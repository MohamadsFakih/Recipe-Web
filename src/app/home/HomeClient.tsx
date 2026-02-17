"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Recipe = {
  id: string;
  name: string;
  cuisineType: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  status: string;
  imageUrl?: string | null;
  user: { id: string; name: string | null; email: string };
};

const CUISINE_FILTERS = ["All", "Italian", "Japanese", "Mexican", "Indian", "French", "Thai", "American", "Chinese"];

const statusConfig: Record<string, { label: string; color: string }> = {
  FAVORITE:    { label: "Favourite",    color: "bg-amber-100 text-amber-800" },
  TO_TRY:      { label: "To try",       color: "bg-sky-100 text-sky-800" },
  MADE_BEFORE: { label: "Made before",  color: "bg-emerald-100 text-emerald-800" },
};

function RecipeCard({ r }: { r: Recipe }) {
  const totalTime = (r.prepTimeMinutes ?? 0) + (r.cookTimeMinutes ?? 0);
  const sc = statusConfig[r.status];

  return (
    <Link href={`/recipes/${r.id}`} className="recipe-card block rounded-2xl overflow-hidden border border-[var(--card-border)] bg-[var(--card)] group">
      {/* Image area */}
      <div className="relative w-full aspect-[4/3] bg-[var(--surface)] overflow-hidden">
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
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--accent-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <span className="text-xs text-[var(--muted)]">No image</span>
          </div>
        )}
        {/* Cuisine badge */}
        {r.cuisineType && (
          <span className="absolute top-3 left-3 badge bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
            {r.cuisineType}
          </span>
        )}
        {/* Status badge */}
        {sc && (
          <span className={`absolute top-3 right-3 badge text-[10px] px-2.5 py-1 rounded-full ${sc.color}`}>
            {sc.label}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h2 className="font-semibold text-[var(--foreground)] text-base leading-snug mb-1 line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
          {r.name}
        </h2>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-[var(--muted)] mb-3">
          {totalTime > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {totalTime} min
            </span>
          )}
          {r.prepTimeMinutes != null && r.cookTimeMinutes != null && totalTime > 0 && (
            <span className="text-[var(--card-border)]">·</span>
          )}
          {r.prepTimeMinutes != null && r.cookTimeMinutes != null && (
            <span>{r.prepTimeMinutes}+{r.cookTimeMinutes} min</span>
          )}
        </div>

        {/* Author */}
        <div className="flex items-center gap-2 pt-3 border-t border-[var(--card-border)]">
          <div className="w-5 h-5 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[9px] font-bold text-[var(--accent)] shrink-0">
            {(r.user.name || r.user.email).charAt(0).toUpperCase()}
          </div>
          <Link
            href={`/users/${r.user.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors truncate"
          >
            {r.user.name || r.user.email}
          </Link>
        </div>
      </div>
    </Link>
  );
}

export default function HomeClient() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [cuisineFilter, setCuisineFilter] = useState("All");
  const [q, setQ] = useState("");
  const [inputQ, setInputQ] = useState("");

  function load(cuisineVal?: string, qVal?: string) {
    setLoading(true);
    const params = new URLSearchParams();
    const useCuisine = cuisineVal ?? cuisineFilter;
    const useQ = qVal ?? q;
    if (useCuisine && useCuisine !== "All") params.set("cuisine", useCuisine);
    if (useQ) params.set("q", useQ);
    fetch(`/api/recipes/public?${params}`)
      .then((r) => r.json())
      .then(setRecipes)
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleCuisineFilter(c: string) {
    setCuisineFilter(c);
    load(c, q);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQ(inputQ);
    load(cuisineFilter, inputQ);
  }

  return (
    <>
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search recipes…"
            value={inputQ}
            onChange={(e) => setInputQ(e.target.value)}
            className="form-input w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted)]"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary px-5 py-2.5 rounded-xl text-sm font-medium"
        >
          Search
        </button>
        {q && (
          <button
            type="button"
            onClick={() => { setInputQ(""); setQ(""); load(cuisineFilter, ""); }}
            className="btn btn-outline px-4 py-2.5 rounded-xl text-sm"
          >
            Clear
          </button>
        )}
      </form>

      {/* Cuisine filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CUISINE_FILTERS.map((c) => (
          <button
            key={c}
            onClick={() => handleCuisineFilter(c)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border ${
              cuisineFilter === c
                ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm"
                : "bg-[var(--card)] text-[var(--muted)] border-[var(--card-border)] hover:border-[var(--accent-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-[var(--card-border)]">
              <div className="skeleton aspect-[4/3]" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-[var(--foreground)] mb-1">No recipes found</h3>
          <p className="text-sm text-[var(--muted)] max-w-xs">
            {q || cuisineFilter !== "All"
              ? "Try adjusting your search filters."
              : "No public recipes yet. Be the first to share one!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
          {recipes.map((r) => (
            <RecipeCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </>
  );
}
