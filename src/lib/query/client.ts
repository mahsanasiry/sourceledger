import { QueryClient } from "@tanstack/react-query";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => failureCount < 2 && isTransient(error),
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function isTransient(error: unknown): boolean {
  if (error instanceof Error && "status" in error) {
    const status = Number((error as { status: unknown }).status);
    return status >= 500 || status === 0;
  }
  return error instanceof TypeError;
}
