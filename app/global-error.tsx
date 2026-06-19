"use client";

import { ErrorFallback } from "@/components/error-fallback";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html>
      <body className="h-full bg-background">
        <ErrorFallback error={error} reset={unstable_retry} />
      </body>
    </html>
  );
}
