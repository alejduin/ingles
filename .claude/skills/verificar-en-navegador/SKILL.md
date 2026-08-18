---
name: verificar-en-navegador
description: Abrir las páginas en un Chromium real para comprobar animaciones, accesibilidad, prefers-reduced-motion, hover táctil o cualquier cosa que dependa de la cascada CSS. Úsala cuando haya que verificar un plan de plans/, cerrar un hallazgo de las skills de animación, o sacar capturas. Incluye el montaje sin sudo en WSL2 y las tres trampas que dan resultados falsos.
---

# Verificar en un navegador real

Este repo se puede verificar en un Chromium de verdad. No hace falta instalar
Google Chrome ni tener `sudo`.

## El comando

```sh
node tools/verify-animations.mjs
```

Levanta su propio servidor, encuentra Chromium, le pasa las libs y comprueba
los planes 001/002/003 más un guardia de regresión. Sale con código 1 si algo
falla. **No necesita ninguna variable de entorno.**

## Por qué hace falta un navegador y no basta `grep`

Las tres cosas que verificamos dependen de algo que solo el navegador resuelve:

- **Un `@media` no se ve en el texto de la regla.** Saber si `.game-card:hover`
  está dentro de `(hover: hover) and (pointer: fine)` exige recorrer el CSSOM.
- **`prefers-reduced-motion` hay que emularlo.** Playwright lo hace por
  contexto (`reducedMotion: 'reduce'`), y entonces se leen estilos calculados.
- **La cascada tiene reglas que sorprenden.** Así apareció el fallo real de
  `index.html`: `animation: cardFadeIn ... both` dejaba la animación como dueña
  de `transform` al terminar, y **una animación gana a una declaración normal**.
  El `translateY(-8px)` del `:hover` no se aplicaba nunca, en ningún
  dispositivo. Leyendo el CSS parecía correcto; solo el navegador lo delata.

## Montaje inicial (una vez por máquina)

Ya está hecho en esta máquina. Se documenta por si hay que rehacerlo.

**1. Chromium.** Puede que ya esté en `~/.cache/ms-playwright/`. Si no:

```sh
npx playwright@1.62.0 install chromium
```

**2. Las libs del sistema, sin root.** Chromium pide `libnspr4`, `libnss3` y
`libasound2t64`, que aquí faltan y no hay `sudo`. Se bajan y se extraen a una
carpeta propia:

```sh
mkdir -p ~/.local/lib/chrome-deps/debs && cd ~/.local/lib/chrome-deps/debs
apt-get download libnspr4 libnss3 libasound2t64
cd .. && for d in debs/*.deb; do dpkg -x "$d" .; done
```

Queda en `~/.local/lib/chrome-deps/usr/lib/x86_64-linux-gnu`. **Que viva en el
home y no en el scratchpad es deliberado**: el scratchpad es efímero y obligaba
a repetir esto en cada sesión.

**3. La fuente de emojis** (solo si vas a mirar capturas):

```sh
cd ~/.local/lib/chrome-deps/debs && apt-get download fonts-noto-color-emoji
cd .. && dpkg -x debs/fonts-noto-color-emoji*.deb fontpkg
mkdir -p ~/.local/share/fonts && find fontpkg -name '*.ttf' -exec cp {} ~/.local/share/fonts/ \;
fc-cache -f
```

Sin ella **todos los emojis salen como `□`** y las capturas engañan: parece un
fallo del sitio y no lo es.

## Las tres trampas

Costaron varios intentos y dan veredictos falsos, no errores. Es lo peor: un
verificador poco fiable da confianza falsa.

**1. `transform: none` no es movimiento.** Es como el bloque de
`prefers-reduced-motion` cancela lo de arriba. Contarlo como movimiento marcaba
cinco páginas como rotas estando bien.

**2. Tailwind compila en el navegador.** Entra por CDN y `networkidle` se
cumple antes de que inyecte sus reglas: la misma página mide 167 reglas o 18
según la suerte. Y **dos lecturas iguales no bastan** para dar por estable el
CSS, porque al principio solo existe la hoja del proyecto. El script exige tres
lecturas iguales y cachea Tailwind en `~/.cache/ingles-verify/`.

**3. La red de este WSL2 es lenta e intermitente** (~50 kB/s, con
`ERR_NETWORK_CHANGED`). Por eso Tailwind se sirve desde disco: sin eso el
resultado sale a suertes. Si añades comprobaciones que dependan de la red,
cachéalas igual.

## Escribir una comprobación nueva

Dos herramientas cubren casi todo:

```js
// Estado del sistema: emular la preferencia de movimiento o el tipo de puntero
await navegador.newPage({ reducedMotion: 'reduce' });
await navegador.newPage({ hasTouch: true, isMobile: true });  // pointer: coarse

// Pseudo-estados que no se pueden provocar de verdad (:active, :focus-visible)
const cdp = await pagina.context().newCDPSession(pagina);
await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
const { root } = await cdp.send('DOM.getDocument');
const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '.game-card' });
await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['active'] });
```

Para animaciones, `el.getAnimations()` da nombre, duración y `fill`, y
muestrear con `requestAnimationFrame` permite ver la curva fotograma a
fotograma — así se comprobó que quitar `both` no introducía ningún destello.

**Verifica siempre dos veces y compara.** Si dos pasadas no dan lo mismo, hay
una carrera y el resultado no vale.

## Lo que esto NO decide

Que una animación **se sienta** bien. El navegador dice si el `transform` se
aplica, cuánto dura y con qué curva; no si a un niño de ocho años le gusta.
Para eso sigue haciendo falta abrir la página. Las skills del carril 1 (Emil)
mandan sobre el criterio; esto solo comprueba que lo acordado ocurre de verdad.
