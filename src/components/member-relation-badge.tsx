import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ACCENTS = [
  "border-transparent bg-fh-secondary-container text-fh-on-secondary-container",
  "border-transparent bg-fh-primary-container text-fh-on-primary-container",
  "border-transparent bg-fh-tertiary-container text-fh-on-tertiary-container",
  "border-transparent bg-fh-surface-container-high text-fh-on-surface",
  "border-transparent bg-fh-surface-container text-fh-on-surface-variant"
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
