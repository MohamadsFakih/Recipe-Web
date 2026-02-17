import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// AI feature: suggest recipes from ingredients or generate idea.
// Uses OpenAI if OPENAI_API_KEY is set; otherwise returns a simple in-app suggestion.

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

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey });
      const prompt = cuisine
        ? `Suggest 3 concrete recipe names (only titles, one per line) that use these ingredients: ${ingredients.join(", ")}. Cuisine style: ${cuisine}.`
        : `Suggest 3 concrete recipe names (only titles, one per line) that use these ingredients: ${ingredients.join(", ")}.`;
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
      });
      const text = completion.choices[0]?.message?.content ?? "";
      const suggestions = text
        .split("\n")
        .map((s) => s.replace(/^\d+\.\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 5);
      return NextResponse.json({ suggestions, source: "openai" });
    }

    // Fallback: find matching recipes from user's + shared recipes by ingredient text
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
