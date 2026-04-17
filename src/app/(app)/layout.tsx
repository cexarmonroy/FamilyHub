import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/members", label: "Perfiles" },
  { href: "/notifications", label: "Notificaciones" }
];

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
      <header className="card mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FamilyHub</h1>
          <p className="text-sm text-slate-600">Centro familiar</p>
        </div>
        <nav className="flex gap-2">
          {links.map((link) => (
            <Link key={link.href} className="button-secondary" href={link.href}>
              {link.label}
              {link.href === "/notifications" ? ` (${count ?? 0})` : ""}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
