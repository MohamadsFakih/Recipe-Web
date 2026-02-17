"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import Notifications from "./Notifications";

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (path: string) =>
    pathname === path || (path !== "/home" && pathname.startsWith(path));

  const navLinks = [
    { href: "/home", label: "Discover" },
    { href: "/dashboard", label: "My Recipes" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--card)]/95 backdrop-blur-lg border-b border-[var(--card-border)] shadow-sm"
          : "bg-[var(--card)] border-b border-[var(--card-border)]"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link href="/home" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-[10px] bg-[var(--accent)] flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
            <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span
            className="font-bold text-[1.1rem] text-[var(--foreground)] tracking-tight"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Recipe
            <span className="text-[var(--accent)]">.</span>
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive(href)
                  ? "text-[var(--accent)] bg-[var(--accent-soft)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
              }`}
            >
              {label}
              {isActive(href) && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]" />
              )}
            </Link>
          ))}
        </nav>

        {/* ── Desktop right actions ── */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Link
            href="/recipes/new"
            className="btn btn-primary flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Recipe
          </Link>

          <Notifications />

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn btn-ghost p-2 rounded-lg"
            title="Sign out"
            aria-label="Sign out"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {/* ── Mobile: Notifications + Hamburger ── */}
        <div className="flex md:hidden items-center gap-1">
          <Notifications />
          <button
            className="btn btn-ghost p-2 rounded-lg"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="md:hidden animate-slide-down border-t border-[var(--card-border)] bg-[var(--card)] px-4 pb-4 pt-2 space-y-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(href)
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-[var(--foreground)] hover:bg-[var(--surface)]"
              }`}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/recipes/new"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-[var(--accent)] text-white mt-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Recipe
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg text-sm text-[var(--muted)] hover:bg-[var(--surface)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
