# Kova

An AI that makes stuff. Describe a small app or tool in plain English, and Kova generates a working, self-contained web app for it — instantly previewable in your browser, editable via follow-up instructions, and downloadable as a single HTML file.

Generation is powered by [Google's Gemini API](https://ai.google.dev/gemini-api/docs) (`@google/genai`) — not Anthropic/Claude.

## How it works

- The frontend (`public/`) sends your description to the backend.
- The backend (`server.js`) asks Gemini to produce a single self-contained HTML document (inline CSS/JS, no external dependencies) implementing your request.
- The result renders live in a sandboxed `<iframe>` preview, with a code view and download option.
- Follow-up instructions ("make the buttons rounder", "add a dark mode toggle") are sent back to Gemini along with the current code, so it can refine the app in place.

## Setup

```bash
npm install
cp .env.example .env   # then add your GEMINI_API_KEY
npm start
```

Get a `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey) (has a free tier). Visit `http://localhost:3000`.

The default model is `gemini-2.5-pro`; override it by setting `GEMINI_MODEL` in `.env` if you want to point at a different Gemini model.

## Notes

- Generated apps run in a sandboxed iframe (`allow-scripts allow-forms allow-modals`, no `allow-same-origin`), so generated code can't reach cookies, storage, or the parent page.
- Everything Gemini generates is client-side only — no external requests, no analytics, no dependencies beyond what ships in the single HTML file.
- Your `GEMINI_API_KEY` stays server-side; it's never exposed to the browser.
