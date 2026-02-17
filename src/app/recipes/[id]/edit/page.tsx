import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import RecipeForm from "@/components/RecipeForm";

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const recipe = await prisma.recipe.findFirst({
    where: {
      id,
      OR: [
        { userId: session.user.id },
        { shares: { some: { sharedWithId: session.user.id, canEdit: true } } },
      ],
    },
  });

  if (!recipe) notFound();

  const ingredients = JSON.parse(recipe.ingredients || "[]") as string[];
  const imageUrls = recipe.imageUrls
    ? (JSON.parse(recipe.imageUrls) as string[])
    : recipe.imageUrl
      ? [recipe.imageUrl]
      : [];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">Edit recipe</h1>
        <RecipeForm
          recipeId={recipe.id}
          initial={{
            name: recipe.name,
            ingredients,
            instructions: recipe.instructions,
            cuisineType: recipe.cuisineType,
            prepTimeMinutes: recipe.prepTimeMinutes,
            cookTimeMinutes: recipe.cookTimeMinutes,
            status: recipe.status,
            isPublic: recipe.isPublic,
            imageUrl: recipe.imageUrl,
            imageUrls,
          }}
        />
      </main>
    </div>
  );
}
