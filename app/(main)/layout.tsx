import { Suspense } from "react";

import AppShell from "@/app/components/app-shell";
import { AuthProvider } from "@/components/auth/session-provider";
import ToastWrapper from "@/components/ui/toast-wrapper";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={null}>
      <AuthProvider>
        <AppShell>{children}</AppShell>
        <ToastWrapper />
      </AuthProvider>
    </Suspense>
  );
}
