/** Imagen en `public/avatars` (misma ruta que usa la migración SQL). */
const AMELIE_PUBLIC_AVATAR = "/avatars/amelie-monroy.png";
const FERNANDA_PUBLIC_AVATAR = "/avatars/fernanda.png";
const CRISTOBAL_PUBLIC_AVATAR = "/avatars/cristobal.png";
const MATIAS_PUBLIC_AVATAR = "/avatars/matias.png";

/**
 * URL de foto: columna `avatar_url` en BD, o recurso por defecto si aún no migraste.
 */
export function resolveMemberAvatarUrl(
  fullName: string,
  avatarUrl: string | null | undefined
): string | null {
  const u = avatarUrl?.trim();
  if (u) return u;
  const n = fullName.trim().toLowerCase();
  if (n.includes("amelie") || n.includes("amélie")) return AMELIE_PUBLIC_AVATAR;
  if (n.includes("fernanda")) return FERNANDA_PUBLIC_AVATAR;
  if (n.includes("cristobal") || n.includes("cristóbal")) return CRISTOBAL_PUBLIC_AVATAR;
  if (n.includes("matias") || n.includes("matías")) return MATIAS_PUBLIC_AVATAR;
  return null;
}
