import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { PageSkeleton } from "@/components/loading-skeleton";
import { countServiceOrders, getServiceOrders } from "@/lib/data/service-orders";

import { ServicesClient } from "./client";

const PAGE_SIZE = 20;

async function ServicesContent({
  searchParams,
  teknisiId,
  userRole,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
  teknisiId?: number;
  userRole?: string;
}) {
  const { status, search, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [orders, total] = await Promise.all([
    getServiceOrders(status, search, PAGE_SIZE, skip, undefined, teknisiId),
    countServiceOrders(status, undefined, search, teknisiId),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <ServicesClient
      orders={orders}
      currentStatus={status || ""}
      search={search || ""}
      page={page}
      totalPages={totalPages}
      userRole={userRole}
    />
  );
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const teknisiId = session.user.role === "teknisi" && session.user.id ? Number(session.user.id) : undefined;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <ServicesContent searchParams={searchParams} teknisiId={teknisiId} userRole={session.user.role} />
    </Suspense>
  );
}
