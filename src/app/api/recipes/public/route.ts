import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cuisine = searchParams.get("cuisine")?.trim();
  const q = searchParams.get("q")?.trim();

  const where: Prisma.RecipeWhereInput = {
    isPublic: true,
    userId: { not: session.user.id },
  };
  if (cuisine) where.cuisineType = { contains: cuisine };
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { instructions: { contains: q } },
      { cuisineType: { contains: q } },
      { ingredients: { contains: q } },
    ];
  }

  const recipes = await prisma.recipe.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const withParsed = recipes.map((r) => ({
    ...r,
    ingredients: JSON.parse(r.ingredients || "[]") as string[],
  }));

  return NextResponse.json(withParsed);
}
