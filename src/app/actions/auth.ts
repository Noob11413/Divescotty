"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { adminLoginSchema } from "@/lib/validators";

export interface LoginState {
  ok?: boolean;
  formError?: string;
  fieldErrors?: { email?: string; password?: string };
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const redirectTo = String(formData.get("redirect") ?? "/admin");

  const parsed = adminLoginSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: LoginState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0]?.toString() as "email" | "password" | undefined;
      if (k) fieldErrors[k] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, formError: "Incorrect email or password." };
  }

  revalidatePath("/admin", "layout");
  redirect(redirectTo);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
