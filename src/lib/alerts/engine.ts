import {
  differenceInCalendarDays,
  differenceInHours,
  isAfter,
  isBefore,
  isWithinInterval,
  parse,
  startOfDay,
  subDays
} from "date-fns";
import { toLocalDateKey } from "@/lib/dates";
import type {
  AgendaEventPayload,
  AlertDomain,
  AlertLevel,
  DashboardAlert,
  DashboardAlertDisplayRow,
  DashboardState,
  MemberDashboardStatus
} from "./types";

/** Supabase puede devolver un objeto o un array de una fila según el join. */
type JoinedName = { full_name?: string } | { full_name?: string }[] | null;

export type RawMember = {
  id: string;
  full_name: string;
  relation: string;
};

export type RawTest = {
  id: string;
  member_id: string;
  subject: string;
  test_at: string;
  completed_at: string | null;
  family_members: JoinedName;
};

export type RawTask = {
  id: string;
  member_id: string;
  title: string;
  due_at: string;
  status: string;
  family_members: JoinedName;
};

export type RawVaccine = {
  id: string;
  member_id: string;
  vaccine_name: string;
  next_due_at: string | null;
  applied_at: string | null;
  family_members: JoinedName;
};

export type RawChronicMedication = {
  id: string;
  member_id: string;
  name: string;
  family_members: JoinedName;
};

export type RawVisitCourse = {
  id: string;
  medication_name: string;
  treatment_start: string;
  treatment_end: string;
  member_id: string;
  family_members: JoinedName;
};

export type RawNotification = {
  id: string;
  title: string;
  body: string | null;
  event_at: string;
  type: string;
  member_id: string | null;
};

function memberName(row: { family_members: JoinedName }): string {
  const f = row.family_members;
  const o = Array.isArray(f) ? f[0] : f;
  return o?.full_name?.trim() || "Familiar";
}

function worstLevel(levels: AlertLevel[]): AlertLevel {
  if (levels.some((l) => l === "critical")) return "critical";
  if (levels.some((l) => l === "warning")) return "warning";
  return "ok";
}

function levelRank(l: AlertLevel): number {
  if (l === "critical") return 2;
  if (l === "warning") return 1;
  return 0;
}

function parseLocalDate(ymd: string): Date {
  return startOfDay(parse(ymd, "yyyy-MM-dd", new Date()));
}

function levelForSchoolTest(
  testAtIso: string,
  now: Date,
  windowStart: Date,
  windowEnd: Date
): AlertLevel | null {
  const t = new Date(testAtIso);
  if (!isAfter(t, now)) return null;
  if (!isWithinInterval(t, { start: windowStart, end: windowEnd })) return null;
  const h = differenceInHours(t, now);
  if (h <= 24) return "critical";
  return "warning";
}

function levelForTask(
  dueAtIso: string,
  status: string,
  now: Date,
  windowStart: Date,
  windowEnd: Date
): AlertLevel | null {
  if (status === "done") return null;
  const t = new Date(dueAtIso);
  if (!isWithinInterval(t, { start: windowStart, end: windowEnd })) return null;
  if (!isAfter(t, now)) return "critical";
  const h = differenceInHours(t, now);
  if (h <= 24) return "critical";
  return "warning";
}

/** Vacuna con fecha en la semana visible: hoy/mañana/atraso → crítico; resto → aviso. */
function levelForVaccineDate(nextDueYmd: string, today: Date): AlertLevel | null {
  const due = parseLocalDate(nextDueYmd);
  if (isBefore(due, today)) return "critical";
  const days = differenceInCalendarDays(due, today);
  if (days === 0 || days === 1) return "critical";
  return "warning";
}

function levelForVisitCourse(startYmd: string, endYmd: string, today: Date): AlertLevel | null {
  const start = parseLocalDate(startYmd);
  const end = parseLocalDate(endYmd);
  if (isBefore(end, today) || isAfter(start, today)) return null;
  if (differenceInCalendarDays(end, today) === 0) return "critical";
  return "warning";
}

function notificationDomain(type: string): AlertDomain {
  const t = type.toLowerCase();
  if (t.includes("school") || t.includes("test")) return "school";
  return "health";
}

