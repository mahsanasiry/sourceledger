"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { WorkspaceFormValues } from "@/lib/validation/schemas";
import {
  createSampleWorkspace,
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  listWorkspaces,
  updateWorkspace,
} from "./api";

export function useWorkspaces() {
  return useQuery({
    queryKey: queryKeys.workspaces(),
    queryFn: () => listWorkspaces(getSupabaseBrowserClient()),
  });
}

export function useWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.workspace(workspaceId),
    queryFn: () => getWorkspace(getSupabaseBrowserClient(), workspaceId),
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: WorkspaceFormValues) =>
      createWorkspace(getSupabaseBrowserClient(), values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() }),
  });
}

export function useUpdateWorkspace(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: WorkspaceFormValues) =>
      updateWorkspace(getSupabaseBrowserClient(), workspaceId, values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.activityRoot(workspaceId) }),
      ]);
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) => deleteWorkspace(getSupabaseBrowserClient(), workspaceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() }),
  });
}

export function useCreateSampleWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => createSampleWorkspace(getSupabaseBrowserClient()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() }),
  });
}
