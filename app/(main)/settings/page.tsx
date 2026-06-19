import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { PageSkeleton } from "@/components/loading-skeleton";
import { getSettings } from "@/lib/data/settings";

import { SettingsClient } from "./client";

async function SettingsContent() {
  const settings = await getSettings();
  return <SettingsClient initialSettings={settings} />;
}

export default async function SettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
