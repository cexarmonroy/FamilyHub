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
    <div className="mx-auto min-h-screen w-full max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
      <header className="card mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <div className="min-w-0 shrink-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">FamilyHub</h1>
          <p className="text-sm text-slate-600">Centro familiar</p>
        </div>
        <nav className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          {links.map((link) => (
            <Link
              key={link.href}
              className="button-secondary w-full justify-center text-center sm:w-auto"
              href={link.href}
            >
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
