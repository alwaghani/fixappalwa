"use client"

import { Wrench, AlertTriangle } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense, useActionState } from "react"

import { Button } from "@/components/ui/button"

import { authenticate } from "./actions"

function LoginForm() {
  const searchParams = useSearchParams()
  const rawCallback = searchParams.get("callbackUrl") || "/dashboard"
  const callbackUrl = rawCallback.startsWith("/") && !rawCallback.startsWith("//") && !rawCallback.includes("://")
    ? rawCallback
    : "/dashboard"
  const [error, formAction, isPending] = useActionState(authenticate, undefined)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="space-y-2.5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">FixApp</h1>
            <p className="mt-1 text-sm text-muted-foreground">Silakan masuk ke panel admin</p>
          </div>
        </div>

        <div className="rounded-xl bg-card p-5 shadow-sm">
          
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />

            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                autoFocus
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                placeholder="admin"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-in fade-in flex items-center gap-2" role="alert">
                <AlertTriangle className="h-4 w-4 shrink-0 text-destructive/80" />
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 shadow-lg shadow-primary/10 hover:shadow-primary/20"
              size="lg"
            >
              {isPending ? "Memproses…" : "Masuk ke Dashboard"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card">
        <Wrench className="h-6 w-6 animate-pulse text-primary" />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}
