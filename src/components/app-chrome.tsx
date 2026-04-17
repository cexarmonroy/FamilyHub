"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  GraduationCap,
  LayoutDashboard,
  Plus,
  Stethoscope,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  match: (pathname: string) => boolean;
};

function buildNav(firstMemberId: string | null): NavItem[] {
  const healthHref = firstMemberId ? `/members/${firstMemberId}/health` : "/members";
  const schoolHref = firstMemberId ? `/members/${firstMemberId}/school` : "/members";

  return [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      match: (p) => p === "/dashboard"
    },
    {
      href: "/members",
      label: "Perfiles",
      icon: Users,
      match: (p) => p === "/members" || /^\/members\/[^/]+$/.test(p)
    },
    {
      href: healthHref,
      label: "Salud",
      icon: Stethoscope,
      match: (p) => p.includes("/health")
    },
    {
      href: schoolHref,
      label: "Escuela",
      icon: GraduationCap,
      match: (p) => p.includes("/school")
    }
  ];
}

export function AppChrome({
  children,
  unreadNotifications,
  firstMemberId
}: {
  children: React.ReactNode;
  unreadNotifications: number;
  firstMemberId: string | null;
}) {
  const pathname = usePathname();
  const nav = buildNav(firstMemberId);

  return (
    <div className="min-h-screen bg-fh-surface text-fh-on-surface antialiased">
      <header className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-fh-line-variant/15 bg-fh-surface/80 px-4 py-3 shadow-ambient backdrop-blur-xl sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-6 md:gap-8">
          <Link href="/dashboard" className="shrink-0">
            <span className="bg-gradient-to-r from-fh-primary to-fh-primary-dim bg-clip-text text-xl font-bold tracking-tight text-transparent sm:text-2xl">
              FamilyHub
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex md:gap-2">
            {nav.map((item) => {
              const active = item.match(pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
                    active
                      ? "text-fh-primary"
                      : "text-fh-on-surface-variant hover:bg-fh-surface-container-low hover:text-fh-on-surface"
                  )}
                >
                  <Icon className="size-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/notifications"
            className="relative rounded-full p-2 text-fh-on-surface-variant transition hover:bg-fh-surface-container-low hover:text-fh-on-surface"
            aria-label={`Notificaciones${unreadNotifications ? `, ${unreadNotifications} sin leer` : ""}`}
          >
            <Bell className="size-5" strokeWidth={2} />
            {unreadNotifications > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-fh-tertiary px-0.5 text-[10px] font-bold text-fh-on-tertiary">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            ) : null}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-28 pt-20 md:px-8 md:pb-8 md:pt-24">{children}</div>

      <nav
        className="fixed bottom-0 left-0 z-50 flex w-full justify-around rounded-t-stitch-xl border-t-0 bg-fh-surface/90 px-2 pb-5 pt-3 text-[11px] font-medium shadow-[0_-4px_20px_rgba(0,0,0,0.04)] backdrop-blur-2xl md:hidden"
        aria-label="Navegación principal"
      >
        {nav.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href + "-mob"}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center rounded-full px-4 py-2 transition-transform active:scale-95",
                active
                  ? "bg-fh-primary-container/50 text-fh-primary"
                  : "text-fh-on-surface-variant hover:text-fh-primary"
              )}
            >
              <Icon className="size-6 shrink-0" strokeWidth={active ? 2.25 : 2} />
              <span className="mt-0.5 truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        href="/members"
        className="fixed bottom-24 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-fh-primary to-fh-primary-dim text-fh-on-primary shadow-lg shadow-fh-primary/25 transition active:scale-95 md:bottom-8"
        aria-label="Añadir o gestionar familiares"
      >
        <Plus className="size-7" strokeWidth={2.5} />
      </Link>
    </div>
  );
}
