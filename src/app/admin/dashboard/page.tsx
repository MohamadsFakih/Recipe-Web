import Link from "next/link";

export default function AdminDashboardPage() {
  const cards = [
    { href: "/admin/users", label: "Users", desc: "View, disable, or delete accounts" },
    { href: "/admin/recipes", label: "Recipes", desc: "View or delete recipes (posts)" },
    { href: "/admin/comments", label: "Comments", desc: "View or delete comments" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
        Admin dashboard
      </h1>
      <p className="text-[var(--muted)] mb-8">Manage users, recipes, and comments.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ href, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="block rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] hover:border-[var(--accent-muted)] transition-colors"
          >
            <h2 className="font-semibold text-[var(--foreground)] mb-1">{label}</h2>
            <p className="text-sm text-[var(--muted)]">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
