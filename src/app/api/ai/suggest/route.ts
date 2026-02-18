import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// AI feature: suggest recipe names from ingredients.
// Uses Hugging Face Router (Responses API) if HUGGINGFACE_API_KEY is set; else local matching.

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
  for (const v of Object.values(d)) {
    if (typeof v === "string" && v.length > 10) return v;
    if (v && typeof v === "object" && Array.isArray(v) && v[0] && typeof (v[0] as Record<string, unknown>).text === "string") {
      return ((v[0] as Record<string, unknown>).text as string);
    }
  }
  return "";
}

/** Lines that are clearly not recipe names (apologies, instructions, etc.). */
function isRecipeNameLike(line: string): boolean {
  const lower = line.toLowerCase();
  const skip = [
    "try more", "try adding", "sorry", "i cannot", "i can't", "i'm unable",
    "here are", "suggestions:", "recipe names", "you could", "for example",
    "ingredients", "need more", "please provide", "unable to",
  ];
  if (skip.some((s) => lower.includes(s))) return false;
  if (line.length < 2 || line.length > 120) return false;
  return true;
}

function parseRecipeNames(text: string): string[] {
  return text
    .split(/\n+/)
    .map((s) => s.replace(/^[\d•\-*.]+\s*/, "").trim())
    .filter(Boolean)
    .filter(isRecipeNameLike)
    .slice(0, 5);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const ingredients: string[] = Array.isArray(body.ingredients)
      ? body.ingredients
      : typeof body.ingredients === "string"
        ? body.ingredients.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];
    const cuisine = typeof body.cuisine === "string" ? body.cuisine.trim() : "";

    const apiKey = process.env.HUGGINGFACE_API_KEY ?? process.env.HF_TOKEN;
    if (apiKey && ingredients.length > 0) {
      const model = process.env.HUGGINGFACE_MODEL ?? DEFAULT_MODEL;
      const ingredientList = ingredients.join(", ");
      const input = cuisine
        ? `Ingredients: ${ingredientList}. Cuisine: ${cuisine}. List 3 dish or recipe names that use these ingredients. One name per line, no numbering.`
        : `Ingredients: ${ingredientList}. List 3 dish or recipe names that use these ingredients. One name per line, no numbering.`;
      const res = await fetch(HF_ROUTER, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          instructions: "Output only recipe or dish names, one per line. No numbers, no bullets, no explanations. Just the names.",
          input,
        }),
      });

      const raw = await res.json().catch(() => ({}));
      const text = getOutputText(raw);
      const suggestions = parseRecipeNames(text);

      if (suggestions.length > 0) {
        return NextResponse.json({
          suggestions,
          source: "huggingface",
        });
      }
    }

    // Fallback: match from user's + shared recipes
    const ownedAndShared = await prisma.recipe.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { shares: { some: { sharedWithId: session.user.id } } },
        ],
      },
    });

    const scored = ownedAndShared.map((r) => {
      const ingList = (JSON.parse(r.ingredients || "[]") as string[]).join(" ").toLowerCase();
      let score = 0;
      for (const ing of ingredients) {
        if (ingList.includes(ing.toLowerCase())) score += 1;
      }
      if (cuisine && r.cuisineType?.toLowerCase().includes(cuisine.toLowerCase())) score += 2;
      return { recipe: r, score };
    });

    const suggested = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s) => ({
        name: s.recipe.name,
        id: s.recipe.id,
        matchScore: s.score,
      }));

    return NextResponse.json({
      suggestions: suggested.length ? suggested.map((s) => s.name) : ["Try adding more ingredients to get suggestions."],
      source: "local",
      matches: suggested,
    });
  } catch (e) {
    console.error("AI suggest error:", e);
    return NextResponse.json(
      { error: "Suggestion failed" },
      { status: 500 }
    );
  }
}
