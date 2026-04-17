import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addItem, addTask, addTest } from "./actions";

export default async function SchoolPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: member }, { data: items }, { data: tests }, { data: tasks }] =
    await Promise.all([
      supabase.from("family_members").select("full_name").eq("id", id).single(),
      supabase.from("school_items").select("*").eq("member_id", id).order("created_at", { ascending: false }),
      supabase.from("school_tests").select("*").eq("member_id", id).order("test_at", { ascending: true }),
      supabase.from("school_tasks").select("*").eq("member_id", id).order("due_at", { ascending: true })
    ]);

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Escolar · {member?.full_name ?? "Integrante"}</h2>
        <Link className="button-secondary" href="/members">Volver</Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card space-y-2">
          <h3 className="font-semibold">Materiales</h3>
          <form action={addItem.bind(null, id)} className="space-y-2">
            <input className="input" name="item" placeholder="Material" required />
            <input className="input" name="quantity" type="number" min={1} defaultValue={1} required />
            <input className="input" name="due_at" type="date" />
            <button className="button" type="submit">Agregar</button>
          </form>
          {(items ?? []).map((i) => <p key={i.id} className="text-sm">{i.item} x{i.quantity} ({i.status})</p>)}
        </div>

        <div className="card space-y-2">
          <h3 className="font-semibold">Calendario de pruebas</h3>
          <form action={addTest.bind(null, id)} className="space-y-2">
            <input className="input" name="subject" placeholder="Asignatura" required />
            <input className="input" name="test_at" type="datetime-local" required />
            <textarea className="input" name="notes" placeholder="Notas" />
            <button className="button" type="submit">Agregar prueba</button>
          </form>
          {(tests ?? []).map((t) => <p key={t.id} className="text-sm">{new Date(t.test_at).toLocaleString()} · {t.subject}</p>)}
        </div>

        <div className="card space-y-2">
          <h3 className="font-semibold">Tareas</h3>
          <form action={addTask.bind(null, id)} className="space-y-2">
            <input className="input" name="title" placeholder="Título" required />
            <input className="input" name="due_at" type="datetime-local" required />
            <select className="input" name="status" defaultValue="pending">
              <option value="pending">Pendiente</option>
              <option value="in_progress">En progreso</option>
              <option value="done">Hecha</option>
            </select>
            <button className="button" type="submit">Agregar tarea</button>
          </form>
          {(tasks ?? []).map((t) => <p key={t.id} className="text-sm">{t.title} · {t.status}</p>)}
        </div>
      </section>
    </main>
  );
}
