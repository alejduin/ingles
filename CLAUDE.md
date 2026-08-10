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
  transversal se replica a mano en los 8 archivos.

## Deuda conocida

- **7 de los 8 archivos no tienen `prefers-reduced-motion`.** Solo `index.html` lo
  implementa. Hay `shake` y `pulse-green` disparándose al fallar y acertar, que es
  justo el movimiento que afecta a usuarios con sensibilidad vestibular. Es la primera
  cosa a arreglar en cualquier pasada de motion.
- `cdn.tailwindcss.com` compila en el navegador y no está pensado para producción.
  Aceptado a cambio de no tener build.

## Skills instaladas y cuándo usar cada una

Tres carriles que no se pisan. **Nunca invoques el carril 1 y el 2 en el mismo turno
sobre el mismo archivo** — dan instrucciones contradictorias sobre movimiento.

### Carril 1 — Movimiento (Emil Kowalski)

Manda sobre todo lo que sea animación, transición o easing.

| Skill | Cuándo |
|---|---|
| `improve-animations` | Auditar los 8 archivos y sacar un plan priorizado. Solo lectura. Punto de entrada por defecto. |
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
