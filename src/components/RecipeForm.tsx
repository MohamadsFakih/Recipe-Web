"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const CUISINE_OPTIONS = [
  "",
  "American",
  "Chinese",
  "French",
  "Indian",
  "Italian",
  "Japanese",
  "Mediterranean",
  "Mexican",
  "Thai",
  "Other",
];

type ImageEntry =
  | { kind: "existing"; url: string }
  | { kind: "new"; file: File; objectUrl: string };

type Props = {
  recipeId?: string;
  initial?: {
    name: string;
    ingredients: string[];
    instructions: string;
    cuisineType?: string | null;
    prepTimeMinutes?: number | null;
    cookTimeMinutes?: number | null;
    status: string;
    isPublic?: boolean;
    imageUrl?: string | null;
    imageUrls?: string[];
  };
};

const STATUS_OPTIONS = [
  { value: "TO_TRY",      label: "To try",      icon: "🔖", color: "text-sky-700 bg-sky-50 border-sky-200" },
  { value: "MADE_BEFORE", label: "Made before", icon: "✅", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { value: "FAVORITE",    label: "Favourite",   icon: "⭐", color: "text-amber-700 bg-amber-50 border-amber-200" },
];

export default function RecipeForm({ recipeId, initial }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initial?.name ?? "");
  const [ingredients, setIngredients] = useState<string[]>(initial?.ingredients ?? [""]);
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [cuisineSelect, setCuisineSelect] = useState(() => {
    const ct = initial?.cuisineType ?? "";
    return CUISINE_OPTIONS.includes(ct) ? ct : (ct ? "Other" : "");
  });
  const [cuisineOther, setCuisineOther] = useState(() => {
    const ct = initial?.cuisineType ?? "";
    return CUISINE_OPTIONS.includes(ct) ? "" : ct;
  });
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(initial?.prepTimeMinutes ?? "");
  const [cookTimeMinutes, setCookTimeMinutes] = useState(initial?.cookTimeMinutes ?? "");
  const [status, setStatus] = useState(initial?.status ?? "TO_TRY");
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? false);
  const [imageList, setImageList] = useState<ImageEntry[]>(() => {
    const urls = initial?.imageUrls ?? (initial?.imageUrl ? [initial.imageUrl] : []);
    return urls.map((url) => ({ kind: "existing" as const, url }));
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const cuisineType = cuisineSelect === "Other" ? cuisineOther : cuisineSelect;

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setIngredients(initial.ingredients.length ? initial.ingredients : [""]);
      setInstructions(initial.instructions);
      const ct = initial.cuisineType ?? "";
      setCuisineSelect(CUISINE_OPTIONS.includes(ct) ? ct : (ct ? "Other" : ""));
      setCuisineOther(CUISINE_OPTIONS.includes(ct) ? "" : ct);
      setPrepTimeMinutes(initial.prepTimeMinutes != null ? String(initial.prepTimeMinutes) : "");
      setCookTimeMinutes(initial.cookTimeMinutes != null ? String(initial.cookTimeMinutes) : "");
      setStatus(initial.status);
      setIsPublic(initial.isPublic ?? false);
      const urls = initial.imageUrls ?? (initial.imageUrl ? [initial.imageUrl] : []);
      setImageList(urls.map((url) => ({ kind: "existing" as const, url })));
    }
  }, [initial]);

  function addIngredient() {
    setIngredients((prev) => [...prev, ""]);
  }

  function setIngredient(i: number, v: string) {
    setIngredients((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }

  function removeIngredient(i: number) {
    setIngredients((prev) => prev.filter((_, idx) => idx !== i));
  }

  function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    const newEntries: ImageEntry[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file?.type.startsWith("image/")) {
        newEntries.push({ kind: "new", file, objectUrl: URL.createObjectURL(file) });
      }
    }
    if (newEntries.length) setImageList((prev) => [...prev, ...newEntries]);
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImageList((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const removed = prev[index];
      if (removed?.kind === "new") URL.revokeObjectURL(removed.objectUrl);
      return next;
    });
  }

  async function generateWithAi() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed");
        setAiLoading(false);
        return;
      }
      setName(data.name ?? "");
      setIngredients(Array.isArray(data.ingredients) && data.ingredients.length ? data.ingredients : [""]);
      setInstructions(data.instructions ?? "");
      const ct = data.cuisineType ?? "";
      setCuisineSelect(CUISINE_OPTIONS.includes(ct) ? ct : (ct ? "Other" : ""));
      setCuisineOther(CUISINE_OPTIONS.includes(ct) ? "" : ct);
      setPrepTimeMinutes(data.prepTimeMinutes != null ? String(data.prepTimeMinutes) : "");
      setCookTimeMinutes(data.cookTimeMinutes != null ? String(data.cookTimeMinutes) : "");
    } catch {
      setError("AI request failed. Please try again.");
    }
    setAiLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const payload = {
      name,
      ingredients: ingredients.filter(Boolean),
      instructions,
      cuisineType: cuisineType || undefined,
      prepTimeMinutes: prepTimeMinutes ? parseInt(String(prepTimeMinutes), 10) : undefined,
      cookTimeMinutes: cookTimeMinutes ? parseInt(String(cookTimeMinutes), 10) : undefined,
      status,
      isPublic,
    };
    try {
      if (recipeId) {
        const res = await fetch(`/api/recipes/${recipeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Update failed");
          setLoading(false);
          return;
        }
        const newUrls: string[] = [];
        for (const item of imageList) {
          if (item.kind === "new") {
            const formData = new FormData();
            formData.set("image", item.file);
            const up = await fetch(`/api/recipes/${recipeId}/image`, { method: "POST", body: formData });
            const upData = await up.json();
            if (up.ok && upData.imageUrl) newUrls.push(upData.imageUrl);
          }
        }
        const finalUrls = imageList.map((i) =>
          i.kind === "existing" ? i.url : newUrls.shift()!
        ).filter(Boolean);
        if (finalUrls.length > 0) {
          await fetch(`/api/recipes/${recipeId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrls: finalUrls }),
          });
        }
        router.push(`/recipes/${recipeId}`);
      } else {
        const res = await fetch("/api/recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Create failed");
          setLoading(false);
          return;
        }
        const data = await res.json();
        const id = data.id as string;
        for (const item of imageList) {
          if (item.kind === "new") {
            const formData = new FormData();
            formData.set("image", item.file);
            await fetch(`/api/recipes/${id}/image`, { method: "POST", body: formData });
          }
        }
        router.push(`/recipes/${id}`);
      }
      router.refresh();
    } catch {
      setError("Request failed. Please check your connection.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">

      {/* ── AI generate panel ── */}
      {process.env.NEXT_PUBLIC_OPENAI_ENABLED !== "false" && (
        <div className="card rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Generate with AI</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">Describe a dish and AI will fill in the recipe details</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Quick creamy pasta with sun-dried tomatoes and basil"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), generateWithAi())}
              className="form-input flex-1 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-2.5 text-[var(--foreground)] text-sm placeholder:text-[var(--muted)]"
            />
            <button
              type="button"
              onClick={generateWithAi}
              disabled={aiLoading || !aiPrompt.trim()}
              className="btn btn-primary px-5 py-2.5 rounded-xl text-sm font-medium shrink-0"
            >
              {aiLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Generating…
                </span>
              ) : "Generate"}
            </button>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm animate-slide-down">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {error}
        </div>
      )}

      {/* ── Section 1: Basic info ── */}
      <div className="card rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center">1</span>
          Basic Information
        </h2>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
            Recipe name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Grandma's Spaghetti Bolognese"
            className="form-input w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-[var(--foreground)] text-sm placeholder:text-[var(--muted)]"
          />
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Status</label>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                  status === opt.value
                    ? opt.color + " shadow-sm"
                    : "bg-[var(--card)] border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--muted)]"
                }`}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Public toggle */}
        <div>
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className={`relative mt-0.5 w-10 h-6 rounded-full transition-colors shrink-0 ${
              isPublic ? "bg-[var(--accent)]" : "bg-[var(--card-border)]"
            }`}
              onClick={() => setIsPublic(!isPublic)}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                isPublic ? "translate-x-4" : "translate-x-0"
              }`} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Make public</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">Show this recipe on the Discover page for others to find</p>
            </div>
          </label>
        </div>
      </div>

      {/* ── Section 2: Details ── */}
      <div className="card rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center">2</span>
          Details
        </h2>

        {/* Cuisine */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Cuisine</label>
            <select
              value={cuisineSelect}
              onChange={(e) => setCuisineSelect(e.target.value)}
              className="form-input w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-[var(--foreground)] text-sm"
            >
              {CUISINE_OPTIONS.map((opt) => (
                <option key={opt || "none"} value={opt}>
                  {opt || "— Select cuisine —"}
                </option>
              ))}
            </select>
            {cuisineSelect === "Other" && (
              <input
                type="text"
                value={cuisineOther}
                onChange={(e) => setCuisineOther(e.target.value)}
                placeholder="Enter cuisine type"
                className="form-input w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-[var(--foreground)] text-sm placeholder:text-[var(--muted)]"
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Prep time</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={prepTimeMinutes}
                  onChange={(e) => setPrepTimeMinutes(e.target.value)}
                  placeholder="0"
                  className="form-input w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 pr-12 text-[var(--foreground)] text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">min</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Cook time</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={cookTimeMinutes}
                  onChange={(e) => setCookTimeMinutes(e.target.value)}
                  placeholder="0"
                  className="form-input w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 pr-12 text-[var(--foreground)] text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Ingredients ── */}
      <div className="card rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center">3</span>
          Ingredients
          <span className="ml-auto text-xs text-[var(--muted)] font-normal">{ingredients.filter(Boolean).length} added</span>
        </h2>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-center group">
              <span className="text-[var(--muted)] text-xs tabular-nums w-5 text-right shrink-0">{i + 1}</span>
              <input
                type="text"
                value={ing}
                onChange={(e) => setIngredient(i, e.target.value)}
                placeholder={`Ingredient ${i + 1}, e.g. 2 cups flour`}
                className="form-input flex-1 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-2.5 text-[var(--foreground)] text-sm placeholder:text-[var(--muted)]"
              />
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                disabled={ingredients.length <= 1}
                className="w-8 h-8 rounded-lg border border-[var(--card-border)] text-[var(--muted)] hover:bg-red-50 hover:text-red-500 hover:border-red-200 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                aria-label="Remove"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          className="flex items-center gap-2 w-full rounded-xl border border-dashed border-[var(--accent-muted)] text-[var(--accent)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--accent-soft)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add ingredient
        </button>
      </div>

      {/* ── Section 4: Instructions ── */}
      <div className="card rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center">4</span>
          Instructions
        </h2>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={8}
          placeholder="Write the steps to prepare this recipe. You can write each step on a new line for a numbered list on the recipe page."
          className="form-input w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-[var(--foreground)] text-sm placeholder:text-[var(--muted)] resize-none leading-relaxed"
        />
        <p className="text-xs text-[var(--muted)]">
          Tip: Put each step on its own line — they&apos;ll be shown as numbered steps on the recipe page.
        </p>
      </div>

      {/* ── Section 5: Photos ── */}
      <div className="card rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center">5</span>
          Photos
          <span className="ml-auto text-xs text-[var(--muted)] font-normal">JPEG, PNG, WebP or GIF · max 5MB each</span>
        </h2>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={onImageChange}
          className="hidden"
        />

        <div className="flex flex-wrap gap-3">
          {imageList.map((entry, index) => (
            <div
              key={index}
              className="relative w-28 h-28 rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--card-border)] group shadow-sm"
            >
              <Image
                src={entry.kind === "existing" ? entry.url : entry.objectUrl}
                alt={`Recipe photo ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all"
                aria-label="Remove photo"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-28 h-28 rounded-xl border-2 border-dashed border-[var(--card-border)] bg-[var(--surface)] flex flex-col items-center justify-center gap-1.5 text-[var(--muted)] hover:border-[var(--accent-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs font-medium">Add photo</span>
          </button>
        </div>
      </div>

      {/* ── Submit ── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary flex-1 sm:flex-none sm:px-8 py-3 rounded-xl text-sm font-semibold"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Saving…
            </span>
          ) : recipeId ? "Update recipe" : "Create recipe"}
        </button>
        {recipeId && (
          <a
            href={`/recipes/${recipeId}`}
            className="btn btn-outline px-6 py-3 rounded-xl text-sm text-center"
          >
            Cancel
          </a>
        )}
      </div>
    </form>
  );
}
