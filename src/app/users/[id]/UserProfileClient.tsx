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
      if (res.ok) {
        setStatus("friends");
        setRequestId(null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function declineRequest() {
    if (!requestId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/friend-requests/${requestId}/decline`, { method: "POST" });
      if (res.ok) {
        setStatus("none");
        setRequestId(null);
      }
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

  const statusLabel: Record<string, string> = {
    FAVORITE: "Favourite",
    TO_TRY: "To try",
    MADE_BEFORE: "Made before",
  };

  return (
    <>
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-sm overflow-hidden mb-6">
        <div className="p-6 bg-[var(--surface)] border-b border-[var(--card-border)]">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-2xl text-[var(--accent)] font-bold">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="font-semibold text-[var(--foreground)] text-xl">
                  {user.name || "Cook"}
                </h1>
                <p className="text-sm text-[var(--muted)]">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {error && <span className="text-sm text-red-600">{error}</span>}
              {status === "friends" && (
                <button
                  onClick={removeFriend}
                  disabled={loading}
                  className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface)] disabled:opacity-50"
                >
                  {loading ? "…" : "Remove friend"}
                </button>
              )}
              {status === "sent" && (
                <span className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--muted)]">
                  Request sent
                </span>
              )}
              {status === "received" && (
                <>
                  <button
                    onClick={acceptRequest}
                    disabled={loading}
                    className="rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    {loading ? "…" : "Accept"}
                  </button>
                  <button
                    onClick={declineRequest}
                    disabled={loading}
                    className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface)] disabled:opacity-50"
                  >
                    Decline
                  </button>
                </>
              )}
              {status === "none" && (
                <button
                  onClick={sendRequest}
                  disabled={loading}
                  className="rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  {loading ? "…" : "Send friend request"}
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-[var(--muted)]">
            {recipes.length} public {recipes.length === 1 ? "recipe" : "recipes"}
          </p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">Public recipes</h2>
      {recipes.length === 0 ? (
        <p className="text-[var(--muted)]">No public recipes yet.</p>
      ) : (
        <ul className="space-y-3">
          {recipes.map((r) => (
            <li key={r.id}>
              <Link
                href={`/recipes/${r.id}`}
                className="flex gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 hover:border-[var(--accent)]/50 transition-colors overflow-hidden"
              >
                {r.imageUrl ? (
                  <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-[var(--surface)]">
                    <Image src={r.imageUrl} alt="" fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="w-20 h-20 shrink-0 rounded-lg bg-[var(--surface)] flex items-center justify-center text-[var(--muted)] text-2xl">
                    ◆
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-[var(--foreground)]">{r.name}</span>
                  <span className="text-sm text-[var(--muted)] ml-2">
                    {r.cuisineType && `· ${r.cuisineType}`}
                    {(r.prepTimeMinutes != null || r.cookTimeMinutes != null) &&
                      ` · ${r.prepTimeMinutes ?? "?"} min prep · ${r.cookTimeMinutes ?? "?"} min cook`}
                  </span>
                  <span className="ml-2 text-xs text-[var(--muted)]">
                    {statusLabel[r.status] ?? r.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
