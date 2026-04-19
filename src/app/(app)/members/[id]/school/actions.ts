"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { markSchoolTestRendered } from "@/lib/school/mark-test-rendered";

function schoolError(memberId: string, message: string) {
  redirect(`/members/${memberId}/school?error=${encodeURIComponent(message.slice(0, 240))}`);
}

function readMemberId(formData: FormData): string {
  return String(formData.get("member_id") ?? "").trim();
}

export async function addItem(formData: FormData) {
  const memberId = readMemberId(formData);
  if (!memberId) redirect("/members?error=" + encodeURIComponent("Falta el integrante."));

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberRow, error: memberErr } = await supabase
    .from("family_members")
    .select("id")
    .eq("id", memberId)
    .maybeSingle();
  if (memberErr || !memberRow) schoolError(memberId, "Integrante no encontrado o sin permiso.");

  const item = String(formData.get("item") ?? "").trim();
  if (!item) schoolError(memberId, "Indica el nombre del material.");

  const { error } = await supabase.from("school_items").insert({
    member_id: memberId,
    owner_user_id: user.id,
    item,
    quantity: Number(formData.get("quantity") ?? 1) || 1,
    due_at: String(formData.get("due_at") ?? "").trim() || null,
    status: "pending"
  });
  if (error) schoolError(memberId, error.message);
  revalidatePath(`/members/${memberId}/school`);
}

export async function addTest(formData: FormData) {
  const memberId = readMemberId(formData);
  if (!memberId) redirect("/members?error=" + encodeURIComponent("Falta el integrante."));

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberRow, error: memberErr } = await supabase
    .from("family_members")
    .select("id")
    .eq("id", memberId)
    .maybeSingle();
  if (memberErr || !memberRow) schoolError(memberId, "Integrante no encontrado o sin permiso.");

  const subject = String(formData.get("subject") ?? "").trim();
  let testAt = String(formData.get("test_at") ?? "").trim();
  if (!subject || !testAt) {
    schoolError(memberId, "Completa asignatura y fecha/hora de la prueba.");
  }
  if (testAt.length === 16) testAt = `${testAt}:00`;

  const { error } = await supabase.from("school_tests").insert({
    member_id: memberId,
    owner_user_id: user.id,
    subject,
    test_at: testAt,
    notes: String(formData.get("notes") ?? "").trim() || null
  });
  if (error) schoolError(memberId, error.message);
  revalidatePath(`/members/${memberId}/school`);
}

export async function addTask(formData: FormData) {
  const memberId = readMemberId(formData);
  if (!memberId) redirect("/members?error=" + encodeURIComponent("Falta el integrante."));

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberRow, error: memberErr } = await supabase
    .from("family_members")
    .select("id")
    .eq("id", memberId)
    .maybeSingle();
  if (memberErr || !memberRow) schoolError(memberId, "Integrante no encontrado o sin permiso.");

  const title = String(formData.get("title") ?? "").trim();
  let dueAt = String(formData.get("due_at") ?? "").trim();
  if (!title || !dueAt) {
    schoolError(memberId, "Completa título y fecha de entrega de la tarea.");
  }
  if (dueAt.length === 16) dueAt = `${dueAt}:00`;

  const { error } = await supabase.from("school_tasks").insert({
    member_id: memberId,
    owner_user_id: user.id,
    title,
    due_at: dueAt,
    status: String(formData.get("status") ?? "pending"),
    notes: String(formData.get("notes") ?? "").trim() || null
  });
  if (error) schoolError(memberId, error.message);
  revalidatePath(`/members/${memberId}/school`);
}

export async function markTestRendered(formData: FormData) {
  const memberId = readMemberId(formData);
  const testId = String(formData.get("test_id") ?? "").trim();
  if (!memberId) redirect("/members?error=" + encodeURIComponent("Falta el integrante."));
  if (!testId) schoolError(memberId, "Falta identificar la prueba.");

  const res = await markSchoolTestRendered(testId, memberId);
  if (!res.ok) schoolError(memberId, res.error ?? "No se pudo guardar.");
}
