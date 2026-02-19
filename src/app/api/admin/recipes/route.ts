import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const recipes = await prisma.recipe.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, name: true } },
      _count: { select: { comments: true, likes: true } },
    },
  });

  return NextResponse.json(
    recipes.map((r) => ({
      id: r.id,
      name: r.name,
      isPublic: r.isPublic,
      createdAt: r.createdAt.toISOString(),
      user: r.user,
      commentCount: r._count.comments,
      likeCount: r._count.likes,
    }))
  );
}
