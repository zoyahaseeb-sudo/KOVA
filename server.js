import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MODEL = "claude-opus-5";
const MAX_PROMPT_LENGTH = 4000;
const MAX_CODE_LENGTH = 200000;

const client = new Anthropic();

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const SYSTEM_PROMPT = `You are Kova, an AI that makes stuff: small, working web apps and tools from a plain-English description.

Given a description, respond with a single self-contained HTML document that implements it - inline <style> and <script>, no external network requests, no external libraries or CDN links. It must run entirely by opening the file in a browser.

Rules:
- Output ONLY the raw HTML document, starting with <!DOCTYPE html> and nothing before or after it - no markdown code fences, no commentary.
- Make it genuinely usable: real interactivity, sensible layout, and a clean, modern visual style (good spacing, readable type, a coherent color palette).
- Keep everything client-side - no server calls, no imports of external scripts/fonts/images.
- If the request is refining existing code, preserve what already works and change only what was asked.
- If the request is unsafe, harmful, or not something a small web app/tool can reasonably be, still return a valid HTML document that clearly explains why in the page itself - never return plain prose outside an HTML document.`;

function extractHtml(text) {
  const fenced = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("<!DOCTYPE");
  const startFallback = start === -1 ? candidate.indexOf("<html") : start;
  const trimmed = startFallback === -1 ? candidate : candidate.slice(startFallback);
  return trimmed.trim();
}

app.post("/api/generate", async (req, res) => {
  const { prompt, previousCode } = req.body ?? {};

  if (typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "Describe what you want to make." });
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({ error: `Description is too long (max ${MAX_PROMPT_LENGTH} characters).` });
  }
  if (previousCode !== undefined && (typeof previousCode !== "string" || previousCode.length > MAX_CODE_LENGTH)) {
    return res.status(400).json({ error: "Existing app code is invalid or too large." });
  }

  const userMessage = previousCode
    ? `Here is the current app's HTML:\n\n${previousCode}\n\nApply this change: ${prompt}\n\nReturn the full updated HTML document.`
    : `Make: ${prompt}`;

  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      output_config: { effort: "high" },
      messages: [{ role: "user", content: userMessage }],
    });

    const response = await stream.finalMessage();

    if (response.stop_reason === "refusal") {
      return res.status(422).json({
        error: "Claude declined to generate this.",
        detail: response.stop_details?.explanation ?? null,
      });
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock?.text) {
      return res.status(502).json({ error: "No output was generated." });
    }

    const code = extractHtml(textBlock.text);
    if (!code) {
      return res.status(502).json({ error: "Generated output wasn't a valid HTML document." });
    }

    res.json({ code });
  } catch (error) {
    console.error(error);
    if (error instanceof Anthropic.AuthenticationError) {
      res.status(500).json({ error: "Server is missing a valid Anthropic API key." });
    } else if (error instanceof Anthropic.RateLimitError) {
      res.status(429).json({ error: "Rate limited - try again in a moment." });
    } else if (error instanceof Anthropic.APIError) {
      res.status(502).json({ error: `Claude API error: ${error.message}` });
    } else {
      res.status(500).json({ error: "Something went wrong generating your app." });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Kova is running at http://localhost:${PORT}`);
});
