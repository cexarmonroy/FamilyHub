"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createMember(formData: FormData) {
  const supabase = await createClient();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const relation = String(formData.get("relation") ?? "").trim();
  if (!fullName || !relation) {
    redirect("/members?error=" + encodeURIComponent("Nombre y relación son obligatorios."));
  }

  const { error } = await supabase.from("family_members").insert({
    full_name: fullName,
    birth_date: String(formData.get("birth_date") ?? "") || null,
    relation,
    notes: String(formData.get("notes") ?? "") || null
  });
  if (error) {
    redirect("/members?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/members");
}
