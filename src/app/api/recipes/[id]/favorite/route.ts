import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewRecipe } from "@/lib/recipe-access";

/** POST: add recipe to favorites. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: recipeId } = await params;
  const { canView } = await canViewRecipe(recipeId, session.user.id);
  if (!canView) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  await prisma.recipeFavorite.upsert({
    where: { recipeId_userId: { recipeId, userId: session.user.id } },
    create: { recipeId, userId: session.user.id },
    update: {},
  });

  return NextResponse.json({ favorited: true });
}

/** DELETE: remove recipe from favorites. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: recipeId } = await params;
  const { canView } = await canViewRecipe(recipeId, session.user.id);
  if (!canView) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  await prisma.recipeFavorite.deleteMany({
    where: { recipeId, userId: session.user.id },
  });

  return NextResponse.json({ favorited: false });
}
