"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type User = { id: string; name: string | null; email: string };
type Recipe = {
  id: string;
  name: string;
  cuisineType: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  status: string;
  imageUrl?: string | null;
};

type RequestStatus = "none" | "sent" | "received" | "friends";

const statusConfig: Record<string, { label: string; color: string }> = {
  FAVORITE:    { label: "Favourite",   color: "bg-amber-100 text-amber-800" },
  TO_TRY:      { label: "To try",      color: "bg-sky-100 text-sky-800" },
  MADE_BEFORE: { label: "Made before", color: "bg-emerald-100 text-emerald-800" },
};

export default function UserProfileClient({
  user,
  recipes,
}: {
  user: User;
  recipes: Recipe[];
}) {
  const [status, setStatus] = useState<RequestStatus | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/friend-requests/status?userId=${user.id}`)
      .then((r) => r.json())
      .then((data: { status: RequestStatus; requestId?: string }) => {
        setStatus(data.status);
        setRequestId(data.requestId ?? null);
      })
      .catch(() => setStatus("none"));
  }, [user.id]);

  async function sendRequest() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (res.ok) setStatus("sent");
      else setError(data.error ?? "Failed to send request");
    } finally {
      setLoading(false);
    }
  }

  async function acceptRequest() {
    if (!requestId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/friend-requests/${requestId}/accept`, { method: "POST" });
      if (res.ok) { setStatus("friends"); setRequestId(null); }
    } finally {
      setLoading(false);
    }
  }

  async function declineRequest() {
    if (!requestId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/friend-requests/${requestId}/decline`, { method: "POST" });
      if (res.ok) { setStatus("none"); setRequestId(null); }
    } finally {
      setLoading(false);
    }
  }

  async function removeFriend() {
    setLoading(true);
    try {
      const res = await fetch(`/api/friends/${user.id}`, { method: "DELETE" });
      if (res.ok) setStatus("none");
    } finally {
      setLoading(false);
    }
  }

  const initials = (user.name || user.email).charAt(0).toUpperCase();

  return (
    <div className="animate-slide-up">
      {/* ── Profile card ── */}
      <div className="card rounded-2xl overflow-hidden mb-8">
        {/* Banner */}
        <div
          className="h-20"
          style={{ background: "linear-gradient(135deg, #1a4731, #2d7a5c, #4aab82)" }}
        />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-7 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] border-4 border-[var(--card)] flex items-center justify-center text-xl font-bold text-[var(--accent)] shadow-md">
              {initials}
            </div>
            {/* Friend action */}
            <div className="flex items-center gap-2">
              {error && <span className="text-xs text-red-600">{error}</span>}
              {status === "friends" && (
                <button
                  onClick={removeFriend}
                  disabled={loading}
                  className="btn btn-outline px-4 py-2 rounded-xl text-sm"
                >
                  {loading ? "…" : "Remove friend"}
                </button>
              )}
              {status === "sent" && (
                <span className="px-4 py-2 rounded-xl border border-[var(--card-border)] text-sm text-[var(--muted)] bg-[var(--surface)]">
                  Request sent
                </span>
              )}
              {status === "received" && (
                <div className="flex gap-2">
                  <button onClick={acceptRequest} disabled={loading} className="btn btn-primary px-4 py-2 rounded-xl text-sm">
                    {loading ? "…" : "Accept"}
                  </button>
                  <button onClick={declineRequest} disabled={loading} className="btn btn-outline px-4 py-2 rounded-xl text-sm">
                    Decline
                  </button>
                </div>
              )}
              {status === "none" && (
                <button onClick={sendRequest} disabled={loading} className="btn btn-primary flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  {loading ? "…" : "Add friend"}
                </button>
              )}
            </div>
          </div>

          <h1
            className="text-xl font-bold text-[var(--foreground)] mb-0.5"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            {user.name || "Cook"}
          </h1>
          <p className="text-sm text-[var(--muted)]">{user.email}</p>

          <div className="mt-4 flex items-center gap-2 text-sm text-[var(--muted)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {recipes.length} public {recipes.length === 1 ? "recipe" : "recipes"}
          </div>
        </div>
      </div>

      {/* ── Public recipes ── */}
      <div className="mb-5 flex items-center justify-between">
        <h2
          className="text-xl font-bold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Public Recipes
        </h2>
      </div>

      {recipes.length === 0 ? (
        <div className="card rounded-2xl p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--surface)] flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-[var(--muted)] text-sm">No public recipes yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {recipes.map((r) => {
            const sc = statusConfig[r.status];
            const totalTime = (r.prepTimeMinutes ?? 0) + (r.cookTimeMinutes ?? 0);
            return (
              <Link
                key={r.id}
                href={`/recipes/${r.id}`}
                className="recipe-card card rounded-xl overflow-hidden flex gap-4 p-4 group"
              >
                {r.imageUrl ? (
                  <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-[var(--surface)]">
                    <Image src={r.imageUrl} alt="" fill className="object-cover transition-transform duration-300 group-hover:scale-110" unoptimized />
                  </div>
                ) : (
                  <div className="w-20 h-20 shrink-0 rounded-lg bg-[var(--surface)] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors text-sm block truncate mb-1">
                    {r.name}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                    {r.cuisineType && <span>{r.cuisineType}</span>}
                    {totalTime > 0 && <span>{totalTime} min</span>}
                  </div>
                  {sc && (
                    <span className={`mt-2 badge text-[10px] px-2.5 py-0.5 rounded-full ${sc.color}`}>
                      {sc.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
