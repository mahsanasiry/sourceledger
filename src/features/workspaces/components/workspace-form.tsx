"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/field";
import { InlineError } from "@/components/ui/states";
import { toUserMessage } from "@/lib/utils/errors";
import { workspaceFormSchema, type WorkspaceFormValues } from "@/lib/validation/schemas";

type WorkspaceFormProps = {
  initialValues?: WorkspaceFormValues;
  submitLabel: string;
  submitting: boolean;
  error: unknown;
  onSubmit: (values: WorkspaceFormValues) => void;
  onCancel: () => void;
};

export function WorkspaceForm({
  initialValues = { name: "", description: "" },
  submitLabel,
  submitting,
  error,
  onSubmit,
  onCancel,
}: WorkspaceFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: initialValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <TextField label="Name" autoFocus error={errors.name?.message} {...register("name")} />
      <TextAreaField
        label="What are you investigating?"
        hint="Optional. A sentence of context helps teammates."
        error={errors.description?.message}
        {...register("description")}
      />
      <InlineError message={error ? toUserMessage(error) : null} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
