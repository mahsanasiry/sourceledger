import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { fromDatabaseError } from "@/lib/utils/errors";
import {
  workspaceSchema,
  type Workspace,
  type WorkspaceFormValues,
} from "@/lib/validation/schemas";

const COLUMNS = "id, name, description, created_at, updated_at";

export async function listWorkspaces(client: SupabaseClient): Promise<Workspace[]> {
  const { data, error } = await client
    .from("workspaces")
    .select(COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw fromDatabaseError(error);
  return z.array(workspaceSchema).parse(data);
}

export async function getWorkspace(client: SupabaseClient, id: string): Promise<Workspace> {
  const { data, error } = await client.from("workspaces").select(COLUMNS).eq("id", id).single();
  if (error) throw fromDatabaseError(error);
  return workspaceSchema.parse(data);
}

export async function createWorkspace(
  client: SupabaseClient,
  values: WorkspaceFormValues,
): Promise<Workspace> {
  const { data, error } = await client.from("workspaces").insert(values).select(COLUMNS).single();
  if (error) throw fromDatabaseError(error);
  return workspaceSchema.parse(data);
}

export async function updateWorkspace(
  client: SupabaseClient,
  id: string,
  values: WorkspaceFormValues,
): Promise<Workspace> {
  const { data, error } = await client
    .from("workspaces")
    .update(values)
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) throw fromDatabaseError(error);
  return workspaceSchema.parse(data);
}

export async function deleteWorkspace(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("workspaces").delete().eq("id", id);
  if (error) throw fromDatabaseError(error);
}

export async function createSampleWorkspace(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.rpc("create_sample_workspace");
  if (error) throw fromDatabaseError(error);
  return z.string().parse(data);
}
