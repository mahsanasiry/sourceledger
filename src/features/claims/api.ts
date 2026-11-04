import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { fromDatabaseError } from "@/lib/utils/errors";
import {
  claimSchema,
  claimSourceSchema,
  type Claim,
  type ClaimFormValues,
  type ClaimSource,
  type LinkFormValues,
} from "@/lib/validation/schemas";

const CLAIM_COLUMNS = "id, workspace_id, statement, conclusion, status, created_at, updated_at";
const LINK_COLUMNS =
  "claim_id, source_id, workspace_id, relation, relation_note, created_at, updated_at";

export async function listClaims(client: SupabaseClient, workspaceId: string): Promise<Claim[]> {
  const { data, error } = await client
    .from("claims")
    .select(CLAIM_COLUMNS)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw fromDatabaseError(error);
  return z.array(claimSchema).parse(data);
}

export async function createClaim(
  client: SupabaseClient,
  workspaceId: string,
  values: ClaimFormValues,
): Promise<Claim> {
  const { data, error } = await client
    .from("claims")
    .insert({
      workspace_id: workspaceId,
      statement: values.statement,
      conclusion: values.conclusion,
      status: values.status,
      last_change_reason: null,
    })
    .select(CLAIM_COLUMNS)
    .single();
  if (error) throw fromDatabaseError(error);
  return claimSchema.parse(data);
}

export async function updateClaim(
  client: SupabaseClient,
  claimId: string,
  values: ClaimFormValues,
): Promise<Claim> {
  const { data, error } = await client
    .from("claims")
    .update({
      statement: values.statement,
      conclusion: values.conclusion,
      status: values.status,
      last_change_reason: values.reason === "" ? null : values.reason,
    })
    .eq("id", claimId)
    .select(CLAIM_COLUMNS)
    .single();
  if (error) throw fromDatabaseError(error);
  return claimSchema.parse(data);
}

export async function deleteClaim(client: SupabaseClient, claimId: string): Promise<void> {
  const { error } = await client.from("claims").delete().eq("id", claimId);
  if (error) throw fromDatabaseError(error);
}

export async function listLinks(
  client: SupabaseClient,
  workspaceId: string,
): Promise<ClaimSource[]> {
  const { data, error } = await client
    .from("claim_sources")
    .select(LINK_COLUMNS)
    .eq("workspace_id", workspaceId);
  if (error) throw fromDatabaseError(error);
  return z.array(claimSourceSchema).parse(data);
}

export async function upsertLink(
  client: SupabaseClient,
  workspaceId: string,
  sourceId: string,
  values: LinkFormValues,
): Promise<ClaimSource> {
  const { data, error } = await client
    .from("claim_sources")
    .upsert(
      {
        workspace_id: workspaceId,
        source_id: sourceId,
        claim_id: values.claim_id,
        relation: values.relation,
        relation_note: values.relation_note,
      },
      { onConflict: "claim_id,source_id" },
    )
    .select(LINK_COLUMNS)
    .single();
  if (error) throw fromDatabaseError(error);
  return claimSourceSchema.parse(data);
}

export async function removeLink(
  client: SupabaseClient,
  claimId: string,
  sourceId: string,
): Promise<void> {
  const { error } = await client
    .from("claim_sources")
    .delete()
    .eq("claim_id", claimId)
    .eq("source_id", sourceId);
  if (error) throw fromDatabaseError(error);
}
