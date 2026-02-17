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

  function loadRecipes() {
    setLoading(true);
    fetch("/api/recipes?shared=true")
      .then((r) => r.json())
      .then((data) => {
        setRecipes({ owned: data.owned ?? [], shared: data.shared ?? [] });
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRecipes();
  }, []);

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
    fetch("/api/ai/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredients: aiIngredients.split(",").map((s) => s.trim()).filter(Boolean),
        cuisine: cuisine || undefined,
      }),
    })
      .then((r) => r.json())
      .then((data) => setAiSuggestions(data.suggestions ?? []));
  }

  const list = searchResults !== null ? searchResults : [...recipes.owned, ...recipes.shared];
  const filteredList = list;

  const statusLabel: Record<string, string> = {
    FAVORITE: "Favourite",
    TO_TRY: "To try",
    MADE_BEFORE: "Made before",
  };
  const statusColor: Record<string, string> = {
    FAVORITE: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    TO_TRY: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
    MADE_BEFORE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  };

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search by name, ingredient, cuisine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            className="flex-1 min-w-[200px] rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-[var(--foreground)]"
          />
          <input
            type="text"
            placeholder="Cuisine"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className="w-32 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-[var(--foreground)]"
          />
          <input
            type="number"
            placeholder="Max prep (min)"
            value={prepMax}
            onChange={(e) => setPrepMax(e.target.value)}
            className="w-28 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-[var(--foreground)]"
          />
          <button
            onClick={runSearch}
            className="rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2"
          >
            Search
          </button>
          {searchResults !== null && (
            <button
              onClick={() => setSearchResults(null)}
              className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm"
            >
              Clear
            </button>
          )}
        </div>

        <div className="mb-6 p-4 rounded-xl bg-[var(--surface)] border border-[var(--card-border)]">
          <p className="text-sm font-medium text-[var(--foreground)] mb-2">AI: Suggest recipes from ingredients</p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="e.g. chicken, garlic, lemon"
              value={aiIngredients}
              onChange={(e) => setAiIngredients(e.target.value)}
              className="flex-1 min-w-[200px] rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-[var(--foreground)]"
            />
            <button
              onClick={askAiSuggest}
              className="rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2"
            >
              Suggest
            </button>
          </div>
          {aiSuggestions.length > 0 && (
            <ul className="mt-2 text-sm text-[var(--muted)] list-disc list-inside">
              {aiSuggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Recipes</h1>
          <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <input
              type="checkbox"
              checked={showShared}
              onChange={(e) => setShowShared(e.target.checked)}
            />
            Include shared with me
          </label>
          <Link
            href="/recipes/new"
            className="rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 text-sm font-medium"
          >
            + Add recipe
          </Link>
        </div>

        {loading ? (
          <p className="text-[var(--muted)]">Loading…</p>
        ) : (
          <ul className="space-y-3">
            {(showShared ? filteredList : recipes.owned).map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] hover:border-[var(--accent)]/50 transition-colors"
              >
                {r.imageUrl ? (
                  <Link href={`/recipes/${r.id}`} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-[var(--surface)]">
                    <Image src={r.imageUrl} alt="" fill className="object-cover" unoptimized />
                  </Link>
                ) : (
                  <Link href={`/recipes/${r.id}`} className="w-16 h-16 shrink-0 rounded-lg bg-[var(--surface)] flex items-center justify-center text-[var(--muted)] text-xl">
                    ◆
                  </Link>
                )}
                <Link href={`/recipes/${r.id}`} className="flex-1 min-w-0">
                  <span className="font-medium text-[var(--foreground)] block truncate">{r.name}</span>
                  <span className="text-sm text-[var(--muted)]">
                    {r.cuisineType && `${r.cuisineType} · `}
                    {(r.prepTimeMinutes != null || r.cookTimeMinutes != null) &&
                      `Prep: ${r.prepTimeMinutes ?? "?"} min · Cook: ${r.cookTimeMinutes ?? "?"} min`}
                    {"user" in r && r.user && ` · Shared by ${(r.user as { name?: string; email?: string }).email ?? "?"}`}
                  </span>
                </Link>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${statusColor[r.status] ?? "bg-[var(--surface)] text-[var(--muted)]"}`}>
                  {statusLabel[r.status] ?? r.status}
                </span>
                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/recipes/${r.id}/edit`}
                    className="text-sm text-[var(--accent)] hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!loading && filteredList.length === 0 && (
          <p className="text-[var(--muted)] py-8 text-center">No recipes yet. Add your first recipe!</p>
        )}
      </main>
    </>
  );
}
