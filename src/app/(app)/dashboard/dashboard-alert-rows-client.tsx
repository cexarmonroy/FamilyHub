"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { executeDashboardAction, executeDashboardActionsBatch } from "./actions";
import type {
  DashboardAlert,
  DashboardAlertAction,
  DashboardAlertDisplayRow
} from "@/lib/alerts/types";

function actionToExecutable(
  act: DashboardAlertAction
): Parameters<typeof executeDashboardAction>[0] {
  switch (act.type) {
    case "mark_notification_read":
      return { type: "mark_notification_read", entityId: act.entityId };
    case "complete_task":
      return { type: "complete_task", entityId: act.entityId, memberId: act.memberId };
    case "complete_event":
      return { type: "complete_event", entityId: act.entityId, memberId: act.memberId };
    case "mark_medication_taken":
      return { type: "mark_medication_taken", entityId: act.entityId, memberId: act.memberId };
    case "mark_vaccine_applied":
      return { type: "mark_vaccine_applied", entityId: act.entityId, memberId: act.memberId };
    case "mark_chronic_medication_taken":
      return { type: "mark_chronic_medication_taken", entityId: act.entityId, memberId: act.memberId };
    default: {
      const _x: never = act;
      return _x;
    }
  }
}

function successMessage(
  act: DashboardAlertAction,
  res: Awaited<ReturnType<typeof executeDashboardAction>>
): string {
  switch (act.type) {
    case "complete_event":
      return "Prueba marcada como rendida.";
    case "mark_medication_taken":
      return res.medicationDuplicate ? "Esta toma ya estaba registrada hoy." : "Toma registrada.";
    case "mark_chronic_medication_taken":
      return res.chronicDuplicate ? "Esta toma ya estaba registrada hoy." : "Toma registrada.";
    case "mark_vaccine_applied":
      return "Aplicación registrada.";
    case "mark_notification_read":
      return "Notificación marcada como leída.";
    case "complete_task":
      return "Tarea completada.";
    default: {
      const _n: never = act;
      return _n;
    }
  }
}

type Variant = "critical" | "warning";

const variantStyles: Record<
  Variant,
  { wrap: string; title: string; card: string; text: string; link: string; btn: string; done: string }
> = {
  critical: {
    wrap: "mb-4 rounded-stitch-lg border border-red-200/80 bg-red-50/90 p-4 shadow-ambient-soft dark:border-red-900/40 dark:bg-red-950/30",
    title: "mb-2 text-xs font-bold uppercase tracking-widest text-red-800 dark:text-red-200",
    card: "rounded-lg border border-red-200/60 bg-white/40 p-3 transition-opacity duration-300 dark:border-red-900/30 dark:bg-red-950/20",
    text: "text-red-900 dark:text-red-100",
    link: "text-red-800 dark:text-red-200",
    btn: "bg-fh-on-surface text-fh-surface dark:bg-red-200 dark:text-red-950",
    done: "border border-emerald-600/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
  },
  warning: {
    wrap: "mb-4 rounded-stitch-lg border border-amber-200/90 bg-amber-50/90 p-4 shadow-ambient-soft dark:border-amber-900/40 dark:bg-amber-950/25",
    title: "mb-2 text-xs font-bold uppercase tracking-widest text-amber-900 dark:text-amber-100",
    card: "rounded-lg border border-amber-200/70 bg-white/50 p-3 transition-opacity duration-300 dark:border-amber-900/35 dark:bg-amber-950/20",
    text: "text-amber-950 dark:text-amber-50",
    link: "text-amber-900 dark:text-amber-100",
    btn: "bg-amber-900 text-amber-50 dark:bg-amber-200 dark:text-amber-950",
    done: "border border-emerald-700/35 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/35 dark:text-emerald-100"
  }
};

type Props = {
  rows: DashboardAlertDisplayRow[];
  variant: Variant;
  title: string;
};

