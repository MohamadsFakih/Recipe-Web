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
    setLoading(true);
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
        setLoading(false);
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
      setError("AI request failed");
    }
    setLoading(false);
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
      setError("Request failed");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {process.env.NEXT_PUBLIC_OPENAI_ENABLED !== "false" && (
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--card-border)]">
          <p className="text-sm font-medium text-[var(--foreground)] mb-2">AI: Generate recipe from idea</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Quick pasta with tomato and basil"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="flex-1 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-[var(--foreground)]"
            />
            <button
              type="button"
              onClick={generateWithAi}
              disabled={loading}
              className="rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 disabled:opacity-50"
            >
              Generate
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-[var(--foreground)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-[var(--foreground)]"
        >
          <option value="TO_TRY">To try</option>
          <option value="FAVORITE">Favourite</option>
          <option value="MADE_BEFORE">Made before</option>
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)] cursor-pointer">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="rounded border-[var(--card-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
          />
          Make public (show on Home for others to discover)
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Cuisine type</label>
        <select
          value={cuisineSelect}
          onChange={(e) => setCuisineSelect(e.target.value)}
          className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-[var(--foreground)]"
        >
          {CUISINE_OPTIONS.map((opt) => (
            <option key={opt || "none"} value={opt}>
              {opt || "— Select —"}
            </option>
          ))}
        </select>
        {cuisineSelect === "Other" && (
          <input
            type="text"
            value={cuisineOther}
            onChange={(e) => setCuisineOther(e.target.value)}
            placeholder="Enter cuisine type"
            className="mt-2 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-[var(--foreground)]"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Prep (minutes)</label>
          <input
            type="number"
            min={0}
            value={prepTimeMinutes}
            onChange={(e) => setPrepTimeMinutes(e.target.value)}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-[var(--foreground)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Cook (minutes)</label>
          <input
            type="number"
            min={0}
            value={cookTimeMinutes}
            onChange={(e) => setCookTimeMinutes(e.target.value)}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-[var(--foreground)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Ingredients</label>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-[var(--muted)] w-6 text-sm tabular-nums">{i + 1}.</span>
              <input
                type="text"
                value={ing}
                onChange={(e) => setIngredient(i, e.target.value)}
                placeholder="e.g. 2 cups flour"
                className="flex-1 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-[var(--foreground)]"
              />
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                disabled={ingredients.length <= 1}
                className="shrink-0 w-9 h-9 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)] hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center font-medium"
                aria-label="Remove ingredient"
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          className="mt-2 rounded-lg border border-dashed border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-soft)]/30 hover:bg-[var(--accent-soft)]/50 px-4 py-2 text-sm font-medium w-full"
        >
          ＋ Add ingredient
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Instructions</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-[var(--foreground)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Recipe images</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={onImageChange}
          className="hidden"
        />
        <div className="flex flex-wrap items-start gap-4">
          {imageList.map((entry, index) => (
            <div
              key={index}
              className="relative w-32 h-32 rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--card-border)] shrink-0 group"
            >
              <Image
                src={entry.kind === "existing" ? entry.url : entry.objectUrl}
                alt={`Recipe ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ))}
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface)]"
            >
              Add images
            </button>
            <p className="text-xs text-[var(--muted)] mt-1">JPEG, PNG, WebP or GIF, max 5MB each. Multiple allowed.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-2 font-medium disabled:opacity-50"
        >
          {loading ? "Saving…" : recipeId ? "Update recipe" : "Create recipe"}
        </button>
        {recipeId && (
          <a
            href={`/recipes/${recipeId}`}
            className="rounded-lg border border-[var(--card-border)] px-6 py-2"
          >
            Cancel
          </a>
        )}
      </div>
    </form>
  );
}
