"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { RELATION_LABELS } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { InlineError } from "@/components/ui/states";
import { toUserMessage } from "@/lib/utils/errors";
import {
  RELATIONS,
  SOURCE_TYPES,
  sourceFormSchema,
  type Claim,
  type SourceFormValues,
} from "@/lib/validation/schemas";

export const SOURCE_TYPE_LABELS: Record<(typeof SOURCE_TYPES)[number], string> = {
  news: "News article",
  academic: "Academic paper",
  government: "Government document",
  report: "Report",
  social: "Social media or blog",
  interview: "Interview",
  dataset: "Dataset",
  other: "Other",
};

type SourceFormProps = {
  mode: "create" | "edit";
  claims: Claim[];
  initialValues?: SourceFormValues;
  submitting: boolean;
  error: unknown;
  onSubmit: (values: SourceFormValues) => void;
  onCancel: () => void;
};

const EMPTY: SourceFormValues = {
  url: "",
  title: "",
  published_on: "",
  source_type: "news",
  excerpt: "",
  note: "",
  claim_id: "",
  relation: "supports",
};

export function SourceForm({
  mode,
  claims,
  initialValues = EMPTY,
  submitting,
  error,
  onSubmit,
  onCancel,
}: SourceFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SourceFormValues>({
    resolver: zodResolver(sourceFormSchema),
    defaultValues: initialValues,
  });
  const chosenClaim = useWatch({ control, name: "claim_id" });
  const linking = mode === "create" && chosenClaim !== "";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <TextField
        label="Address"
        type="url"
        inputMode="url"
        placeholder="https://"
        autoFocus
        error={errors.url?.message}
        {...register("url")}
      />
      <TextField label="Title" error={errors.title?.message} {...register("title")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Publication date"
          type="date"
          error={errors.published_on?.message}
          {...register("published_on")}
        />
        <SelectField label="Type" error={errors.source_type?.message} {...register("source_type")}>
          {SOURCE_TYPES.map((type) => (
            <option key={type} value={type}>
              {SOURCE_TYPE_LABELS[type]}
            </option>
          ))}
        </SelectField>
      </div>
      <TextAreaField
        label="What the source says"
        hint="Paste the passage that matters, so you do not depend on the link staying alive."
        rows={3}
        error={errors.excerpt?.message}
        {...register("excerpt")}
      />
      <TextAreaField
        label="Your note"
        rows={2}
        error={errors.note?.message}
        {...register("note")}
      />
      {mode === "create" ? (
        <fieldset className="border-line grid gap-4 rounded-md border p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm font-medium">Link to a claim (optional)</legend>
          <SelectField label="Claim" {...register("claim_id")}>
            <option value="">Do not link yet</option>
            {claims.map((claim) => (
              <option key={claim.id} value={claim.id}>
                {claim.statement.length > 70 ? `${claim.statement.slice(0, 70)}…` : claim.statement}
              </option>
            ))}
          </SelectField>
          <SelectField label="Relation" disabled={!linking} {...register("relation")}>
            {RELATIONS.map((relation) => (
              <option key={relation} value={relation}>
                {RELATION_LABELS[relation]}
              </option>
            ))}
          </SelectField>
        </fieldset>
      ) : null}
      <InlineError message={error ? toUserMessage(error) : null} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {mode === "create" ? "Add source" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
