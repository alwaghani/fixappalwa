import "server-only";

import { cache } from "react";

import prisma from "@/lib/prisma";

type CustomerBrief = {
  id: number;
  nama: string;
  noHp: string;
};

export type RevenueStats = {
  revenueBulanIni: number;
  revenueTahunIni: number;
  totalLunas: number;
  totalDP: number;
  totalBelumLunas: number;
  labaKotor: number;
  piutang: number;
  cashInHariIni: number;
  cashOutHariIni: number;
  netCashHariIni: number;
  topCustomers: Array<{ customer: CustomerBrief; totalRevenue: number }>;
  recentPaid: Array<{
    id: number;
    merk: string;
    tipe: string;
    customer: CustomerBrief;
    biayaFinal: number;
    lunasAt: Date | null;
  }>;
};

export const getRevenueStats = cache(async (
  bulan?: number,
  tahun?: number,
  startDate?: Date,
  endDate?: Date,
): Promise<RevenueStats> => {
  const now = new Date();
  const month = bulan ?? now.getMonth() + 1;
  const year = tahun ?? now.getFullYear();

  const monthStart = startDate ?? new Date(year, month - 1, 1);
  const monthEnd = endDate ?? new Date(year, month, 0, 23, 59, 59, 999);

  const yearStart = startDate ?? new Date(year, 0, 1);
  const yearEnd = endDate ?? new Date(year, 11, 31, 23, 59, 59, 999);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [
    topCustomersRaw,
    statusCounts,
    lunasOrders,
    piutangOrders,
    transactionsBulanIni,
    transactionsTahunIni,
    modalTahunIni,
    transactionsHariIni,
  ] = await Promise.all([
    prisma.serviceOrder.groupBy({
      by: ["customerId"],
      where: {
        biayaFinal: { not: null },
        statusBayar: "LUNAS",
      },
      _sum: { biayaFinal: true },
      orderBy: { _sum: { biayaFinal: "desc" } },
      take: 5,
    }),
    Promise.all([
      prisma.serviceOrder.count({ where: { statusBayar: "LUNAS" } }),
      prisma.serviceOrder.count({ where: { statusBayar: "DP" } }),
      prisma.serviceOrder.count({ where: { statusBayar: "BELUM_LUNAS" } }),
    ]),
    prisma.serviceOrder.findMany({
      where: { statusBayar: "LUNAS", biayaFinal: { not: null } },
      orderBy: { lunasAt: "desc" },
      take: 10,
      include: { customer: true },
    }),
    prisma.serviceOrder.findMany({
      where: {
        biayaFinal: { not: null },
        statusBayar: { in: ["BELUM_LUNAS", "DP"] },
      },
      select: { biayaFinal: true, dpNominal: true, statusBayar: true },
    }),
    prisma.cashTransaction.findMany({
      where: {
        type: "IN",
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      select: { amount: true },
    }),
    prisma.cashTransaction.findMany({
      where: {
        type: "IN",
        createdAt: { gte: yearStart, lte: yearEnd },
      },
      select: { amount: true },
    }),
    prisma.cashTransaction.findMany({
      where: {
        type: "OUT",
        category: "SPAREPART",
        createdAt: { gte: yearStart, lte: yearEnd },
      },
      select: { amount: true },
    }),
    prisma.cashTransaction.findMany({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
      },
      select: { amount: true, type: true },
    }),
  ]);

  const revenueBulanIni = transactionsBulanIni.reduce((sum, tx) => sum + tx.amount, 0);
  const revenueTahunIni = transactionsTahunIni.reduce((sum, tx) => sum + tx.amount, 0);
  const totalModal = modalTahunIni.reduce((sum, tx) => sum + tx.amount, 0);
  const labaKotor = revenueTahunIni - totalModal;

  const cashInHariIni = transactionsHariIni.filter((tx) => tx.type === "IN").reduce((sum, tx) => sum + tx.amount, 0);
  const cashOutHariIni = transactionsHariIni.filter((tx) => tx.type === "OUT").reduce((sum, tx) => sum + tx.amount, 0);
  const netCashHariIni = cashInHariIni - cashOutHariIni;

  const piutang = piutangOrders.reduce((sum, o) => {
    const sisa = (o.biayaFinal ?? 0) - (o.statusBayar === "BELUM_LUNAS" ? 0 : (o.dpNominal ?? 0));
    return sum + Math.max(sisa, 0);
  }, 0);

  const customerIds = topCustomersRaw
    .map((c) => c.customerId)
    .filter((id): id is number => id !== null);

  const customers = customerIds.length > 0
    ? await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, nama: true, noHp: true },
      })
    : [];

  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const topCustomers = topCustomersRaw
    .map((c) => ({
      customer: customerMap.get(c.customerId) ?? { id: c.customerId, nama: "Unknown", noHp: "" },
      totalRevenue: c._sum.biayaFinal ?? 0,
    }));

  return {
    revenueBulanIni,
    revenueTahunIni,
    totalLunas: statusCounts[0],
    totalDP: statusCounts[1],
    totalBelumLunas: statusCounts[2],
    labaKotor,
    piutang,
    cashInHariIni,
    cashOutHariIni,
    netCashHariIni,
    topCustomers,
    recentPaid: lunasOrders.map((o) => ({
      id: o.id,
      merk: o.merk,
      tipe: o.tipe,
      customer: { id: o.customer.id, nama: o.customer.nama, noHp: o.customer.noHp },
      biayaFinal: o.biayaFinal ?? 0,
      lunasAt: o.lunasAt,
    })),
  };
});

