# Kova

An AI that makes stuff. Describe a small app or tool in plain English, and Kova generates a working, self-contained web app for it — instantly previewable in your browser, editable via follow-up instructions, and downloadable as a single HTML file.

## How it works

- The frontend (`public/`) sends your description to the backend.
- The backend (`server.js`) asks Claude to produce a single self-contained HTML document (inline CSS/JS, no external dependencies) implementing your request.
- The result renders live in a sandboxed `<iframe>` preview, with a code view and download option.
- Follow-up instructions ("make the buttons rounder", "add a dark mode toggle") are sent back to Claude along with the current code, so it can refine the app in place.

## Setup

```bash
npm install
cp .env.example .env   # then add your ANTHROPIC_API_KEY
npm start
```

Visit `http://localhost:3000`.

If you've already run `ant auth login`, you can skip the `.env` file — the SDK picks up your stored credentials automatically.

## Notes

- Generated apps run in a sandboxed iframe (`allow-scripts allow-forms allow-modals`, no `allow-same-origin`), so generated code can't reach cookies, storage, or the parent page.
- Everything Claude generates is client-side only — no external requests, no analytics, no dependencies beyond what ships in the single HTML file.