export function DashboardAlertRowsClient({ rows, variant, title }: Props) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [doneRowKeys, setDoneRowKeys] = useState<Set<string>>(() => new Set());
  const [doneActionKeys, setDoneActionKeys] = useState<Set<string>>(() => new Set());
  const s = variantStyles[variant];

  if (rows.length === 0) return null;

  const onActionSuccess = (actionKey: string) => {
    setDoneActionKeys((prev) => new Set(prev).add(actionKey));
    router.refresh();
  };

  const renderSingleCard = (a: DashboardAlert, rowKey: string) => {
    const rowDone = doneRowKeys.has(rowKey);
    return (
      <li
        key={rowKey}
        className={`${s.card} ${rowDone ? "opacity-50" : ""}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <span className="min-w-0 flex-1">· {a.message}</span>
          {a.detailHref ? (
            <Link
              href={a.detailHref}
              className={`shrink-0 text-xs font-semibold underline-offset-2 hover:underline ${s.link}`}
            >
              Ver detalle
            </Link>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {a.actions?.map((act) => {
            const runKey = `${rowKey}__${act.id}`;
            const busy = busyKey === runKey;
            const done = doneActionKeys.has(runKey);
            return (
              <button
                key={act.id}
                type="button"
                disabled={busy || done || rowDone}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition hover:opacity-90 disabled:cursor-default ${
                  done ? `border ${s.done}` : s.btn
                }`}
                onClick={async () => {
                  setBusyKey(runKey);
                  setFeedback(null);
                  const res = await executeDashboardAction(actionToExecutable(act));
                  setBusyKey(null);
                  if (res.ok) {
                    setFeedback({ tone: "ok", text: successMessage(act, res) });
                    onActionSuccess(runKey);
                  } else {
                    setFeedback({
                      tone: "err",
                      text: res.error ?? "No se pudo completar la acción."
                    });
                  }
                }}
              >
                {done ? "✓ Registrado" : busy ? "…" : act.label}
              </button>
            );
          })}
          <button
            type="button"
            disabled={busyKey === `${rowKey}__snooze` || rowDone}
            className="rounded-full border border-current/25 bg-transparent px-3 py-1 text-xs font-semibold opacity-90 hover:opacity-100 disabled:opacity-50"
            onClick={async () => {
              const runKey = `${rowKey}__snooze`;
              setBusyKey(runKey);
              setFeedback(null);
              const res = await executeDashboardAction({ type: "snooze_alert", alertKey: a.id });
              setBusyKey(null);
              if (res.ok) {
                setFeedback({ tone: "ok", text: "Te lo recordamos en 24 horas." });
                setDoneRowKeys((prev) => new Set(prev).add(rowKey));
                router.refresh();
              } else {
                setFeedback({
                  tone: "err",
                  text: res.error ?? "No se pudo posponer."
                });
              }
            }}
          >
            {busyKey === `${rowKey}__snooze` ? "…" : "Recordar en 24 h"}
          </button>
        </div>
      </li>
    );
  };

  return (
    <div className={s.wrap}>
      <p className={s.title}>{title}</p>
      {feedback ? (
        <p
          role="status"
          className={
            feedback.tone === "ok"
              ? "mb-3 rounded-lg bg-emerald-100/90 px-3 py-2 text-sm font-medium text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"
              : "mb-3 rounded-lg bg-red-100/90 px-3 py-2 text-sm font-medium text-red-950 dark:bg-red-900/40 dark:text-red-50"
          }
        >
          {feedback.text}
        </p>
      ) : null}
      <ul className={`space-y-3 text-sm ${s.text}`}>
        {rows.map((row) => {
          if (row.kind === "single") {
            return renderSingleCard(row.alert, row.alert.id);
          }

          const rowKey = row.id;
          const rowDone = doneRowKeys.has(rowKey);
          const bulkKey = `${rowKey}__bulk`;
          const bulkBusy = busyKey === bulkKey;
          const bulkDone = doneActionKeys.has(bulkKey);

          const executableBulk = row.children
            .map((child) => {
              const act =
                child.actions?.find(
                  (x) =>
                    x.type === "mark_chronic_medication_taken" || x.type === "mark_medication_taken"
                ) ?? child.actions?.[0];
              return act ? actionToExecutable(act) : null;
            })
            .filter((x): x is NonNullable<typeof x> => x != null);

          return (
            <li key={rowKey} className={`${s.card} ${rowDone ? "opacity-50" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="min-w-0 flex-1">{row.message}</span>
                {row.detailHref ? (
                  <Link
                    href={row.detailHref}
                    className={`shrink-0 text-xs font-semibold underline-offset-2 hover:underline ${s.link}`}
                  >
                    Ver detalle
                  </Link>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={bulkBusy || bulkDone || rowDone}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    bulkDone ? `border ${s.done}` : s.btn
                  }`}
                  onClick={async () => {
                    setBusyKey(bulkKey);
                    setFeedback(null);
                    const res = await executeDashboardActionsBatch(executableBulk);
                    setBusyKey(null);
                    if (res.ok) {
                      setFeedback({ tone: "ok", text: "Registro completado." });
                      setDoneActionKeys((prev) => new Set(prev).add(bulkKey));
                      setDoneRowKeys((prev) => new Set(prev).add(rowKey));
                      router.refresh();
                    } else {
                      setFeedback({
                        tone: "err",
                        text: res.error ?? "No se pudo registrar todo."
                      });
                    }
                  }}
                >
                  {bulkDone ? "✓ Registrado" : bulkBusy ? "…" : "Registrar todas"}
                </button>
                <button
                  type="button"
                  disabled={busyKey === `${rowKey}__snooze-g` || rowDone}
                  className="rounded-full border border-current/25 px-3 py-1 text-xs font-semibold opacity-90 hover:opacity-100 disabled:opacity-50"
                  onClick={async () => {
                    const runKey = `${rowKey}__snooze-g`;
                    setBusyKey(runKey);
                    setFeedback(null);
                    const res = await executeDashboardAction({ type: "snooze_alert", alertKey: row.id });
                    setBusyKey(null);
                    if (res.ok) {
                      setFeedback({ tone: "ok", text: "Te lo recordamos en 24 horas." });
                      setDoneRowKeys((prev) => new Set(prev).add(rowKey));
                      router.refresh();
                    } else {
                      setFeedback({ tone: "err", text: res.error ?? "No se pudo posponer." });
                    }
                  }}
                >
                  {busyKey === `${rowKey}__snooze-g` ? "…" : "Recordar en 24 h"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
