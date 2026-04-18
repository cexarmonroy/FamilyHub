"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function readMemberId(formData: FormData): string {
  return String(formData.get("member_id") ?? "").trim();
}

async function requireMember(formData: FormData) {
  const memberId = readMemberId(formData);
  if (!memberId) redirect("/members?error=" + encodeURIComponent("Falta el integrante."));

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberRow, error } = await supabase
    .from("family_members")
    .select("id")
    .eq("id", memberId)
    .maybeSingle();
  if (error || !memberRow) redirect("/members");

  return { memberId, supabase };
}

export async function saveHealthProfile(formData: FormData) {
  const { memberId, supabase } = await requireMember(formData);
  await supabase.from("health_profiles").upsert({
    member_id: memberId,
    blood_type: String(formData.get("blood_type") ?? "") || null,
    known_conditions: String(formData.get("known_conditions") ?? "") || null,
    allergies: String(formData.get("allergies") ?? "") || null
  });
  revalidatePath(`/members/${memberId}/health`);
}

export async function addMedication(formData: FormData) {
  const { memberId, supabase } = await requireMember(formData);
  await supabase.from("medications").insert({
    member_id: memberId,
    name: String(formData.get("name") ?? ""),
    dose: String(formData.get("dose") ?? ""),
    frequency: String(formData.get("frequency") ?? ""),
    active: true
  });
  revalidatePath(`/members/${memberId}/health`);
}

export async function addVisit(formData: FormData) {
  const { memberId, supabase } = await requireMember(formData);
  await supabase.from("medical_visits").insert({
    member_id: memberId,
    visited_at: String(formData.get("visited_at") ?? new Date().toISOString()),
    provider: String(formData.get("provider") ?? ""),
    reason: String(formData.get("reason") ?? ""),
    notes: String(formData.get("notes") ?? "") || null
  });
  revalidatePath(`/members/${memberId}/health`);
}

export async function addVaccine(formData: FormData) {
  const { memberId, supabase } = await requireMember(formData);
  await supabase.from("vaccines").insert({
    member_id: memberId,
    vaccine_name: String(formData.get("vaccine_name") ?? ""),
    applied_at: String(formData.get("applied_at") ?? "") || null,
    next_due_at: String(formData.get("next_due_at") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null
  });
  revalidatePath(`/members/${memberId}/health`);
}

export async function addMetric(formData: FormData) {
  const { memberId, supabase } = await requireMember(formData);
  await supabase.from("metrics").insert({
    member_id: memberId,
    measured_at: String(formData.get("measured_at") ?? new Date().toISOString()),
    weight_kg: Number(formData.get("weight_kg") ?? 0),
    height_cm: Number(formData.get("height_cm") ?? 0),
    notes: String(formData.get("notes") ?? "") || null
  });
  revalidatePath(`/members/${memberId}/health`);
}
