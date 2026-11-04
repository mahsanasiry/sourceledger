import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/states";
import { GraphView } from "@/features/evidence/components/graph-view";

export const metadata: Metadata = { title: "Evidence graph" };

export default async function GraphPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  return (
    <Suspense fallback={<LoadingState label="Building graph" />}>
      <GraphView workspaceId={workspaceId} />
    </Suspense>
  );
}
