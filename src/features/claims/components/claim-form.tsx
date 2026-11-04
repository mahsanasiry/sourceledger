"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CLAIM_LABELS } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField } from "@/components/ui/field";
import { InlineError } from "@/components/ui/states";
import { toUserMessage } from "@/lib/utils/errors";
import { CLAIM_STATUSES, claimFormSchema, type ClaimFormValues } from "@/lib/validation/schemas";

type ClaimFormProps = {
  mode: "create" | "edit";
  initialValues?: ClaimFormValues;
  submitting: boolean;
  error: unknown;
  onSubmit: (values: ClaimFormValues) => void;
  onCancel: () => void;
};

const EMPTY: ClaimFormValues = { statement: "", conclusion: "", status: "open", reason: "" };

export function ClaimForm({
  mode,
  initialValues = EMPTY,
  submitting,
  error,
  onSubmit,
  onCancel,
}: ClaimFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: initialValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <TextAreaField
        label="Claim or research question"
        rows={2}
        autoFocus
        error={errors.statement?.message}
        {...register("statement")}
      />
      <SelectField label="Status" error={errors.status?.message} {...register("status")}>
        {CLAIM_STATUSES.map((status) => (
          <option key={status} value={status}>
            {CLAIM_LABELS[status]}
          </option>
        ))}
      </SelectField>
      <TextAreaField
        label="Conclusion"
        hint="What you currently believe and how confident you are."
        rows={4}
        error={errors.conclusion?.message}
        {...register("conclusion")}
      />
      {mode === "edit" ? (
        <TextAreaField
          label="Reason for this change"
          hint="Saved with the history entry. Optional, but future you will want it."
          rows={2}
          error={errors.reason?.message}
          {...register("reason")}
        />
      ) : null}
      <InlineError message={error ? toUserMessage(error) : null} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {mode === "create" ? "Create claim" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
