"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { RELATION_LABELS } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { InlineError } from "@/components/ui/states";
import { toUserMessage } from "@/lib/utils/errors";
import {
  RELATIONS,
  linkFormSchema,
  type Claim,
  type LinkFormValues,
} from "@/lib/validation/schemas";

type LinkFormProps = {
  claims: Claim[];
  submitting: boolean;
  error: unknown;
  onSubmit: (values: LinkFormValues) => void;
  initialClaimId?: string;
};

export function LinkForm({ claims, submitting, error, onSubmit, initialClaimId = "" }: LinkFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LinkFormValues>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: { claim_id: initialClaimId, relation: "supports", relation_note: "" },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        onSubmit(values);
        reset({ claim_id: "", relation: "supports", relation_note: "" });
      })}
      noValidate
      className="flex flex-col gap-3"
    >
      <SelectField label="Claim" error={errors.claim_id?.message} {...register("claim_id")}>
        <option value="">Choose a claim</option>
        {claims.map((claim) => (
          <option key={claim.id} value={claim.id}>
            {claim.statement.length > 60 ? `${claim.statement.slice(0, 60)}…` : claim.statement}
          </option>
        ))}
      </SelectField>
      <SelectField label="Relation" {...register("relation")}>
        {RELATIONS.map((relation) => (
          <option key={relation} value={relation}>
            {RELATION_LABELS[relation]}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Why does it relate this way?"
        error={errors.relation_note?.message}
        {...register("relation_note")}
      />
      <InlineError message={error ? toUserMessage(error) : null} />
      <Button type="submit" variant="secondary" loading={submitting}>
        Save link
      </Button>
    </form>
  );
}
