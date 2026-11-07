import { z } from "zod";

export const SOURCE_TYPES = [
  "news",
  "academic",
  "government",
  "report",
  "social",
  "interview",
  "dataset",
  "other",
] as const;
export const REVIEW_STATUSES = ["unreviewed", "in_review", "verified", "rejected"] as const;
export const CLAIM_STATUSES = ["open", "supported", "contested", "refuted"] as const;
export const RELATIONS = ["supports", "contradicts", "context"] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];
export type Relation = (typeof RELATIONS)[number];

const timestamp = z.string();

export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  created_at: timestamp,
  updated_at: timestamp,
});
export type Workspace = z.infer<typeof workspaceSchema>;

export const claimSchema = z.object({
  id: z.string(),
  workspace_id: z.string(),
  statement: z.string(),
  conclusion: z.string(),
  status: z.enum(CLAIM_STATUSES),
  created_at: timestamp,
  updated_at: timestamp,
});
export type Claim = z.infer<typeof claimSchema>;

export const sourceSchema = z.object({
  id: z.string(),
  workspace_id: z.string(),
  url: z.string(),
  title: z.string(),
  published_on: z.string().nullable(),
  source_type: z.enum(SOURCE_TYPES),
  excerpt: z.string(),
  note: z.string(),
  review_status: z.enum(REVIEW_STATUSES),
  flagged: z.boolean(),
  created_at: timestamp,
  updated_at: timestamp,
});
export type Source = z.infer<typeof sourceSchema>;

export const claimSourceSchema = z.object({
  claim_id: z.string(),
  source_id: z.string(),
  workspace_id: z.string(),
  relation: z.enum(RELATIONS),
  relation_note: z.string(),
  created_at: timestamp,
  updated_at: timestamp,
});
export type ClaimSource = z.infer<typeof claimSourceSchema>;

export const activitySchema = z.object({
  id: z.number(),
  workspace_id: z.string(),
  entity_type: z.enum(["workspace", "claim", "source", "link"]),
  entity_id: z.string(),
  claim_id: z.string().nullable(),
  source_id: z.string().nullable(),
  action: z.enum(["created", "updated", "deleted"]),
  summary: z.string(),
  changes: z.record(z.string(), z.object({ from: z.unknown(), to: z.unknown() })),
  reason: z.string().nullable(),
  actor_email: z.string().nullable(),
  created_at: timestamp,
});
export type Activity = z.infer<typeof activitySchema>;

const optionalText = (max: number) =>
  z.string().trim().max(max, `Keep this under ${max} characters`);

export const workspaceFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the workspace a name")
    .max(120, "Keep the name under 120 characters"),
  description: optionalText(2000),
});
export type WorkspaceFormValues = z.infer<typeof workspaceFormSchema>;

export const claimFormSchema = z.object({
  statement: z
    .string()
    .trim()
    .min(1, "Write the claim or research question")
    .max(500, "Keep the claim under 500 characters"),
  conclusion: optionalText(5000),
  status: z.enum(CLAIM_STATUSES),
  reason: optionalText(500),
});
export type ClaimFormValues = z.infer<typeof claimFormSchema>;

const httpUrl = z
  .string()
  .trim()
  .min(1, "Enter the address of the source")
  .max(2048, "That address is too long")
  .refine((value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, "Enter a full address starting with http:// or https://");

export const sourceFormSchema = z.object({
  url: httpUrl,
  title: z
    .string()
    .trim()
    .min(1, "Give the source a title")
    .max(300, "Keep the title under 300 characters"),
  published_on: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Use the format YYYY-MM-DD",
    )
    .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), "That is not a real date"),
  source_type: z.enum(SOURCE_TYPES),
  excerpt: optionalText(5000),
  note: optionalText(5000),
  claim_id: z.string(),
  relation: z.enum(RELATIONS),
});
export type SourceFormValues = z.infer<typeof sourceFormSchema>;

export const reviewFormSchema = z.object({
  review_status: z.enum(REVIEW_STATUSES),
  reason: z
    .string()
    .trim()
    .min(3, "Say why the status is changing")
    .max(500, "Keep the reason under 500 characters"),
});
export type ReviewFormValues = z.infer<typeof reviewFormSchema>;

export const linkFormSchema = z.object({
  claim_id: z.string().min(1, "Choose a claim"),
  relation: z.enum(RELATIONS),
  relation_note: optionalText(2000),
});
export type LinkFormValues = z.infer<typeof linkFormSchema>;

export const linkExistingFormSchema = z.object({
  source_id: z.string().min(1, "Choose a source"),
  relation: z.enum(RELATIONS),
  relation_note: optionalText(2000),
});
export type LinkExistingFormValues = z.infer<typeof linkExistingFormSchema>;

export const authFormSchema = z.object({
  email: z.string().trim().min(1, "Enter your email").pipe(z.email("Enter a valid email address")),
  password: z.string().min(8, "Use at least 8 characters").max(72, "Use at most 72 characters"),
});
export type AuthFormValues = z.infer<typeof authFormSchema>;
