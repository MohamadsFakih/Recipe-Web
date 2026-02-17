import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// AI feature: generate a full recipe from a short description.
// Uses Hugging Face Router (Responses API). Set HUGGINGFACE_API_KEY in .env.local

const HF_ROUTER = "https://router.huggingface.co/v1/responses";
const DEFAULT_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

/** Get plain text from HF Responses API (handles multiple response shapes). */
function getOutputText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const d = data as Record<string, unknown>;
  if (typeof d.output_text === "string") return d.output_text;
  const output = d.output;
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0] as Record<string, unknown>;
    if (Array.isArray(first.content)) {
      for (const part of first.content) {
        const p = part as Record<string, unknown>;
        if (p.type === "output_text" && typeof p.text === "string") return p.text;
        if (typeof p.content === "string") return p.content;
      }
    }
    if (typeof first.text === "string") return first.text;
  }
  // Fallback: dig for first substantial string in response (for unknown shapes)
  const str = findFirstText(data);
  if (str) return str;
  return "";
}

function findFirstText(obj: unknown): string {
  if (typeof obj === "string" && obj.length > 20) return obj;
  if (!obj || typeof obj !== "object") return "";
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const s = findFirstText(item);
      if (s) return s;
    }
    return "";
  }
  for (const v of Object.values(obj as Record<string, unknown>)) {
    const s = findFirstText(v);
    if (s) return s;
  }
  return "";
}

/** Escape literal newlines inside the "instructions" JSON string value so JSON.parse works. */
function fixInstructionsNewlines(jsonStr: string): string {
  const key = '"instructions"';
  const idx = jsonStr.indexOf(key);
  if (idx === -1) return jsonStr;
  const afterKey = jsonStr.slice(idx + key.length);
  const openQuote = afterKey.indexOf('"');
  if (openQuote === -1) return jsonStr;
  const valueStart = idx + key.length + openQuote + 1;
  let valueEnd = valueStart;
  let i = valueStart;
  while (i < jsonStr.length) {
    const c = jsonStr[i];
    if (c === "\\") {
      i += 2;
      continue;
    }
    if (c === '"') {
      valueEnd = i;
      break;
    }
    i += 1;
  }
  const inside = jsonStr.slice(valueStart, valueEnd);
  const fixed = inside.replace(/\r\n/g, "\\n").replace(/\n/g, "\\n").replace(/\r/g, "\\n");
  return jsonStr.slice(0, valueStart) + fixed + jsonStr.slice(valueEnd);
}

function extractJson(text: string): Record<string, unknown> | null {
  if (!text.trim()) return null;
  let cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*$/g, "")
    .replace(/^```\s*/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    // Model often returns "instructions": " with literal newlines; escape them and retry
    try {
      const fixed = fixInstructionsNewlines(cleaned);
      return JSON.parse(fixed) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.HUGGINGFACE_API_KEY ?? process.env.HF_TOKEN;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI is not configured. Set HUGGINGFACE_API_KEY in .env.local" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const model = process.env.HUGGINGFACE_MODEL ?? DEFAULT_MODEL;
    const instructions =
      "You are a recipe assistant. Reply with ONLY a valid JSON object, no other text or markdown. Required keys: name (string), ingredients (array of strings), instructions (string), cuisineType (string), prepTimeMinutes (number), cookTimeMinutes (number).";

    const res = await fetch(HF_ROUTER, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions,
        input: `Recipe: ${prompt}`,
      }),
    });

    const raw = await res.json().catch(() => ({}));
    const text = getOutputText(raw);

    if (!res.ok) {
      console.error("HF generate error:", res.status, JSON.stringify(raw).slice(0, 500));
      if (res.status === 503) {
        return NextResponse.json(
          { error: "Model is loading. Try again in 30 seconds." },
          { status: 503 }
        );
      }
      const errMsg = (raw as { error?: { message?: string } })?.error?.message ?? (raw as { message?: string })?.message;
      return NextResponse.json(
        { error: errMsg || "Generation failed. Check your token and model." },
        { status: 502 }
      );
    }

    const json = text ? extractJson(text) : null;
    if (json) {
      return NextResponse.json({
        name: typeof json.name === "string" ? json.name : "Generated Recipe",
        ingredients: Array.isArray(json.ingredients)
          ? json.ingredients.filter((i): i is string => typeof i === "string")
          : [],
        instructions: typeof json.instructions === "string" ? json.instructions : "",
        cuisineType: typeof json.cuisineType === "string" ? json.cuisineType : undefined,
        prepTimeMinutes: typeof json.prepTimeMinutes === "number" ? json.prepTimeMinutes : undefined,
        cookTimeMinutes: typeof json.cookTimeMinutes === "number" ? json.cookTimeMinutes : undefined,
      });
    }

    // Fallback: use raw text as instructions so user gets something editable
    if (text.trim()) {
      const firstLine = text.split("\n")[0]?.trim() || prompt;
      return NextResponse.json({
        name: firstLine.slice(0, 120),
        ingredients: [],
        instructions: text.trim().slice(0, 4000),
        cuisineType: undefined,
        prepTimeMinutes: undefined,
        cookTimeMinutes: undefined,
      });
    }

    return NextResponse.json(
      { error: "AI returned no text. Try another model (HUGGINGFACE_MODEL) or description." },
      { status: 502 }
    );
  } catch (e) {
    console.error("AI generate error:", e);
    return NextResponse.json(
      { error: "Generation failed" },
      { status: 500 }
    );
  }
}
