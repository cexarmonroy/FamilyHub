import Link from "next/link";
import { MemberRelationBadge } from "@/components/member-relation-badge";
import { createMember } from "./actions";
import { createClient } from "@/lib/supabase/server";

export default async function MembersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("family_members")
    .select("id, full_name, relation, birth_date")
    .order("full_name");

  return (
    <main className="grid gap-4 lg:grid-cols-2">
      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Nuevo integrante</h2>
        <form action={createMember} className="space-y-2">
          <input className="input" name="full_name" placeholder="Nombre completo" required />
          <input className="input" name="birth_date" type="date" />
          <input className="input" name="relation" placeholder="Relación (hijo/a, padre, etc.)" required />
          <textarea className="input" name="notes" placeholder="Notas" />
          <button className="button" type="submit">Guardar perfil</button>
        </form>
      </section>
      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Perfiles familiares</h2>
        <div className="space-y-2">
          {(data ?? []).map((member) => (
            <div key={member.id} className="rounded border border-slate-200 p-3">
              <p className="font-medium">{member.full_name}</p>
              <MemberRelationBadge memberId={member.id} relation={member.relation} />
              <div className="mt-2 flex gap-2">
                <Link className="button-secondary" href={`/members/${member.id}/health`}>Salud</Link>
                <Link className="button-secondary" href={`/members/${member.id}/school`}>Escolar</Link>
              </div>
            </div>
          ))}
          {!data?.length ? <p className="text-sm text-slate-500">No hay integrantes todavía.</p> : null}
        </div>
      </section>
    </main>
  );
}
