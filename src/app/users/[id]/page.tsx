import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import UserProfileClient from "./UserProfileClient";

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
  if (!user) notFound();

  const recipes = await prisma.recipe.findMany({
    where: { userId: id, isPublic: true },
    orderBy: { updatedAt: "desc" },
  });
  const recipeList = recipes.map((r) => ({
    id: r.id,
    name: r.name,
    cuisineType: r.cuisineType,
    prepTimeMinutes: r.prepTimeMinutes,
    cookTimeMinutes: r.cookTimeMinutes,
    status: r.status,
    imageUrl: r.imageUrl ?? null,
  }));

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <UserProfileClient user={user} recipes={recipeList} />

        <p className="mt-6">
          <Link href="/home" className="text-[var(--accent)] hover:underline">
            ← Back to Home
          </Link>
        </p>
      </main>
    </div>
  );
}
