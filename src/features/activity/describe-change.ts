import { CLAIM_LABELS, RELATION_LABELS, REVIEW_LABELS } from "@/components/ui/badge";
import { SOURCE_TYPE_LABELS } from "@/features/sources/components/source-form";

export type ChangeDescription =
  | { kind: "set"; to: string }
  | { kind: "removed"; from: string }
  | { kind: "changed"; from: string; to: string };

const VALUE_LABELS: Record<string, Record<string, string>> = {
  relation: RELATION_LABELS,
  status: CLAIM_LABELS,
  review_status: REVIEW_LABELS,
  source_type: SOURCE_TYPE_LABELS,
};

const MAX_LENGTH = 160;

function formatValue(field: string, value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (field === "flagged") return value ? "Flagged" : "Not flagged";
  const text = String(value);
  const label = VALUE_LABELS[field]?.[text] ?? text;
  return label.length > MAX_LENGTH ? `${label.slice(0, MAX_LENGTH)}…` : label;
}

export function describeChange(
  field: string,
  from: unknown,
  to: unknown,
): ChangeDescription | null {
  const before = formatValue(field, from);
  const after = formatValue(field, to);
  if (before === null && after === null) return null;
  if (before === null) return { kind: "set", to: after ?? "" };
  if (after === null) return { kind: "removed", from: before };
  return { kind: "changed", from: before, to: after };
}
