"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CLAIM_LABELS, ClaimStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { tallyClaims } from "@/features/evidence/evidence";
import { CLAIM_STATUSES, type ClaimStatus } from "@/lib/validation/schemas";
import { applyParamPatch } from "@/lib/utils/search-params";
import { useClaims, useCreateClaim, useLinks } from "../hooks";
import { ClaimForm } from "./claim-form";

export function ClaimsView({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();
  const claims = useClaims(workspaceId);
  const links = useLinks(workspaceId);
  const create = useCreateClaim(workspaceId);
  const [creating, setCreating] = useState(false);

  const q = searchParams.get("q") ?? "";
  const statusParam = searchParams.get("status");
  const status = CLAIM_STATUSES.find((value) => value === statusParam) ?? null;

  const setParams = (
    patch: Record<string, string | null>,
    history: "push" | "replace" = "push",
  ) => {
    const next = applyParamPatch(searchParams.toString(), patch);
    const target = next ? `${pathname}?${next}` : pathname;
    if (history === "replace") router.replace(target, { scroll: false });
    else router.push(target, { scroll: false });
  };

  const tallies = useMemo(
    () => tallyClaims(claims.data ?? [], links.data ?? []),
    [claims.data, links.data],
  );

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (claims.data ?? []).filter(
      (claim) =>
        (!status || claim.status === status) &&
        (!needle || `${claim.statement} ${claim.conclusion}`.toLowerCase().includes(needle)),
    );
  }, [claims.data, q, status]);

  if (claims.isPending || links.isPending) return <LoadingState label="Loading claims" />;
  if (claims.isError || links.isError) {
    return (
      <ErrorState
        error={claims.error ?? links.error}
        onRetry={() => {
          void claims.refetch();
          void links.refetch();
        }}
        title="Claims did not load"
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="claim-search" className="text-ink-muted text-xs font-medium">
              Search claims
            </label>
            <input
              id="claim-search"
              type="search"
              defaultValue={q}
              key={q}
              onChange={(event) => setParams({ q: event.target.value }, "replace")}
              className="border-line bg-surface min-h-10 w-64 rounded-md border px-3 text-sm"
            />
          </div>
          <label className="text-ink-muted flex flex-col gap-1 text-xs font-medium">
            Status
            <select
              value={status ?? ""}
              onChange={(event) =>
                setParams({ status: (event.target.value || null) as ClaimStatus | null })
              }
              className="border-line bg-surface text-ink min-h-10 rounded-md border px-3 text-sm"
            >
              <option value="">All statuses</option>
              {CLAIM_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {CLAIM_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Button onClick={() => setCreating(true)}>New claim</Button>
      </div>

      {claims.data.length === 0 ? (
        <EmptyState
          title="No claims yet"
          description="Start with the claim or research question you want to investigate. Sources attach to it as supporting, contradicting or context."
          action={<Button onClick={() => setCreating(true)}>Create the first claim</Button>}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No claims match"
          description="Try a different search or clear the status filter."
          action={
            <Button variant="secondary" onClick={() => setParams({ q: null, status: null })}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((claim) => {
            const tally = tallies.get(claim.id);
            return (
              <li key={claim.id}>
                <Link
                  href={`/workspaces/${workspaceId}/claims/${claim.id}`}
                  className="border-line bg-surface hover:border-accent flex flex-col gap-2 rounded-lg border p-4 transition"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <ClaimStatusBadge status={claim.status} />
                  </span>
                  <span className="text-base leading-snug font-semibold">{claim.statement}</span>
                  {claim.conclusion ? (
                    <span className="text-ink-muted line-clamp-2 text-sm">{claim.conclusion}</span>
                  ) : null}
                  <span className="text-ink-muted text-xs">
                    {tally?.supports ?? 0} supporting · {tally?.contradicts ?? 0} contradicting ·{" "}
                    {tally?.context ?? 0} context
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={creating} title="New claim" onClose={() => setCreating(false)}>
        <ClaimForm
          mode="create"
          submitting={create.isPending}
          error={create.error}
          onCancel={() => setCreating(false)}
          onSubmit={(values) =>
            create.mutate(values, {
              onSuccess: (claim) => {
                setCreating(false);
                toast.success("Claim created");
                router.push(`/workspaces/${workspaceId}/claims/${claim.id}`);
              },
            })
          }
        />
      </Modal>
    </div>
  );
}
