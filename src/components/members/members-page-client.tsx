"use client";

import * as React from "react";
import Link from "next/link";
import { UserPlus, X } from "lucide-react";
import { createMember } from "@/app/(app)/members/actions";
import { FamilyMemberCard } from "@/components/members/family-member-card";
import { NewProfileTile } from "@/components/members/new-profile-tile";
import {
  RecentActivitySection,
  type ActivityItem
} from "@/components/members/recent-activity-section";
import { cn } from "@/lib/utils";

type Member = {
  id: string;
  full_name: string;
  relation: string;
  birth_date: string | null;
};

export function MembersPageClient({
  members,
  activities,
  fontClassName
}: {
  members: Member[];
  activities: ActivityItem[];
  fontClassName: string;
}) {
  const [open, setOpen] = React.useState(false);
  const firstFieldRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    queueMicrotask(() => firstFieldRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  async function handleSubmit(formData: FormData) {
    await createMember(formData);
    setOpen(false);
  }

  return (
    <div className={cn(fontClassName, "text-fh-on-surface")}>
      <header className="mb-10 flex flex-col justify-between gap-6 md:mb-12 md:flex-row md:items-end">
        <div className="space-y-2">
          <span className="text-sm font-semibold uppercase tracking-wider text-fh-secondary">
            Círculo familiar
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-fh-on-surface md:text-5xl">
            Perfiles
          </h1>
          <p className="max-w-md text-fh-on-surface-variant">
            Gestiona los accesos y registros detallados de cada integrante de tu hogar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-3 rounded-xl bg-fh-primary px-6 py-3 font-bold tracking-tight text-fh-on-primary shadow-lg shadow-fh-primary/10 transition-all hover:bg-fh-primary-dim active:scale-[0.98] sm:px-8 sm:py-4"
        >
          <UserPlus className="size-5 shrink-0" strokeWidth={2} />
          Añadir familiar
        </button>
      </header>

      <div className="space-y-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {members.map((member, index) => (
            <FamilyMemberCard key={member.id} member={member} index={index} />
          ))}
          <NewProfileTile onOpen={() => setOpen(true)} />
          {!members.length ? (
            <div className="flex flex-col justify-center rounded-lg bg-fh-surface-container-low p-8 md:col-span-1">
              <p className="text-sm font-medium text-fh-on-surface">Aún no hay integrantes</p>
              <p className="mt-2 text-sm text-fh-on-surface-variant">
                Pulsa «Nuevo perfil» o «Añadir familiar» para registrar al primer integrante.
              </p>
            </div>
          ) : null}
        </div>
        <RecentActivitySection items={activities} />
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="absolute inset-0 bg-fh-on-surface/40 backdrop-blur-sm"
            role="presentation"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-member-title"
            className="relative z-10 w-full max-w-md rounded-2xl bg-fh-surface-container-lowest p-6 shadow-xl ring-1 ring-fh-line-variant/20 sm:p-8"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 id="add-member-title" className="text-lg font-semibold text-fh-on-surface">
                  Nuevo integrante
                </h2>
                <p className="mt-1 text-sm text-fh-on-surface-variant">
                  Completa los datos básicos; luego podrás ampliar salud y escolar desde cada ficha.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-fh-line transition-colors hover:bg-fh-surface-container-low hover:text-fh-on-surface"
                aria-label="Cerrar"
              >
                <X className="size-5" strokeWidth={2} />
              </button>
            </div>
            <form action={handleSubmit} className="space-y-3">
              <input
                ref={firstFieldRef}
                className="input bg-fh-surface-container-highest/80 ring-1 ring-fh-line-variant/20 focus:ring-fh-primary"
                name="full_name"
                placeholder="Nombre completo"
                required
                autoComplete="name"
              />
              <input
                className="input bg-fh-surface-container-highest/80 ring-1 ring-fh-line-variant/20"
                name="birth_date"
                type="date"
              />
              <input
                className="input bg-fh-surface-container-highest/80 ring-1 ring-fh-line-variant/20 focus:ring-fh-primary"
                name="relation"
                placeholder="Relación (hijo/a, padre, etc.)"
                required
              />
              <textarea
                className="input bg-fh-surface-container-highest/80 ring-1 ring-fh-line-variant/20 focus:ring-fh-primary"
                name="notes"
                placeholder="Notas"
              />
              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl border border-fh-line-variant/40 bg-fh-surface-container-low px-4 py-2.5 text-sm font-medium text-fh-on-surface transition hover:bg-fh-surface-container-high"
                >
                  Cancelar
                </button>
                <button
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-fh-primary px-4 py-2.5 text-sm font-bold text-fh-on-primary shadow-md shadow-fh-primary/15 transition hover:bg-fh-primary-dim focus:outline-none focus:ring-2 focus:ring-fh-primary/40 active:scale-[0.98] sm:flex-initial sm:min-w-[140px]"
                  type="submit"
                >
                  Guardar perfil
                </button>
              </div>
            </form>
            <p className="mt-4 text-center text-xs text-fh-line">
              ¿Ya existe el perfil?{" "}
              <Link
                className="font-medium text-fh-primary underline-offset-2 hover:underline"
                href="/dashboard"
                onClick={() => setOpen(false)}
              >
                Volver al tablero
              </Link>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
