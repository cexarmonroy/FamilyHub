import Link from "next/link";
import { MemberAvatar } from "@/components/member-avatar";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Pill,
  Plus,
  Ruler,
  Stethoscope,
  Syringe
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  addMedication,
  addMetric,
  addVaccine,
  addVisit,
  saveHealthProfile
} from "./actions";

function vaccineStatus(v: {
  applied_at: string | null;
  next_due_at: string | null;
}): { label: string; variant: "done" | "scheduled" | "unknown" } {
  if (v.applied_at) return { label: "Aplicada", variant: "done" };
  if (v.next_due_at) {
    const d = new Date(v.next_due_at + "T12:00:00");
    if (!Number.isNaN(d.getTime())) {
      return { label: "Programada", variant: "scheduled" };
    }
  }
  return { label: "Sin fecha", variant: "unknown" };
}

function visitMonthDay(iso: string) {
  const d = new Date(iso);
  return {
    mon: d.toLocaleString("es", { month: "short" }).replace(".", ""),
    day: d.getDate().toString()
  };
}

export default async function HealthPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: member }, { data: profile }, { data: meds }, { data: visits }, { data: vaccines }, { data: metrics }] =
    await Promise.all([
      supabase.from("family_members").select("id, full_name, avatar_url").eq("id", id).single(),
      supabase.from("health_profiles").select("*").eq("member_id", id).maybeSingle(),
      supabase.from("medications").select("*").eq("member_id", id).order("created_at", { ascending: false }),
      supabase.from("medical_visits").select("*").eq("member_id", id).order("visited_at", { ascending: false }),
      supabase.from("vaccines").select("*").eq("member_id", id).order("created_at", { ascending: false }),
      supabase.from("metrics").select("*").eq("member_id", id).order("measured_at", { ascending: false })
    ]);

  const name = member?.full_name ?? "Integrante";
  const latest = (metrics ?? [])[0];

  return (
    <div className="pb-4">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-fh-line-variant/15 pb-6">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <Link
            href={`/members/${id}`}
            className="mt-0.5 shrink-0 rounded-full p-2 text-fh-primary transition hover:bg-fh-surface-container-low active:scale-95"
            aria-label="Volver a la ficha"
          >
            <ArrowLeft className="size-6" strokeWidth={2} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight text-fh-primary sm:text-2xl">Salud · {name}</h1>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-fh-on-surface-variant">
              Perfil clínico digital
            </p>
          </div>
        </div>
        <MemberAvatar
          fullName={name}
          avatarUrl={member?.avatar_url}
          size="sm"
          className="border-2 border-fh-primary-container"
        />
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Columna izquierda: ficha + métricas (maqueta Amélie) */}
        <div className="space-y-6 md:col-span-4">
          <section className="space-y-6 rounded-stitch-lg bg-fh-surface-container-lowest p-6 shadow-ambient-soft">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-fh-primary">
                <ClipboardList className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                Ficha clínica
              </h2>
            </div>
            <form action={saveHealthProfile.bind(null, id)} className="space-y-4">
              <div className="rounded-lg bg-fh-surface-container-low p-4">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-fh-on-surface-variant">
                  Grupo sanguíneo
                </label>
                <input
                  className="w-full border-0 bg-transparent text-lg font-extrabold text-fh-tertiary outline-none ring-0 placeholder:text-fh-line focus:ring-0"
                  name="blood_type"
                  placeholder="Ej. A+ (positivo)"
                  defaultValue={profile?.blood_type ?? ""}
                />
              </div>
              <div className="rounded-lg bg-fh-surface-container-low p-4">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-fh-on-surface-variant">
                  Enfermedades
                </label>
                <textarea
                  className="min-h-[3rem] w-full resize-none border-0 bg-transparent text-sm font-medium text-fh-on-surface outline-none ring-0 placeholder:text-fh-on-surface-variant focus:ring-0"
                  name="known_conditions"
                  placeholder="Ninguna crónica registrada"
                  defaultValue={profile?.known_conditions ?? ""}
                />
              </div>
              <div className="rounded-lg border-l-4 border-fh-tertiary bg-fh-surface-container-low p-4">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-fh-on-surface-variant">
                  Alergias
                </label>
                <input
                  className="w-full border-0 bg-transparent text-sm font-medium text-fh-on-surface outline-none ring-0 placeholder:text-fh-on-surface-variant focus:ring-0"
                  name="allergies"
                  placeholder="Ej. Rinitis alérgica"
                  defaultValue={profile?.allergies ?? ""}
                />
                {profile?.allergies?.trim() ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-fh-tertiary-container px-3 py-1 text-xs font-bold uppercase tracking-tight text-fh-on-tertiary-container">
                      {profile.allergies.trim()}
                    </span>
                  </div>
                ) : null}
              </div>
              <button className="button w-full py-4 text-base shadow-md" type="submit">
                Guardar ficha
              </button>
            </form>
          </section>

          <section className="relative overflow-hidden rounded-stitch-lg bg-fh-primary p-6 text-fh-on-primary shadow-ambient-soft">
            <div className="pointer-events-none absolute -right-4 -top-4 opacity-10" aria-hidden>
              <Activity className="size-[7.5rem]" strokeWidth={1} />
            </div>
            <div className="relative z-10 space-y-6">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <span className="inline-flex rounded-lg bg-white/15 p-1" aria-hidden>
                  <Ruler className="size-5" strokeWidth={2} />
                </span>
                Métricas
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-white/10 p-4 backdrop-blur-md">
                  <span className="mb-1 block text-xs font-medium opacity-85">Peso actual</span>
                  <div className="text-2xl font-black">
                    {latest?.weight_kg != null ? (
                      <>
                        {latest.weight_kg} <span className="text-sm font-normal">kg</span>
                      </>
                    ) : (
                      <span className="text-lg font-bold opacity-80">—</span>
                    )}
                  </div>
                </div>
                <div className="rounded-lg bg-white/10 p-4 backdrop-blur-md">
                  <span className="mb-1 block text-xs font-medium opacity-85">Estatura</span>
                  <div className="text-2xl font-black">
                    {latest?.height_cm != null ? (
                      <>
                        {latest.height_cm} <span className="text-sm font-normal">cm</span>
                      </>
                    ) : (
                      <span className="text-lg font-bold opacity-80">—</span>
                    )}
                  </div>
                </div>
              </div>
              <form action={addMetric.bind(null, id)} className="space-y-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input
                    className="rounded-xl border-0 bg-white/15 px-3 py-2.5 text-sm text-fh-on-primary placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                    name="measured_at"
                    type="datetime-local"
                    required
                  />
                  <input
                    className="rounded-xl border-0 bg-white/15 px-3 py-2.5 text-sm text-fh-on-primary placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                    name="weight_kg"
                    type="number"
                    step="0.01"
                    placeholder="Peso (kg)"
                    required
                  />
                  <input
                    className="rounded-xl border-0 bg-white/15 px-3 py-2.5 text-sm text-fh-on-primary placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                    name="height_cm"
                    type="number"
                    step="0.1"
                    placeholder="Estatura (cm)"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-fh-primary transition hover:bg-fh-surface-container-lowest"
                >
                  <Plus className="size-4" strokeWidth={2.5} />
                  Agregar métrica
                </button>
              </form>
            </div>
          </section>
        </div>

        {/* Columna derecha: medicación, vacunas, visitas */}
        <div className="space-y-6 md:col-span-8">
          <section className="rounded-stitch-lg bg-fh-surface-container-lowest p-6 shadow-ambient-soft">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-fh-primary">
                <Pill className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                Medicación base
              </h2>
              <a
                href="#add-medication"
                className="flex items-center gap-1 text-sm font-bold text-fh-primary hover:underline"
              >
                <Plus className="size-4" strokeWidth={2.5} />
                Agregar
              </a>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(meds ?? []).map((m) => (
                <div
                  key={m.id}
                  className="group flex items-start gap-4 rounded-lg bg-fh-surface-container-low p-4 transition-colors duration-300 hover:bg-fh-secondary-container/50"
                >
                  <div className="rounded-full bg-white p-3 text-fh-secondary shadow-sm">
                    <Pill className="size-5" strokeWidth={2} aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-fh-on-surface">{m.name}</h3>
                    <p className="text-xs text-fh-on-surface-variant">
                      {m.dose} · {m.frequency}
                    </p>
                    {m.active ? (
                      <span className="mt-2 inline-block rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-fh-secondary">
                        Activa
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
              {!meds?.length ? (
                <p className="col-span-full text-sm text-fh-on-surface-variant">Sin medicación registrada.</p>
              ) : null}
            </div>
            <form
              id="add-medication"
              action={addMedication.bind(null, id)}
              className="mt-6 space-y-3 border-t border-fh-line-variant/15 pt-6"
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input className="input" name="name" placeholder="Nombre" required />
                <input className="input" name="dose" placeholder="Dosis" required />
                <input className="input" name="frequency" placeholder="Frecuencia" required />
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-fh-line-variant/40 py-3 text-sm font-bold text-fh-line transition hover:border-fh-primary hover:text-fh-primary"
              >
                <Plus className="size-4" strokeWidth={2.5} />
                Registrar medicación
              </button>
            </form>
          </section>

          <section className="rounded-stitch-lg bg-fh-surface-container-lowest p-6 shadow-ambient-soft">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-fh-primary">
                <Syringe className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                Historial de vacunación
              </h2>
              <span
                className="cursor-not-allowed rounded-full bg-fh-surface-container-high px-4 py-2 text-xs font-bold text-fh-on-surface-variant opacity-70"
                title="Próximamente"
              >
                Descargar carnet (PDF)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-3 text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-wider text-fh-on-surface-variant">
                    <th className="px-4 pb-2">Vacuna</th>
                    <th className="px-4 pb-2">Notas</th>
                    <th className="px-4 pb-2">Fecha</th>
                    <th className="px-4 pb-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {(vaccines ?? []).map((v) => {
                    const st = vaccineStatus(v);
                    return (
                      <tr
                        key={v.id}
                        className="bg-fh-surface-container-low transition-transform hover:scale-[1.01]"
                      >
                        <td className="rounded-l-lg px-4 py-4">
                          <div className={st.variant === "scheduled" ? "font-bold text-fh-tertiary" : "font-bold"}>
                            {v.vaccine_name}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-fh-on-surface-variant">
                          {v.notes?.trim() || "—"}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {v.applied_at?.slice(0, 10) ?? v.next_due_at ?? "—"}
                        </td>
                        <td className="rounded-r-lg px-4 py-4">
                          {st.variant === "done" ? (
                            <span className="flex items-center gap-1 text-xs font-bold uppercase text-emerald-600">
                              <CheckCircle2 className="size-3.5 shrink-0" />
                              {st.label}
                            </span>
                          ) : st.variant === "scheduled" ? (
                            <span className="flex items-center gap-1 text-xs font-bold uppercase text-fh-tertiary">
                              <Clock className="size-3.5 shrink-0" />
                              {st.label}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-fh-on-surface-variant">{st.label}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!vaccines?.length ? (
              <p className="text-sm text-fh-on-surface-variant">Sin vacunas registradas.</p>
            ) : null}
            <form action={addVaccine.bind(null, id)} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input className="input" name="vaccine_name" placeholder="Vacuna" required />
                <input className="input" name="applied_at" type="date" />
                <input className="input" name="next_due_at" type="date" />
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-fh-line-variant/40 py-3 text-sm font-bold text-fh-line transition hover:border-fh-primary hover:text-fh-primary"
              >
                <Plus className="size-4" strokeWidth={2.5} />
                Agregar vacuna
              </button>
            </form>
          </section>

          <section className="rounded-stitch-lg bg-fh-surface-container-high/30 p-6 shadow-ambient-soft">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-fh-primary">
                <Stethoscope className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                Visitas médicas
              </h2>
            </div>
            <div className="space-y-3">
              {(visits ?? []).map((v) => {
                const { mon, day } = visitMonthDay(v.visited_at);
                return (
                  <div
                    key={v.id}
                    className="flex cursor-default items-center justify-between gap-3 rounded-lg border border-transparent bg-white p-4 transition hover:border-fh-primary/25"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="shrink-0 rounded-md bg-fh-surface-container-low px-3 py-1 text-center">
                        <span className="block text-[10px] font-bold uppercase text-fh-on-surface-variant">{mon}</span>
                        <span className="text-lg font-black text-fh-primary">{day}</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-fh-on-surface">{v.reason}</h4>
                        <p className="text-xs text-fh-on-surface-variant">
                          {v.provider}
                          {v.notes ? ` · ${v.notes}` : ""}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-fh-line" aria-hidden />
                  </div>
                );
              })}
              {!visits?.length ? (
                <p className="text-sm text-fh-on-surface-variant">Sin visitas registradas.</p>
              ) : null}
            </div>
            <form action={addVisit.bind(null, id)} className="mt-4 space-y-3">
              <input className="input bg-white" name="visited_at" type="datetime-local" required />
              <input className="input bg-white" name="provider" placeholder="Profesional / centro" required />
              <input className="input bg-white" name="reason" placeholder="Motivo" required />
              <textarea className="input bg-white" name="notes" placeholder="Notas" />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-fh-secondary py-4 text-sm font-bold text-fh-on-secondary shadow-md transition hover:opacity-95 active:scale-[0.99]"
              >
                <Plus className="size-5" strokeWidth={2.5} />
                Agregar visita
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
