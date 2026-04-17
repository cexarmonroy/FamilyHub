import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  addMedication,
  addMetric,
  addVaccine,
  addVisit,
  saveHealthProfile
} from "./actions";

export default async function HealthPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: member }, { data: profile }, { data: meds }, { data: visits }, { data: vaccines }, { data: metrics }] =
    await Promise.all([
      supabase.from("family_members").select("id, full_name").eq("id", id).single(),
      supabase.from("health_profiles").select("*").eq("member_id", id).maybeSingle(),
      supabase.from("medications").select("*").eq("member_id", id).order("created_at", { ascending: false }),
      supabase.from("medical_visits").select("*").eq("member_id", id).order("visited_at", { ascending: false }),
      supabase.from("vaccines").select("*").eq("member_id", id).order("created_at", { ascending: false }),
      supabase.from("metrics").select("*").eq("member_id", id).order("measured_at", { ascending: false })
    ]);

  return (
    <main className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="min-w-0 text-lg font-semibold sm:text-xl">Salud · {member?.full_name ?? "Integrante"}</h2>
        <Link className="button-secondary w-full shrink-0 justify-center text-center sm:w-auto" href="/members">Volver</Link>
      </div>

      <section className="card">
        <h3 className="mb-2 font-semibold">Ficha clínica básica</h3>
        <form action={saveHealthProfile.bind(null, id)} className="grid gap-2 md:grid-cols-3">
          <input className="input" name="blood_type" placeholder="Grupo sanguíneo" defaultValue={profile?.blood_type ?? ""} />
          <input className="input" name="known_conditions" placeholder="Enfermedades" defaultValue={profile?.known_conditions ?? ""} />
          <input className="input" name="allergies" placeholder="Alergias" defaultValue={profile?.allergies ?? ""} />
          <button className="button md:col-span-3" type="submit">Guardar ficha</button>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card space-y-2">
          <h3 className="font-semibold">Medicación base</h3>
          <form action={addMedication.bind(null, id)} className="grid gap-2 md:grid-cols-3">
            <input className="input" name="name" placeholder="Nombre" required />
            <input className="input" name="dose" placeholder="Dosis" required />
            <input className="input" name="frequency" placeholder="Frecuencia" required />
            <button className="button md:col-span-3" type="submit">Agregar medicación</button>
          </form>
          {(meds ?? []).map((m) => <p key={m.id} className="text-sm">{m.name} · {m.dose} · {m.frequency}</p>)}
        </div>

        <div className="card space-y-2">
          <h3 className="font-semibold">Visitas médicas</h3>
          <form action={addVisit.bind(null, id)} className="grid gap-2">
            <input className="input" name="visited_at" type="datetime-local" required />
            <input className="input" name="provider" placeholder="Profesional / centro" required />
            <input className="input" name="reason" placeholder="Motivo" required />
            <textarea className="input" name="notes" placeholder="Notas" />
            <button className="button" type="submit">Agregar visita</button>
          </form>
          {(visits ?? []).slice(0, 5).map((v) => <p key={v.id} className="text-sm">{new Date(v.visited_at).toLocaleString()} · {v.reason}</p>)}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card space-y-2">
          <h3 className="font-semibold">Vacunas</h3>
          <form action={addVaccine.bind(null, id)} className="grid gap-2">
            <input className="input" name="vaccine_name" placeholder="Vacuna" required />
            <label className="text-sm">Aplicada</label>
            <input className="input" name="applied_at" type="date" />
            <label className="text-sm">Próxima dosis</label>
            <input className="input" name="next_due_at" type="date" />
            <button className="button" type="submit">Agregar vacuna</button>
          </form>
          {(vaccines ?? []).map((v) => <p key={v.id} className="text-sm">{v.vaccine_name} · próxima: {v.next_due_at ?? "N/A"}</p>)}
        </div>

        <div className="card space-y-2">
          <h3 className="font-semibold">Métricas</h3>
          <form action={addMetric.bind(null, id)} className="grid gap-2 md:grid-cols-3">
            <input className="input" name="measured_at" type="datetime-local" required />
            <input className="input" name="weight_kg" type="number" step="0.01" placeholder="Peso (kg)" required />
            <input className="input" name="height_cm" type="number" step="0.1" placeholder="Estatura (cm)" required />
            <button className="button md:col-span-3" type="submit">Agregar métrica</button>
          </form>
          {(metrics ?? []).slice(0, 8).map((m) => (
            <p key={m.id} className="text-sm">
              {new Date(m.measured_at).toLocaleDateString()} · {m.weight_kg} kg · {m.height_cm} cm
            </p>
          ))}
        </div>
      </section>
    </main>
  );
}
