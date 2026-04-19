import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markSchoolTestRendered(
  testId: string,
  memberId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const { data, error } = await supabase
    .from("school_tests")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", testId)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "No se encontró la prueba o no tienes permiso." };

  revalidatePath("/dashboard");
  revalidatePath(`/members/${memberId}/school`);
  return { ok: true };
}
