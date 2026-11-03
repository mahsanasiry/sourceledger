export const queryKeys = {
  workspaces: () => ["workspaces"] as const,
  workspace: (workspaceId: string) => ["workspace", workspaceId] as const,
  claims: (workspaceId: string) => ["claims", workspaceId] as const,
  sources: (workspaceId: string) => ["sources", workspaceId] as const,
  links: (workspaceId: string) => ["links", workspaceId] as const,
  activity: (workspaceId: string, scope: string) => ["activity", workspaceId, scope] as const,
  activityRoot: (workspaceId: string) => ["activity", workspaceId] as const,
};
