"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ClaimFormValues, LinkFormValues } from "@/lib/validation/schemas";
import {
  createClaim,
  deleteClaim,
  listClaims,
  listLinks,
  removeLink,
  updateClaim,
  upsertLink,
} from "./api";

export function useClaims(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.claims(workspaceId),
    queryFn: () => listClaims(getSupabaseBrowserClient(), workspaceId),
  });
}

export function useLinks(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.links(workspaceId),
    queryFn: () => listLinks(getSupabaseBrowserClient(), workspaceId),
  });
}

function useRefreshEvidence(workspaceId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.claims(workspaceId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.links(workspaceId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.activityRoot(workspaceId) }),
    ]);
}

export function useCreateClaim(workspaceId: string) {
  const refresh = useRefreshEvidence(workspaceId);
  return useMutation({
    mutationFn: (values: ClaimFormValues) => createClaim(getSupabaseBrowserClient(), workspaceId, values),
    onSuccess: refresh,
  });
}

export function useUpdateClaim(workspaceId: string, claimId: string) {
  const refresh = useRefreshEvidence(workspaceId);
  return useMutation({
    mutationFn: (values: ClaimFormValues) => updateClaim(getSupabaseBrowserClient(), claimId, values),
    onSuccess: refresh,
  });
}

export function useDeleteClaim(workspaceId: string) {
  const refresh = useRefreshEvidence(workspaceId);
  return useMutation({
    mutationFn: (claimId: string) => deleteClaim(getSupabaseBrowserClient(), claimId),
    onSuccess: refresh,
  });
}

export function useUpsertLink(workspaceId: string, sourceId: string) {
  const refresh = useRefreshEvidence(workspaceId);
  return useMutation({
    mutationFn: (values: LinkFormValues) =>
      upsertLink(getSupabaseBrowserClient(), workspaceId, sourceId, values),
    onSuccess: refresh,
  });
}

export function useRemoveLink(workspaceId: string) {
  const refresh = useRefreshEvidence(workspaceId);
  return useMutation({
    mutationFn: (input: { claimId: string; sourceId: string }) =>
      removeLink(getSupabaseBrowserClient(), input.claimId, input.sourceId),
    onSuccess: refresh,
  });
}
