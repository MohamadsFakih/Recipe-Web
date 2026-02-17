"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Notifications from "./Notifications";

export default function Header() {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `text-sm ${pathname === path ? "text-[var(--accent)] font-medium" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`;

  return (
    <header className="border-b border-[var(--card-border)] bg-[var(--card)]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/home" className="font-semibold text-lg text-[var(--foreground)] flex items-center gap-2">
          <span className="text-[var(--accent)]">◆</span>
          Recipe Manager
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/home" className={linkClass("/home")}>
            Home
          </Link>
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            My recipes
          </Link>
          <Link href="/profile" className={linkClass("/profile")}>
            Profile
          </Link>
          <Link href="/recipes/new" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
            Add recipe
          </Link>
          <Notifications />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
