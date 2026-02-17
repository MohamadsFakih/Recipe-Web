import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import HomeClient from "./HomeClient";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Discover recipes</h1>
        <p className="text-[var(--muted)] mb-6">
          Browse public recipes from other cooks. Mark your own recipes as &quot;Make public&quot; to share them here.
        </p>
        <HomeClient />
      </main>
    </div>
  );
}
