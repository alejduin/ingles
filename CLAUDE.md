# CLAUDE.md

El README cubre el stack, los juegos y el formato de datos. Aquí solo va lo que no se
deduce leyendo el código.

## Restricciones que no se negocian

- **Sin build, sin npm, sin frameworks.** Cada `.html` es autocontenido y se abre con
  doble clic. Cualquier sugerencia que requiera `npm install`, un bundler, React o
  Tailwind vía PostCSS está fuera de alcance. Tailwind y Chart.js entran por CDN a
  propósito.
- **Google Fonts por `<link>` es intencional.** No hay paso de build para self-hostear
  Nunito. Varias skills de diseño lo prohíben; aquí no aplica.
- **La estética lúdica es una decisión, no un descuido.** El público son estudiantes de
  8+ años hispanohablantes. Los gradientes vivos, Nunito redondeada, los colores
  saturados y las formas flotantes están puestos para ellos. Las skills de diseño
  empujan hacia lo sobrio y editorial: no las dejes "arreglar" esto.
- **Cada archivo lleva su propio CSS y JS.** No hay módulos compartidos. Un cambio
  transversal se replica a mano en cada HTML.
- **`index.html` no lleva tarjetas escritas a mano.** Construye el menú y los filtros
  desde `units.json`. Publicar un juego es añadir una entrada a `games`, nunca editar
  markup. Esto es deliberado: es lo que permite que un pipeline automatizado (n8n)
  publique una unidad sin tocar HTML. No vuelvas a meter tarjetas en el HTML.
- **Hay dos páginas reutilizables, y no se fusionan.** `vocabulario-unidad.html` carga
  `words-NN.json` (traducir una palabra) y `trivia.html` carga `riddles-NN.json` (leer
  una pista y adivinar). Ejercitan destrezas distintas: recuerdo léxico frente a
  comprensión lectora. Una unidad nueva es un JSON nuevo, nunca un HTML nuevo.
  El resto de juegos sigue con arrays inline: mira qué modelo usa el archivo antes
  de tocar datos.
- **Se publica en GitHub Pages** (hay `.nojekyll`). Todo tiene que funcionar como
  ficheros estáticos servidos tal cual. Ojo: `index.html` y las dos páginas
  reutilizables usan `fetch`, así que abrirlas con doble clic (`file://`) falla por
  CORS. Hace falta un servidor local, p. ej. `python3 -m http.server`. Las tres
  muestran un mensaje que lo explica en vez de quedarse en blanco.

## El pipeline de publicación (n8n)

Publicar una unidad ya no se hace a mano. Hay un bot de Telegram que lee fotos de las
páginas del libro y commitea los JSON. Está vivo y en producción.

```
iniciar → fotos → procesar → [Publicar] → commit en main
```

Cuatro workflows en n8n Cloud, cada uno con una responsabilidad:

| Workflow | ID | Qué hace |
|---|---|---|
| Publish a unit from Telegram photos | `baKnSgFrPpZ7YwFI` | El bot. Sesión, comandos, confirmación |
| Extract vocabulary from textbook pages | `1e45BjwNQija5AP8` | Foto → `{words[], riddles[], unit}` |
| Publish a unit to the website | `4ZasRhexqEjShEgx` | Monta los JSON y **fusiona** `units.json` |
| Commit files to GitHub | `ekZ4xN3i6smOlNor` | Escribe ficheros vía API de contenidos |

Decisiones que no son obvias leyendo el canvas:

- **La lista blanca vive en `additionalFields.userIds` del trigger**, no en un nodo IF.
  Así el workflow ni arranca para otro usuario. El repo es público: sin eso, el bot es
  una vía de escritura abierta para cualquiera que dé con él.
- **La sesión se guarda en la Data Table `sesion_paginas`** (`chatId`, `fileId`,
  `messageId`). Telegram dispara el trigger **una vez por foto**, en ejecuciones
  separadas: no hay otra forma de que una ejecución vea las fotos de las otras.
  Se ordena por `messageId` porque un álbum entra en paralelo y el orden de inserción
  no es fiable.
- **`publicar-unidad` LEE `units.json` antes de escribir y fusiona por `href`.**
  Si la lectura falla con algo que no sea un 404, aborta a propósito: publicar entonces
  sobrescribiría el menú entero con una plantilla vacía.
- **Solo se borra la sesión tras publicar con éxito.** Si algo falla, las fotos siguen
  ahí y reintentar es escribir `procesar` otra vez.
- **Un commit por fichero.** Es cómo funciona la API de contenidos de GitHub. Tres
  ficheros, tres commits.

### Dos trampas de n8n que ya nos costaron una tarde

1. **Publicar es obligatorio tras CADA cambio.** El borrador y la versión activa son
   cosas distintas: editas, guardas, y la ejecución sigue usando el snapshot anterior.
   Puedes estar viendo en pantalla una configuración correcta mientras corre otra.
   Síntoma: arreglas algo y el fallo no cambia.
