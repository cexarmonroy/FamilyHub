import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toLocalDateKey } from "@/lib/dates";

export type LogMedicationCourseResult =
  | { ok: true; duplicate: boolean }
  | { ok: false; error: string };

/**
 * Registra la toma del día para un curso de medicación de visita.
 * Idempotente: si ya existe fila para (course_id, logged_on), devuelve duplicate sin error.
 */
export async function logVisitMedicationCourseTaken(
  courseId: string,
  memberId: string
): Promise<LogMedicationCourseResult> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const loggedOn = toLocalDateKey(new Date());

  const { error } = await supabase.from("visit_medication_course_logs").insert({
    course_id: courseId,
    owner_user_id: user.id,
    taken_at: new Date().toISOString(),
    logged_on: loggedOn
  });

  if (error) {
    if (error.code === "23505") {
      revalidatePath("/dashboard");
      revalidatePath(`/members/${memberId}/health`);
      return { ok: true, duplicate: true };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/members/${memberId}/health`);
  return { ok: true, duplicate: false };
}
