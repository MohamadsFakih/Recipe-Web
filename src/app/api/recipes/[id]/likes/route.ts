import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewRecipe } from "@/lib/recipe-access";

export async function GET(
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

  const [count, userLike] = await Promise.all([
    prisma.recipeLike.count({ where: { recipeId } }),
    prisma.recipeLike.findUnique({
      where: { recipeId_userId: { recipeId, userId: session.user.id } },
    }),
  ]);

  return NextResponse.json({ count, liked: !!userLike });
}

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

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { userId: true },
  });
  if (recipe?.userId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot like your own recipe" },
      { status: 400 }
    );
  }

  await prisma.recipeLike.upsert({
    where: { recipeId_userId: { recipeId, userId: session.user.id } },
    create: { recipeId, userId: session.user.id },
    update: {},
  });

  const count = await prisma.recipeLike.count({ where: { recipeId } });
  return NextResponse.json({ count, liked: true });
}

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

  await prisma.recipeLike.deleteMany({
    where: { recipeId, userId: session.user.id },
  });

  const count = await prisma.recipeLike.count({ where: { recipeId } });
  return NextResponse.json({ count, liked: false });
}
