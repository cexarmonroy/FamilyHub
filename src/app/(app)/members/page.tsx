import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MembersPageClient } from "@/components/members/members-page-client";
import type { ActivityItem } from "@/components/members/recent-activity-section";
import { createClient } from "@/lib/supabase/server";

export default async function MembersPage() {
  const supabase = await createClient();
  const [{ data }, { data: recentNotes }] = await Promise.all([
    supabase
      .from("family_members")
      .select("id, full_name, relation, birth_date, avatar_url")
      .order("full_name"),
    supabase
      .from("notifications")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(2)
  ]);

  const activities: ActivityItem[] = (recentNotes ?? []).map((n, i) => ({
    id: n.id,
    title: n.title,
    atLabel: formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es }),
    variant: i % 2 === 0 ? "secondary" : "primary"
  }));

  const members = data ?? [];

  return (
    <main>
      <MembersPageClient members={members} activities={activities} />
    </main>
  );
}
