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

  useEffect(() => {
    load();
  }, []);

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

  const count = requests.length + notifications.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 6h.01M17 16h.01" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-medium text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-lg py-2 z-50">
          <div className="px-3 py-2 border-b border-[var(--card-border)]">
            <h3 className="font-semibold text-sm text-[var(--foreground)]">Notifications</h3>
            <p className="text-xs text-[var(--muted)]">Friend requests &amp; acceptances</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {requests.length === 0 && notifications.length === 0 ? (
              <p className="px-3 py-4 text-sm text-[var(--muted)]">No notifications</p>
            ) : (
              <>
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={`/users/${n.fromUser.id}`}
                    onClick={() => {
                      if (!n.read) markNotificationRead(n.id);
                      setOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface)] border-b border-[var(--card-border)] ${!n.read ? "bg-[var(--accent-soft)]/20" : ""}`}
                  >
                    <span className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] block truncate min-w-0 flex-1">
                      {n.fromUser.name || n.fromUser.email}
                    </span>
                    <span className="text-xs text-[var(--muted)] shrink-0">
                      {n.type === "FRIEND_ACCEPTED" ? "accepted your friend request" : ""}
                    </span>
                  </Link>
                ))}
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface)] border-b border-[var(--card-border)] last:border-0"
                  >
                    <Link
                      href={`/users/${req.fromUser.id}`}
                      onClick={() => setOpen(false)}
                      className="min-w-0 flex-1"
                    >
                      <span className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] block truncate">
                        {req.fromUser.name || req.fromUser.email}
                      </span>
                      <span className="text-xs text-[var(--muted)]">sent you a friend request</span>
                    </Link>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => accept(req.id)}
                        className="rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-2 py-1 text-xs"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => decline(req.id)}
                        className="rounded border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface)]"
                      >
                        Decline
                      </button>
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
