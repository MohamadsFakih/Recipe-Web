import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import HomeClient from "./HomeClient";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero section - always light gradient, so use dark text for contrast */}
      <div className="relative overflow-hidden border-b border-[var(--card-border)]"
        style={{ background: "linear-gradient(135deg, #f5f2ec 0%, #edf7f2 50%, #f5f2ec 100%)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-full mb-4">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Community Recipes
            </span>
            <h1
              className="text-4xl md:text-5xl font-bold text-stone-800 mb-4 leading-tight"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif", letterSpacing: "-0.02em" }}
            >
              Discover amazing<br />
              <span className="text-emerald-700">recipes</span> from home cooks
            </h1>
            <p className="text-stone-600 text-lg leading-relaxed">
              Browse public recipes shared by our community. Find inspiration, save your favourites, and share your own creations.
            </p>
          </div>
        </div>

        {/* Decorative background circles */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[var(--accent-soft)] opacity-50 pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-32 h-32 rounded-full bg-[var(--accent-soft)] opacity-30 pointer-events-none" />
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <HomeClient />
      </main>
    </div>
  );
}