function notificationLevel(eventAtIso: string, now: Date): AlertLevel {
  const t = new Date(eventAtIso);
  if (!isAfter(t, now)) return "warning";
  const h = differenceInHours(t, now);
  if (h <= 24) return "critical";
  return "warning";
}

function memberSectionHref(domain: AlertDomain, memberId: string | null): string | null {
  if (!memberId) return "/notifications";
  return domain === "school" ? `/members/${memberId}/school` : `/members/${memberId}/health`;
}

function buildAgendaEvents(input: {
  tests: RawTest[];
  tasks: RawTask[];
  vaccines: RawVaccine[];
}): AgendaEventPayload[] {
  const { tests, tasks, vaccines } = input;
  const mapped: AgendaEventPayload[] = [
    ...tests
      .filter((item) => !item.completed_at)
      .map((item) => ({
        id: `test-${item.id}`,
        title: `Prueba: ${item.subject}`,
        memberName: memberName(item),
        at: new Date(item.test_at).toISOString(),
        tone: "border border-fh-primary-container/35 bg-fh-primary-container/20 text-fh-on-background"
      })),
    ...tasks.map((item) => ({
      id: `task-${item.id}`,
      title: `Tarea: ${item.title}`,
      memberName: memberName(item),
      at: new Date(item.due_at).toISOString(),
      tone: "border border-fh-secondary/25 bg-fh-secondary-container/40 text-fh-on-background"
    })),
    ...vaccines
      .filter((item) => item.next_due_at)
      .map((item) => ({
        id: `vac-${item.id}`,
        title: `Vacuna: ${item.vaccine_name}`,
        memberName: memberName(item),
        at: new Date(`${item.next_due_at}T09:00:00`).toISOString(),
        tone: "border border-fh-tertiary-container/50 bg-fh-tertiary-container/25 text-fh-on-background"
      }))
  ];
  mapped.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return mapped;
}

function buildSummary(alerts: DashboardAlert[]): {
  school: { message: string; detailHref: string | null };
  health: { message: string; detailHref: string | null };
} {
  if (alerts.length === 0) {
    return {
      school: {
        message: "Próximos días despejados. No hay pruebas urgentes.",
        detailHref: null
      },
      health: {
        message: "Todo al día. Sin pendientes médicos destacados.",
        detailHref: null
      }
    };
  }
  const schoolAlerts = alerts
    .filter((a) => a.domain === "school")
    .sort((a, b) => levelRank(b.level) - levelRank(a.level));
  const healthAlerts = alerts
    .filter((a) => a.domain === "health")
    .sort((a, b) => levelRank(b.level) - levelRank(a.level));

  const topSchool = schoolAlerts[0];
  const topHealth = healthAlerts[0];

  return {
    school: topSchool
      ? { message: topSchool.message, detailHref: topSchool.detailHref }
      : { message: "Sin novedades escolares.", detailHref: null },
    health: topHealth
      ? { message: topHealth.message, detailHref: topHealth.detailHref }
      : { message: "Sin novedades de salud.", detailHref: null }
  };
}

function groupMemberStatuses(
  members: RawMember[],
  alerts: DashboardAlert[]
): MemberDashboardStatus[] {
  return members.map((m) => {
    const mine = alerts.filter((a) => a.memberId === m.id);
    const status = worstLevel(mine.map((a) => a.level));
    const sorted = [...mine].sort((a, b) => levelRank(b.level) - levelRank(a.level));
    return {
      id: m.id,
      name: m.full_name,
      status,
      highlight: sorted[0]?.message ?? null,
      alerts: mine
    };
  });
}

/**
 * Reglas: `critical` ≤24 h o vencido o vacuna hoy/mañana o último día de tratamiento;
 * `warning` resto de la ventana o notas/activos.
 * `rangeStart` / `rangeEnd` definen el periodo (p. ej. hoy … hoy+6 días).
 */
function isAlertHiddenBySnooze(a: DashboardAlert, snoozed: ReadonlySet<string>): boolean {
  if (snoozed.has(a.id)) return true;
  if (a.memberId && a.id.startsWith("health-chronic-med-") && snoozed.has(`grp-chronic-${a.memberId}`)) {
    return true;
  }
  if (a.memberId && a.id.startsWith("health-course-") && snoozed.has(`grp-visit-${a.memberId}`)) {
    return true;
  }
  return false;
}

