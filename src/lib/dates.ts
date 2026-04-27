import { toDate } from "date-fns-tz";

/**
 * Zona IANA para mostrar fechas/horas en la UI.
 * En el servidor (p. ej. Vercel) el huso por defecto suele ser UTC y `toLocaleString()` sin timeZone
 * desplaza la hora respecto a la tuya; con esto se alinea a tu región.
 */
export const APP_TIMEZONE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_TIMEZONE?.trim()) ||
  "America/Santiago";

const ymdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

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
  const parts = ymdFormatter.formatToParts(d);
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

/** Suma días al calendario gregoriano para una clave `yyyy-MM-dd` (sin ambigüedad de huso). */
export function addCalendarDaysToYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const u = new Date(Date.UTC(y, m - 1, d + days));
  const mm = String(u.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(u.getUTCDate()).padStart(2, "0");
  return `${u.getUTCFullYear()}-${mm}-${dd}`;
}

/** Inicio del día civil `ymd` en `APP_TIMEZONE` (instante UTC). Útil en SSR donde `startOfDay` sería UTC. */
export function startOfAppZonedDay(ymd: string): Date {
  return toDate(`${ymd}T00:00:00`, { timeZone: APP_TIMEZONE });
}

/** Fin del día civil `ymd` en `APP_TIMEZONE` (instante UTC). */
export function endOfAppZonedDay(ymd: string): Date {
  return toDate(`${ymd}T23:59:59.999`, { timeZone: APP_TIMEZONE });
}

/** Ventana móvil de 7 días: hoy … hoy+6 en la zona de la app (coherente en Vercel y en local). */
export function rollingSevenDayRangeAppTz(now = new Date()): {
  rangeStart: Date;
  rangeEnd: Date;
  rangeStartYmd: string;
  rangeEndYmd: string;
} {
  const rangeStartYmd = toLocalDateKey(now);
  const rangeEndYmd = addCalendarDaysToYmd(rangeStartYmd, 6);
  return {
    rangeStart: startOfAppZonedDay(rangeStartYmd),
    rangeEnd: endOfAppZonedDay(rangeEndYmd),
    rangeStartYmd,
    rangeEndYmd
  };
}
