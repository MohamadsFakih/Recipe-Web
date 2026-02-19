"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CommentRow = {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
  recipeId: string;
  recipeName: string;
};

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/comments")
      .then((r) => r.json())
      .then((data) => { setComments(Array.isArray(data) ? data : []); })
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function deleteComment(c: CommentRow) {
    if (!confirm("Delete this comment?")) return;
    setDeletingId(c.id);
    try {
      const res = await fetch(`/api/admin/comments/${c.id}`, { method: "DELETE" });
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
        Comments
      </h1>
      <p className="text-[var(--muted)] mb-6">Recent comments. Delete inappropriate ones.</p>
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden shadow-[var(--shadow-card)]">
        <div className="divide-y divide-[var(--card-border)]">
          {comments.map((c) => (
            <div key={c.id} className="px-4 py-4">
              <p className="text-[var(--foreground)] text-sm mb-2">{c.text}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
                <span>{c.user.name || c.user.email}</span>
                <span>·</span>
                <Link href={`/recipes/${c.recipeId}`} className="text-[var(--accent)] hover:underline">
                  {c.recipeName}
                </Link>
                <span>·</span>
                <span>{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => deleteComment(c)}
                  disabled={deletingId === c.id}
                  className="px-3 py-1.5 rounded-lg text-xs text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === c.id ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
        {comments.length === 0 && (
          <p className="px-4 py-8 text-center text-[var(--muted)]">No comments found.</p>
        )}
      </div>
    </div>
  );
}
