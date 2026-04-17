import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ACCENTS = [
  "border-emerald-200/80 bg-emerald-50 text-emerald-900",
  "border-sky-200/80 bg-sky-50 text-sky-900",
  "border-violet-200/80 bg-violet-50 text-violet-900",
  "border-amber-200/80 bg-amber-50 text-amber-900",
  "border-rose-200/80 bg-rose-50 text-rose-900"
] as const;

export function memberAccentClasses(memberId: string): string {
  let h = 0;
  for (let i = 0; i < memberId.length; i++) {
    h = Math.imul(31, h) + memberId.charCodeAt(i);
  }
  return ACCENTS[Math.abs(h) % ACCENTS.length] ?? ACCENTS[0];
}

export function MemberRelationBadge({
  memberId,
  relation
}: {
  memberId: string;
  relation: string | null;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("mt-0.5 font-normal", memberAccentClasses(memberId))}
    >
      {relation?.trim() || "—"}
    </Badge>
  );
}
