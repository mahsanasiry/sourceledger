import { cn } from "@/lib/utils/cn";
import type { ClaimStatus, Relation, ReviewStatus } from "@/lib/validation/schemas";

const BASE = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

const REVIEW_STYLES: Record<ReviewStatus, string> = {
  unreviewed: "bg-surface-muted text-ink-muted",
  in_review: "bg-warning-soft text-warning",
  verified: "bg-support-soft text-support",
  rejected: "bg-contradict-soft text-contradict",
};

const CLAIM_STYLES: Record<ClaimStatus, string> = {
  open: "bg-surface-muted text-ink-muted",
  supported: "bg-support-soft text-support",
  contested: "bg-warning-soft text-warning",
  refuted: "bg-contradict-soft text-contradict",
};

const RELATION_STYLES: Record<Relation, string> = {
  supports: "bg-support-soft text-support",
  contradicts: "bg-contradict-soft text-contradict",
  context: "bg-context-soft text-context",
};

export const REVIEW_LABELS: Record<ReviewStatus, string> = {
  unreviewed: "Unreviewed",
  in_review: "In review",
  verified: "Verified",
  rejected: "Rejected",
};

export const CLAIM_LABELS: Record<ClaimStatus, string> = {
  open: "Open",
  supported: "Supported",
  contested: "Contested",
  refuted: "Refuted",
};

export const RELATION_LABELS: Record<Relation, string> = {
  supports: "Supports",
  contradicts: "Contradicts",
  context: "Context",
};

export function ReviewBadge({ status }: { status: ReviewStatus }) {
  return <span className={cn(BASE, REVIEW_STYLES[status])}>{REVIEW_LABELS[status]}</span>;
}

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  return <span className={cn(BASE, CLAIM_STYLES[status])}>{CLAIM_LABELS[status]}</span>;
}

export function RelationBadge({ relation }: { relation: Relation }) {
  return <span className={cn(BASE, RELATION_STYLES[relation])}>{RELATION_LABELS[relation]}</span>;
}

export function FlagBadge() {
  return <span className={cn(BASE, "bg-warning-soft text-warning")}>Flagged</span>;
}
