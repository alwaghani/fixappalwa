import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { PageSkeleton } from "@/components/loading-skeleton";
import { countCustomers, getCustomers } from "@/lib/data/customers";

import { CustomerClient } from "./client";

const PAGE_SIZE = 20;

async function CustomersContent({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { search, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [customers, total] = await Promise.all([
    getCustomers(search, PAGE_SIZE, skip),
    countCustomers(search),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <CustomerClient
      customers={customers}
      search={search || ""}
      page={page}
      totalPages={totalPages}
    />
  );
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <Suspense fallback={<PageSkeleton />}>
      <CustomersContent searchParams={searchParams} />
    </Suspense>
  );
}
