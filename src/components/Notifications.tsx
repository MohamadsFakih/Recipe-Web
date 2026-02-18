"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

type Request = {
  id: string;
  fromUser: { id: string; email: string; name: string | null };
  createdAt: string;
};

type NotificationItem = {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  fromUser: { id: string; email: string; name: string | null };
};

export default function Notifications() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function load() {
    fetch("/api/friend-requests")
      .then((r) => r.json())
      .then(setRequests)
      .catch(() => setRequests([]));
    fetch("/api/notifications")
      .then((r) => r.json())
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function accept(requestId: string) {
    const res = await fetch(`/api/friend-requests/${requestId}/accept`, { method: "POST" });
    if (res.ok) {
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      load();
    }
  }

  async function decline(requestId: string) {
    const res = await fetch(`/api/friend-requests/${requestId}/decline`, { method: "POST" });
    if (res.ok) setRequests((prev) => prev.filter((r) => r.id !== requestId));
  }

  async function markNotificationRead(notificationId: string) {
    const res = await fetch(`/api/notifications/${notificationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
    if (res.ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    }
  }

  const unreadCount = requests.length + notifications.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn btn-ghost relative p-2 rounded-lg"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[9px] font-bold text-white px-0.5">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-lg z-50 animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-[var(--foreground)]">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-[var(--muted)] mt-0.5">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount === 0 && (
              <span className="text-xs text-[var(--muted)]">All caught up</span>
            )}
          </div>

          {/* Items */}
          <div className="max-h-80 overflow-y-auto">
            {requests.length === 0 && notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-[var(--surface)] flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-sm text-[var(--muted)]">No notifications</p>
              </div>
            ) : (
              <>
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={`/users/${n.fromUser.id}`}
                    onClick={() => { if (!n.read) markNotificationRead(n.id); setOpen(false); }}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-[var(--surface)] border-b border-[var(--card-border)] transition-colors ${
                      !n.read ? "bg-[var(--accent-soft)]/30" : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-xs font-bold text-[var(--accent)] shrink-0 mt-0.5">
                      {(n.fromUser.name || n.fromUser.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">
                        {n.fromUser.name || n.fromUser.email}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {n.type === "FRIEND_ACCEPTED" ? "accepted your friend request" : "sent you a notification"}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0 mt-1.5" />
                    )}
                  </Link>
                ))}

                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-start gap-3 px-4 py-3 border-b border-[var(--card-border)] last:border-0 bg-amber-50/50"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0 mt-0.5">
                      {(req.fromUser.name || req.fromUser.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/users/${req.fromUser.id}`}
                        onClick={() => setOpen(false)}
                      >
                        <p className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] truncate">
                          {req.fromUser.name || req.fromUser.email}
                        </p>
                        <p className="text-xs text-[var(--muted)]">wants to be friends</p>
                      </Link>
                      <div className="flex gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={() => accept(req.id)}
                          className="btn btn-primary px-3 py-1 rounded-lg text-xs"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => decline(req.id)}
                          className="btn btn-outline px-3 py-1 rounded-lg text-xs"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
