"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Recipe = {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string;
  cuisineType: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  status: string;
  imageUrl?: string | null;
  user?: { id: string; name: string | null; email: string | null };
};

function RecipeCard({ r }: { r: Recipe }) {
  const totalTime = (r.prepTimeMinutes ?? 0) + (r.cookTimeMinutes ?? 0);
  return (
    <div className="recipe-card rounded-2xl overflow-hidden border border-[var(--card-border)] bg-[var(--card)] group flex flex-col">
      <Link href={`/recipes/${r.id}`} className="relative block aspect-[16/10] bg-[var(--surface)] overflow-hidden">
        {r.imageUrl ? (
          <Image
            src={r.imageUrl}
            alt={r.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--accent-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        )}
      </Link>
      <div className="p-4 flex-1 flex flex-col">
        <Link href={`/recipes/${r.id}`}>
          <h3 className="font-semibold text-[var(--foreground)] text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
            {r.name}
          </h3>
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)] mb-3">
          {r.cuisineType && <span>{r.cuisineType}</span>}
          {totalTime > 0 && <span>{totalTime} min</span>}
          {r.user && (
            <span>
              By {r.user.name || r.user.email}
            </span>
          )}
        </div>
        <div className="mt-auto pt-3 border-t border-[var(--card-border)]">
          <Link
            href={`/recipes/${r.id}`}
            className="text-xs text-[var(--accent)] font-medium hover:underline underline-offset-2"
          >
            View recipe →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function FavoritesClient() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((data) => setRecipes(Array.isArray(data) ? data : []))
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1
          className="text-3xl font-bold text-[var(--foreground)] leading-tight mb-1"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", letterSpacing: "-0.02em" }}
        >
          Favorites
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Recipes you&apos;ve saved for later
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-[var(--card-border)]">
              <div className="skeleton aspect-[16/10]" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <h3 className="font-semibold text-[var(--foreground)] mb-1">No favorites yet</h3>
          <p className="text-sm text-[var(--muted)] mb-6 max-w-sm">
            When you find a recipe you like, click the star on the recipe page to add it here.
          </p>
          <Link href="/home" className="btn btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold">
            Discover recipes
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
          {recipes.map((r) => (
            <RecipeCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </main>
  );
}
