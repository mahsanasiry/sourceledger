import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function WorkspaceGroupLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  return (
    <>
      <AppHeader email={data.user?.email ?? null} />
      <main id="main" className="mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
    </>
  );
}
