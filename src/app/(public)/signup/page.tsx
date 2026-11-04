import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-12">
      <p className="font-serif text-2xl font-semibold tracking-tight">SourceLedger</p>
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <AuthForm mode="signup" next={next} />
    </main>
  );
}
