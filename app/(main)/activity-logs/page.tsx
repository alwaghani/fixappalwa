import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { PageSkeleton } from "@/components/loading-skeleton";
import { getActivityLogs } from "@/lib/data/activity-logs";

import { ActivityLogsClient } from "./client";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    action?: string;
  }>;
};

async function ActivityLogsContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1") || 1;
  const search = params.search || "";
  const action = params.action || "ALL";

  const { logs, totalPages, currentPage, total } = await getActivityLogs({
    page,
    search,
    action,
  });

  return (
    <ActivityLogsClient
      initialLogs={logs}
      totalPages={totalPages}
      currentPage={currentPage}
      total={total}
      initialSearch={search}
      initialAction={action}
    />
  );
}

export default async function ActivityLogsPage(props: PageProps) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      <ActivityLogsContent searchParams={props.searchParams} />
    </Suspense>
  );
}
