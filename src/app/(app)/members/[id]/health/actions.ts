"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveHealthProfile(memberId: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.from("health_profiles").upsert({
    member_id: memberId,
    blood_type: String(formData.get("blood_type") ?? "") || null,
    known_conditions: String(formData.get("known_conditions") ?? "") || null,
    allergies: String(formData.get("allergies") ?? "") || null
  });
  revalidatePath(`/members/${memberId}/health`);
}

export async function addMedication(memberId: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.from("medications").insert({
    member_id: memberId,
    name: String(formData.get("name") ?? ""),
    dose: String(formData.get("dose") ?? ""),
    frequency: String(formData.get("frequency") ?? ""),
    active: true
  });
  revalidatePath(`/members/${memberId}/health`);
}

export async function addVisit(memberId: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.from("medical_visits").insert({
    member_id: memberId,
    visited_at: String(formData.get("visited_at") ?? new Date().toISOString()),
    provider: String(formData.get("provider") ?? ""),
    reason: String(formData.get("reason") ?? ""),
    notes: String(formData.get("notes") ?? "") || null
  });
  revalidatePath(`/members/${memberId}/health`);
}

export async function addVaccine(memberId: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.from("vaccines").insert({
    member_id: memberId,
    vaccine_name: String(formData.get("vaccine_name") ?? ""),
    applied_at: String(formData.get("applied_at") ?? "") || null,
    next_due_at: String(formData.get("next_due_at") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null
  });
  revalidatePath(`/members/${memberId}/health`);
}

export async function addMetric(memberId: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.from("metrics").insert({
    member_id: memberId,
    measured_at: String(formData.get("measured_at") ?? new Date().toISOString()),
    weight_kg: Number(formData.get("weight_kg") ?? 0),
    height_cm: Number(formData.get("height_cm") ?? 0),
    notes: String(formData.get("notes") ?? "") || null
  });
  revalidatePath(`/members/${memberId}/health`);
}
