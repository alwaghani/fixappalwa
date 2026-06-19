import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { PageSkeleton } from "@/components/loading-skeleton";
import { getUsers } from "@/lib/data/users";

import { TeknisiClient } from "./client";

async function TeknisiContent() {
  const users = await getUsers();
  return <TeknisiClient users={users} />;
}

export default async function TeknisiPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      <TeknisiContent />
    </Suspense>
  );
}
