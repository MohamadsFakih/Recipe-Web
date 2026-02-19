"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type RecipeRow = {
  id: string;
  name: string;
  isPublic: boolean;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
  commentCount: number;
  likeCount: number;
};

export default function AdminRecipesPage() {
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/recipes")
      .then((r) => r.json())
      .then((data) => { setRecipes(Array.isArray(data) ? data : []); })
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function deleteRecipe(r: RecipeRow) {
    if (!confirm(`Delete recipe "${r.name}"? This cannot be undone.`)) return;
    setDeletingId(r.id);
    try {
      const res = await fetch(`/api/admin/recipes/${r.id}`, { method: "DELETE" });
      if (res.ok) load();
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
        Recipes (posts)
      </h1>
      <p className="text-[var(--muted)] mb-6">All recipes. Delete inappropriate posts.</p>
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--surface)]">
                <th className="text-left px-4 py-3 font-semibold text-[var(--foreground)]">Recipe</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--foreground)]">Author</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--foreground)]">Public</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--foreground)]">Comments</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--foreground)]">Likes</th>
                <th className="text-right px-4 py-3 font-semibold text-[var(--foreground)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((r) => (
                <tr key={r.id} className="border-b border-[var(--card-border)]">
                  <td className="px-4 py-3">
                    <Link href={`/recipes/${r.id}`} className="text-[var(--accent)] hover:underline font-medium">
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{r.user.name || r.user.email}</td>
                  <td className="px-4 py-3">{r.isPublic ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{r.commentCount}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{r.likeCount}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => deleteRecipe(r)}
                      disabled={deletingId === r.id}
                      className="px-3 py-1.5 rounded-lg text-xs text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === r.id ? "…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {recipes.length === 0 && (
          <p className="px-4 py-8 text-center text-[var(--muted)]">No recipes found.</p>
        )}
      </div>
    </div>
  );
}
