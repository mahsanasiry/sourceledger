import type { Metadata } from "next";
import { SettingsActions } from "@/features/workspaces/components/settings-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <section
        aria-labelledby="account-heading"
        className="border-line bg-surface rounded-lg border p-5"
      >
        <h2 id="account-heading" className="text-base font-semibold">
          Account
        </h2>
        <p className="text-ink-muted mt-1 text-sm">
          Signed in as {data.user?.email ?? "an unknown user"}.
        </p>
      </section>
      <SettingsActions />
    </div>
  );
}
