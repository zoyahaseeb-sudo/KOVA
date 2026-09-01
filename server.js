import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ApiError } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-pro";
const MAX_PROMPT_LENGTH = 4000;
const MAX_CODE_LENGTH = 200000;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 8192,
      },
    });

    const text = response.text;
    if (!text) {
      return res.status(502).json({ error: "No output was generated." });
    }

    const code = extractHtml(text);
    if (!code) {
      return res.status(502).json({ error: "Generated output wasn't a valid HTML document." });
    }

    res.json({ code });
  } catch (error) {
    console.error(error);
    if (error instanceof ApiError) {
      if (error.status === 401 || error.status === 403) {
        res.status(500).json({ error: "Server is missing a valid API key." });
      } else if (error.status === 429) {
        res.status(429).json({ error: "Rate limited - try again in a moment." });
      } else {
        res.status(502).json({ error: "The generator API returned an error." });
      }
    } else {
      res.status(500).json({ error: "Something went wrong generating your app." });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Kova is running at http://localhost:${PORT}`);
});
