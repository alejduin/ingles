# Inglés — English Vocabulary Learning Tools

**▶ Play online: [alejduin.github.io/ingles](https://alejduin.github.io/ingles/)**

A suite of interactive, client-side web applications designed to help Spanish-speaking children (ages 8+) learn English vocabulary through gamified experiences. Built with vanilla HTML, CSS, and JavaScript — no build tools or server required.

## Games

| Game | File | Type | Vocabulary |
|------|------|------|------------|
| **Vocabulario** | [`vocabulario.html`](https://alejduin.github.io/ingles/vocabulario.html) | Flashcard dashboard with flip cards and progress chart | Unit 5: Insects, Adjectives, -le words, Verbs, Nature (36 words) |
| **Pares de Palabras** | [`pares-de-palabras.html`](https://alejduin.github.io/ingles/pares-de-palabras.html) | Memory-style matching game (English ↔ Spanish cards) | Unit 5 (36 pairs) |
| **Trivia Unidad 5** | [`vocabulario-unidad.html?data=words-05.json`](https://alejduin.github.io/ingles/vocabulario-unidad.html?data=words-05.json) | Reusable multiple-choice quiz | Unit 5: Adjectives, Colors, Animals, Nature, Clothing, Verbs (89 words) |
| **Trivia Unidad 1** | [`vocabulario-unidad.html?data=words-01.json`](https://alejduin.github.io/ingles/vocabulario-unidad.html?data=words-01.json) | Reusable multiple-choice quiz | Unit 1: Events, Sports, Feelings (-ed), Descriptions (-ing) (26 words) |
| **Trivia Unidad 2** | [`vocabulario-unidad.html?data=words-02.json`](https://alejduin.github.io/ingles/vocabulario-unidad.html?data=words-02.json) | Reusable multiple-choice quiz | Unit 2: Actions, Nature, Gerunds (27 words) |
| **Trivia Unidad 10** | [`vocabulario-unidad.html?data=words-10.json`](https://alejduin.github.io/ingles/vocabulario-unidad.html?data=words-10.json) | Reusable multiple-choice quiz | Unit 10: Transport, Energy, Quantifiers, Places (27 words) |
| **Adivinanzas Unidad 5** | [`trivia.html?data=riddles-05.json`](https://alejduin.github.io/ingles/trivia.html?data=riddles-05.json) | Reusable riddle quiz — read an English clue, pick what it describes | Unit 5 (12 questions) |
| **Adivinanzas Unidad 10** | [`trivia.html?data=riddles-10.json`](https://alejduin.github.io/ingles/trivia.html?data=riddles-10.json) | Reusable riddle quiz — read an English clue, pick what it describes | Unit 10 (12 questions) |
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

**2. Riddle quiz (`trivia.html`)** — same `?data=` mechanism, different content shape. Drop a new `riddles-NN.json` to add a unit (see `riddles-10.json`):

```jsonc
{
  "schemaVersion": 1,
  "meta": {
    "unit": "10",
    "title": "Unidad 10",
    "subtitle": "Lee la pista y adivina de qué se habla",
    "theme": "sky"
  },
  "questions": [
    {
      "question": "It uses flashing lights when it drives on busy streets.",
      "correct_answers": ["ambulance"],          // always an array, even with one
      "incorrect_answers": ["taxi", "carpool"]
    },
    {
      "question": "Which of these make clean energy? Choose ALL the correct answers.",
      "correct_answers": ["wind turbine", "solar panel"],
      "incorrect_answers": ["traffic jam"]
    }
  ]
}
```

Notes:
- `correct_answers` is **always an array**. When it holds more than one answer the question switches itself to "choose all that apply": options become toggles and a **Comprobar** button appears. A question is scored right only if the selected set matches exactly.
- Options shown = correct + incorrect, shuffled. Three total is the norm; the page does not hardcode it.
- `id` is **not** written by hand, same as `words-NN.json`.
- A plain array and the older `"correct_answer": "string"` field are both still accepted, so files written before this schema keep working.
- Validation is strict and the error names the offending question, e.g. *"La pregunta 3 repite «taxi» como correcta e incorrecta a la vez"*.

**3. Legacy inline lists** — the older games (`vocabulario.html`, both `*-science.html`, `pares-de-palabras.html`) still keep the vocabulary as an inline `fullVocabList` array:

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
├── index.html                    # landing page, builds its menu from units.json
├── units.json                    # manifest: every game card and filter
├── vocabulario.html              # Flashcards Unit 5 (Chart.js dashboard)
├── trivia.html                   # Reusable riddle quiz, reads ?data=<file>.json
├── pares-de-palabras.html        # Matching game Unit 5
├── vocabulario-unidad.html       # Reusable word quiz, reads ?data=<file>.json
├── words-01.json                 # Unit 1 vocabulary
├── words-02.json                 # Unit 2 vocabulary
├── words-05.json                 # Unit 5 vocabulary
├── words-10.json                 # Unit 10 vocabulary
├── riddles-05.json               # Unit 5 riddles
├── riddles-10.json               # Unit 10 riddles
├── vocabulario-science.html      # Science quiz (inline vocabulary)
├── triviaScience.html            # Science trivia (inline vocabulary)
└── .nojekyll                     # serve files as-is on GitHub Pages
```

Each HTML file is self-contained (HTML + CSS + JS in one file). No shared modules, no build step. `vocabulario-unidad.html` and `trivia.html` read their data from the sibling `words-*.json` / `riddles-*.json` files.

### The menu manifest (`units.json`)

`index.html` holds no game cards. It renders them from `units.json`, so **publishing a game is a data change, not an HTML change** — which is what lets an automated pipeline add a unit without editing markup.

```jsonc
{
  "schemaVersion": 1,
  "categories": [                      // drives the filter buttons
    { "id": "trivia", "icon": "🎯", "label": "Trivia" }
  ],
  "games": [
    {
      "title": "Trivia – Unit 5",
      "href": "vocabulario-unidad.html?data=words-05.json",
      "icon": "🎯",
      "iconLabel": "diana",            // optional, for screen readers
      "desc": "Insectos, adjetivos y el mundo que nos rodea.",
      "category": "trivia",            // must exist in "categories"
      "badge": "Trivia",
      "count": "36 palabras",
      "theme": "sky",                  // amber | sky | green | violet
      "recommended": true,             // optional, adds the "¡Empieza aquí!" ribbon
      "ariaLabel": "..."               // optional, generated from title + desc if absent
    }
  ]
}
```

Notes:
- A filter button only appears if at least one game uses that category. An empty filter would blank the screen with no explanation.
- An unknown `theme` falls back to `sky` rather than rendering an unstyled card.
- Adding a unit end to end = write `words-NN.json` (and/or `riddles-NN.json`), then append one entry to `games`. Nothing else.

### The two reusable pages

Both read their content from an external JSON chosen with `?data=`, so a new unit means a new JSON file, never a new HTML file.

| Page | Activity | Data files |
|------|----------|------------|
| `vocabulario-unidad.html` | Translate a single English word into Spanish | `words-NN.json` |
| `trivia.html` | Read an English clue and pick what it describes | `riddles-NN.json` |

They exercise different skills. The word quiz drills vocabulary recall; the riddle quiz drills reading comprehension, since the answer is only reachable by understanding a whole sentence. Keep them separate rather than merging them.

Both accept `?theme=` to override the palette (`sky`, `amber`, `emerald`, `violet`, `rose`).

## Deployment

Hosted on **GitHub Pages**, served from the `main` branch (root). Deployment is automatic — every push to `main` republishes the site in ~30 seconds:

```sh
git add -A && git commit -m "your message" && git push
```

There is no build step or workflow file; GitHub Pages serves the HTML directly. The `.nojekyll` file disables Jekyll preprocessing.

### Publishing a unit from a phone

New units don't have to be written by hand. A Telegram bot backed by n8n reads photographs of the textbook pages and commits the JSON:

```
iniciar  →  send the photos  →  procesar  →  confirm  →  committed
```

It writes `words-NN.json`, `riddles-NN.json`, and merges the new cards into `units.json`. The unit number is read from the printed page; `procesar 5` forces it when it can't be found.

`words-05.json` and `riddles-05.json` were produced this way — which is why their word counts and categories differ in style from the hand-written `words-01`/`02`/`10`. See `CLAUDE.md` for the pipeline's architecture and its failure modes.

## Color Themes

| Files | Brand Color |
|-------|-------------|
| `vocabulario.html`, `pares-de-palabras.html` | Amber/Yellow |
| `vocabulario-unidad.html` (default), `trivia.html` (default), `triviaScience.html` | Sky Blue |
| `vocabulario-science.html` | Green |

The two reusable pages take their palette from `meta.theme` in the JSON, overridable with `?theme=`. The rest hardcode theirs.

The reusable quiz picks its color from `meta.theme` in the JSON, or from `?theme=` in the URL.

## License

Educational use.
