import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1
            className="text-3xl font-bold text-[var(--foreground)] leading-tight mb-1"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif", letterSpacing: "-0.02em" }}
          >
            My Profile
          </h1>
          <p className="text-sm text-[var(--muted)]">Manage your account and connections</p>
        </div>
        <ProfileClient />
      </main>
    </div>
  );
}
