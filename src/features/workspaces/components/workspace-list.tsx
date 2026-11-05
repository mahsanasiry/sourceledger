"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils/dates";
import { toUserMessage } from "@/lib/utils/errors";
import { useCreateSampleWorkspace, useCreateWorkspace, useWorkspaces } from "../hooks";
import { WorkspaceForm } from "./workspace-form";

export function WorkspaceList() {
  const router = useRouter();
  const toast = useToast();
  const workspaces = useWorkspaces();
  const create = useCreateWorkspace();
  const sample = useCreateSampleWorkspace();
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Workspaces</h1>
        <Button onClick={() => setCreating(true)}>New workspace</Button>
      </div>

      {workspaces.isPending ? <LoadingState label="Loading workspaces" /> : null}
      {workspaces.isError ? (
        <ErrorState
          error={workspaces.error}
          onRetry={() => workspaces.refetch()}
          title="Workspaces did not load"
        />
      ) : null}
      {workspaces.isSuccess && workspaces.data.length === 0 ? (
        <EmptyState
          title="No workspaces yet"
          description="A workspace holds the claims and sources for one investigation. Create one, or start from a sample to see how an evidence file works."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => setCreating(true)}>New workspace</Button>
              <Button
                variant="secondary"
                loading={sample.isPending}
                onClick={() =>
                  sample.mutate(undefined, {
                    onSuccess: () => toast.success("Sample workspace added"),
                    onError: (error) => toast.error(toUserMessage(error)),
                  })
                }
              >
                Add a sample workspace
              </Button>
            </div>
          }
        />
      ) : null}
      {workspaces.isSuccess && workspaces.data.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.data.map((workspace) => (
            <li key={workspace.id}>
              <Link
                href={`/workspaces/${workspace.id}`}
                className="border-line bg-surface hover:border-accent flex h-full flex-col gap-2 rounded-lg border p-5 transition"
              >
                <span className="text-base font-semibold">{workspace.name}</span>
                <span className="text-ink-muted line-clamp-3 text-sm">
                  {workspace.description || "No description"}
                </span>
                <span className="text-ink-muted mt-auto pt-2 text-xs">
                  Created {formatDate(workspace.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <Modal open={creating} title="New workspace" onClose={() => setCreating(false)}>
        <WorkspaceForm
          submitLabel="Create workspace"
          submitting={create.isPending}
          error={create.error}
          onCancel={() => setCreating(false)}
          onSubmit={(values) =>
            create.mutate(values, {
              onSuccess: (workspace) => {
                setCreating(false);
                toast.success("Workspace created");
                router.push(`/workspaces/${workspace.id}`);
              },
            })
          }
        />
      </Modal>
    </div>
  );
}
