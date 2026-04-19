import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toLocalDateKey } from "@/lib/dates";

export type LogChronicMedicationResult =
  | { ok: true; duplicate: boolean }
  | { ok: false; error: string };

export async function logChronicMedicationTaken(
  medicationId: string,
  memberId: string
): Promise<LogChronicMedicationResult> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const loggedOn = toLocalDateKey(new Date());

  const { error } = await supabase.from("chronic_medication_logs").insert({
    medication_id: medicationId,
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
