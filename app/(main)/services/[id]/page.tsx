import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { PageSkeleton } from "@/components/loading-skeleton";
import { getRelatedOrders, getServiceOrderById, getTeknisiList } from "@/lib/data/service-orders";
import { getSettings } from "@/lib/data/settings";

import { ServiceDetailClient } from "./client";

async function ServiceDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = Number(id);
  const [order, settings, session, teknisiList] = await Promise.all([
    getServiceOrderById(orderId),
    getSettings(),
    auth(),
    getTeknisiList(),
  ]);
  if (!session?.user) redirect("/login");
  const userRole = session?.user?.role;

  if (!order) {
    notFound();
  }

  const relatedOrders = order.customerId
    ? await getRelatedOrders(order.customerId, order.merk, order.tipe, orderId)
    : [];

  return <ServiceDetailClient order={order} relatedOrders={relatedOrders} settings={settings} userRole={userRole} teknisiList={teknisiList} />;
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ServiceDetailContent params={params} />
    </Suspense>
  );
}
