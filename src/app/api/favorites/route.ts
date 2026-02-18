import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET: list all recipes the current user has favorited (bookmarked). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await prisma.recipeFavorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      recipe: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  type FavRow = { recipe: { id: string; name: string; ingredients: string; instructions: string; cuisineType: string | null; prepTimeMinutes: number | null; cookTimeMinutes: number | null; status: string; imageUrl: string | null; user: { id: string; name: string | null; email: string | null } } };
  const recipes = favorites.map((f: FavRow) => {
    const r = f.recipe;
    return {
      id: r.id,
      name: r.name,
      ingredients: JSON.parse(r.ingredients || "[]") as string[],
      instructions: r.instructions,
      cuisineType: r.cuisineType,
      prepTimeMinutes: r.prepTimeMinutes,
      cookTimeMinutes: r.cookTimeMinutes,
      status: r.status,
      imageUrl: r.imageUrl,
      user: r.user,
    };
  });

  return NextResponse.json(recipes);
}
