"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { writeStoredMemberId } from "@/lib/member-nav-storage";

type MemberRow = { id: string; full_name: string };

/**
 * Selector de familiar cuando estás en Salud o Escuela (misma ruta de módulo, otro hijo).
 */
export function MemberModuleSwitcher({ members }: { members: MemberRow[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const match = pathname.match(/^\/members\/([^/]+)\/(health|school)(?:\/|$)/);
  if (!match || members.length <= 1) return null;

  const currentId = match[1];
  const moduleSeg = match[2] as "health" | "school";
  const valid = members.some((m) => m.id === currentId);
  if (!valid) return null;

  return (
    <div className="relative flex min-w-0 max-w-[min(100%,11rem)] items-center sm:max-w-[14rem]">
      <label htmlFor="fh-member-module" className="sr-only">
        Cambiar familiar
      </label>
      <div className="pointer-events-none absolute right-2 top-1/2 z-[1] -translate-y-1/2 text-fh-on-surface-variant">
        <ChevronDown className="size-3.5 opacity-70" aria-hidden />
      </div>
      <select
        id="fh-member-module"
        value={currentId}
        onChange={(e) => {
          const id = e.target.value;
          writeStoredMemberId(id);
          router.push(`/members/${id}/${moduleSeg}`);
        }}
        className="w-full cursor-pointer appearance-none rounded-full border border-fh-line-variant/30 bg-fh-surface-container-low py-1.5 pl-3 pr-8 text-xs font-semibold text-fh-on-surface shadow-sm outline-none transition hover:border-fh-primary/35 focus-visible:ring-2 focus-visible:ring-fh-primary/40"
      >
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.full_name}
          </option>
        ))}
      </select>
    </div>
  );
}
