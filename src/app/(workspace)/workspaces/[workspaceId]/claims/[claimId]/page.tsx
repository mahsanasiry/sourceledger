import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/states";
import { ClaimEvidenceFile } from "@/features/claims/components/claim-evidence-file";

export const metadata: Metadata = { title: "Evidence file" };

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ workspaceId: string; claimId: string }>;
}) {
  const { workspaceId, claimId } = await params;
  return (
    <Suspense fallback={<LoadingState label="Loading evidence file" />}>
      <ClaimEvidenceFile workspaceId={workspaceId} claimId={claimId} />
    </Suspense>
  );
}
