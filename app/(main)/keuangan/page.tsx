import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { PageSkeleton } from "@/components/loading-skeleton";
import {
  getProfitStats,
  getRevenueStats,
  getTransactions,
  getCashAudits,
} from "@/lib/data/keuangan";

import { KeuanganClient } from "./client";

async function KeuanganContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { bulan, tahun, startDate: sd, endDate: ed } = await searchParams;
  const session = await auth();
  const month = bulan ? Number(bulan) : undefined;
  const year = tahun ? Number(tahun) : undefined;
  const startDate = typeof sd === "string" ? new Date(sd) : undefined;
  const endDate = typeof ed === "string" ? new Date(ed) : undefined;
  const startDateStr = typeof sd === "string" ? sd : undefined;
  const endDateStr = typeof ed === "string" ? ed : undefined;

  const [stats, profitStats, transactions, cashAudits] = await Promise.all([
    getRevenueStats(month, year, startDate, endDate),
    getProfitStats(month, year, startDate, endDate),
    getTransactions(month, year, startDate, endDate),
    getCashAudits(month, year, startDate, endDate),
  ]);

  return (
    <KeuanganClient
      stats={stats}
      profitStats={profitStats}
      transactions={transactions}
      cashAudits={cashAudits}
      bulan={month}
      tahun={year}
      startDate={startDateStr}
      endDate={endDateStr}
      userRole={session?.user?.role}
    />
  );
}

export default async function KeuanganPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "kasir" && session?.user?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      <KeuanganContent searchParams={searchParams} />
    </Suspense>
  );
}
