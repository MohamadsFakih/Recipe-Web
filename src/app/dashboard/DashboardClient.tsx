"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
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
  user?: { name: string | null; email: string };
};

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  FAVORITE:    { label: "Favourite",   color: "bg-amber-100 text-amber-800",   dot: "bg-amber-400" },
  TO_TRY:      { label: "To try",      color: "bg-sky-100 text-sky-800",       dot: "bg-sky-400" },
  MADE_BEFORE: { label: "Made before", color: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
};

function RecipeGridCard({ r }: { r: Recipe }) {
  const sc = statusConfig[r.status];
  const totalTime = (r.prepTimeMinutes ?? 0) + (r.cookTimeMinutes ?? 0);

  return (
    <div className="recipe-card rounded-2xl overflow-hidden border border-[var(--card-border)] bg-[var(--card)] group flex flex-col">
      {/* Image */}
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
        {/* Status */}
        {sc && (
          <span className={`absolute top-2.5 right-2.5 badge text-[10px] px-2 py-0.5 rounded-full ${sc.color}`}>
            {sc.label}
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <Link href={`/recipes/${r.id}`}>
          <h3 className="font-semibold text-[var(--foreground)] text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
            {r.name}
          </h3>
        </Link>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)] mb-3">
          {r.cuisineType && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
              {r.cuisineType}
            </span>
          )}
          {totalTime > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {totalTime} min
            </span>
          )}
          {r.user && (
            <span className="text-[var(--muted)] text-[10px]">
              Shared by {r.user.name || r.user.email}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-[var(--card-border)] flex items-center justify-between">
          <Link
            href={`/recipes/${r.id}/edit`}
            className="flex items-center gap-1.5 text-xs text-[var(--accent)] font-medium hover:underline underline-offset-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
          <Link
            href={`/recipes/${r.id}`}
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DashboardClient({ userEmail }: { userEmail: string }) {
  const [recipes, setRecipes] = useState<{ owned: Recipe[]; shared: Recipe[] }>({ owned: [], shared: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [prepMax, setPrepMax] = useState("");
  const [searchResults, setSearchResults] = useState<Recipe[] | null>(null);
  const [showShared, setShowShared] = useState(true);
  const [aiIngredients, setAiIngredients] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  function loadRecipes() {
    setLoading(true);
    fetch("/api/recipes?shared=true")
      .then((r) => r.json())
      .then((data) => {
        setRecipes({ owned: data.owned ?? [], shared: data.shared ?? [] });
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadRecipes(); }, []);

  function runSearch() {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (cuisine) params.set("cuisine", cuisine);
    if (prepMax) params.set("prepMax", prepMax);
    params.set("shared", "true");
    fetch(`/api/recipes/search?${params}`)
      .then((r) => r.json())
      .then(setSearchResults);
  }

  function askAiSuggest() {
    if (!aiIngredients.trim()) return;
    setAiLoading(true);
    fetch("/api/ai/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredients: aiIngredients.split(",").map((s) => s.trim()).filter(Boolean),
        cuisine: cuisine || undefined,
      }),
    })
      .then((r) => r.json())
      .then((data) => setAiSuggestions(data.suggestions ?? []))
      .finally(() => setAiLoading(false));
  }

  const allList = searchResults !== null ? searchResults : [...recipes.owned, ...(showShared ? recipes.shared : [])];

  const stats = {
    total: recipes.owned.length,
    favorites: recipes.owned.filter((r) => r.status === "FAVORITE").length,
    shared: recipes.shared.length,
  };

  void userEmail;

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Page header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-3xl font-bold text-[var(--foreground)] leading-tight mb-1"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif", letterSpacing: "-0.02em" }}
            >
              My Recipes
            </h1>
            <p className="text-sm text-[var(--muted)]">Your personal recipe collection</p>
          </div>
          <Link
            href="/recipes/new"
            className="btn btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Recipe
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total", value: stats.total, icon: "📋" },
            { label: "Favourites", value: stats.favorites, icon: "⭐" },
            { label: "Shared with me", value: stats.shared, icon: "🤝" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="card px-4 py-4 rounded-xl text-center">
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-2xl font-bold text-[var(--accent)]">{value}</div>
              <div className="text-xs text-[var(--muted)] mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* AI suggest panel */}
        <div className="card rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">AI Recipe Suggestions</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">Enter ingredients you have and get recipe ideas instantly</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="e.g. chicken, garlic, lemon, thyme"
              value={aiIngredients}
              onChange={(e) => setAiIngredients(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askAiSuggest()}
              className="form-input flex-1 min-w-[200px] rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-2.5 text-[var(--foreground)] text-sm placeholder:text-[var(--muted)]"
            />
            <button
              onClick={askAiSuggest}
              disabled={aiLoading || !aiIngredients.trim()}
              className="btn btn-primary px-5 py-2.5 rounded-xl text-sm font-medium"
            >
              {aiLoading ? "Thinking…" : "Suggest"}
            </button>
          </div>
          {aiSuggestions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--card-border)]">
              <p className="text-xs font-medium text-[var(--muted)] mb-2">Suggestions:</p>
              <ul className="space-y-1.5">
                {aiSuggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Search & filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search name, ingredient, cuisine…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              className="form-input w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted)]"
            />
          </div>
          <input
            type="text"
            placeholder="Cuisine"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className="form-input w-32 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-[var(--foreground)] text-sm placeholder:text-[var(--muted)]"
          />
          <input
            type="number"
            placeholder="Max prep"
            value={prepMax}
            onChange={(e) => setPrepMax(e.target.value)}
            className="form-input w-28 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-[var(--foreground)] text-sm placeholder:text-[var(--muted)]"
          />
          <button
            onClick={runSearch}
            className="btn btn-primary px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            Search
          </button>
          {searchResults !== null && (
            <button
              onClick={() => setSearchResults(null)}
              className="btn btn-outline px-4 py-2.5 rounded-xl text-sm"
            >
              Clear
            </button>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <p className="text-sm text-[var(--muted)]">
              {allList.length} recipe{allList.length !== 1 ? "s" : ""}
            </p>
            <label className="flex items-center gap-2 text-sm text-[var(--muted)] cursor-pointer">
              <input
                type="checkbox"
                checked={showShared}
                onChange={(e) => setShowShared(e.target.checked)}
                className="rounded"
              />
              Include shared
            </label>
          </div>
          {/* View toggle */}
          <div className="flex rounded-lg border border-[var(--card-border)] overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-1.5 text-sm transition-colors ${view === "grid" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface)]"}`}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-sm transition-colors border-l border-[var(--card-border)] ${view === "list" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface)]"}`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Recipe list */}
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
        ) : allList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="font-semibold text-[var(--foreground)] mb-1">No recipes yet</h3>
            <p className="text-sm text-[var(--muted)] mb-6">Start building your collection by adding your first recipe.</p>
            <Link href="/recipes/new" className="btn btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold">
              + Add your first recipe
            </Link>
          </div>
        ) : view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
            {allList.map((r) => (
              <RecipeGridCard key={r.id} r={r} />
            ))}
          </div>
        ) : (
          /* List view */
          <div className="space-y-2 animate-fade-in">
            {allList.map((r) => {
              const sc = statusConfig[r.status];
              const totalTime = (r.prepTimeMinutes ?? 0) + (r.cookTimeMinutes ?? 0);
              return (
                <div
                  key={r.id}
                  className="recipe-card flex items-center gap-4 p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)]"
                >
                  {r.imageUrl ? (
                    <Link href={`/recipes/${r.id}`} className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-[var(--surface)]">
                      <Image src={r.imageUrl} alt="" fill className="object-cover" unoptimized />
                    </Link>
                  ) : (
                    <Link href={`/recipes/${r.id}`} className="w-14 h-14 shrink-0 rounded-lg bg-[var(--surface)] flex items-center justify-center">
                      <svg className="w-5 h-5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </Link>
                  )}
                  <Link href={`/recipes/${r.id}`} className="flex-1 min-w-0">
                    <span className="font-medium text-[var(--foreground)] block truncate text-sm">{r.name}</span>
                    <span className="text-xs text-[var(--muted)]">
                      {r.cuisineType && `${r.cuisineType} · `}
                      {totalTime > 0 && `${totalTime} min`}
                      {r.user && ` · Shared by ${r.user.name || r.user.email}`}
                    </span>
                  </Link>
                  {sc && (
                    <span className={`badge shrink-0 text-[10px] px-2.5 py-1 rounded-full ${sc.color}`}>
                      {sc.label}
                    </span>
                  )}
                  <Link
                    href={`/recipes/${r.id}/edit`}
                    className="shrink-0 text-xs text-[var(--accent)] font-medium hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
