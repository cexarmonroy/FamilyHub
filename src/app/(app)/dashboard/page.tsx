import Link from "next/link";
import { MemberAvatar } from "@/components/member-avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, ClipboardList, School, Stethoscope } from "lucide-react";
import { MemberRelationBadge } from "@/components/member-relation-badge";
import { WeeklyAgendaClient } from "./weekly-agenda-client";
import { toLocalDateKey } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

function toDateRange() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { monday, sunday } = toDateRange();

  const [
    { data: tests },
    { data: tasks },
    { data: vaccines },
    { data: alerts },
    { data: members },
    { data: feedNotes }
  ] = await Promise.all([
    supabase
      .from("school_tests")
      .select("id, subject, test_at, family_members(full_name)")
      .gte("test_at", monday.toISOString())
      .lte("test_at", sunday.toISOString())
      .order("test_at", { ascending: true }),
    supabase
      .from("school_tasks")
      .select("id, title, due_at, status, family_members(full_name)")
      .gte("due_at", monday.toISOString())
      .lte("due_at", sunday.toISOString())
      .order("due_at", { ascending: true }),
    supabase
      .from("vaccines")
      .select("id, vaccine_name, next_due_at, family_members(full_name)")
      .not("next_due_at", "is", null)
      .gte("next_due_at", monday.toISOString().slice(0, 10))
      .lte("next_due_at", sunday.toISOString().slice(0, 10))
      .order("next_due_at", { ascending: true }),
    supabase
      .from("notifications")
      .select("id, title, body, event_at")
      .is("read_at", null)
      .order("event_at", { ascending: true })
      .limit(8),
    supabase
      .from("family_members")
      .select("id, full_name, relation, avatar_url")
      .order("full_name", { ascending: true })
      .limit(8),
    supabase
      .from("notifications")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(6)
  ]);

  const weeklyEvents = [
    ...(tests ?? []).map((item) => ({
      id: `test-${item.id}`,
      title: `Prueba: ${item.subject}`,
      at: new Date(item.test_at),
      tone: "border border-fh-primary-container/35 bg-fh-primary-container/20 text-fh-on-background"
    })),
    ...(tasks ?? []).map((item) => ({
      id: `task-${item.id}`,
      title: `Tarea: ${item.title}`,
      at: new Date(item.due_at),
      tone: "border border-fh-secondary/25 bg-fh-secondary-container/40 text-fh-on-background"
    })),
    ...(vaccines ?? []).map((item) => ({
      id: `vac-${item.id}`,
      title: `Vacuna: ${item.vaccine_name}`,
      at: new Date(`${item.next_due_at}T09:00:00`),
      tone: "border border-fh-tertiary-container/50 bg-fh-tertiary-container/25 text-fh-on-background"
    }))
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  const weekStart = toLocalDateKey(monday);
  const weeklyEventsPayload = weeklyEvents.map((e) => ({
    id: e.id,
    title: e.title,
    at: e.at.toISOString(),
    tone: e.tone
  }));

  const nextTest = (tests ?? [])[0];
  const nextVaccine = (vaccines ?? [])[0];
  const nextTask = (tasks ?? []).find((t) => t.status !== "done");

  const memberName = (row: { family_members: unknown }) => {
    const m = row.family_members as { full_name?: string } | null;
    return m?.full_name?.trim() || "Familiar";
  };

  const priorityCount = (alerts?.length ?? 0) + (nextTest ? 1 : 0) + (nextVaccine ? 1 : 0);

  const upcomingHealthRows = (vaccines ?? []).slice(0, 2);
  const upcomingTasksRows = (tasks ?? []).filter((t) => t.status !== "done").slice(0, 2);

  return (
    <main className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-8">
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-fh-on-surface">Resumen de hoy</h2>
            {priorityCount > 0 ? (
              <span className="rounded-full bg-fh-secondary-container px-4 py-1 text-sm font-semibold text-fh-secondary">
                {priorityCount} alertas prioritarias
              </span>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-start gap-4 rounded-stitch-lg border-l-4 border-fh-primary bg-fh-surface-container-lowest p-6 shadow-ambient">
              <div className="rounded-xl bg-fh-primary-container p-3 text-fh-on-primary-container">
                <School className="size-6 shrink-0" strokeWidth={2} aria-hidden />
              </div>
              <div className="min-w-0">
                {nextTest ? (
                  <>
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-fh-primary">
                      Escuela · {memberName(nextTest)}
                    </p>
                    <h3 className="text-lg font-semibold text-fh-on-surface">Prueba: {nextTest.subject}</h3>
                    <p className="mt-1 text-sm text-fh-on-surface-variant">
                      {new Date(nextTest.test_at).toLocaleString("es", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-fh-primary">Escuela</p>
                    <h3 className="text-lg font-semibold text-fh-on-surface">Sin pruebas esta semana</h3>
                    <p className="mt-1 text-sm text-fh-on-surface-variant">
                      Añade fechas desde el seguimiento escolar de cada perfil.
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-stitch-lg border-l-4 border-fh-tertiary bg-fh-surface-container-lowest p-6 shadow-ambient">
              <div className="rounded-xl bg-fh-tertiary-container p-3 text-fh-on-tertiary-container">
                <Stethoscope className="size-6 shrink-0" strokeWidth={2} aria-hidden />
              </div>
              <div className="min-w-0">
                {nextVaccine ? (
                  <>
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-fh-tertiary">
                      Salud · {memberName(nextVaccine)}
                    </p>
                    <h3 className="text-lg font-semibold text-fh-on-surface">Vacuna: {nextVaccine.vaccine_name}</h3>
                    <p className="mt-1 text-sm text-fh-on-surface-variant">
                      Próxima dosis: {nextVaccine.next_due_at}
                    </p>
                  </>
                ) : nextTask ? (
                  <>
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-fh-tertiary">
                      Escuela · {memberName(nextTask)}
                    </p>
                    <h3 className="text-lg font-semibold text-fh-on-surface">Tarea: {nextTask.title}</h3>
                    <p className="mt-1 text-sm text-fh-on-surface-variant">
                      Vence {new Date(nextTask.due_at).toLocaleString("es")}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-fh-tertiary">Salud</p>
                    <h3 className="text-lg font-semibold text-fh-on-surface">Todo al día</h3>
                    <p className="mt-1 text-sm text-fh-on-surface-variant">
                      No hay vacunas ni tareas urgentes en el rango visible.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <WeeklyAgendaClient weekStart={weekStart} events={weeklyEventsPayload} />

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
                          {memberName(t)} · {new Date(t.due_at).toLocaleDateString("es")}
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
              {(members ?? []).map((member) => (
                <Link
                  key={member.id}
                  href={`/members/${member.id}`}
                  className="flex items-center gap-3 rounded-xl bg-fh-surface-container-lowest p-3 transition hover:bg-white"
                >
                  <MemberAvatar
                    fullName={member.full_name}
                    avatarUrl={member.avatar_url}
                    size="sm"
                    ringClassName="ring-2 ring-fh-primary-container/40"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fh-on-surface">{member.full_name}</p>
                    <MemberRelationBadge memberId={member.id} relation={member.relation} />
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-fh-line" />
                </Link>
              ))}
              {!members?.length ? (
                <p className="text-sm text-fh-on-surface-variant">Añade familiares desde Perfiles.</p>
              ) : null}
            </div>
          </div>
        </div>

        {(alerts ?? []).length > 0 ? (
          <div className="rounded-stitch-lg bg-fh-surface-container-lowest p-5 shadow-ambient-soft">
            <h4 className="mb-3 text-sm font-bold text-fh-on-surface">Notificaciones activas</h4>
            <ul className="space-y-2 text-sm">
              {(alerts ?? []).slice(0, 4).map((n) => (
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
