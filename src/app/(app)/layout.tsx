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

  const [{ count }, { data: firstMember }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .is("read_at", null),
    supabase.from("family_members").select("id").order("full_name", { ascending: true }).limit(1).maybeSingle()
  ]);

  return (
    <AppChrome unreadNotifications={count ?? 0} firstMemberId={firstMember?.id ?? null}>
      {children}
    </AppChrome>
  );
}
