import Link from "next/link";
import { notFound } from "next/navigation";
import { MemberAvatar } from "@/components/member-avatar";
import { formatAppDateTime } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

function getAge(birthDate: string | null) {
  if (!birthDate) return null;
  const dob = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export default async function MemberDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: member },
    { data: profile },
    { data: meds },
    { data: tests },
    { data: tasks },
    { data: vaccines }
  ] = await Promise.all([
    supabase
      .from("family_members")
      .select("id, full_name, relation, birth_date, notes, avatar_url")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("health_profiles")
      .select("blood_type, known_conditions, allergies")
      .eq("member_id", id)
      .maybeSingle(),
    supabase
      .from("medications")
      .select("id, name, dose, frequency, active")
      .eq("member_id", id)
      .eq("active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("school_tests")
      .select("id, subject, test_at")
      .eq("member_id", id)
      .gte("test_at", new Date().toISOString())
      .order("test_at", { ascending: true })
      .limit(5),
    supabase
      .from("school_tasks")
      .select("id, title, due_at, status")
      .eq("member_id", id)
      .neq("status", "done")
      .order("due_at", { ascending: true })
      .limit(5),
    supabase
      .from("vaccines")
      .select("id, vaccine_name, next_due_at")
      .eq("member_id", id)
      .not("next_due_at", "is", null)
      .gte("next_due_at", new Date().toISOString().slice(0, 10))
      .order("next_due_at", { ascending: true })
      .limit(5)
  ]);

  if (!member) notFound();
  const age = getAge(member.birth_date);

  return (
    <main className="space-y-6">
      <div className="card flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-center gap-4">
          <MemberAvatar
            fullName={member.full_name}
            avatarUrl={member.avatar_url}
            size="lg"
            ringClassName="ring-4 ring-fh-primary-container/50"
          />
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-fh-on-surface sm:text-2xl">{member.full_name}</h2>
            <p className="text-sm text-fh-on-surface-variant">
              {member.relation}
              {age !== null ? ` · ${age} años` : ""}
            </p>
          </div>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <Link className="button-secondary w-full justify-center text-center sm:w-auto" href={`/members/${id}/health`}>
            Ver salud
          </Link>
          <Link className="button-secondary w-full justify-center text-center sm:w-auto" href={`/members/${id}/school`}>
            Ver escolar
          </Link>
          <Link className="button-secondary w-full justify-center text-center sm:w-auto" href="/members">
            Volver a perfiles
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card space-y-2">
          <h3 className="font-bold text-fh-on-surface">Ficha rápida</h3>
          <p className="text-sm">
            <span className="text-fh-line">Grupo sanguíneo:</span>{" "}
            {profile?.blood_type ?? "No definido"}
          </p>
          <p className="text-sm">
            <span className="text-fh-line">Enfermedades:</span>{" "}
            {profile?.known_conditions ?? "No definido"}
          </p>
          <p className="text-sm">
            <span className="text-fh-line">Alergias:</span>{" "}
            {profile?.allergies ?? "No definido"}
          </p>
          <p className="text-sm">
            <span className="text-fh-line">Notas:</span>{" "}
            {member.notes ?? "Sin notas"}
          </p>
        </section>

        <section className="card space-y-2">
          <h3 className="font-bold text-fh-on-surface">Medicación activa</h3>
          {(meds ?? []).map((m) => (
            <p key={m.id} className="text-sm">
              {m.name} · {m.dose} · {m.frequency}
            </p>
          ))}
          {!meds?.length ? (
            <p className="text-sm text-fh-on-surface-variant">Sin medicación activa.</p>
          ) : null}
        </section>

        <section className="card space-y-2">
          <h3 className="font-bold text-fh-on-surface">Próximas vacunas</h3>
          {(vaccines ?? []).map((v) => (
            <p key={v.id} className="text-sm">
              {v.next_due_at} · {v.vaccine_name}
            </p>
          ))}
          {!vaccines?.length ? (
            <p className="text-sm text-fh-on-surface-variant">Sin vacunas próximas.</p>
          ) : null}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card space-y-2">
          <h3 className="font-bold text-fh-on-surface">Próximas pruebas</h3>
          {(tests ?? []).map((t) => (
            <p key={t.id} className="text-sm">
              {formatAppDateTime(t.test_at)} · {t.subject}
            </p>
          ))}
          {!tests?.length ? (
            <p className="text-sm text-fh-on-surface-variant">Sin pruebas próximas.</p>
          ) : null}
        </section>

        <section className="card space-y-2">
          <h3 className="font-bold text-fh-on-surface">Tareas pendientes</h3>
          {(tasks ?? []).map((t) => (
            <p key={t.id} className="text-sm">
              {formatAppDateTime(t.due_at)} · {t.title} ({t.status})
            </p>
          ))}
          {!tasks?.length ? (
            <p className="text-sm text-fh-on-surface-variant">Sin tareas pendientes.</p>
          ) : null}
        </section>
      </div>
    </main>
  );
}

