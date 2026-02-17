"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

type Recipe = {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string;
  cuisineType: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  status: string;
  isPublic?: boolean;
  imageUrl?: string | null;
  imageUrls?: string[];
  user?: { id: string; email: string | null; name: string | null };
};

const statusConfig: Record<string, { label: string; color: string }> = {
  FAVORITE:    { label: "Favourite",   color: "bg-amber-100 text-amber-800" },
  TO_TRY:      { label: "To try",      color: "bg-sky-100 text-sky-800" },
  MADE_BEFORE: { label: "Made before", color: "bg-emerald-100 text-emerald-800" },
};

export default function RecipeDetail({
  recipe,
  isOwner,
  canEdit = isOwner,
}: {
  recipe: Recipe;
  isOwner: boolean;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [linkCopied, setLinkCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

  const images = recipe.imageUrls && recipe.imageUrls.length > 0
    ? recipe.imageUrls
    : recipe.imageUrl
      ? [recipe.imageUrl]
      : [];
  const [slideIndex, setSlideIndex] = useState(0);

  const goPrev = useCallback(() => {
    setSlideIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
  }, [images.length]);
  const goNext = useCallback(() => {
    setSlideIndex((i) => (i >= images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(goNext, 4500);
    return () => clearInterval(t);
  }, [images.length, goNext]);

  async function copyRecipeLink() {
    const url = typeof window !== "undefined" ? `${window.location.origin}/recipes/${recipe.id}` : "";
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      if (typeof window !== "undefined") window.prompt("Copy this link:", url);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    }
  }

  function toggleIngredient(i: number) {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  // Parse instructions into numbered steps
  const instructionSteps = recipe.instructions
    ? recipe.instructions
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const sc = statusConfig[recipe.status];
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);

  return (
    <article className="animate-fade-in">
      {/* ── Hero image ── */}
      {images.length > 0 && (
        <div className="relative w-full aspect-[21/9] max-h-[480px] rounded-2xl overflow-hidden bg-[var(--surface)] mb-8 shadow-md">
          <Image
            key={images[slideIndex]}
            src={images[slideIndex]}
            alt={`${recipe.name} — image ${slideIndex + 1}`}
            fill
            className="object-cover"
            priority
            unoptimized
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          {/* Slide controls */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                aria-label="Previous image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                aria-label="Next image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSlideIndex(i)}
                    className={`transition-all duration-200 rounded-full ${
                      i === slideIndex ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/75"
                    }`}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Header section ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[var(--muted)] mb-3">
            <Link href="/dashboard" className="hover:text-[var(--accent)] transition-colors">My Recipes</Link>
            <span>›</span>
            <span className="truncate text-[var(--foreground)]">{recipe.name}</span>
          </div>

          <h1
            className="text-3xl md:text-4xl font-bold text-[var(--foreground)] leading-tight mb-4"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif", letterSpacing: "-0.02em" }}
          >
            {recipe.name}
          </h1>

          {/* Meta pills */}
          <div className="flex flex-wrap items-center gap-2">
            {sc && (
              <span className={`badge text-xs px-3 py-1 rounded-full ${sc.color}`}>
                {sc.label}
              </span>
            )}
            {recipe.isPublic && (
              <span className="badge text-xs px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-muted)]/30">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                </svg>
                Public
              </span>
            )}
            {recipe.cuisineType && (
              <span className="badge text-xs px-3 py-1 rounded-full bg-[var(--surface)] text-[var(--muted)] border border-[var(--card-border)]">
                {recipe.cuisineType}
              </span>
            )}
          </div>

          {/* Author */}
          {recipe.user && (
            <div className="flex items-center gap-2 mt-4">
              <div className="w-7 h-7 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-xs font-bold text-[var(--accent)]">
                {(recipe.user.name || recipe.user.email || "?").charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-[var(--muted)]">
                By{" "}
                <Link href={`/users/${recipe.user.id}`} className="text-[var(--accent)] font-medium hover:underline underline-offset-2">
                  {recipe.user.name || recipe.user.email}
                </Link>
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={copyRecipeLink}
            className="btn btn-outline flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm"
          >
            {linkCopied ? (
              <>
                <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </>
            )}
          </button>
          {canEdit && (
            <Link
              href={`/recipes/${recipe.id}/edit`}
              className="btn btn-primary flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
          )}
          {isOwner && (
            <div className="relative">
              {deleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--muted)]">Sure?</span>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="px-3 py-2 rounded-xl border border-[var(--card-border)] text-xs text-[var(--muted)] hover:bg-[var(--surface)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="btn btn-outline flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm text-red-600 border-red-200 hover:bg-red-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick stats bar ── */}
      {(recipe.prepTimeMinutes != null || recipe.cookTimeMinutes != null || totalTime > 0) && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {recipe.prepTimeMinutes != null && (
            <div className="card rounded-xl p-4 text-center">
              <div className="text-xs text-[var(--muted)] mb-1 font-medium uppercase tracking-wide">Prep</div>
              <div className="text-xl font-bold text-[var(--foreground)]">{recipe.prepTimeMinutes}</div>
              <div className="text-xs text-[var(--muted)]">minutes</div>
            </div>
          )}
          {recipe.cookTimeMinutes != null && (
            <div className="card rounded-xl p-4 text-center">
              <div className="text-xs text-[var(--muted)] mb-1 font-medium uppercase tracking-wide">Cook</div>
              <div className="text-xl font-bold text-[var(--foreground)]">{recipe.cookTimeMinutes}</div>
              <div className="text-xs text-[var(--muted)]">minutes</div>
            </div>
          )}
          {totalTime > 0 && (
            <div className="card rounded-xl p-4 text-center bg-[var(--accent-soft)]" style={{ borderColor: "rgba(45,122,92,0.2)" }}>
              <div className="text-xs text-[var(--accent)] mb-1 font-medium uppercase tracking-wide">Total</div>
              <div className="text-xl font-bold text-[var(--accent)]">{totalTime}</div>
              <div className="text-xs text-[var(--accent)]/70">minutes</div>
            </div>
          )}
        </div>
      )}

      {/* ── Two-column layout: Ingredients + Instructions ── */}
      <div className="grid md:grid-cols-[300px_1fr] gap-8 mb-10">
        {/* Ingredients column */}
        {recipe.ingredients.length > 0 && (
          <aside>
            <div className="card rounded-2xl p-5 md:sticky md:top-24">
              <h2
                className="text-lg font-bold text-[var(--foreground)] mb-1"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Ingredients
              </h2>
              <p className="text-xs text-[var(--muted)] mb-4">
                {recipe.ingredients.length} item{recipe.ingredients.length !== 1 ? "s" : ""} · tap to check off
              </p>
              <ul className="space-y-2">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => toggleIngredient(i)}
                      className="flex items-start gap-3 w-full text-left group"
                    >
                      <span className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        checkedIngredients.has(i)
                          ? "bg-[var(--accent)] border-[var(--accent)]"
                          : "border-[var(--card-border)] group-hover:border-[var(--accent-muted)]"
                      }`}>
                        {checkedIngredients.has(i) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className={`text-sm leading-relaxed transition-colors ${
                        checkedIngredients.has(i) ? "line-through text-[var(--muted)]" : "text-[var(--foreground)]"
                      }`}>
                        {ing}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {checkedIngredients.size > 0 && (
                <button
                  type="button"
                  onClick={() => setCheckedIngredients(new Set())}
                  className="mt-4 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Reset all
                </button>
              )}
            </div>
          </aside>
        )}

        {/* Instructions column */}
        {recipe.instructions && (
          <section>
            <h2
              className="text-lg font-bold text-[var(--foreground)] mb-5"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Instructions
            </h2>
            {instructionSteps.length > 1 ? (
              <ol className="space-y-5">
                {instructionSteps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center mt-0.5 shadow-sm">
                      {i + 1}
                    </span>
                    <p className="text-[var(--foreground)] leading-relaxed text-sm flex-1 pt-1">{step}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="prose prose-sm max-w-none text-[var(--foreground)] leading-relaxed whitespace-pre-wrap text-sm">
                {recipe.instructions}
              </div>
            )}
          </section>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="pt-8 border-t border-[var(--card-border)] flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to recipes
        </Link>
        <button
          type="button"
          onClick={copyRecipeLink}
          className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {linkCopied ? "Link copied!" : "Copy share link"}
        </button>
      </div>
    </article>
  );
}
