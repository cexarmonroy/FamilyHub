/**
 * Zona IANA para mostrar fechas/horas en la UI.
 * En el servidor (p. ej. Vercel) el huso por defecto suele ser UTC y `toLocaleString()` sin timeZone
 * desplaza la hora respecto a la tuya; con esto se alinea a tu región.
 */
export const APP_TIMEZONE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_TIMEZONE?.trim()) ||
  "America/Santiago";

/** Fecha y hora legibles en la zona de la app (no la del host del servidor). */
export function formatAppDateTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("es-CL", {
    timeZone: APP_TIMEZONE,
    dateStyle: "short",
    timeStyle: "short"
  });
}

/** Solo fecha, misma zona que el resto de la app. */
export function formatAppDate(iso: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("es-CL", {
    timeZone: APP_TIMEZONE,
    ...options
  });
}

/** Hora (sin fecha) en la zona de la app. */
export function formatAppTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleTimeString("es-CL", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit"
  });
}

/** Fecha local en formato yyyy-MM-dd (sin depender de UTC). */
export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
