import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// AI feature: suggest recipe names from ingredients.
// Uses Hugging Face Router (Responses API) if HUGGINGFACE_API_KEY is set; else local matching.

const HF_ROUTER = "https://router.huggingface.co/v1/responses";
const DEFAULT_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

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
      const input = cuisine
        ? `Suggest 3 recipe names only, one per line, using: ${ingredients.join(", ")}. Cuisine: ${cuisine}.`
        : `Suggest 3 recipe names only, one per line, using: ${ingredients.join(", ")}.`;
      const res = await fetch(HF_ROUTER, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          instructions: "Reply with only the recipe names, one per line. No numbering or extra text.",
          input,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { output_text?: string };
        const text = data?.output_text ?? "";
        const suggestions = text
          .split("\n")
          .map((s) => s.replace(/^\d+\.\s*/, "").trim())
          .filter(Boolean)
          .slice(0, 5);
        return NextResponse.json({
          suggestions: suggestions.length ? suggestions : ["Try more ingredients for suggestions."],
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
