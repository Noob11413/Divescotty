"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { AdminAlert } from "@/components/ui/AdminAlert";

const initialState: LoginState = {};

export function LoginForm({ redirect }: { redirect: string }) {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="redirect" value={redirect} />

      {state?.formError ? (
        <AdminAlert variant="error" message={state.formError} />
      ) : null}

      <label className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          Email
        </span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          className="input input-bordered bg-base-200/60"
        />
        {state?.fieldErrors?.email && (
          <span className="text-xs text-error">{state.fieldErrors.email}</span>
        )}
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          Password
        </span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          minLength={8}
          className="input input-bordered bg-base-200/60"
        />
        {state?.fieldErrors?.password && (
          <span className="text-xs text-error">
            {state.fieldErrors.password}
          </span>
        )}
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex items-center justify-center gap-3 bg-primary px-6 py-4 text-xs font-semibold uppercase tracking-[0.32em] text-primary-content hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}
