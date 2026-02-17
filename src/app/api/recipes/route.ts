import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createRecipeSchema = z.object({
  name: z.string().min(1),
  ingredients: z.array(z.string()).default([]),
  instructions: z.string().default(""),
  cuisineType: z.string().optional(),
  prepTimeMinutes: z.number().int().min(0).optional(),
  cookTimeMinutes: z.number().int().min(0).optional(),
  status: z.enum(["FAVORITE", "TO_TRY", "MADE_BEFORE"]).default("TO_TRY"),
  isPublic: z.boolean().default(false),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as "FAVORITE" | "TO_TRY" | "MADE_BEFORE" | null;
  const includeShared = searchParams.get("shared") === "true";

  const owned = await prisma.recipe.findMany({
    where: {
      userId: session.user.id,
      ...(status ? { status } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  let shared: Awaited<ReturnType<typeof prisma.recipe.findMany>> = [];
  if (includeShared) {
    shared = await prisma.recipe.findMany({
      where: {
        shares: {
          some: { sharedWithId: session.user.id },
        },
        ...(status ? { status } : {}),
      },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
    });
  }

  const ownedWithParsed = owned.map((r) => ({
    ...r,
    ingredients: JSON.parse(r.ingredients || "[]") as string[],
  }));
  const sharedWithParsed = shared.map((r) => ({
    ...r,
    ingredients: JSON.parse(r.ingredients || "[]") as string[],
  }));

  return NextResponse.json({
    owned: ownedWithParsed,
    shared: sharedWithParsed,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createRecipeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const recipe = await prisma.recipe.create({
      data: {
        userId: session.user.id,
        name: data.name,
        ingredients: JSON.stringify(data.ingredients),
        instructions: data.instructions,
        cuisineType: data.cuisineType ?? null,
        prepTimeMinutes: data.prepTimeMinutes ?? null,
        cookTimeMinutes: data.cookTimeMinutes ?? null,
        status: data.status,
        isPublic: data.isPublic,
      },
    });

    return NextResponse.json({
      ...recipe,
      ingredients: JSON.parse(recipe.ingredients || "[]"),
    });
  } catch (e) {
    console.error("Create recipe error:", e);
    return NextResponse.json(
      { error: "Failed to create recipe" },
      { status: 500 }
    );
  }
}
