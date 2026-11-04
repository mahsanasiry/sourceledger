import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { fromDatabaseError } from "@/lib/utils/errors";
import { activitySchema, type Activity } from "@/lib/validation/schemas";

const COLUMNS =
  "id, workspace_id, entity_type, entity_id, claim_id, source_id, action, summary, changes, reason, actor_email, created_at";

export type ActivityScope = { claimId?: string; sourceId?: string; limit?: number };

export async function listActivity(
  client: SupabaseClient,
  workspaceId: string,
  scope: ActivityScope = {},
): Promise<Activity[]> {
  let query = client
    .from("activity")
    .select(COLUMNS)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(scope.limit ?? 200);
  if (scope.claimId) query = query.eq("claim_id", scope.claimId);
  if (scope.sourceId) query = query.eq("source_id", scope.sourceId);
  const { data, error } = await query;
  if (error) throw fromDatabaseError(error);
  return z.array(activitySchema).parse(data);
}

const PAGE_SIZE = 1000;

export async function listAllActivity(client: SupabaseClient, workspaceId: string): Promise<Activity[]> {
  const rows: Activity[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from("activity")
      .select(COLUMNS)
      .eq("workspace_id", workspaceId)
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw fromDatabaseError(error);
    const page = z.array(activitySchema).parse(data);
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}
