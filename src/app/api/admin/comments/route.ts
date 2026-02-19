import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const comments = await prisma.recipeComment.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, email: true, name: true } },
      recipe: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(
    comments.map((c) => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt.toISOString(),
      user: c.user,
      recipeId: c.recipeId,
      recipeName: c.recipe.name,
    }))
  );
}