function filterSnoozedAlerts(alerts: DashboardAlert[], snoozedKeys: ReadonlySet<string>): DashboardAlert[] {
  if (snoozedKeys.size === 0) return alerts;
  return alerts.filter((a) => !isAlertHiddenBySnooze(a, snoozedKeys));
}

function rowWorstLevel(row: DashboardAlertDisplayRow): AlertLevel {
  if (row.kind === "single") return row.alert.level;
  return worstLevel(row.children.map((c) => c.level));
}

function buildDisplayRows(alerts: DashboardAlert[]): DashboardAlertDisplayRow[] {
  const sorted = [...alerts].sort(
    (a, b) =>
      levelRank(b.level) - levelRank(a.level) || a.message.localeCompare(b.message, "es", { sensitivity: "base" })
  );
  const used = new Set<string>();
  const rows: DashboardAlertDisplayRow[] = [];

  for (const a of sorted) {
    if (used.has(a.id)) continue;

    if (a.id.startsWith("health-chronic-med-") && a.memberId) {
      const same = sorted.filter(
        (x) =>
          x.id.startsWith("health-chronic-med-") && x.memberId === a.memberId && !used.has(x.id)
      );
      if (same.length >= 2) {
        for (const x of same) used.add(x.id);
        rows.push({
          kind: "group",
          id: `grp-chronic-${a.memberId}`,
          groupKind: "chronic_medications",
          memberId: a.memberId,
          memberName: same[0]!.memberName,
          count: same.length,
          message: `${same[0]!.memberName} tiene ${same.length} medicamentos base por registrar hoy`,
          detailHref: memberSectionHref("health", a.memberId),
          children: same
        });
      } else {
        used.add(a.id);
        rows.push({ kind: "single", alert: a });
      }
      continue;
    }

    if (a.id.startsWith("health-course-") && a.memberId) {
      const same = sorted.filter(
        (x) =>
          x.id.startsWith("health-course-") && x.memberId === a.memberId && !used.has(x.id)
      );
      if (same.length >= 2) {
        for (const x of same) used.add(x.id);
        rows.push({
          kind: "group",
          id: `grp-visit-${a.memberId}`,
          groupKind: "visit_medications",
          memberId: a.memberId,
          memberName: same[0]!.memberName,
          count: same.length,
          message: `${same[0]!.memberName} tiene ${same.length} medicamentos por registrar de su receta médica`,
          detailHref: memberSectionHref("health", a.memberId),
          children: same
        });
      } else {
        used.add(a.id);
        rows.push({ kind: "single", alert: a });
      }
      continue;
    }

    used.add(a.id);
    rows.push({ kind: "single", alert: a });
  }

  return rows.sort(
    (a, b) =>
      levelRank(rowWorstLevel(b)) - levelRank(rowWorstLevel(a)) ||
      (a.kind === "group" ? a.message : a.alert.message).localeCompare(
        b.kind === "group" ? b.message : b.alert.message,
        "es",
        { sensitivity: "base" }
      )
  );
}

