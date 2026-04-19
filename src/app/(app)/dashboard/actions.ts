"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { snoozeDashboardAlert } from "@/lib/dashboard/snooze-alert";
import type { DashboardExecutableAction } from "@/lib/alerts/types";
import { toLocalDateKey } from "@/lib/dates";
import { logChronicMedicationTaken } from "@/lib/health/log-chronic-medication";
import { logVisitMedicationCourseTaken } from "@/lib/health/log-medication-course";
import { markSchoolTestRendered } from "@/lib/school/mark-test-rendered";

export async function executeDashboardAction(
  action: DashboardExecutableAction
): Promise<{
  ok: boolean;
  error?: string;
  medicationDuplicate?: boolean;
  chronicDuplicate?: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  if (action.type === "complete_task") {
    const { data, error } = await supabase
      .from("school_tasks")
      .update({ status: "done" })
      .eq("id", action.entityId)
      .select("id")
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "No se encontró la tarea o no tienes permiso." };

    revalidatePath("/dashboard");
    revalidatePath(`/members/${action.memberId}/school`);
    return { ok: true };
  }

  if (action.type === "complete_event") {
    return markSchoolTestRendered(action.entityId, action.memberId);
  }

  if (action.type === "mark_medication_taken") {
    const res = await logVisitMedicationCourseTaken(action.entityId, action.memberId);
    if (!res.ok) return { ok: false, error: res.error };
    return { ok: true, medicationDuplicate: res.duplicate };
  }

  if (action.type === "mark_vaccine_applied") {
    const todayKey = toLocalDateKey(new Date());
    const { data, error } = await supabase
      .from("vaccines")
      .update({ applied_at: todayKey, next_due_at: null })
      .eq("id", action.entityId)
      .select("id")
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "No se encontró la vacuna o no tienes permiso." };

    revalidatePath("/dashboard");
    revalidatePath(`/members/${action.memberId}/health`);
    return { ok: true };
  }

  if (action.type === "mark_notification_read") {
    const { data, error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", action.entityId)
      .select("id")
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "No se encontró la notificación." };

    revalidatePath("/dashboard");
    revalidatePath("/notifications");
    revalidatePath("/", "layout");
    return { ok: true };
  }

  if (action.type === "mark_chronic_medication_taken") {
    const res = await logChronicMedicationTaken(action.entityId, action.memberId);
    if (!res.ok) return { ok: false, error: res.error };
    return { ok: true, chronicDuplicate: res.duplicate };
  }

  if (action.type === "snooze_alert") {
    return snoozeDashboardAlert(action.alertKey);
  }

  return { ok: false, error: "Acción no soportada." };
}

/** Ejecuta varias acciones en secuencia (p. ej. registrar todas las tomas de un grupo). */
export async function executeDashboardActionsBatch(
  actions: DashboardExecutableAction[]
): Promise<{ ok: boolean; error?: string; failedAt?: number }> {
  for (let i = 0; i < actions.length; i += 1) {
    const res = await executeDashboardAction(actions[i]!);
    if (!res.ok) return { ok: false, error: res.error, failedAt: i };
  }
  return { ok: true };
}
