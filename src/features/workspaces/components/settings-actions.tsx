"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { toUserMessage } from "@/lib/utils/errors";
import { useCreateSampleWorkspace } from "../hooks";

export function SettingsActions() {
  const router = useRouter();
  const toast = useToast();
  const sample = useCreateSampleWorkspace();

  return (
    <section
      aria-labelledby="sample-heading"
      className="border-line bg-surface rounded-lg border p-5"
    >
      <h2 id="sample-heading" className="text-base font-semibold">
        Sample workspace
      </h2>
      <p className="text-ink-muted mt-1 text-sm">
        Adds a copy of the illustrative workspace with two claims, seven sources and a short
        history. Useful for trying the evidence board and graph.
      </p>
      <Button
        className="mt-4"
        variant="secondary"
        loading={sample.isPending}
        onClick={() =>
          sample.mutate(undefined, {
            onSuccess: (workspaceId) => {
              toast.success("Sample workspace added");
              router.push(`/workspaces/${workspaceId}`);
            },
            onError: (error) => toast.error(toUserMessage(error)),
          })
        }
      >
        Add sample workspace
      </Button>
    </section>
  );
}
