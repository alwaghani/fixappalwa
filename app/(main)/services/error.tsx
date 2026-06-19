"use client";

import { ErrorFallback } from "@/components/error-fallback";

export default function ServicesError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return <ErrorFallback error={error} reset={unstable_retry} />;
}
