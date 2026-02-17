"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  recipeCount: number;
  publicCount: number;
};

type FriendEntry = {
  id: string;
  friend: { id: string; email: string; name: string | null };
};

type FriendRequestEntry = {
  id: string;
  fromUser: { id: string; email: string; name: string | null };
  createdAt: string;
};

export default function ProfileClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [friendEmail, setFriendEmail] = useState("");
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  const [addFriendError, setAddFriendError] = useState("");
  const [addFriendSuccess, setAddFriendSuccess] = useState("");

  function loadProfile() {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setName(data.name ?? "");
      });
  }

  function loadFriends() {
    fetch("/api/friends")
      .then((r) => r.json())
      .then(setFriends)
      .catch(() => setFriends([]));
  }

  function loadPendingRequests() {
    fetch("/api/friend-requests")
      .then((r) => r.json())
      .then(setPendingRequests)
      .catch(() => setPendingRequests([]));
  }

  useEffect(() => {
    loadProfile();
    loadFriends();
    loadPendingRequests();
  }, []);

  useEffect(() => {
    if (profile) setLoading(false);
  }, [profile]);

  async function saveName() {
    if (!profile) return;
    setSaveLoading(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || null }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile((p) => (p ? { ...p, name: data.name } : null));
        setEditingName(false);
      }
    } finally {
      setSaveLoading(false);
    }
  }

  async function sendFriendRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!friendEmail.trim()) return;
    setAddFriendError("");
    setAddFriendSuccess("");
    setAddFriendLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: friendEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setFriendEmail("");
        setAddFriendSuccess("Friend request sent!");
        setTimeout(() => setAddFriendSuccess(""), 3000);
      } else {
        setAddFriendError(data.error ?? "Failed to send request");
      }
    } finally {
      setAddFriendLoading(false);
    }
  }

  async function removeFriend(friendId: string) {
    const res = await fetch(`/api/friends/${friendId}`, { method: "DELETE" });
    if (res.ok) {
      setFriends((prev) => prev.filter((f) => f.friend.id !== friendId));
    }
  }

  async function acceptRequest(requestId: string) {
    const res = await fetch(`/api/friend-requests/${requestId}/accept`, { method: "POST" });
    if (res.ok) {
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      loadFriends();
    }
  }

  async function declineRequest(requestId: string) {
    const res = await fetch(`/api/friend-requests/${requestId}/decline`, { method: "POST" });
    if (res.ok) setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
  }

  if (loading || !profile) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  const initials = (profile.name || profile.email).charAt(0).toUpperCase();

  return (
    <div className="space-y-6 animate-slide-up">

      {/* ── Profile card ── */}
      <div className="card rounded-2xl overflow-hidden">
        {/* Banner gradient */}
        <div
          className="h-24 relative"
          style={{ background: "linear-gradient(135deg, #1a4731, #2d7a5c, #4aab82)" }}
        >
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex items-end justify-between -mt-8 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white border-4 border-[var(--card)] flex items-center justify-center text-2xl font-bold text-[var(--accent)] shadow-md"
              style={{ background: "linear-gradient(135deg, var(--accent-soft), var(--accent-soft))" }}
            >
              {initials}
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-[var(--accent)] font-medium hover:underline underline-offset-2"
            >
              View recipes →
            </Link>
          </div>

          {/* Name + email */}
          <div className="mb-4">
            {editingName ? (
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  className="form-input rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)] text-sm"
                  placeholder="Display name"
                  autoFocus
                />
                <button
                  onClick={saveName}
                  disabled={saveLoading}
                  className="btn btn-primary px-4 py-2 rounded-xl text-sm"
                >
                  {saveLoading ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => { setEditingName(false); setName(profile.name ?? ""); }}
                  className="btn btn-ghost px-4 py-2 rounded-xl text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[var(--foreground)]"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  {profile.name || "No name set"}
                </h2>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors p-1 rounded"
                  title="Edit name"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            )}
            <p className="text-sm text-[var(--muted)] mt-0.5">{profile.email}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: profile.recipeCount, label: "Recipes" },
              { value: profile.publicCount, label: "Public" },
              { value: friends.length, label: "Friends" },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-xl bg-[var(--surface)] px-3 py-3 text-center">
                <div className="text-xl font-bold text-[var(--accent)]">{value}</div>
                <div className="text-xs text-[var(--muted)] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Friends section ── */}
      <div className="card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--card-border)] flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Friends</h3>
            <p className="text-xs text-[var(--muted)]">Connect with other cooks</p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Add friend form */}
          <div>
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">Send a request</p>
            <form onSubmit={sendFriendRequest} className="flex gap-2 flex-wrap">
              <input
                type="email"
                value={friendEmail}
                onChange={(e) => { setFriendEmail(e.target.value); setAddFriendError(""); }}
                placeholder="Friend's email address"
                className="form-input flex-1 min-w-[180px] rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-2.5 text-[var(--foreground)] text-sm placeholder:text-[var(--muted)]"
              />
              <button
                type="submit"
                disabled={addFriendLoading || !friendEmail.trim()}
                className="btn btn-primary px-4 py-2.5 rounded-xl text-sm font-medium"
              >
                {addFriendLoading ? "Sending…" : "Send request"}
              </button>
            </form>
            {addFriendError && (
              <p className="text-xs text-red-600 mt-2">{addFriendError}</p>
            )}
            {addFriendSuccess && (
              <p className="text-xs text-[var(--accent)] mt-2 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {addFriendSuccess}
              </p>
            )}
          </div>

          {/* Pending requests */}
          {pendingRequests.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
                Pending requests ({pendingRequests.length})
              </p>
              <ul className="space-y-2">
                {pendingRequests.map((req) => (
                  <li
                    key={req.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
                  >
                    <Link href={`/users/${req.fromUser.id}`} className="min-w-0 flex-1">
                      <span className="font-medium text-[var(--foreground)] text-sm hover:text-[var(--accent)] block truncate">
                        {req.fromUser.name || req.fromUser.email}
                      </span>
                      <p className="text-xs text-[var(--muted)] truncate">{req.fromUser.email}</p>
                    </Link>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => acceptRequest(req.id)}
                        className="btn btn-primary px-3 py-1.5 rounded-lg text-xs"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => declineRequest(req.id)}
                        className="btn btn-outline px-3 py-1.5 rounded-lg text-xs"
                      >
                        Decline
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Friends list */}
          <div>
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
              Friends {friends.length > 0 && `(${friends.length})`}
            </p>
            {friends.length === 0 && pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-[var(--surface)] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm text-[var(--muted)]">No friends yet</p>
                <p className="text-xs text-[var(--muted)] mt-1">Send a request to connect with other cooks</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {friends.map(({ friend }) => (
                  <li
                    key={friend.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-xs font-bold text-[var(--accent)] shrink-0">
                        {(friend.name || friend.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/users/${friend.id}`} className="font-medium text-[var(--foreground)] hover:text-[var(--accent)] text-sm block truncate">
                          {friend.name || friend.email}
                        </Link>
                        <p className="text-xs text-[var(--muted)] truncate">{friend.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFriend(friend.id)}
                      className="shrink-0 text-xs text-[var(--muted)] hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