function buildNaturalLanguageSummary(alerts: DashboardAlert[]): string {
  if (alerts.length === 0) {
    return "Todo despejado: no tienes pendientes destacados para hoy.";
  }
  let tests = 0;
  let tasks = 0;
  let vaccines = 0;
  let chronic = 0;
  let visitMed = 0;
  let notifs = 0;
  for (const a of alerts) {
    if (a.id.startsWith("school-test-")) tests += 1;
    else if (a.id.startsWith("school-task-")) tasks += 1;
    else if (a.id.startsWith("health-vac-")) vaccines += 1;
    else if (a.id.startsWith("health-chronic-med-")) chronic += 1;
    else if (a.id.startsWith("health-course-")) visitMed += 1;
    else if (a.id.startsWith("notif-")) notifs += 1;
  }
  const parts: string[] = [];
  if (tests === 1) parts.push("1 prueba escolar importante");
  else if (tests > 1) parts.push(`${tests} pruebas escolares`);
  if (tasks === 1) parts.push("1 tarea pendiente");
  else if (tasks > 1) parts.push(`${tasks} tareas`);
  if (vaccines === 1) parts.push("1 vacuna o control");
  else if (vaccines > 1) parts.push(`${vaccines} vacunas o controles`);
  if (chronic === 1) parts.push("1 medicación base por registrar");
  else if (chronic > 1) parts.push(`${chronic} medicaciones base por registrar`);
  if (visitMed === 1) parts.push("1 medicamento por registrar de receta médica");
  else if (visitMed > 1) parts.push(`${visitMed} medicamentos por registrar de receta médica`);
  if (notifs === 1) parts.push("1 notificación sin leer");
  else if (notifs > 1) parts.push(`${notifs} notificaciones sin leer`);

  if (parts.length === 0) {
    return "Tienes avisos activos; revisa las listas de abajo.";
  }
  if (parts.length === 1) return `Hoy tienes ${parts[0]}.`;
  const last = parts.pop()!;
  return `Hoy tienes ${parts.join(", ")} y ${last}.`;
}

