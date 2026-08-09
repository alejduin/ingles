# Inglés — English Vocabulary Learning Tools

A suite of interactive, client-side web applications designed to help Spanish-speaking children (ages 8+) learn English vocabulary through gamified experiences. Built with vanilla HTML, CSS, and JavaScript — no build tools or server required.

## Games

| Game | File | Type | Vocabulary |
|------|------|------|------------|
| **Vocabulario** | `vocabulario.html` | Flashcard dashboard with flip cards and progress chart | Unit 5: Insects, Adjectives, -le words, Verbs, Nature (36 words) |
| **Trivia** | `trivia.html` | Multiple-choice quiz with audio | Unit 5 (36 words) |
| **Pares de Palabras** | `pares-de-palabras.html` | Memory-style matching game (English ↔ Spanish cards) | Unit 5 (36 pairs) |
| **Vocabulario Unidad 1** | `vocabulario-unidad-01.html` | Multiple-choice quiz | Unit 1: Events, Sports, Feelings (-ed), Descriptions (-ing) (26 words) |
| **Vocabulario Unidad 2** | `vocabulario-unidad-02.html` | Multiple-choice quiz | Unit 2: Actions, Nature, Gerunds (27 words) |
| **Vocabulario Science** | `vocabulario-science.html` | Multiple-choice quiz | Science: Senses, Organ Systems, Food/Nutrients, Teeth (50 words) |
| **Trivia Science** | `triviaScience.html` | Multiple-choice quiz | Science: Food/Body, Teeth, Action Verbs, Adjectives (55 words) |

## How to Use

Open any `.html` file directly in a modern web browser. No server or installation needed.

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

All vocabulary is stored as inline JavaScript arrays. Each entry follows:

```js
{ id: Number, en: "English", es: "Español", icon: "emoji", cat: "category" }
```

To add or edit words, modify the `fullVocabList` array in the corresponding HTML file.

## Configuration

### Gemini API Key

To enable AI-generated stories and example sentences, set `apiKey` in each file:

```js
const apiKey = "your-api-key-here";
```

The key is intentionally left blank (`""`) and expected to be injected at runtime.

## Project Structure

```
ingles/
├── vocabulario.html
├── trivia.html
├── pares-de-palabras.html
├── vocabulario-unidad-01.html
├── vocabulario-unidad-02.html
├── vocabulario-science.html
└── triviaScience.html
```

Each file is self-contained (HTML + CSS + JS in one file). No shared modules, no build step.

## Color Themes

| Files | Brand Color |
|-------|-------------|
| `vocabulario.html`, `pares-de-palabras.html` | Amber/Yellow |
| All trivia files | Sky Blue |

## License

Private / educational use.
