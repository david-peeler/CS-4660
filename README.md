# AI Arena

AI Arena is a student-facing, Kahoot-style web game about responsible classroom AI use. It mixes three kinds of rounds:

- LLM hallucination spotting
- Code verification with AI-generated snippets
- Teacher framework calls about when AI is allowed, allowed with limits, or not allowed

## How to run

Open [index.html](./index.html) directly in a browser, or serve the folder with a static server.

Example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Files

- `index.html` contains the page structure
- `styles.css` contains the visual design and responsive layout
- `app.js` contains the game data and interaction logic
