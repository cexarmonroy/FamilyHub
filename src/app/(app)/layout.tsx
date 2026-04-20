import { redirect } from "next/navigation";
import { AppChrome } from "@/components/app-chrome";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ count }, { data: memberRows }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .is("read_at", null),
    supabase.from("family_members").select("id, full_name").order("full_name", { ascending: true })
  ]);

  const members = memberRows ?? [];

  return (
    <AppChrome unreadNotifications={count ?? 0} members={members}>
      {children}
    </AppChrome>
  );
}
