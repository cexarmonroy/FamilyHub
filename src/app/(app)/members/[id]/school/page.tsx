import Link from "next/link";
import { MemberAvatar } from "@/components/member-avatar";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CalendarPlus,
  Check,
  ClipboardList,
  GraduationCap,
  Plus,
  Receipt
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { addItem, addTask, addTest } from "./actions";

function taskStatusLabel(status: string) {
  if (status === "done") return "Completado";
  if (status === "in_progress") return "En curso";
  return "Pendiente";
}

function isUrgent(dueAt: string, status: string) {
  if (status === "done") return false;
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return diff >= 0 && diff < 48 * 60 * 60 * 1000;
}

export default async function SchoolPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: actionError } = await searchParams;
  const supabase = await createClient();

  const [{ data: member }, { data: items }, { data: tests }, { data: tasks }] =
    await Promise.all([
      supabase.from("family_members").select("full_name, avatar_url").eq("id", id).single(),
      supabase.from("school_items").select("*").eq("member_id", id).order("created_at", { ascending: false }),
      supabase.from("school_tests").select("*").eq("member_id", id).order("test_at", { ascending: true }),
      supabase.from("school_tasks").select("*").eq("member_id", id).order("due_at", { ascending: true })
    ]);

  const name = member?.full_name ?? "Integrante";
  const taskList = tasks ?? [];
  const doneCount = taskList.filter((t) => t.status === "done").length;
  const progressPct = taskList.length ? Math.round((doneCount / taskList.length) * 100) : 0;

  return (
    <div className="pb-4">
      {actionError ? (
        <div
          className="mb-6 rounded-stitch-lg border border-fh-error/30 bg-fh-error-container/15 px-4 py-3 text-sm text-fh-error"
          role="alert"
        >
          <strong className="font-semibold">No se pudo guardar.</strong> {actionError}
        </div>
      ) : null}
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="flex items-center gap-4">
          <Link
            href={`/members/${id}`}
            className="group flex size-12 shrink-0 items-center justify-center rounded-full bg-fh-surface-container-low shadow-sm transition hover:bg-fh-surface-container-high active:scale-95"
            aria-label="Volver a la ficha"
          >
            <ArrowLeft
              className="size-6 text-fh-primary transition-transform group-hover:-translate-x-0.5"
              strokeWidth={2}
            />
          </Link>
          <div>
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-fh-secondary">
              Gestión académica
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-fh-on-surface md:text-4xl">Escolar · {name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-fh-line-variant/10 bg-fh-surface-container-lowest py-2 pl-2 pr-6 shadow-sm">
          <MemberAvatar
            fullName={name}
            avatarUrl={member?.avatar_url}
            size="sm"
            className="border border-fh-line-variant/15"
          />
          <div>
            <p className="text-xs font-bold text-fh-on-surface">{name}</p>
            <p className="text-[10px] text-fh-on-surface-variant">Seguimiento escolar</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Materiales */}
        <section className="flex flex-col gap-4 lg:col-span-4">
          <div className="rounded-stitch-xl border border-fh-line-variant/5 bg-fh-surface-container-lowest p-6 shadow-[0_8px_24px_rgba(45,51,56,0.04)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fh-primary-container/30 text-fh-primary">
                <BookOpen className="size-5" strokeWidth={2} aria-hidden />
              </div>
              <h2 className="text-lg font-bold text-fh-on-surface">Materiales escolares</h2>
            </div>
            <div className="space-y-4">
              {(items ?? []).map((i) => (
                <div
                  key={i.id}
                  className="group flex flex-col gap-3 rounded-lg bg-fh-surface-container-low p-4 transition-colors hover:bg-fh-surface-container-high"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-fh-on-surface">{i.item}</h3>
                      <p className="text-xs text-fh-on-surface-variant">Estado: {i.status}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-fh-primary-container px-2 py-1 text-[10px] font-bold uppercase text-fh-on-primary-container">
                      {i.quantity} {i.quantity === 1 ? "unidad" : "unidades"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-fh-on-surface-variant">
                    <CalendarDays className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                    <span>
                      {i.due_at
                        ? `Entrega: ${new Date(i.due_at + "T12:00:00").toLocaleDateString("es", {
                            day: "numeric",
                            month: "short"
                          })}`
                        : "Sin fecha límite"}
                    </span>
                  </div>
                </div>
              ))}
              {!items?.length ? (
                <p className="text-sm text-fh-on-surface-variant">Aún no hay materiales listados.</p>
              ) : null}
            </div>
            <form action={addItem} className="mt-4 space-y-3 border-t border-fh-line-variant/10 pt-4">
              <input type="hidden" name="member_id" value={id} />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input className="input" name="item" placeholder="Material" required />
                <input className="input" name="quantity" type="number" min={1} defaultValue={1} required />
                <input className="input" name="due_at" type="date" />
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-fh-line-variant/30 py-3 text-sm font-medium text-fh-on-surface-variant transition hover:border-fh-primary/40 hover:text-fh-primary"
              >
                <Plus className="size-4" strokeWidth={2.5} />
                Agregar material
              </button>
            </form>
          </div>

          <div className="relative overflow-hidden rounded-stitch-xl bg-fh-secondary-container/50 p-6">
            <div className="relative z-10">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-fh-on-secondary-container">
                Resumen
              </p>
              <h4 className="text-2xl font-black text-fh-on-secondary-container">
                {(items ?? []).length} materiales
              </h4>
              <p className="mt-1 text-[10px] italic text-fh-on-secondary-container/70">
                {(tests ?? []).length} pruebas · {taskList.length} tareas registradas
              </p>
            </div>
            <Receipt
              className="pointer-events-none absolute -bottom-4 -right-4 size-32 rotate-12 text-fh-secondary/10"
              strokeWidth={1}
              aria-hidden
            />
          </div>
        </section>

        {/* Pruebas */}
        <section className="rounded-stitch-xl border border-fh-line-variant/5 bg-fh-surface-container-lowest p-6 shadow-[0_8px_24px_rgba(45,51,56,0.04)] lg:col-span-4">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fh-tertiary-container/30 text-fh-tertiary">
              <CalendarPlus className="size-5" strokeWidth={2} aria-hidden />
            </div>
            <h2 className="text-lg font-bold text-fh-on-surface">Calendario de pruebas</h2>
          </div>
          <div className="space-y-4">
            {(tests ?? []).map((t, idx) => {
              const dt = new Date(t.test_at);
              const border = idx % 2 === 0 ? "border-fh-tertiary" : "border-fh-secondary";
              const labelColor = idx % 2 === 0 ? "text-fh-tertiary" : "text-fh-secondary";
              return (
                <div
                  key={t.id}
                  className={`relative rounded-r-lg border-l-4 ${border} bg-fh-surface-container-low p-4 pl-4`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${labelColor}`}>{t.subject}</span>
                    <span className="text-xs font-medium text-fh-on-surface-variant">
                      {dt.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <h3 className="mb-1 font-bold text-fh-on-surface">Evaluación programada</h3>
                  {t.notes ? (
                    <p className="mb-3 text-xs italic text-fh-on-surface-variant">&quot;{t.notes}&quot;</p>
                  ) : (
                    <p className="mb-3 text-xs text-fh-on-surface-variant">Sin notas adicionales.</p>
                  )}
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-3.5 text-fh-on-surface-variant" strokeWidth={2} aria-hidden />
                    <span className="text-xs font-bold capitalize text-fh-on-surface">
                      {dt.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}
                    </span>
                  </div>
                </div>
              );
            })}
            {!tests?.length ? (
              <p className="text-sm text-fh-on-surface-variant">No hay pruebas programadas.</p>
            ) : null}
          </div>
          <form action={addTest} className="mt-4 space-y-3 border-t border-fh-line-variant/10 pt-4">
            <input type="hidden" name="member_id" value={id} />
            <input className="input" name="subject" placeholder="Asignatura" required />
            <input className="input" name="test_at" type="datetime-local" required />
            <textarea className="input" name="notes" placeholder="Notas o temario" rows={2} />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-fh-tertiary py-3 text-sm font-bold text-fh-on-tertiary shadow-md transition hover:opacity-90 active:scale-[0.98]"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              Agregar prueba
            </button>
          </form>
        </section>

        {/* Tareas */}
        <section className="rounded-stitch-xl border border-fh-line-variant/5 bg-fh-surface-container-lowest p-6 shadow-[0_8px_24px_rgba(45,51,56,0.04)] lg:col-span-4">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fh-secondary-container/30 text-fh-secondary">
              <ClipboardList className="size-5" strokeWidth={2} aria-hidden />
            </div>
            <h2 className="text-lg font-bold text-fh-on-surface">Tareas y proyectos</h2>
          </div>

          <div className="mb-6 rounded-xl bg-fh-surface-container-low p-4">
            <div className="mb-2 flex justify-between text-[10px] font-bold uppercase text-fh-on-surface-variant">
              <span>Progreso</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-fh-surface-container-highest">
              <div
                className="h-full rounded-full bg-fh-secondary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            {taskList.map((t) => {
              const urgent = isUrgent(t.due_at, t.status);
              const done = t.status === "done";
              return (
                <div key={t.id} className="flex items-start gap-4 p-2">
                  <div
                    className={`mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      done
                        ? "border-fh-secondary bg-fh-secondary text-fh-on-secondary"
                        : t.status === "in_progress"
                          ? "border-fh-secondary text-fh-secondary"
                          : "border-fh-line-variant text-fh-line-variant"
                    }`}
                  >
                    {done ? <Check className="size-3.5" strokeWidth={3} /> : null}
                  </div>
                  <div className={`min-w-0 flex-1 ${done ? "" : "border-b border-fh-line-variant/10 pb-4"}`}>
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                      <h3
                        className={`text-sm font-bold ${done ? "text-fh-on-surface-variant line-through" : "text-fh-on-surface"}`}
                      >
                        {t.title}
                      </h3>
                      {urgent ? (
                        <span className="rounded bg-fh-error-container/20 px-2 py-0.5 text-[9px] font-bold text-fh-error">
                          Urgente
                        </span>
                      ) : (
                        <span className="rounded bg-fh-surface-container-high px-2 py-0.5 text-[9px] font-bold text-fh-on-surface-variant">
                          Normal
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-fh-on-surface-variant">
                        Entrega:{" "}
                        {new Date(t.due_at).toLocaleDateString("es", { day: "numeric", month: "short" })}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase ${
                          done ? "text-fh-secondary" : "text-fh-on-surface-variant"
                        }`}
                      >
                        {taskStatusLabel(t.status)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {!taskList.length ? (
              <p className="text-sm text-fh-on-surface-variant">No hay tareas registradas.</p>
            ) : null}
          </div>

          <form action={addTask} className="mt-4 space-y-3 border-t border-fh-line-variant/10 pt-4">
            <input type="hidden" name="member_id" value={id} />
            <input className="input" name="title" placeholder="Título de la tarea" required />
            <input className="input" name="due_at" type="datetime-local" required />
            <select className="input" name="status" defaultValue="pending">
              <option value="pending">Pendiente</option>
              <option value="in_progress">En curso</option>
              <option value="done">Hecha</option>
            </select>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-fh-surface-container-high py-3 text-sm font-bold text-fh-on-surface transition hover:bg-fh-surface-container-highest active:scale-[0.99]"
            >
              <GraduationCap className="size-4" strokeWidth={2} />
              Agregar tarea
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
