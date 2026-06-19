"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ErrorFallback({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-foreground">Terjadi kesalahan</h2>
      <p className="mt-1 max-w-md text-center text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={() => reset()} variant="default" className="mt-6">
        <RefreshCw className="h-4 w-4" />
        Coba lagi
      </Button>
    </div>
  );
}
