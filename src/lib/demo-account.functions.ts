import { createServerFn } from "@tanstack/react-start";

/**
 * Idempotently ensures the demo account (admin@clearit.com / 123456) exists,
 * grants it the `hr` role and reassigns the seeded demo squad ownership to it.
 * Called from the auth screen before signInWithPassword when the user types
 * the demo credentials — so the "fake login" for demos always works even in
 * fresh environments.
 */
export const ensureDemoAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const DEMO_EMAIL = "admin@clearit.com";
  const DEMO_PASSWORD = "123456";

  // 1. Find or create the user
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;

  let userId = list.users.find((u) => u.email?.toLowerCase() === DEMO_EMAIL)?.id;

  if (!userId) {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Demo · ClearIT" },
    });
    if (createErr) throw createErr;
    userId = created.user!.id;
  } else {
    // Make sure the password stays "123456" for demo purposes.
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
  }

  // 2. Ensure profile row exists.
  await supabaseAdmin
    .from("profiles")
    .upsert({ id: userId, full_name: "Demo · ClearIT" }, { onConflict: "id" });

  // 3. Ensure `hr` role (also inherits manager visibility).
  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role: "hr" }, { onConflict: "user_id,role" });
  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role: "manager" }, { onConflict: "user_id,role" });

  // 4. Reassign the previously seeded demo squad to this account so the
  //    dashboard/team/feedback screens are already populated. Idempotent —
  //    only rows still owned by the previous seed user are moved.
  const PREVIOUS_DEMO_EMAIL = "goncalvestudostrabalho@gmail.com";
  const previousUserId = list.users.find(
    (u) => u.email?.toLowerCase() === PREVIOUS_DEMO_EMAIL,
  )?.id;

  if (previousUserId && previousUserId !== userId) {
    const tables = [
      "employees",
      "meetings",
      "feedbacks",
      "pdi_objectives",
      "legacy_feedbacks",
      "sensitive_incidents",
      "recordings",
    ] as const;
    const admin = supabaseAdmin as unknown as {
      from: (t: string) => {
        update: (v: Record<string, unknown>) => {
          eq: (c: string, v: string) => Promise<unknown>;
        };
      };
    };
    for (const table of tables) {
      await admin.from(table).update({ manager_id: userId }).eq("manager_id", previousUserId);
    }
  }

  return { ok: true as const, email: DEMO_EMAIL };
});
