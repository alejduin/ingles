# Inglés — English Vocabulary Learning Tools

**▶ Play online: [alejduin.github.io/ingles](https://alejduin.github.io/ingles/)**

A suite of interactive, client-side web applications designed to help Spanish-speaking children (ages 8+) learn English vocabulary through gamified experiences. Built with vanilla HTML, CSS, and JavaScript — no build tools or server required.

## Games

| Game | File | Type | Vocabulary |
|------|------|------|------------|
| **Vocabulario** | [`vocabulario.html`](https://alejduin.github.io/ingles/vocabulario.html) | Flashcard dashboard with flip cards and progress chart | Unit 5: Insects, Adjectives, -le words, Verbs, Nature (36 words) |
| **Trivia** | [`trivia.html`](https://alejduin.github.io/ingles/trivia.html) | Multiple-choice quiz with audio | Unit 5 (36 words) |
| **Pares de Palabras** | [`pares-de-palabras.html`](https://alejduin.github.io/ingles/pares-de-palabras.html) | Memory-style matching game (English ↔ Spanish cards) | Unit 5 (36 pairs) |
| **Trivia Unidad 1** | [`vocabulario-unidad.html?data=words-01.json`](https://alejduin.github.io/ingles/vocabulario-unidad.html?data=words-01.json) | Reusable multiple-choice quiz | Unit 1: Events, Sports, Feelings (-ed), Descriptions (-ing) (26 words) |
| **Trivia Unidad 2** | [`vocabulario-unidad.html?data=words-02.json`](https://alejduin.github.io/ingles/vocabulario-unidad.html?data=words-02.json) | Reusable multiple-choice quiz | Unit 2: Actions, Nature, Gerunds (27 words) |
| **Trivia Unidad 10** | [`vocabulario-unidad.html?data=words-10.json`](https://alejduin.github.io/ingles/vocabulario-unidad.html?data=words-10.json) | Reusable multiple-choice quiz | Unit 10: Transport, Energy, Quantifiers, Places (27 words) |
| **Vocabulario Science** | [`vocabulario-science.html`](https://alejduin.github.io/ingles/vocabulario-science.html) | Multiple-choice quiz | Science: Senses, Organ Systems, Food/Nutrients, Teeth (50 words) |
| **Trivia Science** | [`triviaScience.html`](https://alejduin.github.io/ingles/triviaScience.html) | Multiple-choice quiz | Science: Food/Body, Teeth, Action Verbs, Adjectives (55 words) |

## How to Use

**Online:** visit [alejduin.github.io/ingles](https://alejduin.github.io/ingles/) — nothing to install.

**Locally:** open any `.html` file directly in a modern web browser. No server or installation needed.

### Game Mechanics

- **Flashcards** (`vocabulario.html`): Click cards to flip between English and Spanish. A doughnut chart shows category progress.
- **Trivia** (all trivia files): Click the speaker icon to hear pronunciation, then choose the correct translation. Must listen before answering.
- **Pares de Palabras** (`pares-de-palabras.html`): Match English cards to their Spanish pair. Cards remain face-up when matched correctly.

## Tech Stack

- **HTML / CSS / JavaScript** — no frameworks or bundlers
- **Tailwind CSS** (CDN) — utility-first styling
- **Chart.js** (CDN) — progress doughnut chart (vocabulario.html only)
- **Google Fonts: Nunito** — brand typeface
- **Google Translate TTS** — audio pronunciation
- **Web Speech API** — fallback TTS
- **Gemini API** — optional AI-generated sentences/stories (disabled by default; requires an API key)

## Vocabulary Data

There are two storage strategies in this repo:

**1. Reusable quiz (`vocabulario-unidad.html`)** — loads its vocabulary from an external JSON file selected by the `?data=` query parameter (e.g. `vocabulario-unidad.html?data=words-01.json`). This is the recommended approach for new units: no HTML duplication, just drop a new `words-NN.json`.

The JSON schema (see `words-10.json` for a full example):

```jsonc
{
  "schemaVersion": 1,
  "meta": {
    "unit": "10",
    "title": "Unidad 10",
    "subtitle": "Transporte, energía y cuantificadores",
    "theme": "sky"                       // sky | amber | emerald | violet | rose
  },
  "categories": [                        // optional: nice labels for the category badge
    { "name": "Transporte", "label": "Transporte (Transportation)", "icon": "🚑" }
  ],
  "words": [
    { "en": "ambulance", "es": "ambulancia", "icon": "🚑", "cat": "Transporte" }
  ]
}
```

Notes:
- `id` is **not** written by hand. The loader assigns it from the array position, so you can insert or remove words without renumbering.
- `icon` and `cat` are optional (defaults: `📘` / `General`).
- A plain array `[ {...}, {...} ]` is also accepted for compatibility.
- The theme can also be forced via `?theme=amber`.

**2. Legacy inline lists** — the older games (`vocabulario.html`, `trivia.html`, both `*-science.html`, `pares-de-palabras.html`) still keep the vocabulary as an inline `fullVocabList` array:

```js
{ id: Number, en: "English", es: "Español", icon: "emoji", cat: "category" }
```

To add or edit words there, modify the `fullVocabList` array in the corresponding HTML file.

## Configuration

### Gemini API Key

To enable AI-generated stories and example sentences, set `apiKey` in each file:

```js
const apiKey = "your-api-key-here";
```

The key is intentionally left blank (`""`) and expected to be injected at runtime.

> **Warning:** this site is public and the code runs entirely in the browser. Any key hardcoded into these files is visible to anyone via View Source. Do not commit a real key — use a backend proxy or an HTTP-referrer-restricted key instead.

## Project Structure

```
ingles/
├── index.html                    # landing page / game menu
├── vocabulario.html              # Flashcards Unit 5 (Chart.js dashboard)
├── trivia.html                   # Trivia Unit 5 (inline vocabulary)
├── pares-de-palabras.html        # Matching game Unit 5
├── vocabulario-unidad.html       # Reusable quiz, reads ?data=<file>.json
├── words-01.json                 # Unit 1 vocabulary
├── words-02.json                 # Unit 2 vocabulary
├── words-10.json                 # Unit 10 vocabulary
├── vocabulario-science.html      # Science quiz (inline vocabulary)
├── triviaScience.html            # Science trivia (inline vocabulary)
└── .nojekyll                     # serve files as-is on GitHub Pages
```

Each HTML file is self-contained (HTML + CSS + JS in one file). No shared modules, no build step. `vocabulario-unidad.html` reads its data from the sibling `words-*.json` files.

## Deployment

Hosted on **GitHub Pages**, served from the `main` branch (root). Deployment is automatic — every push to `main` republishes the site in ~30 seconds:

```sh
git add -A && git commit -m "your message" && git push
```

There is no build step or workflow file; GitHub Pages serves the HTML directly. The `.nojekyll` file disables Jekyll preprocessing.

## Color Themes

| Files | Brand Color |
|-------|-------------|
| `vocabulario.html`, `pares-de-palabras.html` | Amber/Yellow |
| `trivia.html`, `vocabulario-unidad.html` (default), `triviaScience.html` | Sky Blue |
| `vocabulario-science.html` | Green |

The reusable quiz picks its color from `meta.theme` in the JSON, or from `?theme=` in the URL.

## License

Educational use.
