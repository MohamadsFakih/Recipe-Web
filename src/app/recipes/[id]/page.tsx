import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
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

  const [likeCount, userLike, userFavorite, comments] = await Promise.all([
    prisma.recipeLike.count({ where: { recipeId: id } }),
    prisma.recipeLike.findUnique({
      where: { recipeId_userId: { recipeId: id, userId: session.user.id } },
    }),
    prisma.recipeFavorite.findUnique({
      where: { recipeId_userId: { recipeId: id, userId: session.user.id } },
    }),
    prisma.recipeComment.findMany({
      where: { recipeId: id },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
  ]);

  const ingredients = JSON.parse(recipe.ingredients || "[]") as string[];
  const imageUrls = recipe.imageUrls
    ? (JSON.parse(recipe.imageUrls) as string[])
    : recipe.imageUrl
      ? [recipe.imageUrl]
      : [];
  const isOwner = recipe.userId === session.user.id;
  const canEdit = isOwner || (recipe.shares?.[0]?.canEdit ?? false);

  const commentList = comments.map((c) => ({
    id: c.id,
    text: c.text,
    createdAt: c.createdAt.toISOString(),
    user: c.user,
  }));

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <RecipeDetail
          recipe={{
            ...recipe,
            ingredients,
            imageUrls,
          }}
          isOwner={isOwner}
          canEdit={canEdit}
          likeCount={likeCount}
          userLiked={!!userLike}
          userFavorited={!!userFavorite}
          comments={commentList}
        />
      </main>
    </div>
  );
}
