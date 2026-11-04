"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { InlineError } from "@/components/ui/states";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/utils/errors";
import { authFormSchema, type AuthFormValues } from "@/lib/validation/schemas";
import { safeRedirectPath } from "./redirect";

type AuthFormProps = { mode: "login" | "signup"; next: string | undefined };

export function AuthForm({ mode, next }: AuthFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({ resolver: zodResolver(authFormSchema) });

  async function onSubmit(values: AuthFormValues) {
    setFormError(null);
    const client = getSupabaseBrowserClient();
    const destination = safeRedirectPath(next);

    try {
      if (mode === "login") {
        const { error } = await client.auth.signInWithPassword(values);
        if (error) throw error;
      } else {
        const { data, error } = await client.auth.signUp({
          ...values,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}` },
        });
        if (error) throw error;
        if (!data.session) {
          setConfirmationSentTo(values.email);
          return;
        }
      }
      router.replace(destination);
      router.refresh();
    } catch (error) {
      setFormError(toUserMessage(error));
    }
  }

  if (confirmationSentTo) {
    return (
      <div role="status" className="rounded-lg border border-line bg-surface p-5 text-sm">
        <h2 className="font-semibold">Check your email</h2>
        <p className="mt-1 text-ink-muted">
          We sent a confirmation link to {confirmationSentTo}. Open it to finish creating your account.
        </p>
      </div>
    );
  }

  const isLogin = mode === "login";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        autoFocus
        error={errors.email?.message}
        {...register("email")}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete={isLogin ? "current-password" : "new-password"}
        hint={isLogin ? undefined : "At least 8 characters."}
        error={errors.password?.message}
        {...register("password")}
      />
      <InlineError message={formError} />
      <Button type="submit" loading={isSubmitting}>
        {isLogin ? "Sign in" : "Create account"}
      </Button>
      <p className="text-sm text-ink-muted">
        {isLogin ? "New here? " : "Already have an account? "}
        <Link href={isLogin ? "/signup" : "/login"} className="font-medium text-accent underline">
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
