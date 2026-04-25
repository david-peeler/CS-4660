# AI Arena

AI Arena is a student-facing verification lab about responsible classroom AI use in computer science contexts. Learners work through case-based scenarios that ask them to inspect prompts, model outputs, and generated code, then make a defensible judgment about what to trust, how to verify it, and whether a use of AI fits classroom expectations.

The current experience includes four kinds of cases:

- LLM hallucination spotting with prompt and model-output views
- Code verification with AI-generated snippets
- Evidence matching to the right verifier
- Prompt surgery around acceptable and unacceptable classroom AI use

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
