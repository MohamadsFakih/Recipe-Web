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
        setAddFriendError("");
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
    return <p className="text-[var(--muted)]">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-sm overflow-hidden">
        <div className="p-6 bg-[var(--surface)] border-b border-[var(--card-border)]">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-2xl text-[var(--accent)] font-bold">
              {(profile.name || profile.email).charAt(0).toUpperCase()}
            </div>
            <div>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-1.5 text-[var(--foreground)]"
                    placeholder="Display name"
                  />
                  <button
                    onClick={saveName}
                    disabled={saveLoading}
                    className="rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditingName(false); setName(profile.name ?? ""); }}
                    className="text-sm text-[var(--muted)] hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="font-semibold text-[var(--foreground)] text-lg">
                    {profile.name || "No name set"}
                  </h2>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-sm text-[var(--accent)] hover:underline"
                  >
                    Edit name
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">{profile.email}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-bold text-[var(--accent)]">{profile.recipeCount}</p>
              <p className="text-sm text-[var(--muted)]">Total recipes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--accent)]">{profile.publicCount}</p>
              <p className="text-sm text-[var(--muted)]">Public recipes</p>
            </div>
          </div>
          <div className="pt-4 border-t border-[var(--card-border)]">
            <Link
              href="/dashboard"
              className="text-[var(--accent)] font-medium hover:underline"
            >
              View my recipes →
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--card-border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Friends</h3>
          <p className="text-sm text-[var(--muted)] mt-0.5">Send a friend request by email. They can accept from their profile or notifications.</p>
        </div>
        <div className="p-4 space-y-4">
          <form onSubmit={sendFriendRequest} className="flex gap-2 flex-wrap">
            <input
              type="email"
              value={friendEmail}
              onChange={(e) => { setFriendEmail(e.target.value); setAddFriendError(""); }}
              placeholder="Friend's email"
              className="flex-1 min-w-[180px] rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-[var(--foreground)]"
            />
            <button
              type="submit"
              disabled={addFriendLoading}
              className="rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {addFriendLoading ? "Sending…" : "Send friend request"}
            </button>
          </form>
          {addFriendError && (
            <p className="text-sm text-red-600">{addFriendError}</p>
          )}
          {/* Pending friend requests */}
          {pendingRequests.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">Pending friend requests</h4>
              <ul className="space-y-2">
                {pendingRequests.map((req) => (
                  <li
                    key={req.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2"
                  >
                    <Link href={`/users/${req.fromUser.id}`} className="min-w-0 flex-1">
                      <span className="font-medium text-[var(--foreground)] hover:text-[var(--accent)]">
                        {req.fromUser.name || req.fromUser.email}
                      </span>
                      <p className="text-xs text-[var(--muted)]">{req.fromUser.email}</p>
                    </Link>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => acceptRequest(req.id)}
                        className="rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-2 py-1 text-xs font-medium"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => declineRequest(req.id)}
                        className="rounded-lg border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface)]"
                      >
                        Decline
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {friends.length === 0 && pendingRequests.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No friends yet. Send a friend request by email above.</p>
          ) : friends.length > 0 ? (
            <ul className="space-y-2">
              {friends.map(({ id, friend }) => (
                <li
                  key={friend.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2"
                >
                  <div className="min-w-0">
                    <Link href={`/users/${friend.id}`} className="font-medium text-[var(--foreground)] hover:text-[var(--accent)] truncate block">
                      {friend.name || friend.email}
                    </Link>
                    <p className="text-xs text-[var(--muted)] truncate">{friend.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFriend(friend.id)}
                    className="shrink-0 rounded-lg border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--muted)] hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
