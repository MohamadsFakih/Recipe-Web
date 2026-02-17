import Header from "@/components/Header";
import RecipeForm from "@/components/RecipeForm";

export default function NewRecipePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">Add recipe</h1>
        <RecipeForm />
      </main>
    </div>
  );
}
