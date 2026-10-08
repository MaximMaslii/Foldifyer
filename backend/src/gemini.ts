// Pictures through Google's Gemini image models ("Nano Banana"), called over plain HTTPS.
// Several times cheaper per picture than gpt-image-1; which one looks better is decided by testing.
import { env } from "./env.js";

const BASE = "https://generativelanguage.googleapis.com/v1beta";
type Pic = { buf: Buffer; type: string };
type Part = { text?: string; inlineData?: { mimeType: string; data: string }; inline_data?: { mime_type: string; data: string } };
type Reply = {
  candidates?: { content?: { parts?: Part[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: Record<string, unknown>;
  error?: { message?: string; status?: string };
};

/** Image models this key can use (for the test script and for a helpful error message). */
export async function geminiImageModels(): Promise<string[]> {
  const res = await fetch(`${BASE}/models?pageSize=200`, { headers: { "x-goog-api-key": env.geminiKey }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`gemini models ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
  return (body.models ?? []).filter((m) => /image/i.test(m.name) && !/imagen/i.test(m.name) && m.supportedGenerationMethods?.includes("generateContent")).map((m) => m.name.replace(/^models\//, ""));
}

export async function geminiEdit(prompt: string, pics: Pic[], model = env.geminiImageModel, ratio = "1:1"): Promise<Pic & { usage?: Record<string, unknown> }> {
  const imageConfig: Record<string, string> = { aspectRatio: ratio };
  if (/gemini-3|nano-banana/.test(model)) imageConfig.imageSize = env.geminiImageSize; // 2.5 models have one fixed size
  const res = await fetch(`${BASE}/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": env.geminiKey, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(180_000),
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }, ...pics.map((p) => ({ inlineData: { mimeType: p.type, data: p.buf.toString("base64") } }))] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig },
    }),
  });
  const body = (await res.json().catch(() => ({}))) as Reply;
  if (!res.ok) throw Object.assign(new Error(`gemini ${res.status}: ${body.error?.message ?? "request failed"}`), { status: res.status });
  if (body.promptFeedback?.blockReason) throw new Error(`gemini blocked the request: ${body.promptFeedback.blockReason}`);
  const cand = body.candidates?.[0];
  for (const p of cand?.content?.parts ?? []) {
    const d = p.inlineData ?? (p.inline_data ? { mimeType: p.inline_data.mime_type, data: p.inline_data.data } : undefined);
    if (d?.data) return { buf: Buffer.from(d.data, "base64"), type: d.mimeType || "image/png", usage: body.usageMetadata };
  }
  throw new Error(`gemini returned no picture (${cand?.finishReason ?? "no candidate"})`);
}

/** JSON Schema as OpenAI takes it → the subset Gemini takes (no additionalProperties; "nullable" instead of a null type). */
function toGeminiSchema(x: unknown): unknown {
  if (Array.isArray(x)) return x.map(toGeminiSchema);
  if (!x || typeof x !== "object") return x;
  const o = { ...(x as Record<string, unknown>) };
  delete o.additionalProperties;
  if (Array.isArray(o.type)) { const real = (o.type as string[]).filter((t) => t !== "null"); o.nullable = (o.type as string[]).includes("null"); o.type = real[0]; }
  for (const k of Object.keys(o)) if (k !== "enum" && k !== "required") o[k] = toGeminiSchema(o[k]);
  return o;
}

/** Structured answer from a Gemini text model: a system line, a user text and optional JPEG pictures (base64). */
export async function geminiJson(system: string, text: string, images: string[], schema: object, maxTokens: number): Promise<unknown> {
  const res = await fetch(`${BASE}/models/${encodeURIComponent(env.geminiTextModel)}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": env.geminiKey, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(60_000),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text }, ...images.map((data) => ({ inlineData: { mimeType: "image/jpeg", data } }))] }],
      // Thinking models spend part of the budget before answering, so leave room for it.
      generationConfig: { responseMimeType: "application/json", responseSchema: toGeminiSchema(schema), maxOutputTokens: maxTokens + 2000, temperature: 0.4 },
    }),
  });
  const body = (await res.json().catch(() => ({}))) as Reply;
  if (!res.ok) throw Object.assign(new Error(`gemini ${res.status}: ${body.error?.message ?? "request failed"}`), { status: res.status });
  if (body.promptFeedback?.blockReason) throw new Error(`gemini blocked the request: ${body.promptFeedback.blockReason}`);
  const out = (body.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  if (!out) throw new Error(`gemini returned no text (${body.candidates?.[0]?.finishReason ?? "no candidate"})`);
  return JSON.parse(out);
}
