import Link from "next/link";
import { MemberAvatar } from "@/components/member-avatar";
import { formatDistanceToNow } from "date-fns";
import { startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, ClipboardList, School, Stethoscope } from "lucide-react";
import { MemberRelationBadge } from "@/components/member-relation-badge";
import { DashboardAlertRowsClient } from "./dashboard-alert-rows-client";
import { WeeklyAgendaClient } from "./weekly-agenda-client";
import { formatAppDate, toLocalDateKey } from "@/lib/dates";
import { buildDashboardState, type RawChronicMedication } from "@/lib/alerts/engine";
import type { AlertLevel } from "@/lib/alerts/types";
import { createClient } from "@/lib/supabase/server";

/** Ventana móvil: hoy (00:00) … hoy+6 (23:59:59), para alinear datos y cinta con “desde hoy”. */
function toRollingSevenDayRange() {
  const rangeStart = startOfDay(new Date());
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 6);
  rangeEnd.setHours(23, 59, 59, 999);
  return { rangeStart, rangeEnd };
}

function globalStatusCopy(status: AlertLevel): { text: string; className: string } {
  if (status === "critical") return { text: "Acciones urgentes", className: "text-red-600" };
  if (status === "warning") return { text: "Atención en los próximos días", className: "text-amber-600" };
  return { text: "Todo en orden", className: "text-emerald-600" };
}

