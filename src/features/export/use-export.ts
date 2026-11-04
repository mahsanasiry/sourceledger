"use client";

import { useMutation } from "@tanstack/react-query";
import { listAllActivity } from "@/features/activity/api";
import { listClaims, listLinks } from "@/features/claims/api";
import { listSources } from "@/features/sources/api";
import { getWorkspace } from "@/features/workspaces/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildCsvExport, buildJsonExport, exportFileName } from "./workspace-export";

function download(fileName: string, content: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function useExportWorkspace(workspaceId: string) {
  return useMutation({
    mutationFn: async (format: "json" | "csv") => {
      const client = getSupabaseBrowserClient();
      const [workspace, claims, sources, links, activity] = await Promise.all([
        getWorkspace(client, workspaceId),
        listClaims(client, workspaceId),
        listSources(client, workspaceId),
        listLinks(client, workspaceId),
        listAllActivity(client, workspaceId),
      ]);
      const snapshot = { workspace, claims, sources, links, activity };
      const now = new Date();
      const fileName = exportFileName(workspace.name, format, now);
      if (format === "json") {
        download(fileName, buildJsonExport(snapshot, now), "application/json");
      } else {
        download(fileName, buildCsvExport(snapshot), "text/csv;charset=utf-8");
      }
      return fileName;
    },
  });
}
