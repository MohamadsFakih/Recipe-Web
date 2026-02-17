import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";
import RecipeDetail from "./RecipeDetail";

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const recipe = await prisma.recipe.findFirst({
    where: {
      id,
      OR: [
        { userId: session.user.id },
        { shares: { some: { sharedWithId: session.user.id } } },
        { isPublic: true },
      ],
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
      shares: { where: { sharedWithId: session.user.id }, select: { canEdit: true } },
    },
  });

  if (!recipe) notFound();

  const ingredients = JSON.parse(recipe.ingredients || "[]") as string[];
  const imageUrls = recipe.imageUrls
    ? (JSON.parse(recipe.imageUrls) as string[])
    : recipe.imageUrl
      ? [recipe.imageUrl]
      : [];
  const isOwner = recipe.userId === session.user.id;
  const canEdit = isOwner || (recipe.shares?.[0]?.canEdit ?? false);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <RecipeDetail
          recipe={{
            ...recipe,
            ingredients,
            imageUrls,
          }}
          isOwner={isOwner}
          canEdit={canEdit}
        />
      </main>
    </div>
  );
}