export type ProfitStats = {
  totalProfit: number;
  totalRevenue: number;
  totalModal: number;
  marginPercent: number;
  serviceCount: number;
  totalKomisi: number;
  totalLabaBersih: number;
  totalPengeluaranOperasional: number;
  topServices: Array<{
    id: number;
    noService: string;
    customer: string;
    merk: string;
    tipe: string;
    biayaFinal: number;
    modalPart: number;
    profit: number;
    margin: number;
    teknisiName: string | null;
    komisi: number;
    labaBersih: number;
  }>;
};

export const getProfitStats = cache(async (
  bulan?: number,
  tahun?: number,
  startDate?: Date,
  endDate?: Date,
): Promise<ProfitStats> => {
  const now = new Date();
  const month = bulan ?? now.getMonth() + 1;
  const year = tahun ?? now.getFullYear();

  const monthStart = startDate ?? new Date(year, month - 1, 1);
  const monthEnd = endDate ?? new Date(year, month, 0, 23, 59, 59, 999);

  const [orders, manualOutTransactions] = await Promise.all([
    prisma.serviceOrder.findMany({
      where: {
        biayaFinal: { not: null },
        statusBayar: "LUNAS",
        lunasAt: { gte: monthStart, lte: monthEnd },
      },
      include: {
        customer: { select: { nama: true } },
        parts: { select: { hargaPokok: true } },
        teknisi: { select: { name: true, username: true, role: true, komisiPersen: true } },
      },
      orderBy: { lunasAt: "desc" },
    }),
    prisma.cashTransaction.findMany({
      where: {
        type: "OUT",
        serviceOrderId: null,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      select: { amount: true },
    }),
  ]);

  const entries = orders.map((o) => {
    const modalPart = o.parts.reduce((sum, p) => sum + p.hargaPokok, 0);
    const revenue = o.biayaFinal ?? 0;
    const profit = revenue - modalPart; // Laba Kotor

    let komisi = 0;
    if (o.teknisi && o.teknisi.role !== "admin") {
      komisi = Math.round(profit * (o.teknisi.komisiPersen / 100));
    }
    const labaBersih = profit - komisi;

    return {
      id: o.id,
      noService: o.noService,
      customer: o.customer.nama,
      merk: o.merk,
      tipe: o.tipe,
      biayaFinal: revenue,
      modalPart,
      profit,
      margin: revenue > 0 ? Math.round((profit / revenue) * 100) : 0,
      teknisiName: o.teknisi ? (o.teknisi.name || o.teknisi.username) : null,
      komisi,
      labaBersih,
    };
  });

  const totalRevenue = entries.reduce((s, e) => s + e.biayaFinal, 0);
  const totalModal = entries.reduce((s, e) => s + e.modalPart, 0);
  const totalProfit = entries.reduce((s, e) => s + e.profit, 0);
  const totalKomisi = entries.reduce((s, e) => s + e.komisi, 0);
  const totalPengeluaranOperasional = manualOutTransactions.reduce((s, t) => s + t.amount, 0);
  
  // Laba bersih toko = Laba kotor servis - Komisi teknisi - Pengeluaran operasional
  const totalLabaBersih = totalProfit - totalKomisi - totalPengeluaranOperasional;

  const topServices = entries
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10);

  return {
    totalProfit,
    totalRevenue,
    totalModal,
    marginPercent: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0,
    serviceCount: entries.length,
    totalKomisi,
    totalLabaBersih,
    totalPengeluaranOperasional,
    topServices,
  };
});

export type TransactionDetail = {
  id: number;
  amount: number;
  type: string;
  category: string;
  description: string;
  createdAt: Date;
  serviceOrderNo?: string | null;
};

export const getTransactions = cache(async (
  bulan?: number,
  tahun?: number,
  startDate?: Date,
  endDate?: Date,
): Promise<TransactionDetail[]> => {
  const now = new Date();
  const month = bulan ?? now.getMonth() + 1;
  const year = tahun ?? now.getFullYear();

  const monthStart = startDate ?? new Date(year, month - 1, 1);
  const monthEnd = endDate ?? new Date(year, month, 0, 23, 59, 59, 999);

  const txs = await prisma.cashTransaction.findMany({
    where: {
      createdAt: { gte: monthStart, lte: monthEnd },
    },
    include: {
      serviceOrder: { select: { noService: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return txs.map((t) => ({
    id: t.id,
    amount: t.amount,
    type: t.type,
    category: t.category,
    description: t.description,
    createdAt: t.createdAt,
    serviceOrderNo: t.serviceOrder?.noService ?? null,
  }));
});

export const getCashAudits = cache(async (
  bulan?: number,
  tahun?: number,
  startDate?: Date,
  endDate?: Date,
) => {
  const now = new Date();
  const month = bulan ?? now.getMonth() + 1;
  const year = tahun ?? now.getFullYear();

  const monthStart = startDate ?? new Date(year, month - 1, 1);
  const monthEnd = endDate ?? new Date(year, month, 0, 23, 59, 59, 999);

  return prisma.cashAudit.findMany({
    where: {
      createdAt: { gte: monthStart, lte: monthEnd },
    },
    orderBy: { createdAt: "desc" },
  });
});

