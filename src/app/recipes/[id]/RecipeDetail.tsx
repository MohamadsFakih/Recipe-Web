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
    const t = setInterval(goNext, 4000);
    return () => clearInterval(t);
  }, [images.length, goNext]);

  async function copyRecipeLink() {
    const url = typeof window !== "undefined" ? `${window.location.origin}/recipes/${recipe.id}` : "";
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // fallback: prompt with URL
      if (typeof window !== "undefined") window.prompt("Copy this link:", url);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this recipe?")) return;
    const res = await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/home");
      router.refresh();
    }
  }

  const statusLabel: Record<string, string> = {
    FAVORITE: "Favourite",
    TO_TRY: "To try",
    MADE_BEFORE: "Made before",
  };
  const statusColor: Record<string, string> = {
    FAVORITE: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    TO_TRY: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
    MADE_BEFORE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  };

  return (
    <article className="space-y-6">
      {images.length > 0 && (
        <div className="relative w-full aspect-[2/1] max-h-80 rounded-2xl overflow-hidden bg-[var(--surface)] border border-[var(--card-border)]">
          <Image
            key={images[slideIndex]}
            src={images[slideIndex]}
            alt={`${recipe.name} ${slideIndex + 1}/${images.length}`}
            fill
            className="object-cover"
            unoptimized
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                aria-label="Next image"
              >
                ›
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSlideIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === slideIndex ? "bg-white" : "bg-white/50 hover:bg-white/70"}`}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
              <span className="absolute bottom-2 right-2 text-xs text-white/90 bg-black/40 px-2 py-0.5 rounded">
                {slideIndex + 1} / {images.length}
              </span>
            </>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{recipe.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-[var(--muted)]">
            {recipe.cuisineType && <span>{recipe.cuisineType}</span>}
            {(recipe.prepTimeMinutes != null || recipe.cookTimeMinutes != null) && (
              <span>
                Prep: {recipe.prepTimeMinutes ?? "?"} min · Cook: {recipe.cookTimeMinutes ?? "?"} min
              </span>
            )}
            {recipe.user && (
              <span>
                By{" "}
                <Link href={`/users/${recipe.user.id}`} className="text-[var(--accent)] hover:underline">
                  {recipe.user.name || recipe.user.email}
                </Link>
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[recipe.status] ?? ""}`}>
              {statusLabel[recipe.status] ?? recipe.status}
            </span>
            {recipe.isPublic && (
              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--card-border)]">
                Public
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Link
              href={`/recipes/${recipe.id}/edit`}
              className="rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 text-sm font-medium"
            >
              Edit
            </Link>
          )}
          {isOwner && (
            <button
              onClick={handleDelete}
              className="rounded-lg border border-red-300 text-red-600 px-4 py-2 text-sm"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {recipe.ingredients.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Ingredients</h2>
          <ul className="list-disc list-inside space-y-1 text-[var(--foreground)]">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>{ing}</li>
            ))}
          </ul>
        </section>
      )}

      {recipe.instructions && (
        <section>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Instructions</h2>
          <div className="whitespace-pre-wrap text-[var(--foreground)]">{recipe.instructions}</div>
        </section>
      )}

      <section className="pt-6 border-t border-[var(--card-border)]">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Share recipe</h2>
        <p className="text-sm text-[var(--muted)] mb-2">Copy the link to send this recipe to anyone.</p>
        <button
          type="button"
          onClick={copyRecipeLink}
          className="rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 text-sm font-medium"
        >
          {linkCopied ? "Link copied!" : "Copy link"}
        </button>
      </section>

      <p>
        <Link href="/dashboard" className="text-[var(--accent)] hover:underline">
          ← Back to recipes
        </Link>
      </p>
    </article>
  );
}
