"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { REVIEW_LABELS } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField } from "@/components/ui/field";
import { InlineError } from "@/components/ui/states";
import { toUserMessage } from "@/lib/utils/errors";
import {
  REVIEW_STATUSES,
  reviewFormSchema,
  type ReviewFormValues,
  type ReviewStatus,
} from "@/lib/validation/schemas";

type ReviewFormProps = {
  current: ReviewStatus;
  submitting: boolean;
  error: unknown;
  onSubmit: (values: ReviewFormValues) => void;
};

export function ReviewForm({ current, submitting, error, onSubmit }: ReviewFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { review_status: current, reason: "" },
  });
  const chosen = useWatch({ control, name: "review_status" });
  const unchanged = chosen === current;

  return (
    <form
      onSubmit={handleSubmit((values) => {
        onSubmit(values);
        reset({ review_status: values.review_status, reason: "" });
      })}
      noValidate
      className="flex flex-col gap-3"
    >
      <SelectField label="Review status" {...register("review_status")}>
        {REVIEW_STATUSES.map((status) => (
          <option key={status} value={status}>
            {REVIEW_LABELS[status]}
          </option>
        ))}
      </SelectField>
      <TextAreaField
        label="Why is the status changing?"
        rows={2}
        error={errors.reason?.message}
        {...register("reason")}
      />
      <InlineError message={error ? toUserMessage(error) : null} />
      <Button type="submit" loading={submitting} disabled={unchanged}>
        Record status change
      </Button>
    </form>
  );
}
