"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addItem(memberId: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.from("school_items").insert({
    member_id: memberId,
    item: String(formData.get("item") ?? ""),
    quantity: Number(formData.get("quantity") ?? 1),
    due_at: String(formData.get("due_at") ?? "") || null,
    status: "pending"
  });
  revalidatePath(`/members/${memberId}/school`);
}

export async function addTest(memberId: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.from("school_tests").insert({
    member_id: memberId,
    subject: String(formData.get("subject") ?? ""),
    test_at: String(formData.get("test_at") ?? ""),
    notes: String(formData.get("notes") ?? "") || null
  });
  revalidatePath(`/members/${memberId}/school`);
}

export async function addTask(memberId: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.from("school_tasks").insert({
    member_id: memberId,
    title: String(formData.get("title") ?? ""),
    due_at: String(formData.get("due_at") ?? ""),
    status: String(formData.get("status") ?? "pending"),
    notes: String(formData.get("notes") ?? "") || null
  });
  revalidatePath(`/members/${memberId}/school`);
}
