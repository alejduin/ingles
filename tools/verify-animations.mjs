#!/usr/bin/env node
/**
 * Verifica en un navegador real lo que los planes de `plans/` dejaron aplicado.
 *
 *   node tools/verify-animations.mjs
 *
 * No forma parte del sitio. Es una herramienta de QA que se ejecuta a mano; la
 * web se sigue sirviendo como ficheros estáticos y sin ningún paso de build.
 *
 * Comprueba cuatro cosas que un `grep` no puede resolver, porque dependen de la
 * cascada, de los media queries y del estado del navegador:
 *
 *   001  Ninguna transición usa `all`.
 *   002  Con prefers-reduced-motion no sobrevive ningún `transform`.
 *   003  Todo movimiento por :hover está tras (hover: hover) and (pointer: fine).
 *   004  El levantamiento de las tarjetas SÍ ocurre con ratón (guardia de
 *        regresión: una animación con fill-mode lo anulaba en silencio).
 *
 * Ver `.claude/skills/verificar-en-navegador/SKILL.md` para el montaje inicial.
 */

import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(homedir(), '.cache', 'ingles-verify');
const LIBS = join(homedir(), '.local', 'lib', 'chrome-deps', 'usr', 'lib', 'x86_64-linux-gnu');

const PAGINAS = [
  'index.html',
  'trivia.html?data=riddles-05.json',
  'triviaScience.html',
  'vocabulario-science.html',
  'vocabulario-unidad.html?data=words-05.json',
  'pares-de-palabras.html',
  'vocabulario.html',
];

/* ---------------------------------------------------------------- utilidades */

/** Playwright vive en la caché de npx: no hay `npm install` en este repo. */
async function cargarPlaywright() {
  const base = join(homedir(), '.npm', '_npx');
  const candidatos = existsSync(base)
    ? readdirSync(base)
        .map((d) => join(base, d, 'node_modules', 'playwright', 'index.mjs'))
        .filter((p) => existsSync(p))
    : [];
  if (candidatos.length === 0) {
    throw new Error(
      'No encuentro Playwright. Ejecuta una vez:  npx playwright@1.62.0 --version',
    );
  }
  return import(candidatos[0]);
}

function buscarChrome() {
  const base = join(homedir(), '.cache', 'ms-playwright');
  if (!existsSync(base)) throw new Error(`No existe ${base}. Ejecuta: npx playwright@1.62.0 install chromium`);
  for (const dir of readdirSync(base)) {
    if (!dir.startsWith('chromium-')) continue;
    const exe = join(base, dir, 'chrome-linux64', 'chrome');
    if (existsSync(exe)) return exe;
  }
  throw new Error('No encuentro el binario de Chromium. Ejecuta: npx playwright@1.62.0 install chromium');
}

/**
 * Tailwind entra por CDN y compila EN EL NAVEGADOR. Con la red lenta o
 * intermitente, la misma página mide 167 reglas o 18 según la suerte, y el
 * veredicto sale a cara o cruz. Se cachea una vez y se sirve desde disco.
 */
async function tailwindCacheado() {
  const fichero = join(CACHE, 'tailwind-cdn.js');
  try {
    await access(fichero);
    return readFile(fichero, 'utf8');
  } catch {
    process.stderr.write('Descargando Tailwind por única vez… ');
    const res = await fetch('https://cdn.tailwindcss.com');
    if (!res.ok) throw new Error(`el CDN de Tailwind respondió ${res.status}`);
    const cuerpo = await res.text();
    await mkdir(CACHE, { recursive: true });
    await writeFile(fichero, cuerpo);
    process.stderr.write('hecho.\n');
    return cuerpo;
  }
}

const TIPOS = { '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css' };

/** Las páginas usan fetch(), así que file:// falla por CORS: hace falta servidor. */
function levantarServidor() {
  return new Promise((resolve) => {
    const servidor = createServer(async (req, res) => {
      const ruta = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
      try {
        const cuerpo = await readFile(join(RAIZ, ruta));
        res.writeHead(200, { 'Content-Type': TIPOS[extname(ruta)] ?? 'application/octet-stream' });
        res.end(cuerpo);
      } catch {
        res.writeHead(404).end('no encontrado');
      }
    });
    servidor.listen(0, '127.0.0.1', () => resolve({ servidor, puerto: servidor.address().port }));
  });
}

/** Recorre las reglas tal y como Chrome las parseó, arrastrando sus @media. */
const RECORRER = `(() => {
  const salida = [];
  const visitar = (reglas, contexto) => {
    for (const r of reglas) {
      if (r.media !== undefined && r.cssRules) visitar(r.cssRules, contexto.concat(String(r.media.mediaText)));
      else if (r.cssRules && !r.selectorText) visitar(r.cssRules, contexto);
      else if (r.selectorText) salida.push({
        selector: r.selectorText,
        media: contexto,
        transition: r.style.transition || r.style.transitionProperty || '',
        transform: r.style.transform || '',
      });
    }
  };
  for (const hoja of document.styleSheets) {
    let reglas;
    try { reglas = hoja.cssRules; } catch { continue; }
    if (reglas) visitar(reglas, []);
  }
  return salida;
})()`;

/**
 * Dos lecturas iguales NO bastan: al principio solo existe la hoja del
 * proyecto, y dos muestras seguidas antes de que Tailwind inyecte la suya dan
 * una estabilidad falsa. Se exigen 3 iguales.
 */
