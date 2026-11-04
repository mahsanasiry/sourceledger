import type { Metadata } from "next";
import { ActivityList } from "@/features/activity/components/activity-list";

export const metadata: Metadata = { title: "History" };

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return (
    <section aria-labelledby="history-heading" className="flex flex-col gap-4">
      <h2 id="history-heading" className="text-lg font-semibold">
        Workspace history
      </h2>
      <ActivityList workspaceId={workspaceId} scope={{ limit: 300 }} />
    </section>
  );
}
