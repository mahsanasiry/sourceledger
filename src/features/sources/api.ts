import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { fromDatabaseError } from "@/lib/utils/errors";
import {
  sourceSchema,
  type ReviewFormValues,
  type Source,
  type SourceFormValues,
} from "@/lib/validation/schemas";

const COLUMNS =
  "id, workspace_id, url, title, published_on, source_type, excerpt, note, review_status, flagged, created_at, updated_at";

export type SourceFields = Omit<SourceFormValues, "claim_id" | "relation">;

function toRow(values: SourceFields) {
  return {
    url: values.url,
    title: values.title,
    published_on: values.published_on === "" ? null : values.published_on,
    source_type: values.source_type,
    excerpt: values.excerpt,
    note: values.note,
  };
}

export async function listSources(client: SupabaseClient, workspaceId: string): Promise<Source[]> {
  const { data, error } = await client
    .from("sources")
    .select(COLUMNS)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw fromDatabaseError(error);
  return z.array(sourceSchema).parse(data);
}

export async function createSource(
  client: SupabaseClient,
  workspaceId: string,
  values: SourceFields,
): Promise<Source> {
  const { data, error } = await client
    .from("sources")
    .insert({ workspace_id: workspaceId, ...toRow(values), last_change_reason: null })
    .select(COLUMNS)
    .single();
  if (error) throw fromDatabaseError(error);
  return sourceSchema.parse(data);
}

export async function updateSource(
  client: SupabaseClient,
  sourceId: string,
  values: SourceFields,
): Promise<Source> {
  const { data, error } = await client
    .from("sources")
    .update({ ...toRow(values), last_change_reason: null })
    .eq("id", sourceId)
    .select(COLUMNS)
    .single();
  if (error) throw fromDatabaseError(error);
  return sourceSchema.parse(data);
}

export async function setReviewStatus(
  client: SupabaseClient,
  sourceId: string,
  values: ReviewFormValues,
): Promise<Source> {
  const { data, error } = await client
    .from("sources")
    .update({ review_status: values.review_status, last_change_reason: values.reason })
    .eq("id", sourceId)
    .select(COLUMNS)
    .single();
  if (error) throw fromDatabaseError(error);
  return sourceSchema.parse(data);
}

export async function setFlag(
  client: SupabaseClient,
  sourceId: string,
  flagged: boolean,
  reason: string | null,
): Promise<Source> {
  const { data, error } = await client
    .from("sources")
    .update({ flagged, last_change_reason: reason })
    .eq("id", sourceId)
    .select(COLUMNS)
    .single();
  if (error) throw fromDatabaseError(error);
  return sourceSchema.parse(data);
}

export async function deleteSource(client: SupabaseClient, sourceId: string): Promise<void> {
  const { error } = await client.from("sources").delete().eq("id", sourceId);
  if (error) throw fromDatabaseError(error);
}
