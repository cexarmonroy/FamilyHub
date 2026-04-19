"use client";

import * as React from "react";
import { addDays, format, isWithinInterval, parse, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toLocalDateKey } from "@/lib/dates";

export type WeekEventDTO = {
  id: string;
  title: string;
  at: string;
  tone: string;
};

function parseLocalYmd(ymd: string) {
  return startOfDay(parse(ymd, "yyyy-MM-dd", new Date()));
}

function dayShortLabel(d: Date) {
  const raw = format(d, "EEE", { locale: es }).replace(/\./g, "");
  const head = raw.slice(0, 3);
  return head.charAt(0).toUpperCase() + head.slice(1);
}

type Props = {
  /** Primer día mostrado en la cinta (típicamente hoy): inicio de la ventana de 7 días. */
  windowStart: string;
  events: WeekEventDTO[];
};

export function WeeklyAgendaClient({ windowStart, events }: Props) {
  const firstDay = React.useMemo(() => parseLocalYmd(windowStart), [windowStart]);
  const lastDay = React.useMemo(() => addDays(firstDay, 6), [firstDay]);

  const defaultKey = React.useMemo(() => {
    const today = startOfDay(new Date());
    if (isWithinInterval(today, { start: firstDay, end: lastDay })) {
      return toLocalDateKey(today);
    }
    return windowStart;
  }, [firstDay, lastDay, windowStart]);

  const [selected, setSelected] = React.useState(defaultKey);

  React.useEffect(() => {
    setSelected(defaultKey);
  }, [defaultKey, windowStart]);

  const dayCells = React.useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(firstDay, i);
        return {
          key: toLocalDateKey(d),
          label: dayShortLabel(d),
          dayNum: format(d, "d", { locale: es })
        };
      }),
    [firstDay]
  );

  const selectedIndex = dayCells.findIndex((c) => c.key === selected);

  const shiftWeek = (dir: -1 | 1) => {
    const next = Math.min(Math.max(selectedIndex + dir, 0), 6);
    setSelected(dayCells[next]!.key);
  };

  const filtered = React.useMemo(() => {
    return events.filter((e) => toLocalDateKey(new Date(e.at)) === selected);
  }, [events, selected]);

  const weekIsEmpty = events.length === 0;
  const dayIsEmpty = filtered.length === 0;

  return (
    <section className="rounded-stitch-xl bg-fh-surface-container-low p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-fh-on-surface">Próximos 7 días</h3>
          <p className="mt-0.5 text-xs font-medium text-fh-on-surface-variant">Desde hoy · visibilidad de lo que viene</p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            className="rounded-full p-2 text-fh-on-surface-variant transition hover:bg-fh-surface-container"
            aria-label="Día anterior"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            className="rounded-full p-2 text-fh-on-surface-variant transition hover:bg-fh-surface-container"
            aria-label="Día siguiente"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <div className="-mx-1 flex justify-between gap-2 overflow-x-auto pb-2 md:mx-0">
        {dayCells.map((cell) => {
          const on = cell.key === selected;
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => setSelected(cell.key)}
              className={cn(
                "flex min-w-[4.5rem] flex-col items-center rounded-2xl px-3 py-3 transition-all md:min-w-[5rem]",
                on
                  ? "scale-105 bg-fh-primary text-fh-on-primary shadow-lg shadow-fh-primary/15"
                  : "bg-fh-surface-container-lowest shadow-sm text-fh-on-surface opacity-80 hover:opacity-100"
              )}
            >
              <span className={cn("mb-1 text-xs font-semibold", on ? "font-bold" : "text-fh-line")}>
                {cell.label}
              </span>
              <span className={cn(on ? "text-2xl font-black" : "text-lg font-bold")}>{cell.dayNum}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 space-y-3">
        <h4 className="text-sm font-bold uppercase tracking-widest text-fh-line">Eventos del día</h4>
        <div className="space-y-2">
          {filtered.map((event) => (
            <div key={event.id} className={cn("rounded-xl p-3 text-sm", event.tone)}>
              <p className="font-semibold">{event.title}</p>
              <p className="mt-0.5 text-xs opacity-85">{new Date(event.at).toLocaleString("es")}</p>
            </div>
          ))}
          {dayIsEmpty ? (
            <div className="flex flex-col items-center gap-3 rounded-xl bg-fh-surface-container-lowest/80 px-4 py-10 text-center">
              <CalendarDays className="size-10 text-fh-line" aria-hidden />
              {weekIsEmpty ? (
                <>
                  <p className="text-sm font-semibold text-fh-on-surface">Sin eventos en la ventana</p>
                  <p className="max-w-sm text-sm text-fh-on-surface-variant">
                    No hay exámenes, tareas ni vacunas en los próximos 7 días.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-fh-on-surface">Sin eventos este día</p>
                  <p className="max-w-sm text-sm text-fh-on-surface-variant">
                    Elige otro día en la cinta o añade datos desde salud y escolar.
                  </p>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
