import { prisma } from "@/lib/prisma";

/** Check if a user can view a recipe (owner, shared with, or public). */
export async function canViewRecipe(recipeId: string, userId: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      shares: { where: { sharedWithId: userId } },
    },
  });
  if (!recipe) return { canView: false, recipe: null };
  const isOwner = recipe.userId === userId;
  const isShared = recipe.shares.length > 0;
  const isPublic = recipe.isPublic;
  if (isOwner || isShared || isPublic) {
    return { canView: true, recipe };
  }
  return { canView: false, recipe };
}
