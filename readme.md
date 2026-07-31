# CMA Master Pro

A beginner-friendly CMA USA exam preparation website — built with plain HTML, CSS, and JavaScript only. No frameworks, no build step, no dependencies to install.

## Files

- `index.html` — the whole site (homepage, Part 1 page, Part 2 page, practice ledger)
- `style.css` — all styling
- `script.js` — navigation, quiz engine, timer, and scoring logic
- `questions.json` — the original practice question bank (Part 1 and Part 2)

## Running it locally

Because the site loads `questions.json` with `fetch()`, opening `index.html` directly by double‑clicking it (a `file://` URL) will be blocked by the browser in some cases. Instead, serve the folder locally:

```bash
# Python 3
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Publishing on GitHub Pages

1. Create a new GitHub repository and push these four files (plus this README) to it.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, set the source to **Deploy from a branch**, pick `main` and `/root`.
4. Save. GitHub will publish the site at `https://<your-username>.github.io/<repo-name>/`.

## What's included in this first version

- Professional homepage with a ledger-styled hero and feature overview
- Part 1 (Financial Planning, Performance & Analytics) topic guide
- Part 2 (Strategic Financial Management) topic guide
- A practice ledger where you can:
  - Choose Part 1, Part 2, or both
  - Choose how many questions to attempt
  - Turn an exam-style countdown timer on or off
  - Select an answer, submit it, see the correct answer and a worked explanation
  - Get a final score, accuracy percentage, and a topic-by-topic breakdown

All questions are original and written for this project — they are not copied from Wiley, Hock, or any other CMA prep provider.

## Extending it later

Some natural next steps once this first version is live:
- Add more questions to `questions.json` (just follow the existing structure)
- Add a bookmarking feature for questions to revisit
- Track scores across sessions (would need `localStorage` or a small backend)
- Break Part 1 and Part 2 topic pages into individual lesson pages
- 
