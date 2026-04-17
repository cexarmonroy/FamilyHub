"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createMember(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("family_members").insert({
    full_name: String(formData.get("full_name") ?? ""),
    birth_date: String(formData.get("birth_date") ?? "") || null,
    relation: String(formData.get("relation") ?? ""),
    notes: String(formData.get("notes") ?? "") || null
  });
  revalidatePath("/members");
}
