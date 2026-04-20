import Link from "next/link";
import { formatAppDateTime } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { markAsRead } from "./actions";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, event_at, read_at")
    .order("event_at", { ascending: false });

  return (
    <main className="rounded-stitch-xl bg-fh-surface-container-lowest p-6 shadow-ambient-soft md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight text-fh-on-surface">Notificaciones</h2>
        <Link href="/dashboard" className="text-sm font-semibold text-fh-primary hover:underline">
          Volver al tablero
        </Link>
      </div>
      <div className="space-y-3">
        {(data ?? []).map((n) => (
          <div
            key={n.id}
            className="rounded-stitch-lg bg-fh-surface-container-low p-4 transition hover:bg-fh-surface-container"
          >
            <p className="font-semibold text-fh-on-surface">{n.title}</p>
            <p className="mt-1 text-sm text-fh-on-surface-variant">{n.body}</p>
            <p className="mt-2 text-xs text-fh-line">{formatAppDateTime(n.event_at)}</p>
            {!n.read_at ? (
              <form action={markAsRead} className="mt-3">
                <input type="hidden" name="notification_id" value={n.id} />
                <button className="button-secondary text-xs" type="submit">
                  Marcar leída
                </button>
              </form>
            ) : (
              <p className="mt-3 text-xs font-medium text-fh-primary">Leída</p>
            )}
          </div>
        ))}
        {!data?.length ? <p className="text-sm text-fh-on-surface-variant">No hay notificaciones.</p> : null}
      </div>
    </main>
  );
}
