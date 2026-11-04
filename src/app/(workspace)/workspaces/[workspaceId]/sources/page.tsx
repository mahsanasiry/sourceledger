import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/states";
import { SourcesView } from "@/features/sources/components/sources-view";

export const metadata: Metadata = { title: "Sources" };

export default async function SourcesPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return (
    <Suspense fallback={<LoadingState label="Loading sources" />}>
      <SourcesView workspaceId={workspaceId} />
    </Suspense>
  );
}
