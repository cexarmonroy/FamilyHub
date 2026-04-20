"use server";

import { redirect } from "next/navigation";
import { createClient as createAdminClient, type SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

async function resolveCanonicalOwnerId(service: SupabaseClient): Promise<string | null> {
  const { data: row } = await service.from("family_members").select("owner_user_id").limit(1).maybeSingle();
  if (row?.owner_user_id) return row.owner_user_id;

  const { data: list, error } = await service.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error || !list?.users?.length) return null;
  const sorted = [...list.users].sort(
    (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
  );
  return sorted[0]?.id ?? null;
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const inviteCode = String(formData.get("invite_code") ?? "").trim();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    redirect(
      "/login?error=Falta SUPABASE_SERVICE_ROLE_KEY en el servidor (necesario para registro y vínculo familiar)."
    );
  }

  /** La clave publishable/anon no sirve para auth.admin (listUsers/createUser). */
  if (serviceRoleKey.startsWith("sb_publishable_") || serviceRoleKey === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect(
      "/login?error=" +
        encodeURIComponent(
          "SUPABASE_SERVICE_ROLE_KEY debe ser la clave secreta «service_role» del proyecto (Supabase → Settings → API → API Keys: la clave secret, no la publishable/anónima). Vuelve a copiarla en .env.local y reinicia el servidor."
        )
    );
  }

  const admin = createAdminClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1
  });

  if (usersError) {
    redirect(`/login?error=${encodeURIComponent(usersError.message)}`);
  }

  const hasAnyUser = (usersData?.users?.length ?? 0) > 0;

  /** Primera cuenta (admin): mismo flujo que antes. */
  if (!hasAnyUser) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    redirect(
      "/login?message=Usuario creado. Si no requiere confirmación por email, ya puedes iniciar sesión."
    );
  }

  /** Segundo adulto: código + creación confirmada + vínculo a la cuenta principal. */
  const expectedInvite = process.env.FAMILY_INVITE_CODE?.trim();
  if (!expectedInvite) {
    redirect(
      "/login?error=El administrador debe definir FAMILY_INVITE_CODE en el servidor para permitir registrar a otro adulto."
    );
  }

  if (inviteCode !== expectedInvite) {
    redirect(
      "/login?error=Código de familia incorrecto. Pídeselo a quien creó la cuenta principal o revisa .env (FAMILY_INVITE_CODE)."
    );
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (createErr || !created.user) {
    redirect(`/login?error=${encodeURIComponent(createErr?.message ?? "No se pudo crear la cuenta")}`);
  }

  const newUserId = created.user.id;

  const canonical = await resolveCanonicalOwnerId(admin);

  if (!canonical) {
    redirect(
      "/login?error=No se encontró la cuenta principal de la familia. Contacta soporte o revisa los datos en Supabase."
    );
  }

  if (canonical === newUserId) {
    redirect("/login?error=No se pudo vincular la cuenta. Intenta con otro email.");
  }

  const { error: linkErr } = await admin.from("household_member_access").insert({
    canonical_owner_id: canonical,
    member_user_id: newUserId
  });

  if (linkErr) {
    redirect(`/login?error=${encodeURIComponent(linkErr.message)}`);
  }

  redirect(
    "/login?message=Cuenta de familiar creada. Ya puedes iniciar sesión con tu email y contraseña."
  );
}
