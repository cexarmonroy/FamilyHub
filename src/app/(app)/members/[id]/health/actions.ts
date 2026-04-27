"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logChronicMedicationTaken } from "@/lib/health/log-chronic-medication";
import { logVisitMedicationCourseTaken } from "@/lib/health/log-medication-course";
import { createClient } from "@/lib/supabase/server";

function readMemberId(formData: FormData): string {
  return String(formData.get("member_id") ?? "").trim();
}

function healthActionError(memberId: string, message: string) {
  redirect(`/members/${memberId}/health?error=${encodeURIComponent(message.slice(0, 240))}`);
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

function throwOnMutationError(memberId: string, error: { message: string } | null, fallback: string) {
  if (error) healthActionError(memberId, error.message || fallback);
}

export async function saveHealthProfile(formData: FormData) {
  const { memberId, supabase } = await requireMember(formData);
  const { error } = await supabase.from("health_profiles").upsert({
    member_id: memberId,
    blood_type: String(formData.get("blood_type") ?? "") || null,
    known_conditions: String(formData.get("known_conditions") ?? "") || null,
    allergies: String(formData.get("allergies") ?? "") || null
  });
  throwOnMutationError(memberId, error, "No se pudo actualizar la ficha clínica.");
  revalidatePath(`/members/${memberId}/health`);
}

export async function addMedication(formData: FormData) {
  const { memberId, supabase } = await requireMember(formData);
  const name = String(formData.get("name") ?? "").trim();
  const dose = String(formData.get("dose") ?? "").trim();
  const frequency = String(formData.get("frequency") ?? "").trim();
  if (!name || !dose || !frequency) {
    healthActionError(memberId, "Completa nombre, dosis y frecuencia.");
  }

  const { error } = await supabase.from("medications").insert({
    member_id: memberId,
    name,
    dose,
    frequency,
    active: true
  });
  throwOnMutationError(memberId, error, "No se pudo agregar la medicación.");
  revalidatePath(`/members/${memberId}/health`);
}

export async function addVisit(formData: FormData) {
  const { memberId, supabase } = await requireMember(formData);
  const { data: visit, error } = await supabase
    .from("medical_visits")
    .insert({
      member_id: memberId,
      visited_at: String(formData.get("visited_at") ?? new Date().toISOString()),
      provider: String(formData.get("provider") ?? ""),
      reason: String(formData.get("reason") ?? ""),
      notes: String(formData.get("notes") ?? "") || null
    })
    .select("id")
    .single();

  if (error || !visit) {
    revalidatePath(`/members/${memberId}/health`);
    return;
  }

  const courseRows: {
    visit_id: string;
    member_id: string;
    medication_name: string;
    dose: string;
    frequency: string;
    treatment_start: string;
    treatment_end: string;
    notes: string | null;
  }[] = [];

  for (let i = 0; i < 4; i++) {
    const name = String(formData.get(`course_${i}_name`) ?? "").trim();
    if (!name) continue;
    const start = String(formData.get(`course_${i}_start`) ?? "").trim();
    const end = String(formData.get(`course_${i}_end`) ?? "").trim();
    if (!start || !end) continue;
    courseRows.push({
      visit_id: visit.id,
      member_id: memberId,
      medication_name: name,
      dose: String(formData.get(`course_${i}_dose`) ?? "").trim(),
      frequency: String(formData.get(`course_${i}_frequency`) ?? "").trim(),
      treatment_start: start,
      treatment_end: end,
      notes: String(formData.get(`course_${i}_notes`) ?? "").trim() || null
    });
  }

  if (courseRows.length) {
    const { error: coursesError } = await supabase.from("visit_medication_courses").insert(courseRows);
    throwOnMutationError(memberId, coursesError, "No se pudieron guardar los tratamientos.");
  }

  revalidatePath(`/members/${memberId}/health`);
  revalidatePath("/dashboard");
}

export async function addVaccine(formData: FormData) {
  const { memberId, supabase } = await requireMember(formData);
  const vaccineName = String(formData.get("vaccine_name") ?? "").trim();
  if (!vaccineName) {
    healthActionError(memberId, "Indica el nombre de la vacuna.");
  }

  const { error } = await supabase.from("vaccines").insert({
    member_id: memberId,
    vaccine_name: vaccineName,
    applied_at: String(formData.get("applied_at") ?? "") || null,
    next_due_at: String(formData.get("next_due_at") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null
  });
  throwOnMutationError(memberId, error, "No se pudo agregar la vacuna.");
  revalidatePath(`/members/${memberId}/health`);
}

export async function addMetric(formData: FormData) {
  const { memberId, supabase } = await requireMember(formData);
  const weight = Number(formData.get("weight_kg") ?? 0);
  const height = Number(formData.get("height_cm") ?? 0);
  if (!Number.isFinite(weight) || !Number.isFinite(height) || weight <= 0 || height <= 0) {
    healthActionError(memberId, "Peso y estatura deben ser valores mayores que cero.");
  }

  const { error } = await supabase.from("metrics").insert({
    member_id: memberId,
    measured_at: String(formData.get("measured_at") ?? new Date().toISOString()),
    weight_kg: weight,
    height_cm: height,
    notes: String(formData.get("notes") ?? "") || null
  });
  throwOnMutationError(memberId, error, "No se pudo agregar la métrica.");
  revalidatePath(`/members/${memberId}/health`);
}

export async function markMedicationCourseTaken(formData: FormData) {
  const memberId = readMemberId(formData);
  const courseId = String(formData.get("course_id") ?? "").trim();
  if (!memberId) redirect("/members?error=" + encodeURIComponent("Falta el integrante."));
  if (!courseId) healthActionError(memberId, "Falta identificar el tratamiento.");

  const res = await logVisitMedicationCourseTaken(courseId, memberId);
  if (!res.ok) healthActionError(memberId, res.error);
}

export async function markChronicMedicationTaken(formData: FormData) {
  const memberId = readMemberId(formData);
  const medicationId = String(formData.get("medication_id") ?? "").trim();
  if (!memberId) redirect("/members?error=" + encodeURIComponent("Falta el integrante."));
  if (!medicationId) healthActionError(memberId, "Falta identificar la medicación.");

  const res = await logChronicMedicationTaken(medicationId, memberId);
  if (!res.ok) healthActionError(memberId, res.error);
}
