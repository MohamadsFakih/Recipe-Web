import Header from "@/components/Header";
import RecipeForm from "@/components/RecipeForm";

export default function NewRecipePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1
            className="text-3xl font-bold text-[var(--foreground)] leading-tight mb-1"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif", letterSpacing: "-0.02em" }}
          >
            New Recipe
          </h1>
          <p className="text-sm text-[var(--muted)]">Add a recipe to your collection</p>
        </div>
        <RecipeForm />
      </main>
    </div>
  );
}
