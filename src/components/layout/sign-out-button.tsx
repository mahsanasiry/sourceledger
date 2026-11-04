"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    const { error } = await getSupabaseBrowserClient().auth.signOut();
    if (error) {
      setPending(false);
      toast.error("Could not sign out. Try again.");
      return;
    }
    queryClient.clear();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button variant="secondary" loading={pending} onClick={signOut}>
      Sign out
    </Button>
  );
}
