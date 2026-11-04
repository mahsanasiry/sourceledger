"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ErrorState, InlineError, LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useExportWorkspace } from "@/features/export/use-export";
import { cn } from "@/lib/utils/cn";
import { toUserMessage } from "@/lib/utils/errors";
import { useDeleteWorkspace, useUpdateWorkspace, useWorkspace } from "../hooks";
import { WorkspaceForm } from "./workspace-form";

const TABS = [
  { segment: "", label: "Claims" },
  { segment: "/sources", label: "Sources" },
  { segment: "/graph", label: "Graph" },
  { segment: "/activity", label: "History" },
];

export function WorkspaceShell({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const workspace = useWorkspace(workspaceId);
  const update = useUpdateWorkspace(workspaceId);
  const remove = useDeleteWorkspace();
  const exporter = useExportWorkspace(workspaceId);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (workspace.isPending) return <LoadingState label="Loading workspace" />;
  if (workspace.isError) {
    return (
      <ErrorState
        error={workspace.error}
        onRetry={() => workspace.refetch()}
        title="Workspace did not load"
      />
    );
  }

  const base = `/workspaces/${workspaceId}`;
  const exportTo = (format: "json" | "csv") =>
    exporter.mutate(format, {
      onSuccess: (fileName) => toast.success(`Exported ${fileName}`),
      onError: (error) => toast.error(toUserMessage(error)),
    });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/workspaces" className="text-accent text-sm underline">
          All workspaces
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold">{workspace.data.name}</h1>
            {workspace.data.description ? (
              <p className="text-ink-muted mt-1 text-sm">{workspace.data.description}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              loading={exporter.isPending && exporter.variables === "json"}
              disabled={exporter.isPending}
              onClick={() => exportTo("json")}
            >
              Export JSON
            </Button>
            <Button
              variant="secondary"
              loading={exporter.isPending && exporter.variables === "csv"}
              disabled={exporter.isPending}
              onClick={() => exportTo("csv")}
            >
              Export CSV
            </Button>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Rename
            </Button>
            <Button variant="danger" onClick={() => setDeleting(true)}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      <nav aria-label="Workspace sections" className="border-line flex gap-1 border-b">
        {TABS.map((tab) => {
          const href = `${base}${tab.segment}`;
          const active =
            tab.segment === ""
              ? pathname === base || pathname.startsWith(`${base}/claims`)
              : pathname.startsWith(href);
          return (
            <Link
              key={tab.label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-4 py-2 text-sm font-medium",
                active
                  ? "border-accent text-ink"
                  : "text-ink-muted hover:text-ink border-transparent",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}

      <Modal open={editing} title="Rename workspace" onClose={() => setEditing(false)}>
        <WorkspaceForm
          initialValues={{ name: workspace.data.name, description: workspace.data.description }}
          submitLabel="Save changes"
          submitting={update.isPending}
          error={update.error}
          onCancel={() => setEditing(false)}
          onSubmit={(values) =>
            update.mutate(values, {
              onSuccess: () => {
                setEditing(false);
                toast.success("Workspace updated");
              },
            })
          }
        />
      </Modal>

      <Modal open={deleting} title="Delete this workspace?" onClose={() => setDeleting(false)}>
        <p className="text-sm">
          All claims, sources, links and history in “{workspace.data.name}” will be permanently
          deleted. Export a copy first if you may need it.
        </p>
        <div className="mt-4">
          <InlineError message={remove.error ? toUserMessage(remove.error) : null} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setDeleting(false)}
            disabled={remove.isPending}
          >
            Keep workspace
          </Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            onClick={() =>
              remove.mutate(workspaceId, {
                onSuccess: () => {
                  toast.success("Workspace deleted");
                  router.replace("/workspaces");
                },
              })
            }
          >
            Delete workspace
          </Button>
        </div>
      </Modal>
    </div>
  );
}
