# Kova

Kova makes small web apps from a plain-English description — a pomodoro timer, a color palette generator, a tic-tac-toe game, and more.

It is **not powered by any AI company's API**. There's no model, no account, no API key, and nothing ever leaves your browser. Every app it can build is a real, hand-written blueprint in [`templates.js`](./templates.js); Kova matches your description against those blueprints by keyword and assembles the result — instantly, offline-capable, and fully inspectable (it's about 500 lines of plain JavaScript, no build step, no dependencies).

## Running it

It's a static site — three files (`index.html`, `style.css`, `app.js`) plus the blueprint library (`templates.js`). Open `index.html` directly in a browser, or serve the folder with anything that serves static files:

```bash
python3 -m http.server 8080
# or
npx serve .
```

## Hosting it on the internet (GitHub Pages)

This repo can be turned into a live, public URL with GitHub Pages, at no cost and with no server to run:

1. On GitHub, go to **Settings → Pages**.
2. Under "Build and deployment", set **Source** to "Deploy from a branch".
3. Pick this branch and the `/ (root)` folder, then **Save**.
4. GitHub publishes it at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

That URL is a real, independent website — not affiliated with or hosted by any AI company — and works in any browser, including Safari on iPad.

## Adding a new blueprint

Add an entry to the `RECIPES` array in `templates.js`: an `id`, a `name`, a `blurb`, a list of `keywords` to match against a description, and a `build(promptText)` function that returns a complete, self-contained HTML document (inline `<style>`/`<script>`, no external requests). `matchRecipe()` picks the blueprint with the most keyword hits against what the person typed.
