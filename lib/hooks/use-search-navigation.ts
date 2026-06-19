"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useSearchNavigation(basePath: string) {
  const router = useRouter();

  return useCallback(
    (search: string, extraParams?: Record<string, string>) =>
      (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (extraParams) {
          for (const [key, value] of Object.entries(extraParams)) {
            if (value) params.set(key, value);
          }
        }
        const qs = params.toString();
        router.push(qs ? `${basePath}?${qs}` : basePath);
      },
    [basePath, router],
  );
}
