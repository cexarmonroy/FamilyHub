"use client";

import Link from "next/link";
import { ChevronRight, GraduationCap, MoreHorizontal, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

type Member = {
  id: string;
  full_name: string;
  relation: string;
  birth_date: string | null;
};

const RING = [
  "ring-fh-secondary-container",
  "ring-fh-primary-container",
  "ring-fh-tertiary-container"
] as const;

const BADGE = [
  "bg-fh-secondary text-fh-on-secondary",
  "bg-fh-primary text-fh-on-primary",
  "bg-fh-tertiary text-fh-on-tertiary"
] as const;

function initialsFromName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : (parts[0]?.[1] ?? "");
  return (a + b).toUpperCase();
}

function ageFromBirthDate(birthDate: string | null) {
  if (!birthDate) return null;
  const dob = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export function FamilyMemberCard({ member, index }: { member: Member; index: number }) {
  const ring = RING[index % RING.length];
  const badge = BADGE[index % BADGE.length];
  const age = ageFromBirthDate(member.birth_date);
  const subtitle =
    age !== null ? `${age} años · integrante familiar` : "Integrante familiar";

  return (
    <article
      className={cn(
        "group rounded-lg bg-fh-surface-container-lowest p-6 shadow-sm transition-all duration-300 sm:p-8",
        "hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(45,51,56,0.06)]"
      )}
    >
      <div className="mb-8 flex items-start justify-between">
        <div className="relative">
          <div
            className={cn(
              "flex h-24 w-24 items-center justify-center rounded-full bg-fh-surface-container-high text-xl font-bold text-fh-on-surface ring-4",
              ring
            )}
            aria-hidden
          >
            {initialsFromName(member.full_name)}
          </div>
          <span
            className={cn(
              "absolute bottom-0 right-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest",
              badge
            )}
          >
            {member.relation.trim() || "—"}
          </span>
        </div>
        <Link
          href={`/members/${member.id}`}
          className="rounded-full p-1 text-fh-line transition-colors hover:bg-fh-surface-container-low hover:text-fh-primary"
          aria-label={`Ver ficha de ${member.full_name}`}
        >
          <MoreHorizontal className="size-6" strokeWidth={1.75} />
        </Link>
      </div>
      <h3 className="mb-1 text-2xl font-bold text-fh-on-surface">{member.full_name}</h3>
      <p className="mb-8 text-sm text-fh-on-surface-variant">{subtitle}</p>
      <div className="flex flex-col gap-3">
        <Link
          href={`/members/${member.id}/health`}
          className="group/link flex items-center justify-between rounded-xl bg-fh-surface-container-low p-4 transition-colors hover:bg-fh-secondary-container/30"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Stethoscope className="size-5 shrink-0 text-fh-secondary" strokeWidth={1.75} />
            <span className="truncate font-medium text-fh-on-surface">Salud general</span>
          </div>
          <ChevronRight
            className="size-5 shrink-0 text-fh-line transition-transform group-hover/link:translate-x-1"
            strokeWidth={1.75}
          />
        </Link>
        <Link
          href={`/members/${member.id}/school`}
          className="group/link flex items-center justify-between rounded-xl bg-fh-surface-container-low p-4 transition-colors hover:bg-fh-primary-container/30"
        >
          <div className="flex min-w-0 items-center gap-3">
            <GraduationCap className="size-5 shrink-0 text-fh-primary" strokeWidth={1.75} />
            <span className="truncate font-medium text-fh-on-surface">Seguimiento escolar</span>
          </div>
          <ChevronRight
            className="size-5 shrink-0 text-fh-line transition-transform group-hover/link:translate-x-1"
            strokeWidth={1.75}
          />
        </Link>
      </div>
    </article>
  );
}
