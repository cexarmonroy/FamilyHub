"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markAsRead(formData: FormData) {
  const id = String(formData.get("notification_id") ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}
