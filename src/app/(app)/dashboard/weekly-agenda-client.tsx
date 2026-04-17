"use client";

import * as React from "react";
import { addDays, format, isWithinInterval, parse, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  weekStart: string;
  events: WeekEventDTO[];
};

export function WeeklyAgendaClient({ weekStart, events }: Props) {
  const monday = React.useMemo(() => parseLocalYmd(weekStart), [weekStart]);
  const sunday = React.useMemo(() => addDays(monday, 6), [monday]);

  const defaultKey = React.useMemo(() => {
    const today = startOfDay(new Date());
    if (isWithinInterval(today, { start: monday, end: sunday })) {
      return toLocalDateKey(today);
    }
    return weekStart;
  }, [monday, sunday, weekStart]);

  const [selected, setSelected] = React.useState(defaultKey);

  React.useEffect(() => {
    setSelected(defaultKey);
  }, [defaultKey, weekStart]);

  const dayCells = React.useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(monday, i);
        return {
          key: toLocalDateKey(d),
          label: dayShortLabel(d),
          dayNum: format(d, "d", { locale: es })
        };
      }),
    [monday]
  );

  const filtered = React.useMemo(() => {
    return events.filter((e) => toLocalDateKey(new Date(e.at)) === selected);
  }, [events, selected]);

  const weekIsEmpty = events.length === 0;
  const dayIsEmpty = filtered.length === 0;

  return (
    <>
      <div className="card min-w-0">
        <h2 className="mb-4 text-lg font-semibold">Agenda semanal</h2>
        <div className="-mx-2 overflow-x-auto px-2 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
        <ToggleGroup
          variant="outline"
          value={[selected]}
          onValueChange={(next) => {
            if (next[0]) setSelected(next[0]);
          }}
          className="!grid w-full max-w-full grid-cols-7 gap-1 min-w-[24rem] sm:min-w-0 sm:gap-2"
        >
          {dayCells.map((cell) => (
            <ToggleGroupItem
              key={cell.key}
              value={cell.key}
              className={cn(
                "h-auto min-w-0 w-full flex-col gap-0.5 rounded-lg px-1 py-1.5 font-medium sm:px-2 sm:py-2",
                "border-slate-200/90 bg-slate-100/80 text-slate-600 shadow-none",
                "hover:bg-slate-100 hover:text-slate-800",
                "data-[state=on]:border-blue-900 data-[state=on]:bg-blue-900 data-[state=on]:text-white",
                "data-[state=on]:hover:bg-blue-900 data-[state=on]:hover:text-white"
              )}
            >
              <span className="text-[0.65rem] leading-tight sm:text-xs">{cell.label}</span>
              <span className="text-[0.6rem] font-normal opacity-90 sm:text-[0.7rem]">{cell.dayNum}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">Eventos</h2>
        <div className="space-y-2">
          {filtered.map((event) => (
            <div key={event.id} className={`rounded-xl border p-3 text-sm ${event.tone}`}>
              <p className="font-medium">{event.title}</p>
              <p className="text-xs opacity-80">{new Date(event.at).toLocaleString("es")}</p>
            </div>
          ))}
          {dayIsEmpty ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
              <CalendarDays className="size-10 text-slate-400" aria-hidden />
              {weekIsEmpty ? (
                <>
                  <p className="text-sm font-medium text-slate-700">¡Semana despejada!</p>
                  <p className="max-w-sm text-sm text-slate-500">
                    No hay exámenes, tareas ni vacunas programados en estos días. Disfruta el respiro.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-700">Todo tranquilo este día</p>
                  <p className="max-w-sm text-sm text-slate-500">
                    No hay pendientes para el día seleccionado. Revisa otro día o añade algo nuevo cuando quieras.
                  </p>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