export function buildDashboardState(input: {
  rangeStart: Date;
  rangeEnd: Date;
  now?: Date;
  tests: RawTest[];
  tasks: RawTask[];
  vaccines: RawVaccine[];
  visitCourses: RawVisitCourse[];
  notifications: RawNotification[];
  members: RawMember[];
  /** Medicación base activa sin registro de toma hoy (alerta recordatorio). */
  chronicMedicationsWithoutLogToday: RawChronicMedication[];
  /** Última fecha de toma registrada por medicación (yyyy-MM-dd), para escalar a crítico si ayer faltó. */
  chronicLastLogYmdByMedicationId?: Record<string, string | null>;
  /** Claves de alerta pospuestas y aún vigentes. */
  snoozedAlertKeys?: ReadonlySet<string>;
}): DashboardState {
  const now = input.now ?? new Date();
  const windowStart = startOfDay(input.rangeStart);
  const windowEnd = input.rangeEnd;
  const rawAlerts: DashboardAlert[] = [];

  const todayKey = toLocalDateKey(now);
  const yesterdayKey = toLocalDateKey(subDays(now, 1));
  const today = parseLocalDate(todayKey);
  const lastLogMap = input.chronicLastLogYmdByMedicationId ?? {};

  for (const t of input.tests) {
    if (t.completed_at) continue;
    const lvl = levelForSchoolTest(t.test_at, now, windowStart, windowEnd);
    if (!lvl) continue;
    rawAlerts.push({
      id: `school-test-${t.id}`,
      domain: "school",
      level: lvl,
      message: `Prueba: ${t.subject} · ${memberName(t)}`,
      memberId: t.member_id,
      memberName: memberName(t),
      detailHref: memberSectionHref("school", t.member_id),
      actions: [
        {
          id: "complete",
          type: "complete_event",
          label: "Marcar como rendida",
          entityId: t.id,
          entityType: "event",
          memberId: t.member_id
        }
      ]
    });
  }

  for (const task of input.tasks) {
    const lvl = levelForTask(task.due_at, task.status, now, windowStart, windowEnd);
    if (!lvl) continue;
    rawAlerts.push({
      id: `school-task-${task.id}`,
      domain: "school",
      level: lvl,
      message: `Tarea: ${task.title} · ${memberName(task)}`,
      memberId: task.member_id,
      memberName: memberName(task),
      detailHref: memberSectionHref("school", task.member_id),
      actions: [
        {
          id: "complete",
          type: "complete_task",
          label: "Marcar como completada",
          entityId: task.id,
          entityType: "task",
          memberId: task.member_id
        }
      ]
    });
  }

  for (const v of input.vaccines) {
    if (!v.next_due_at) continue;
    if (v.applied_at && v.applied_at >= v.next_due_at) continue;
    const lvl = levelForVaccineDate(v.next_due_at, today);
    if (!lvl) continue;
    rawAlerts.push({
      id: `health-vac-${v.id}`,
      domain: "health",
      level: lvl,
      message: `Vacuna: ${v.vaccine_name} · ${memberName(v)}`,
      memberId: v.member_id,
      memberName: memberName(v),
      detailHref: memberSectionHref("health", v.member_id),
      actions: [
        {
          id: "applied",
          type: "mark_vaccine_applied",
          label: "Registrar aplicación",
          entityId: v.id,
          entityType: "vaccine",
          memberId: v.member_id
        }
      ]
    });
  }

  for (const m of input.chronicMedicationsWithoutLogToday) {
    const lastYmd = lastLogMap[m.id] ?? null;
    /** Sin registro hoy: si el último registro es anterior a ayer → se considera día perdido → crítico. */
    const missedPriorDay =
      lastYmd !== null && lastYmd < yesterdayKey;
    const chronicLevel: AlertLevel = missedPriorDay ? "critical" : "warning";
    rawAlerts.push({
      id: `health-chronic-med-${m.id}`,
      domain: "health",
      level: chronicLevel,
      message: `Medicación base: ${m.name} · ${memberName(m)}`,
      memberId: m.member_id,
      memberName: memberName(m),
      detailHref: memberSectionHref("health", m.member_id),
      actions: [
        {
          id: "log",
          type: "mark_chronic_medication_taken",
          label: "Registrar toma hoy",
          entityId: m.id,
          entityType: "chronic_medication",
          memberId: m.member_id
        }
      ]
    });
  }

  for (const c of input.visitCourses) {
    const lvl = levelForVisitCourse(c.treatment_start, c.treatment_end, today);
    if (!lvl) continue;
    const name = memberName(c);
    const lastDay = c.treatment_end === todayKey;
    rawAlerts.push({
      id: `health-course-${c.id}`,
      domain: "health",
      level: lvl,
      message: lastDay
        ? `Último día de ${c.medication_name} · ${name}`
        : `Tratamiento activo: ${c.medication_name} · ${name}`,
      memberId: c.member_id,
      memberName: name,
      detailHref: memberSectionHref("health", c.member_id),
      actions: [
        {
          id: "taken",
          type: "mark_medication_taken",
          label: "Registrar toma hoy",
          entityId: c.id,
          entityType: "medication",
          memberId: c.member_id
        }
      ]
    });
  }

  for (const n of input.notifications) {
    const dom = notificationDomain(n.type);
    const lvl = notificationLevel(n.event_at, now);
    const nm = n.member_id
      ? input.members.find((m) => m.id === n.member_id)?.full_name ?? "Familiar"
      : "Familia";
    rawAlerts.push({
      id: `notif-${n.id}`,
      domain: dom,
      level: lvl,
      message: n.title + (n.body?.trim() ? ` — ${n.body.trim()}` : ""),
      memberId: n.member_id,
      memberName: nm,
      detailHref: memberSectionHref(dom, n.member_id),
      actions: [
        {
          id: "read",
          type: "mark_notification_read",
          label: "Marcar leída",
          entityId: n.id,
          entityType: "notification",
          memberId: n.member_id ?? ""
        }
      ]
    });
  }

  const snoozeSet = input.snoozedAlertKeys ?? new Set<string>();
  const alerts = filterSnoozedAlerts(rawAlerts, snoozeSet);

  const globalStatus = worstLevel(alerts.map((a) => a.level));
  const summary = buildSummary(alerts);
  const naturalLanguageSummary = buildNaturalLanguageSummary(alerts);

  const criticalList = alerts
    .filter((a) => a.level === "critical")
    .sort((a, b) => levelRank(b.level) - levelRank(a.level));
  const warningList = alerts
    .filter((a) => a.level === "warning")
    .sort((a, b) => levelRank(b.level) - levelRank(a.level));

  const priorityDisplayRows = buildDisplayRows(criticalList).slice(0, 6);
  const warningDisplayRows = buildDisplayRows(warningList).slice(0, 12);

  const agendaEvents = buildAgendaEvents({
    tests: input.tests,
    tasks: input.tasks,
    vaccines: input.vaccines
  });

  const alertCount = alerts.length;

  return {
    globalStatus,
    summary,
    naturalLanguageSummary,
    priorityDisplayRows,
    warningDisplayRows,
    members: groupMemberStatuses(input.members, alerts),
    agendaEvents,
    alertCount
  };
}
