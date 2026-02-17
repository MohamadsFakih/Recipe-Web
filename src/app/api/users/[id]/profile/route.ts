import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const publicRecipes = await prisma.recipe.findMany({
    where: { userId: id, isPublic: true },
    orderBy: { updatedAt: "desc" },
  });

  const recipesWithParsed = publicRecipes.map((r) => ({
    ...r,
    ingredients: JSON.parse(r.ingredients || "[]") as string[],
  }));

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email },
    recipes: recipesWithParsed,
  });
}
