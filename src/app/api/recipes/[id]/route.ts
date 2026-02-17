import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateRecipeSchema = z.object({
  name: z.string().min(1).optional(),
  ingredients: z.array(z.string()).optional(),
  instructions: z.string().optional(),
  cuisineType: z.string().optional().nullable(),
  prepTimeMinutes: z.number().int().min(0).optional().nullable(),
  cookTimeMinutes: z.number().int().min(0).optional().nullable(),
  status: z.enum(["FAVORITE", "TO_TRY", "MADE_BEFORE"]).optional(),
  isPublic: z.boolean().optional(),
  imageUrl: z.string().optional().nullable(),
  imageUrls: z.array(z.string()).optional(),
});

async function canAccessRecipe(
  recipeId: string,
  userId: string,
  needOwner = false
) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      shares: { where: { sharedWithId: userId } },
    },
  });
  if (!recipe) return { ok: false, recipe: null };
  const isOwner = recipe.userId === userId;
  const isShared = recipe.shares.length > 0 && recipe.shares[0].canEdit;
  const isPublic = recipe.isPublic;
  if (needOwner && !isOwner) return { ok: false, recipe };
  if (isOwner || isShared || isPublic) {
    return { ok: true, recipe, isOwner, canEdit: isOwner || isShared };
  }
  return { ok: false, recipe };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { ok, recipe } = await canAccessRecipe(id, session.user.id);
  if (!ok || !recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...recipe,
    ingredients: JSON.parse(recipe.ingredients || "[]"),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { ok, canEdit } = await canAccessRecipe(id, session.user.id);
  if (!ok || !canEdit) {
    return NextResponse.json({ error: "Recipe not found or no edit access" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = updateRecipeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.instructions !== undefined) updateData.instructions = data.instructions;
    if (data.cuisineType !== undefined) updateData.cuisineType = data.cuisineType;
    if (data.prepTimeMinutes !== undefined) updateData.prepTimeMinutes = data.prepTimeMinutes;
    if (data.cookTimeMinutes !== undefined) updateData.cookTimeMinutes = data.cookTimeMinutes;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.ingredients !== undefined) updateData.ingredients = JSON.stringify(data.ingredients);
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.imageUrls !== undefined) {
      updateData.imageUrls = JSON.stringify(data.imageUrls);
      updateData.imageUrl = data.imageUrls[0] ?? null;
    }

    const recipe = await prisma.recipe.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...recipe,
      ingredients: JSON.parse(recipe.ingredients || "[]"),
    });
  } catch (e) {
    console.error("Update recipe error:", e);
    return NextResponse.json(
      { error: "Failed to update recipe" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { ok, isOwner } = await canAccessRecipe(id, session.user.id, true);
  if (!ok || !isOwner) {
    return NextResponse.json({ error: "Recipe not found or not owner" }, { status: 404 });
  }

  await prisma.recipe.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
