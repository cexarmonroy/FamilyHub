import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const SNOOZE_MS = 24 * 60 * 60 * 1000;

export async function snoozeDashboardAlert(alertKey: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const snoozedUntil = new Date(Date.now() + SNOOZE_MS).toISOString();

  await supabase
    .from("dashboard_alert_snoozes")
    .delete()
    .eq("owner_user_id", user.id)
    .eq("alert_key", alertKey);

  const { error } = await supabase.from("dashboard_alert_snoozes").insert({
    owner_user_id: user.id,
    alert_key: alertKey,
    snoozed_until: snoozedUntil
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}
