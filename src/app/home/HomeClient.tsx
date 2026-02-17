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

export default function HomeClient() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [cuisine, setCuisine] = useState("");
  const [q, setQ] = useState("");

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (cuisine) params.set("cuisine", cuisine);
    if (q) params.set("q", q);
    fetch(`/api/recipes/public?${params}`)
      .then((r) => r.json())
      .then(setRecipes)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const statusLabel: Record<string, string> = {
    FAVORITE: "Favourite",
    TO_TRY: "To try",
    MADE_BEFORE: "Made before",
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
        <input
          type="text"
          placeholder="Search recipes..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-[var(--foreground)] min-w-[200px]"
        />
        <input
          type="text"
          placeholder="Cuisine"
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-[var(--foreground)] w-32"
        />
        <button
          onClick={load}
          className="rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2"
        >
          Search
        </button>
      </div>

      {loading ? (
        <p className="text-[var(--muted)]">Loading…</p>
      ) : recipes.length === 0 ? (
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center text-[var(--muted)]">
          <p>No public recipes yet.</p>
          <p className="mt-2 text-sm">Add a recipe and mark it &quot;Make public&quot; to share it with everyone.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {recipes.map((r) => (
            <li key={r.id}>
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden shadow-sm hover:border-[var(--accent)]/50 hover:shadow-md transition-all">
                <Link href={`/recipes/${r.id}`} className="block">
                  {r.imageUrl ? (
                    <div className="relative w-full aspect-[2/1] bg-[var(--surface)]">
                      <Image src={r.imageUrl} alt={r.name} fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="w-full aspect-[2/1] bg-[var(--surface)] flex items-center justify-center text-[var(--muted)] text-4xl">
                      ◆
                    </div>
                  )}
                </Link>
                <div className="p-5">
                  <Link href={`/recipes/${r.id}`} className="block">
                    <h2 className="font-semibold text-[var(--foreground)]">{r.name}</h2>
                    <p className="text-sm text-[var(--muted)] mt-1">
                      {r.cuisineType && `${r.cuisineType} · `}
                      Prep: {r.prepTimeMinutes ?? "?"} min · Cook: {r.cookTimeMinutes ?? "?"} min
                    </p>
                  </Link>
                  <Link
                    href={`/users/${(r.user as { id: string }).id}`}
                    className="block text-sm text-[var(--accent)] mt-2 hover:underline"
                  >
                    by {(r.user as { name?: string; email?: string }).name || (r.user as { email?: string }).email}
                  </Link>
                  <span className="inline-block mt-2 text-xs text-[var(--muted)]">
                    {statusLabel[r.status] ?? r.status}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
