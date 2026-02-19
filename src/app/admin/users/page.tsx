"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  disabled: boolean;
  createdAt: string;
  recipeCount: number;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => { setUsers(Array.isArray(data) ? data : []); })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function toggleDisabled(user: UserRow) {
    setActionLoading(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: !user.disabled }),
      });
      if (res.ok) load();
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteUser(user: UserRow) {
    if (!confirm(`Delete user ${user.email}? This cannot be undone.`)) return;
    setActionLoading(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (res.ok) load();
    } finally {
      setActionLoading(null);
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
        Users
      </h1>
      <p className="text-[var(--muted)] mb-6">All registered users. Disable or delete accounts.</p>
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--surface)]">
                <th className="text-left px-4 py-3 font-semibold text-[var(--foreground)]">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--foreground)]">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--foreground)]">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--foreground)]">Recipes</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--foreground)]">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-[var(--foreground)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={`border-b border-[var(--card-border)] ${u.disabled ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3 text-[var(--foreground)]">{u.email}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{u.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === "ADMIN" ? "bg-amber-100 text-amber-800" : "bg-[var(--surface)] text-[var(--muted)]"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{u.recipeCount}</td>
                  <td className="px-4 py-3">
                    {u.disabled ? (
                      <span className="text-red-600 font-medium">Disabled</span>
                    ) : (
                      <span className="text-[var(--accent)]">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleDisabled(u)}
                        disabled={actionLoading === u.id || u.role === "ADMIN"}
                        className="btn btn-outline px-3 py-1.5 rounded-lg text-xs"
                      >
                        {actionLoading === u.id ? "…" : u.disabled ? "Enable" : "Disable"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteUser(u)}
                        disabled={actionLoading === u.id || u.role === "ADMIN"}
                        className="px-3 py-1.5 rounded-lg text-xs text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <p className="px-4 py-8 text-center text-[var(--muted)]">No users found.</p>
        )}
      </div>
    </div>
  );
}
