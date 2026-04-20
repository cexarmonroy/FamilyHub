/** Último perfil usado en módulos Salud/Escuela (y enlaces del menú). */
export const MEMBER_NAV_STORAGE_KEY = "fh:lastMemberId";

export function readStoredMemberId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(MEMBER_NAV_STORAGE_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

export function writeStoredMemberId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MEMBER_NAV_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

/** `/members/:uuid/...` → id (excluye rutas especiales). */
export function extractMemberIdFromPathname(pathname: string): string | null {
  const m = pathname.match(/^\/members\/([^/]+)/);
  if (!m?.[1]) return null;
  const id = m[1];
  if (id === "new") return null;
  return id;
}

export function resolveTargetMemberId(args: {
  pathname: string;
  storedId: string | null;
  validIds: Set<string>;
  fallbackFirstId: string | null;
}): string | null {
  const { pathname, storedId, validIds, fallbackFirstId } = args;
  const fromPath = extractMemberIdFromPathname(pathname);
  if (fromPath && validIds.has(fromPath)) return fromPath;
  if (storedId && validIds.has(storedId)) return storedId;
  return fallbackFirstId;
}
