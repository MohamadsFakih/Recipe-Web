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
  const q = searchParams.get("q")?.trim() ?? "";
  const cuisine = searchParams.get("cuisine")?.trim();
  const prepMax = searchParams.get("prepMax"); // max prep time in minutes
  const includeShared = searchParams.get("shared") !== "false";

  const conditions: Prisma.RecipeWhereInput[] = [];

  // Own recipes or shared with me
  conditions.push({
    OR: [
      { userId: session.user.id },
      ...(includeShared
        ? [{ shares: { some: { sharedWithId: session.user.id } } }]
        : []),
    ],
  });

  if (q) {
    conditions.push({
      OR: [
        { name: { contains: q } },
        { instructions: { contains: q } },
        { cuisineType: { contains: q } },
        { ingredients: { contains: q } },
      ],
    });
  }

  if (cuisine) {
    conditions.push({
      cuisineType: { contains: cuisine },
    });
  }

  if (prepMax !== null && prepMax !== undefined && prepMax !== "") {
    const max = parseInt(prepMax, 10);
    if (!Number.isNaN(max)) {
      conditions.push({
        prepTimeMinutes: { lte: max },
      });
    }
  }

  const recipes = await prisma.recipe.findMany({
    where: { AND: conditions },
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { likes: true, favorites: true } },
    },
  });

  const withParsed = recipes.map((r) => {
    const { _count, ...rest } = r;
    return {
      ...rest,
      ingredients: JSON.parse(r.ingredients || "[]") as string[],
      likeCount: _count.likes,
      favoriteCount: _count.favorites,
    };
  });

  return NextResponse.json(withParsed);
}
