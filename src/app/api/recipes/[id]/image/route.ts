import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/upload";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: recipeId } = await params;
  const recipe = await prisma.recipe.findFirst({
    where: {
      id: recipeId,
      OR: [
        { userId: session.user.id },
        { shares: { some: { sharedWithId: session.user.id, canEdit: true } } },
      ],
    },
  });

  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found or no edit access" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    if (!file || !file.size) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
    const filename = `${recipeId}-${Date.now()}.${safeExt}`;
    const newUrl = await uploadImage(file, "recipes", filename);

    const current = recipe.imageUrls ? (JSON.parse(recipe.imageUrls) as string[]) : (recipe.imageUrl ? [recipe.imageUrl] : []);
    const imageUrls = [...current, newUrl];
    const imageUrl = imageUrls[0] ?? newUrl;
    await prisma.recipe.update({
      where: { id: recipeId },
      data: { imageUrl, imageUrls: JSON.stringify(imageUrls) },
    });

    return NextResponse.json({ imageUrl: newUrl, imageUrls });
  } catch (e) {
    console.error("Image upload error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
