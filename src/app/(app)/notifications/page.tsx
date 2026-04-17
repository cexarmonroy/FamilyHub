import { createClient } from "@/lib/supabase/server";
import { markAsRead } from "./actions";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, event_at, read_at")
    .order("event_at", { ascending: false });

  return (
    <main className="card">
      <h2 className="mb-4 text-lg font-semibold">Centro de notificaciones</h2>
      <div className="space-y-2">
        {(data ?? []).map((n) => (
          <div key={n.id} className="rounded border border-slate-200 p-3">
            <p className="font-medium">{n.title}</p>
            <p className="text-sm text-slate-700">{n.body}</p>
            <p className="text-xs text-slate-500">{new Date(n.event_at).toLocaleString()}</p>
            {!n.read_at ? (
              <form action={markAsRead.bind(null, n.id)} className="mt-2">
                <button className="button-secondary text-xs" type="submit">Marcar leída</button>
              </form>
            ) : (
              <p className="mt-2 text-xs text-emerald-700">Leída</p>
            )}
          </div>
        ))}
        {!data?.length ? <p className="text-sm text-slate-500">No hay notificaciones.</p> : null}
      </div>
    </main>
  );
}