function memberStatusDotClass(status: AlertLevel): string {
  if (status === "critical") return "bg-red-500";
  if (status === "warning") return "bg-amber-500";
  return "bg-emerald-500";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser }
  } = await supabase.auth.getUser();
  const { rangeStart, rangeEnd } = toRollingSevenDayRange();
  const rangeStartYmd = toLocalDateKey(rangeStart);
  const rangeEndYmd = toLocalDateKey(rangeEnd);
  const todayStr = toLocalDateKey(new Date());

  const [
    { data: tests },
    { data: tasks },
    { data: vaccines },
    { data: unreadNotifications },
    { data: visitCourses },
    { data: members },
    { data: feedNotes },
    { data: snoozeRows }
  ] = await Promise.all([
    supabase
      .from("school_tests")
      .select("id, member_id, subject, test_at, completed_at, family_members(full_name)")
      .gte("test_at", rangeStart.toISOString())
      .lte("test_at", rangeEnd.toISOString())
      .order("test_at", { ascending: true }),
    supabase
      .from("school_tasks")
      .select("id, member_id, title, due_at, status, family_members(full_name)")
      .gte("due_at", rangeStart.toISOString())
      .lte("due_at", rangeEnd.toISOString())
      .order("due_at", { ascending: true }),
    supabase
      .from("vaccines")
      .select("id, member_id, vaccine_name, next_due_at, applied_at, family_members(full_name)")
      .not("next_due_at", "is", null)
      .gte("next_due_at", rangeStartYmd)
      .lte("next_due_at", rangeEndYmd)
      .order("next_due_at", { ascending: true }),
    supabase
      .from("notifications")
      .select("id, title, body, event_at, type, member_id")
      .is("read_at", null)
      .order("event_at", { ascending: true })
      .limit(8),
    supabase
      .from("visit_medication_courses")
      .select("id, medication_name, treatment_start, treatment_end, member_id, family_members(full_name)")
      .lte("treatment_start", todayStr)
      .gte("treatment_end", todayStr),
    supabase
      .from("family_members")
      .select("id, full_name, relation, avatar_url")
      .order("full_name", { ascending: true })
      .limit(8),
    supabase
      .from("notifications")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    authUser
      ? supabase
          .from("dashboard_alert_snoozes")
          .select("alert_key")
          .gt("snoozed_until", new Date().toISOString())
      : Promise.resolve({ data: [] as { alert_key: string }[] })
  ]);

  const memberRows = members ?? [];
  const memberIds = memberRows.map((m) => m.id);

  const { data: chronicMeds } =
    memberIds.length > 0
      ? await supabase
          .from("medications")
          .select("id, member_id, name, family_members(full_name)")
          .in("member_id", memberIds)
          .eq("active", true)
      : { data: [] as RawChronicMedication[] };

  const chronicIds = (chronicMeds ?? []).map((m) => m.id);
  const { data: chronicLogRows } =
    chronicIds.length > 0
      ? await supabase
          .from("chronic_medication_logs")
          .select("medication_id")
          .in("medication_id", chronicIds)
          .eq("logged_on", todayStr)
      : { data: [] as { medication_id: string }[] };

  const { data: chronicLogHistory } =
    chronicIds.length > 0
      ? await supabase.from("chronic_medication_logs").select("medication_id, logged_on").in("medication_id", chronicIds)
      : { data: [] as { medication_id: string; logged_on: string }[] };

  const chronicLastLogYmdByMedicationId: Record<string, string | null> = {};
  for (const row of chronicLogHistory ?? []) {
    const cur = chronicLastLogYmdByMedicationId[row.medication_id];
    if (!cur || row.logged_on > cur) {
      chronicLastLogYmdByMedicationId[row.medication_id] = row.logged_on;
    }
  }

  const loggedChronic = new Set((chronicLogRows ?? []).map((r) => r.medication_id));
  const chronicPending = (chronicMeds ?? []).filter((m) => !loggedChronic.has(m.id)) as RawChronicMedication[];

  const snoozedKeys = new Set((snoozeRows ?? []).map((r) => r.alert_key));

  const dash = buildDashboardState({
    rangeStart,
    rangeEnd,
    tests: tests ?? [],
    tasks: tasks ?? [],
    vaccines: (vaccines ?? []).map((v) => ({
      ...v,
      applied_at: v.applied_at ?? null
    })),
    visitCourses: visitCourses ?? [],
    notifications: (unreadNotifications ?? []).map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      event_at: n.event_at,
      type: n.type ?? "info",
      member_id: n.member_id
    })),
    members: memberRows.map((m) => ({
      id: m.id,
      full_name: m.full_name,
      relation: m.relation
    })),
    chronicMedicationsWithoutLogToday: chronicPending,
    chronicLastLogYmdByMedicationId,
    snoozedAlertKeys: snoozedKeys
  });

  const agendaWindowStart = rangeStartYmd;
  const weeklyEventsPayload = dash.agendaEvents;

  const memberName = (row: { family_members: unknown }) => {
    const m = row.family_members as { full_name?: string } | { full_name?: string }[] | null;
    const o = Array.isArray(m) ? m[0] : m;
    return o?.full_name?.trim() || "Familiar";
  };

  const upcomingHealthRows = (vaccines ?? []).slice(0, 2);
  const upcomingTasksRows = (tasks ?? []).filter((t) => t.status !== "done").slice(0, 2);

  const header = globalStatusCopy(dash.globalStatus);

  return (
    <main className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-8">
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-fh-on-surface">Resumen de hoy</h2>
              <p className={`mt-1 text-sm font-semibold ${header.className}`}>{header.text}</p>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fh-on-surface-variant">
                {dash.naturalLanguageSummary}
              </p>
            </div>
            {dash.alertCount > 0 ? (
              <span className="rounded-full bg-fh-secondary-container px-4 py-1 text-sm font-semibold text-fh-secondary">
                {dash.alertCount} alertas
              </span>
            ) : null}
          </div>

          <DashboardAlertRowsClient
            rows={dash.priorityDisplayRows}
            variant="critical"
            title="Prioritarias"
          />
          <DashboardAlertRowsClient
            rows={dash.warningDisplayRows}
            variant="warning"
            title="Atención"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-start gap-4 rounded-stitch-lg border-l-4 border-fh-primary bg-fh-surface-container-lowest p-6 shadow-ambient">
              <div className="rounded-xl bg-fh-primary-container p-3 text-fh-on-primary-container">
                <School className="size-6 shrink-0" strokeWidth={2} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-fh-primary">Escuela</p>
                <h3 className="text-lg font-semibold leading-snug text-fh-on-surface">
                  {dash.summary.school.message}
                </h3>
                {dash.summary.school.detailHref ? (
                  <Link
                    href={dash.summary.school.detailHref}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-fh-primary hover:underline"
                  >
                    Ver detalle
                    <ArrowRight className="size-3.5" strokeWidth={2} aria-hidden />
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-stitch-lg border-l-4 border-fh-tertiary bg-fh-surface-container-lowest p-6 shadow-ambient">
              <div className="rounded-xl bg-fh-tertiary-container p-3 text-fh-on-tertiary-container">
                <Stethoscope className="size-6 shrink-0" strokeWidth={2} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-fh-tertiary">Salud</p>
                <h3 className="text-lg font-semibold leading-snug text-fh-on-surface">
                  {dash.summary.health.message}
                </h3>
                {dash.summary.health.detailHref ? (
                  <Link
                    href={dash.summary.health.detailHref}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-fh-tertiary hover:underline"
                  >
                    Ver detalle
                    <ArrowRight className="size-3.5" strokeWidth={2} aria-hidden />
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <WeeklyAgendaClient windowStart={agendaWindowStart} events={weeklyEventsPayload} />

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-stitch-lg bg-fh-surface-container-lowest p-6 shadow-ambient-soft">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-fh-secondary-container text-fh-secondary">
                <Stethoscope className="size-5" strokeWidth={2} />
              </div>
              <h4 className="text-lg font-bold text-fh-on-surface">Salud próxima</h4>
            </div>
            <div className="space-y-3">
              {upcomingHealthRows.length ? (
                upcomingHealthRows.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-fh-surface-container-low p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-fh-on-surface">
                        {v.vaccine_name} · {memberName(v)}
                      </p>
                      <p className="text-xs text-fh-on-surface-variant">{v.next_due_at}</p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-fh-line" strokeWidth={2} aria-hidden />
                  </div>
                ))
              ) : (
                <p className="text-sm text-fh-on-surface-variant">Sin vacunas programadas en la semana.</p>
              )}
            </div>
          </div>
          <div className="rounded-stitch-lg bg-fh-surface-container-lowest p-6 shadow-ambient-soft">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-fh-primary-container text-fh-primary">
                <ClipboardList className="size-5" strokeWidth={2} />
              </div>
              <h4 className="text-lg font-bold text-fh-on-surface">Tareas pendientes</h4>
            </div>
            <div className="space-y-3">
              {upcomingTasksRows.length ? (
                upcomingTasksRows.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-fh-surface-container-low p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={
                          t.status === "pending"
                            ? "size-2 shrink-0 rounded-full bg-fh-tertiary"
                            : "size-2 shrink-0 rounded-full bg-fh-primary"
                        }
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-fh-on-surface">{t.title}</p>
                        <p className="text-xs text-fh-on-surface-variant">
                          {memberName(t)} · {formatAppDate(t.due_at)}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-fh-line" strokeWidth={2} aria-hidden />
                  </div>
                ))
              ) : (
                <p className="text-sm text-fh-on-surface-variant">Sin tareas pendientes en la semana.</p>
              )}
            </div>
          </div>
        </section>
      </div>

      <aside className="space-y-6 lg:col-span-4">
        <div className="rounded-stitch-xl bg-fh-surface-container-low p-6 lg:sticky lg:top-24">
          <div className="mb-6 flex items-center justify-between gap-2">
            <h3 className="text-xl font-bold text-fh-on-surface">Actividad reciente</h3>
            <Link href="/notifications" className="text-sm font-bold text-fh-primary hover:underline">
              Ver todo
            </Link>
          </div>
          <div className="space-y-6">
            {(feedNotes ?? []).map((n, i) => {
              const dot =
                i % 3 === 0 ? "bg-fh-secondary" : i % 3 === 1 ? "bg-fh-primary" : "bg-fh-tertiary";
              return (
                <div
                  key={n.id}
                  className="relative border-l-2 border-fh-line-variant/20 pb-6 pl-8 last:border-0 last:pb-0"
                >
                  <div
                    className={`absolute -left-[9px] top-0 size-4 rounded-full ring-4 ring-fh-surface-container-low ${dot}`}
                  />
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-fh-line">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                  </p>
                  <p className="text-sm font-medium text-fh-on-surface">{n.title}</p>
                </div>
              );
            })}
            {!feedNotes?.length ? (
              <p className="text-sm text-fh-on-surface-variant">Aún no hay actividad registrada.</p>
            ) : null}
          </div>

          <div className="mt-8 border-t border-fh-line-variant/20 pt-8">
            <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-fh-line">Integrantes</h4>
            <div className="space-y-2">
              {memberRows.map((member) => {
                const st = dash.members.find((m) => m.id === member.id);
                return (
                  <Link
                    key={member.id}
                    href={`/members/${member.id}`}
                    className="flex items-center gap-3 rounded-xl bg-fh-surface-container-lowest p-3 transition hover:bg-white"
                  >
                    <span
                      className={`size-2 shrink-0 rounded-full ${memberStatusDotClass(st?.status ?? "ok")}`}
                      title={st?.highlight ?? undefined}
                      aria-hidden
                    />
                    <MemberAvatar
                      fullName={member.full_name}
                      avatarUrl={member.avatar_url}
                      size="sm"
                      ringClassName="ring-2 ring-fh-primary-container/40"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-fh-on-surface">{member.full_name}</p>
                      <MemberRelationBadge memberId={member.id} relation={member.relation} />
                      {st?.highlight ? (
                        <p className="mt-0.5 truncate text-[11px] text-fh-on-surface-variant">{st.highlight}</p>
                      ) : null}
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-fh-line" />
                  </Link>
                );
              })}
              {!memberRows.length ? (
                <p className="text-sm text-fh-on-surface-variant">Añade familiares desde Perfiles.</p>
              ) : null}
            </div>
          </div>
        </div>

        {(unreadNotifications ?? []).length > 0 ? (
          <div className="rounded-stitch-lg bg-fh-surface-container-lowest p-5 shadow-ambient-soft">
            <h4 className="mb-3 text-sm font-bold text-fh-on-surface">Notificaciones activas</h4>
            <ul className="space-y-2 text-sm">
              {(unreadNotifications ?? []).slice(0, 4).map((n) => (
                <li key={n.id} className="rounded-xl bg-fh-surface-container-low p-3 text-fh-on-surface">
                  <span className="font-semibold">{n.title}</span>
                  {n.body ? <p className="mt-1 text-xs text-fh-on-surface-variant">{n.body}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>
    </main>
  );
}
