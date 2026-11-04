"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { listActivity, type ActivityScope } from "./api";

export function useActivity(workspaceId: string, scope: ActivityScope = {}) {
  const scopeKey = `${scope.claimId ?? ""}:${scope.sourceId ?? ""}:${scope.limit ?? ""}`;
  return useQuery({
    queryKey: queryKeys.activity(workspaceId, scopeKey),
    queryFn: () => listActivity(getSupabaseBrowserClient(), workspaceId, scope),
  });
}