2. **Dos credenciales del mismo tipo dejan el nodo vacío.** n8n autoasigna por descarte;
   con dos candidatas no elige ninguna y no avisa. Se manifiesta como
   *"Authorization failed"* en un nodo que parece bien configurado. `get_workflow_details`
   **no devuelve las credenciales**, así que no se puede verificar por API: hay que
   abrir el nodo. Mantén una sola credencial por tipo.

### Estado del modelo

`Extraer pagina` lleva `needsFallback` y el **orden de los submodelos ES la preferencia**.
Hoy: **Google Vertex** en el índice 0 y Claude Sonnet 5 en el 1. Se pasó a Vertex porque
la cuenta de Anthropic quedó bloqueada y la Gemini API por clave devolvía 429 con dos
imágenes. De propina Vertex es mejor para privacidad: no usa contenido de clientes para
entrenar, y aquí se procesan fotos del cuaderno de un niño.

El prompt del extractor encierra lo aprendido a base de resultados malos: ignora lo
escrito a mano, no completa texto cortado, exige que cada palabra sea **traducible por sí
sola** (eso mató `-ing`, `was`, `theme`), exige que cada adivinanza **se entienda sola**
(eso mató *"What is the theme of this poem?"*), y cuenta las palabras que se practican
dentro de un ejercicio pero no el enunciado. Esa última regla subió la cobertura de 16 a
26 sobre 36. No la relajes sin volver a medir.

## Deuda conocida

- `cdn.tailwindcss.com` compila en el navegador y no está pensado para producción.
  Aceptado a cambio de no tener build.
- Los tres planes de `plans/` están aplicados pero ninguno verificado en un navegador
  real. Lo pendiente está listado en `plans/README.md`.
- `words-05.json` tiene 89 palabras, más del doble que las unidades escritas a mano.
  Es todo contenido legítimo de la unidad, pero es un cuestionario largo. Decisión
  consciente de dejarlo así por ahora.
- Quedan cuatro pares base/gerundio duplicados en `words-05.json` (`write`/`writing`,
  `shine`/`shining`, `leap`/`leaping`, `escaped`/`escaping`). El dedup del extractor solo
  cubre `+s`/`+es`.
- En `pdf-a-datos` hay un nodo de Gemini API desconectado a propósito, por si hay que
  volver a él. Genera tres avisos de validación en cada guardado.

## Skills instaladas y cuándo usar cada una

Tres carriles que no se pisan. **Nunca invoques el carril 1 y el 2 en el mismo turno
sobre el mismo archivo** — dan instrucciones contradictorias sobre movimiento.

### Carril 1 — Movimiento (Emil Kowalski)

Manda sobre todo lo que sea animación, transición o easing.

| Skill | Cuándo |
|---|---|
| `improve-animations` | Auditar todos los HTML y sacar un plan priorizado. Solo lectura. Punto de entrada por defecto. |
| `review-animations` | Revisar un cambio concreto ya hecho. Requiere invocación manual. |
| `animate` | Construir una animación nueva desde cero. |
| `find-animation-opportunities` | Qué debería animarse y hoy no lo hace. |
| `emil-design-eng` | Paraguas de filosofía, para dudas sueltas de pulido. |

Reglas duras que traen: solo `transform` y `opacity`, por debajo de 300ms, nunca
`ease-in` en UI, nunca animar acciones que se repiten mucho.

### Carril 2 — Estructura

`redesign-existing-projects` — auditoría de tipografía, color, layout, estados y
patrones sobre HTML ya escrito. Funciona con CSS vanilla.

**Ignora su subsección "Motion Upgrades"** (scroll con inercia, spring physics en todo,
reveals por scroll). Contradice al carril 1, que es la autoridad en movimiento.

### Carril 3 — Higiene de salida

`full-output-enforcement` — impide truncar código y placeholders tipo
`<!-- resto igual -->`. Ortogonal a las demás, no compite con ninguna. Relevante porque
los archivos rondan los 25 KB de una sola pieza.

## Skills descartadas y por qué

No reinstalar sin releer esto:

- **`design-taste-frontend`** (taste-skill) — su §3.A impone React/Next.js con Server
  Components, Tailwind v4 y `motion/react`. Además se autoexcluye por alcance: dice
  explícitamente que no cubre "multi-step product UI", que es exactamente lo que son
  las trivias con estado.
- **`high-end-visual-design`** (soft-skill) — contradice a Emil de forma directa:
  pide `duration-700` y reveals de 800ms+ donde Emil marca el techo en 300ms, y usa
  `blur` como decoración por defecto donde Emil lo reserva para tapar costuras de
  crossfade. Su repertorio (navbar de cristal, botones magnéticos) es de landing page
  de agencia.
- **`impeccable`** — encaja técnicamente y es agnóstica de framework, pero solapa con
  los carriles 1 y 2 casi por completo. Es una alternativa al conjunto, no un añadido.
  Si se adopta, hay que vaciar los carriles 1 y 2 primero.
