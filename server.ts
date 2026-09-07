import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 8080);
const PUBLIC_URL = process.env.PUBLIC_URL || `http://${HOST}:${PORT}`;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";
const ROOT = fileURLToPath(new URL(".", import.meta.url));

const blockedTerms = /\b(sex|porn|nude|naked|kill|murder|suicide|weapon|gun|bomb|blood|drug|alcohol|religion|god|race|ethnic|gender|disability|disease|politic|president|war|crime|criminal|funeral|toilet|poop|pee|salary|relationship)\b/i;

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(body));
}

function normalizeQuestion(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value
    .replace(/^\s*[-*\d.)]+\s*/, "")
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length < 15 || text.length > 220 || !text.endsWith("?") || blockedTerms.test(text)) return null;
  return text;
}

async function readBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 32_000) throw new Error("Request is too large");
  }
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
}

async function generateQuestions(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    json(response, 503, { message: "OPENROUTER_API_KEY is not configured" });
    return;
  }

  const body = await readBody(request);
  const exclude = Array.isArray(body.exclude)
    ? body.exclude.filter((item): item is string => typeof item === "string").slice(-150)
    : [];
  const prompt = `Create exactly 8 original, clever, absurd questions for an unattended office monitor.
They must be playful thought experiments or language paradoxes—not trivia, facts, advice, or personal questions.
They must be comfortable for every workplace and culture. Never mention sex, bodies, death, violence, weapons, crime, drugs, alcohol, politics, religion, protected traits, health, insults, relationships, or employee information.
Avoid noun-swapping templates and vary the sentence structures. Each question must be under 22 words and end with a question mark.
Do not repeat or closely paraphrase these previous questions: ${JSON.stringify(exclude)}.
Return exactly one question per line with no numbering, commentary, or introduction.`;

  const upstream = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": PUBLIC_URL,
      "X-Title": "The Absurdity Feed"
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "You write harmless surreal comedy for diverse professional workplaces." },
        { role: "user", content: prompt }
      ],
      temperature: 1.05,
      max_tokens: 2000,
      reasoning: { effort: "low", exclude: true }
    }),
    signal: AbortSignal.timeout(45_000)
  });

  if (!upstream.ok) {
    const detail = await upstream.text();
    console.error(`OpenRouter request failed (${upstream.status}):`, detail.slice(0, 500));
    json(response, 502, { message: "The hosted question service is unavailable" });
    return;
  }

  const data = await upstream.json() as {
    choices?: Array<{
      finish_reason?: string;
      message?: { content?: string | Array<{ type?: string; text?: string }> };
    }>;
  };
  const rawContent = data.choices?.[0]?.message?.content;
  const content = typeof rawContent === "string"
    ? rawContent
    : rawContent?.map((part) => part.text || "").join("");
  if (!content) throw new Error("OpenRouter returned an empty response");
  let candidates: unknown[] = [];
  try {
    const parsed = JSON.parse(content) as { questions?: unknown[] };
    if (Array.isArray(parsed.questions)) candidates = parsed.questions;
  } catch {
    // The free router may select a model without reliable strict JSON output.
  }
  if (candidates.length === 0) candidates = content.split(/\r?\n/);
  const questions = [...new Set(candidates.map(normalizeQuestion).filter((item): item is string => Boolean(item)))];
  if (questions.length === 0) throw new Error("No generated questions passed the safety checks");
  json(response, 200, { questions });
}

async function serveStatic(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const pathname = new URL(request.url || "/", `http://${HOST}`).pathname;
  const files: Record<string, string> = { "/": "index.html", "/index.html": "index.html" };
  const filename = files[pathname];
  if (!filename) {
    response.writeHead(404).end("Not found");
    return;
  }
  const content = await readFile(join(ROOT, filename));
  const type = extname(filename) === ".html" ? "text/html; charset=utf-8" : "application/octet-stream";
  response.writeHead(200, {
    "Content-Type": type,
    "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(content);
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/api/questions") {
      await generateQuestions(request, response);
    } else if (request.method === "GET" || request.method === "HEAD") {
      await serveStatic(request, response);
    } else {
      response.writeHead(405, { Allow: "GET, HEAD, POST" }).end("Method not allowed");
    }
  } catch (error) {
    console.error("Request failed:", error instanceof Error ? error.message : error);
    if (!response.headersSent) json(response, 500, { message: "The request could not be completed" });
    else response.end();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`The Absurdity Feed is running at http://${HOST}:${PORT}`);
  if (!process.env.OPENROUTER_API_KEY) console.warn("AI generation is disabled until OPENROUTER_API_KEY is set.");
});
