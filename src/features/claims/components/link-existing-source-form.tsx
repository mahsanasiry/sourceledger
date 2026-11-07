"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { RELATION_LABELS } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { InlineError } from "@/components/ui/states";
import { hostOf } from "@/features/sources/components/source-card";
import { toUserMessage } from "@/lib/utils/errors";
import {
  RELATIONS,
  linkExistingFormSchema,
  type LinkExistingFormValues,
  type Source,
} from "@/lib/validation/schemas";

type LinkExistingSourceFormProps = {
  candidates: Source[];
  submitting: boolean;
  error: unknown;
  onSubmit: (values: LinkExistingFormValues) => void;
  onCancel: () => void;
};

export function LinkExistingSourceForm({
  candidates,
  submitting,
  error,
  onSubmit,
  onCancel,
}: LinkExistingSourceFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LinkExistingFormValues>({
    resolver: zodResolver(linkExistingFormSchema),
    defaultValues: { source_id: "", relation: "supports", relation_note: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <SelectField label="Source" error={errors.source_id?.message} {...register("source_id")}>
        <option value="">Choose a source</option>
        {candidates.map((source) => (
          <option key={source.id} value={source.id}>
            {source.title} ({hostOf(source.url)})
          </option>
        ))}
      </SelectField>
      <SelectField label="Relation to this claim" {...register("relation")}>
        {RELATIONS.map((relation) => (
          <option key={relation} value={relation}>
            {RELATION_LABELS[relation]}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Why does it relate this way?"
        hint="Optional. Shown on the evidence board."
        error={errors.relation_note?.message}
        {...register("relation_note")}
      />
      <InlineError message={error ? toUserMessage(error) : null} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Link source
        </Button>
      </div>
    </form>
  );
}
