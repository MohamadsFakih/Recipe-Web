import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// AI feature: generate a full recipe (name, ingredients, instructions) from a short description.
// Requires OPENAI_API_KEY.

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI generation is not configured. Set OPENAI_API_KEY." },
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

    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey });

    const systemPrompt = `You are a recipe assistant. Given a short description or idea, respond with a JSON object only (no markdown, no code block) with exactly these keys:
- name: string (recipe title)
- ingredients: string[] (list of ingredients with quantities)
- instructions: string (full step-by-step instructions, can be multiple paragraphs)
- cuisineType: string (e.g. Italian, Mexican)
- prepTimeMinutes: number
- cookTimeMinutes: number`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: 800,
    });

    const text = completion.choices[0]?.message?.content ?? "";
    let json: Record<string, unknown>;
    try {
      const cleaned = text.replace(/```json?\s*/g, "").replace(/```\s*$/g, "").trim();
      json = JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid format" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      name: json.name ?? "Generated Recipe",
      ingredients: Array.isArray(json.ingredients) ? json.ingredients : [],
      instructions: typeof json.instructions === "string" ? json.instructions : "",
      cuisineType: typeof json.cuisineType === "string" ? json.cuisineType : undefined,
      prepTimeMinutes: typeof json.prepTimeMinutes === "number" ? json.prepTimeMinutes : undefined,
      cookTimeMinutes: typeof json.cookTimeMinutes === "number" ? json.cookTimeMinutes : undefined,
    });
  } catch (e) {
    console.error("AI generate error:", e);
    return NextResponse.json(
      { error: "Generation failed" },
      { status: 500 }
    );
  }
}
