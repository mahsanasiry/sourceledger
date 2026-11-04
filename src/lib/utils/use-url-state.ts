"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  parseSourceQuery,
  serializeSourceQuery,
  type SourceQuery,
} from "@/features/sources/source-query";

type Commit = { history?: "push" | "replace" };

export function useSourceQueryState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serialized = searchParams.toString();

  const query = useMemo(() => parseSourceQuery(new URLSearchParams(serialized)), [serialized]);

  const update = useCallback(
    (patch: Partial<SourceQuery>, { history = "push" }: Commit = {}) => {
      const next = serializeSourceQuery({ ...query, ...patch });
      const target = next ? `${pathname}?${next}` : pathname;
      if (history === "replace") router.replace(target, { scroll: false });
      else router.push(target, { scroll: false });
    },
    [pathname, query, router],
  );

  return { query, update };
}
