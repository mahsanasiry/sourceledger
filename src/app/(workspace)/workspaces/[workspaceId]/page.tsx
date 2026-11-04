import type { Metadata } from "next";
import { Suspense } from "react";
import { ClaimsView } from "@/features/claims/components/claims-view";
import { LoadingState } from "@/components/ui/states";

export const metadata: Metadata = { title: "Claims" };

export default async function ClaimsPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  return (
    <Suspense fallback={<LoadingState label="Loading claims" />}>
      <ClaimsView workspaceId={workspaceId} />
    </Suspense>
  );
}