async function esperarCSS(pagina) {
  let previo = -1;
  let iguales = 0;
  for (let i = 0; i < 60; i++) {
    await pagina.waitForTimeout(250);
    const ahora = await pagina.evaluate(() => {
      let n = 0;
      for (const h of document.styleSheets) { try { n += h.cssRules.length; } catch { /* CDN */ } }
      return n;
    });
    iguales = ahora === previo ? iguales + 1 : 0;
    previo = ahora;
    if (ahora > 50 && iguales >= 3) return ahora;
  }
  throw new Error(`el CSS nunca se estabilizó (última lectura: ${previo})`);
}

/* ------------------------------------------------------------------ programa */

const { chromium } = await cargarPlaywright();
const TAILWIND = await tailwindCacheado();
const { servidor, puerto } = await levantarServidor();
const BASE = `http://127.0.0.1:${puerto}/`;

// Las libs de Chromium se instalaron sin root, así que el enlazador dinámico
// necesita saber dónde están. Se le pasan al proceso hijo: así este script se
// ejecuta sin que quien lo llama tenga que exportar nada.
const entorno = existsSync(LIBS)
  ? { ...process.env, LD_LIBRARY_PATH: [LIBS, process.env.LD_LIBRARY_PATH].filter(Boolean).join(':') }
  : process.env;

const navegador = await chromium.launch({ executablePath: buscarChrome(), args: ['--no-sandbox'], env: entorno });

const conTailwind = async (pagina) => {
  const servir = (r) => r.fulfill({ contentType: 'application/javascript', body: TAILWIND });
  await pagina.route('**/cdn.tailwindcss.com/**', servir);
  await pagina.route('https://cdn.tailwindcss.com', servir);
};

const mueve = (t) => t && t.trim() !== 'none';
let fallos = 0;
const linea = (ok, texto) => {
  if (!ok) fallos++;
  console.log(`  ${ok ? 'OK   ' : 'FALLA'} ${texto}`);
};

for (const ruta of PAGINAS) {
  const nombre = ruta.split('?')[0];
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 900 } });
  await conTailwind(pagina);
  await pagina.goto(BASE + ruta, { waitUntil: 'networkidle' });
  const total = await esperarCSS(pagina);
  const reglas = await pagina.evaluate(RECORRER);

  console.log(`\n=== ${nombre}  (${total} reglas)`);

  const transitionAll = reglas.filter((r) => /(^|\s)all(\s|$|,)/.test(r.transition));
  linea(
    transitionAll.length === 0,
    `001 transition:all → ${transitionAll.length === 0 ? 'ninguna' : transitionAll.map((r) => r.selector).join(', ')}`,
  );

  // `transform: none` no es movimiento: es como reduced-motion cancela lo de
  // arriba. Contarlo daba falsos positivos.
  const sinPuerta = reglas
    .filter((r) => r.selector.includes(':hover') && mueve(r.transform))
    .filter((r) => !r.media.some((m) => m.includes('hover: hover') && m.includes('pointer: fine')));
  linea(sinPuerta.length === 0, `003 hover sin puerta → ${sinPuerta.length === 0 ? 'ninguno' : sinPuerta.map((r) => r.selector).join(', ')}`);

  await pagina.close();

  // 002 se mide de verdad, emulando la preferencia del sistema.
  const pagRM = await navegador.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await conTailwind(pagRM);
  await pagRM.goto(BASE + ruta, { waitUntil: 'networkidle' });
  await esperarCSS(pagRM);
  const sobrevive = await pagRM.evaluate(() => {
    const vivos = [];
    for (const clase of ['correct-answer', 'wrong-answer', 'card', 'game-card', 'option-btn']) {
      const el = document.createElement('div');
      el.className = clase;
      document.body.appendChild(el);
      const s = getComputedStyle(el);
      const props = s.transitionProperty.split(',').map((x) => x.trim());
      // Solo importa el movimiento. box-shadow y color siguen animándose a
      // propósito: el audit pide "menos y más suave", no cero.
      if (props.includes('transform') && parseFloat(s.transitionDuration) > 0.05 && s.transform !== 'none') {
        vivos.push(`${clase} (${s.transform})`);
      }
      el.remove();
    }
    return vivos;
  });
  linea(sobrevive.length === 0, `002 transform bajo reduced-motion → ${sobrevive.length === 0 ? 'ninguno' : sobrevive.join(', ')}`);
  await pagRM.close();
}

// 004 — guardia de regresión sobre el fallo que motivó todo esto.
console.log('\n=== guardia de regresión (index.html)');
{
  const p = await navegador.newPage({ viewport: { width: 1280, height: 900 } });
  await conTailwind(p);
  await p.goto(BASE + 'index.html', { waitUntil: 'networkidle' });
  await p.waitForSelector('.game-card', { state: 'attached', timeout: 45000 });
  await p.waitForTimeout(900); // que termine cardFadeIn (600ms)
  await p.locator('.game-card').first().hover();
  await p.waitForTimeout(450);
  const tf = await p.evaluate(() => getComputedStyle(document.querySelector('.game-card')).transform);
  const levanta = tf !== 'none' && tf !== 'matrix(1, 0, 0, 1, 0, 0)';
  linea(levanta, `004 la tarjeta se levanta con ratón → ${tf}`);
  if (!levanta) {
    console.log('       Causa conocida: una animación con fill-mode (`both`) se queda dueña de');
    console.log('       `transform`, y en la cascada una animación gana a una declaración normal.');
  }
  await p.close();
}

await navegador.close();
servidor.close();

console.log(fallos === 0 ? '\nTodo correcto.' : `\n${fallos} comprobación(es) fallida(s).`);
process.exit(fallos === 0 ? 0 : 1);
