"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function markAsRead(formData: FormData) {
  const id = String(formData.get("notification_id") ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect("/notifications?error=" + encodeURIComponent(error?.message ?? "No se pudo actualizar."));
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}
