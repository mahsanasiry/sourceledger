"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { upsertLink } from "@/features/claims/api";
import { queryKeys } from "@/lib/query/keys";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ReviewFormValues, Source, SourceFormValues } from "@/lib/validation/schemas";
import {
  createSource,
  deleteSource,
  listSources,
  setFlag,
  setReviewStatus,
  updateSource,
  type SourceFields,
} from "./api";

export function useSources(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.sources(workspaceId),
    queryFn: () => listSources(getSupabaseBrowserClient(), workspaceId),
  });
}

function useRefreshSources(workspaceId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.sources(workspaceId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.links(workspaceId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.activityRoot(workspaceId) }),
    ]);
}

export class LinkAfterCreateError extends Error {
  constructor(readonly sourceId: string) {
    super(
      "The source was saved, but it could not be linked to the claim. Open it and link it again.",
    );
    this.name = "LinkAfterCreateError";
  }
}

export function useCreateSource(workspaceId: string) {
  const refresh = useRefreshSources(workspaceId);
  return useMutation({
    mutationFn: async (values: SourceFormValues): Promise<Source> => {
      const client = getSupabaseBrowserClient();
      const { claim_id, relation, ...fields } = values;
      const source = await createSource(client, workspaceId, fields satisfies SourceFields);
      if (claim_id) {
        try {
          await upsertLink(client, workspaceId, source.id, {
            claim_id,
            relation,
            relation_note: "",
          });
        } catch {
          throw new LinkAfterCreateError(source.id);
        }
      }
      return source;
    },
    onSettled: refresh,
  });
}

export function useUpdateSource(workspaceId: string, sourceId: string) {
  const refresh = useRefreshSources(workspaceId);
  return useMutation({
    mutationFn: (values: SourceFields) =>
      updateSource(getSupabaseBrowserClient(), sourceId, values),
    onSuccess: refresh,
  });
}

export function useSetReviewStatus(workspaceId: string, sourceId: string) {
  const refresh = useRefreshSources(workspaceId);
  return useMutation({
    mutationFn: (values: ReviewFormValues) =>
      setReviewStatus(getSupabaseBrowserClient(), sourceId, values),
    onSuccess: refresh,
  });
}

export function useToggleFlag(workspaceId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.sources(workspaceId);

  return useMutation({
    mutationFn: (input: { sourceId: string; flagged: boolean }) =>
      setFlag(
        getSupabaseBrowserClient(),
        input.sourceId,
        input.flagged,
        input.flagged ? "Flagged for a second look" : "Flag removed",
      ),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Source[]>(key);
      queryClient.setQueryData<Source[]>(key, (current) =>
        current?.map((source) =>
          source.id === input.sourceId ? { ...source, flagged: input.flagged } : source,
        ),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: key }),
        queryClient.invalidateQueries({ queryKey: queryKeys.activityRoot(workspaceId) }),
      ]),
  });
}

export function useDeleteSource(workspaceId: string) {
  const refresh = useRefreshSources(workspaceId);
  return useMutation({
    mutationFn: (sourceId: string) => deleteSource(getSupabaseBrowserClient(), sourceId),
    onSuccess: refresh,
  });
}
