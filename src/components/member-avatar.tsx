import Image from "next/image";
import { cn } from "@/lib/utils";
import { resolveMemberAvatarUrl } from "@/lib/resolve-member-avatar";

function initialsFromName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : (parts[0]?.[1] ?? "");
  return (a + b).toUpperCase();
}

const dimPx = { sm: 40, md: 96, lg: 128, xl: 160 } as const;

export function MemberAvatar({
  fullName,
  avatarUrl,
  size = "md",
  className,
  ringClassName
}: {
  fullName: string;
  avatarUrl?: string | null;
  size?: keyof typeof dimPx;
  className?: string;
  ringClassName?: string;
}) {
  const src = resolveMemberAvatarUrl(fullName, avatarUrl);
  const dim = dimPx[size];
  const box = cn(
    "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-fh-surface-container-high font-bold text-fh-on-surface",
    size === "sm" && "size-10 text-sm",
    size === "md" && "size-24 text-xl",
    size === "lg" && "size-32 text-2xl",
    size === "xl" && "h-40 w-40 text-3xl",
    ringClassName,
    className
  );

  if (src) {
    const href = src.startsWith("http") ? src : src.startsWith("/") ? src : `/${src}`;
    return (
      <span className={box}>
        <Image
          src={href}
          alt={`Foto de perfil de ${fullName}`}
          width={dim}
          height={dim}
          className="size-full object-cover"
          sizes={`${dim}px`}
          priority={size === "lg" || size === "xl"}
        />
      </span>
    );
  }

  return <span className={box}>{initialsFromName(fullName)}</span>;
}
