import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewRecipe } from "@/lib/recipe-access";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: recipeId, commentId } = await params;
  const { canView } = await canViewRecipe(recipeId, session.user.id);
  if (!canView) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  const comment = await prisma.recipeComment.findFirst({
    where: { id: commentId, recipeId },
  });
  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }
  if (comment.userId !== session.user.id) {
    return NextResponse.json(
      { error: "You can only delete your own comments" },
      { status: 403 }
    );
  }

  await prisma.recipeComment.delete({ where: { id: commentId } });
  return NextResponse.json({ success: true });
}
