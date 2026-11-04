import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-12"
    >
      <p className="font-serif text-2xl font-semibold tracking-tight">SourceLedger</p>
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <AuthForm mode="login" next={next} />
    </main>
  );
}
