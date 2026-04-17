import Link from "next/link";
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
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().slice(0, 10);

  const [
    { data: tests },
    { data: tasks },
    { data: vaccines },
    { data: alerts },
    { data: members }
  ] =
    await Promise.all([
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
        .select("id, full_name, relation")
        .order("full_name", { ascending: true })
        .limit(6)
    ]);

  const tomorrowAlerts = [
    ...(tests ?? []).filter((t) => String(t.test_at).slice(0, 10) === tomorrowDate).map((t) => `Mañana: prueba de ${t.subject}`),
    ...(tasks ?? []).filter((t) => String(t.due_at).slice(0, 10) === tomorrowDate && t.status !== "done").map((t) => `Mañana vence tarea: ${t.title}`)
  ];

  const weeklyEvents = [
    ...(tests ?? []).map((item) => ({
      id: `test-${item.id}`,
      title: `Prueba: ${item.subject}`,
      at: new Date(item.test_at),
      tone: "border-blue-200 bg-blue-50 text-blue-900"
    })),
    ...(tasks ?? []).map((item) => ({
      id: `task-${item.id}`,
      title: `Tarea: ${item.title}`,
      at: new Date(item.due_at),
      tone: "border-amber-200 bg-amber-50 text-amber-900"
    })),
    ...(vaccines ?? []).map((item) => ({
      id: `vac-${item.id}`,
      title: `Vacuna: ${item.vaccine_name}`,
      at: new Date(`${item.next_due_at}T09:00:00`),
      tone: "border-emerald-200 bg-emerald-50 text-emerald-900"
    }))
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  const weekStart = toLocalDateKey(monday);
  const weeklyEventsPayload = weeklyEvents.map((e) => ({
    id: e.id,
    title: e.title,
    at: e.at.toISOString(),
    tone: e.tone
  }));

  return (
    <main className="grid min-w-0 grid-cols-12 gap-4">
      <section className="col-span-12 space-y-4 lg:col-span-8">
        <WeeklyAgendaClient weekStart={weekStart} events={weeklyEventsPayload} />
      </section>

      <section className="col-span-12 space-y-4 lg:col-span-4">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Integrantes</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {(members ?? []).map((member) => (
              <Link
                key={member.id}
                href={`/members/${member.id}`}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-2 transition hover:border-red-300 hover:bg-red-50/60"
              >
                <div className="h-10 w-10 rounded-full bg-slate-200" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium hover:text-red-700">{member.full_name}</p>
                  <MemberRelationBadge memberId={member.id} relation={member.relation} />
                </div>
              </Link>
            ))}
            {!members?.length ? <p className="text-sm text-slate-500">Sin integrantes.</p> : null}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Próximas fechas</h2>
          <div className="space-y-2 text-sm">
            {(tests ?? []).slice(0, 3).map((t) => (
              <p key={t.id}>🎒 {new Date(t.test_at).toLocaleDateString()} · {t.subject}</p>
            ))}
            {(vaccines ?? []).slice(0, 3).map((v) => (
              <p key={v.id}>🏥 {v.next_due_at} · {v.vaccine_name}</p>
            ))}
            {!tests?.length && !vaccines?.length ? <p className="text-slate-500">Sin próximas fechas.</p> : null}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Notificaciones</h2>
          <ul className="space-y-2 text-sm">
            {tomorrowAlerts.slice(0, 3).map((a, i) => (
              <li key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-800">
                {a}
              </li>
            ))}
            {(alerts ?? []).slice(0, 3).map((n) => (
              <li key={n.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-800">
                {n.title}
              </li>
            ))}
            {!tomorrowAlerts.length && !alerts?.length ? (
              <li className="text-slate-500">Sin notificaciones activas.</li>
            ) : null}
          </ul>
        </div>
      </section>
    </main>
  );
}
