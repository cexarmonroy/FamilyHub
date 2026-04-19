import {
  differenceInCalendarDays,
  differenceInHours,
  isAfter,
  isBefore,
  isWithinInterval,
  parse,
  startOfDay
} from "date-fns";
import { toLocalDateKey } from "@/lib/dates";
import type {
  AgendaEventPayload,
  AlertDomain,
  AlertLevel,
  DashboardAlert,
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
  weekStart: Date,
  weekEnd: Date
): AlertLevel | null {
  const t = new Date(testAtIso);
  if (!isAfter(t, now)) return null;
  if (!isWithinInterval(t, { start: weekStart, end: weekEnd })) return null;
  const h = differenceInHours(t, now);
  if (h <= 24) return "critical";
  return "warning";
}

function levelForTask(
  dueAtIso: string,
  status: string,
  now: Date,
  weekStart: Date,
  weekEnd: Date
): AlertLevel | null {
  if (status === "done") return null;
  const t = new Date(dueAtIso);
  if (!isWithinInterval(t, { start: weekStart, end: weekEnd })) return null;
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

function buildAgendaEvents(input: {
  tests: RawTest[];
  tasks: RawTask[];
  vaccines: RawVaccine[];
}): AgendaEventPayload[] {
  const { tests, tasks, vaccines } = input;
  const mapped: AgendaEventPayload[] = [
    ...tests.map((item) => ({
      id: `test-${item.id}`,
      title: `Prueba: ${item.subject}`,
      at: new Date(item.test_at).toISOString(),
      tone: "border border-fh-primary-container/35 bg-fh-primary-container/20 text-fh-on-background"
    })),
    ...tasks.map((item) => ({
      id: `task-${item.id}`,
      title: `Tarea: ${item.title}`,
      at: new Date(item.due_at).toISOString(),
      tone: "border border-fh-secondary/25 bg-fh-secondary-container/40 text-fh-on-background"
    })),
    ...vaccines.map((item) => ({
      id: `vac-${item.id}`,
      title: `Vacuna: ${item.vaccine_name}`,
      at: new Date(`${item.next_due_at}T09:00:00`).toISOString(),
      tone: "border border-fh-tertiary-container/50 bg-fh-tertiary-container/25 text-fh-on-background"
    }))
  ];
  mapped.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return mapped;
}

function buildSummary(alerts: DashboardAlert[]): { school: string; health: string } {
  if (alerts.length === 0) {
    return {
      school: "Semana despejada. No hay pruebas urgentes.",
      health: "Todo al día. Sin pendientes médicos destacados."
    };
  }
  const schoolAlerts = alerts
    .filter((a) => a.domain === "school")
    .sort((a, b) => levelRank(b.level) - levelRank(a.level));
  const healthAlerts = alerts
    .filter((a) => a.domain === "health")
    .sort((a, b) => levelRank(b.level) - levelRank(a.level));

  return {
    school: schoolAlerts.length ? schoolAlerts[0]!.message : "Sin novedades escolares.",
    health: healthAlerts.length ? healthAlerts[0]!.message : "Sin novedades de salud."
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
 * `warning` resto de la ventana semanal o notas/activos.
 */
export function buildDashboardState(input: {
  monday: Date;
  sunday: Date;
  now?: Date;
  tests: RawTest[];
  tasks: RawTask[];
  vaccines: RawVaccine[];
  visitCourses: RawVisitCourse[];
  notifications: RawNotification[];
  members: RawMember[];
}): DashboardState {
  const now = input.now ?? new Date();
  const weekStart = startOfDay(input.monday);
  const weekEnd = input.sunday;
  const alerts: DashboardAlert[] = [];

  const todayKey = toLocalDateKey(now);
  const today = parseLocalDate(todayKey);

  for (const t of input.tests) {
    const lvl = levelForSchoolTest(t.test_at, now, weekStart, weekEnd);
    if (!lvl) continue;
    alerts.push({
      id: `school-test-${t.id}`,
      domain: "school",
      level: lvl,
      message: `Prueba: ${t.subject} · ${memberName(t)}`,
      memberId: t.member_id,
      memberName: memberName(t)
    });
  }

  for (const task of input.tasks) {
    const lvl = levelForTask(task.due_at, task.status, now, weekStart, weekEnd);
    if (!lvl) continue;
    alerts.push({
      id: `school-task-${task.id}`,
      domain: "school",
      level: lvl,
      message: `Tarea: ${task.title} · ${memberName(task)}`,
      memberId: task.member_id,
      memberName: memberName(task)
    });
  }

  for (const v of input.vaccines) {
    if (!v.next_due_at) continue;
    const lvl = levelForVaccineDate(v.next_due_at, today);
    if (!lvl) continue;
    alerts.push({
      id: `health-vac-${v.id}`,
      domain: "health",
      level: lvl,
      message: `Vacuna: ${v.vaccine_name} · ${memberName(v)}`,
      memberId: v.member_id,
      memberName: memberName(v)
    });
  }

  for (const c of input.visitCourses) {
    const lvl = levelForVisitCourse(c.treatment_start, c.treatment_end, today);
    if (!lvl) continue;
    const name = memberName(c);
    const lastDay = c.treatment_end === todayKey;
    alerts.push({
      id: `health-course-${c.id}`,
      domain: "health",
      level: lvl,
      message: lastDay
        ? `Último día de ${c.medication_name} · ${name}`
        : `Tratamiento activo: ${c.medication_name} · ${name}`,
      memberId: c.member_id,
      memberName: name
    });
  }

  for (const n of input.notifications) {
    const dom = notificationDomain(n.type);
    const lvl = notificationLevel(n.event_at, now);
    alerts.push({
      id: `notif-${n.id}`,
      domain: dom,
      level: lvl,
      message: n.title + (n.body?.trim() ? ` — ${n.body.trim()}` : ""),
      memberId: n.member_id,
      memberName: n.member_id
        ? input.members.find((m) => m.id === n.member_id)?.full_name ?? "Familiar"
        : "Familia"
    });
  }

  const globalStatus = worstLevel(alerts.map((a) => a.level));
  const summary = buildSummary(alerts);
  const priorityAlerts = alerts
    .filter((a) => a.level === "critical")
    .sort((a, b) => levelRank(b.level) - levelRank(a.level))
    .slice(0, 2);

  const agendaEvents = buildAgendaEvents({
    tests: input.tests,
    tasks: input.tasks,
    vaccines: input.vaccines
  });

  const alertCount = alerts.length;

  return {
    globalStatus,
    summary,
    priorityAlerts,
    members: groupMemberStatuses(input.members, alerts),
    agendaEvents,
    alertCount
  };
}
