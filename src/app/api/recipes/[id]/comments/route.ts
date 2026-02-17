import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewRecipe } from "@/lib/recipe-access";

const createCommentSchema = z.object({
  text: z.string().min(1).max(2000),
});

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

  const comments = await prisma.recipeComment.findMany({
    where: { recipeId },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  return NextResponse.json(
    comments.map((c) => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt.toISOString(),
      user: c.user,
    }))
  );
}

export async function POST(
  request: Request,
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

  const body = await request.json();
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid comment", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const comment = await prisma.recipeComment.create({
    data: {
      recipeId,
      userId: session.user.id,
      text: parsed.data.text.trim(),
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  return NextResponse.json({
    id: comment.id,
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
    user: comment.user,
  });
}
