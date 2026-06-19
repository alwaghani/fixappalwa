import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getCustomers } from "@/lib/data/customers";
import { getTeknisiList } from "@/lib/data/service-orders";

import { NewServiceClient } from "./client";

export default async function NewServicePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [{ customerId }, customers, teknisiList] = await Promise.all([
    searchParams,
    getCustomers(),
    getTeknisiList(),
  ]);

  return (
    <NewServiceClient
      customers={customers}
      selectedCustomerId={customerId ? Number(customerId) : undefined}
      teknisiList={teknisiList}
    />
  );
}
