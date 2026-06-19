import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/loading-skeleton";
import { getCustomerById } from "@/lib/data/customers";
import { getServiceOrders } from "@/lib/data/service-orders";

import { CustomerDetailClient } from "./client";

async function CustomerDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customerId = Number(id);

  const [customer, orders] = await Promise.all([
    getCustomerById(customerId),
    getServiceOrders(undefined, undefined, 50, 0, customerId),
  ]);

  if (!customer) {
    notFound();
  }

  return <CustomerDetailClient customer={customer} orders={orders} />;
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CustomerDetailContent params={params} />
    </Suspense>
  );
}
