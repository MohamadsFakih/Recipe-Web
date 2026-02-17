import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const shareSchema = z.object({
  sharedWithEmail: z.string().email(),
  canEdit: z.boolean().default(false),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: recipeId } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });
  if (!recipe || recipe.userId !== session.user.id) {
    return NextResponse.json({ error: "Recipe not found or not owner" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = shareSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { sharedWithEmail, canEdit } = parsed.data;

    const sharedWith = await prisma.user.findUnique({
      where: { email: sharedWithEmail },
    });
    if (!sharedWith) {
      return NextResponse.json(
        { error: "No user found with that email" },
        { status: 404 }
      );
    }
    if (sharedWith.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot share with yourself" },
        { status: 400 }
      );
    }

    await prisma.recipeShare.upsert({
      where: {
        recipeId_sharedWithId: { recipeId, sharedWithId: sharedWith.id },
      },
      create: {
        recipeId,
        ownerId: session.user.id,
        sharedWithId: sharedWith.id,
        canEdit,
      },
      update: { canEdit },
    });

    return NextResponse.json({
      success: true,
      sharedWith: { email: sharedWith.email, name: sharedWith.name },
    });
  } catch (e) {
    console.error("Share recipe error:", e);
    return NextResponse.json(
      { error: "Failed to share recipe" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: recipeId } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });
  if (!recipe || recipe.userId !== session.user.id) {
    return NextResponse.json({ error: "Recipe not found or not owner" }, { status: 404 });
  }

  const shares = await prisma.recipeShare.findMany({
    where: { recipeId },
    include: {
      sharedWith: { select: { email: true, name: true } },
    },
  });

  return NextResponse.json(shares);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: recipeId } = await params;
  const { searchParams } = new URL(request.url);
  const sharedWithId = searchParams.get("userId");

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });
  if (!recipe || recipe.userId !== session.user.id) {
    return NextResponse.json({ error: "Recipe not found or not owner" }, { status: 404 });
  }

  if (!sharedWithId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  await prisma.recipeShare.deleteMany({
    where: { recipeId, sharedWithId },
  });

  return NextResponse.json({ success: true });
}
