import "server-only";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cache } from "react";

import { NEXT_STATUS, formatHarga } from "@/lib/constants";
import type { PaymentStatus, ServiceStatus, Role } from "@/lib/generated/prisma/client";
import prisma from "@/lib/prisma";

export type ServiceOrderWithRelations = Awaited<ReturnType<typeof getServiceOrderById>>;

const orderInclude = {
  customer: { select: { id: true, nama: true, noHp: true, alamat: true } },
  teknisi: { select: { id: true, name: true, username: true } },
  parts: true,
  activityLogs: {
    orderBy: { createdAt: "desc" },
  },
} as const;

export type ServiceOrderListItem = {
  id: number;
  noService: string;
  createdAt: Date;
  updatedAt: Date;
  customerId: number;
  merk: string;
  tipe: string;
  pin: string | null;
  problem: string;
  estimasiBiaya: number;
  biayaFinal: number | null;
  statusBayar: string;
  dpNominal: number | null;
  lunasAt: Date | null;
  catatan: string | null;
  status: string;
  warrantyUntil: Date | null;
  customer: {
    id: number;
    nama: string;
    noHp: string;
  };
};

export const getServiceOrders = cache(async (
  status?: string,
  search?: string,
  take = 50,
  skip = 0,
  customerId?: number,
  teknisiId?: number,
): Promise<ServiceOrderListItem[]> => {
  return prisma.serviceOrder.findMany({
    where: {
      ...(status ? { status: status as ServiceStatus } : {}),
      ...(customerId ? { customerId } : {}),
      ...(teknisiId ? { teknisiId } : {}),
      ...(search
        ? {
            OR: [
              { noService: { contains: search } },
              { merk: { contains: search } },
              { tipe: { contains: search } },
              { problem: { contains: search } },
              { customer: { nama: { contains: search } } },
            ],
          }
        : {}),
    },
    include: { customer: { select: { id: true, nama: true, noHp: true } } },
    orderBy: { createdAt: "desc" },
    take,
    skip,
  }) as Promise<ServiceOrderListItem[]>;
});

export const countServiceOrders = cache(async (
  status?: string,
  customerId?: number,
  search?: string,
  teknisiId?: number,
): Promise<number> => {
  return prisma.serviceOrder.count({
    where: {
      ...(status ? { status: status as ServiceStatus } : {}),
      ...(customerId ? { customerId } : {}),
      ...(teknisiId ? { teknisiId } : {}),
      ...(search
        ? {
            OR: [
              { noService: { contains: search } },
              { merk: { contains: search } },
              { tipe: { contains: search } },
              { problem: { contains: search } },
              { customer: { nama: { contains: search } } },
            ],
          }
        : {}),
    },
  });
});

export const getRelatedOrders = cache(async (
  customerId: number,
  merk: string,
  tipe: string,
  excludeId: number,
  take = 5,
) => {
  return prisma.serviceOrder.findMany({
    where: {
      customerId,
      merk,
      tipe,
      id: { not: excludeId },
    },
    include: {
      customer: { select: { nama: true, noHp: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
});

export const getServiceOrderById = cache(async (id: number) => {
  return prisma.serviceOrder.findUnique({
    where: { id },
    include: orderInclude,
  });
});

export async function createServiceOrder(data: {
  customerId: number;
  merk: string;
  tipe: string;
  pin?: string;
  problem: string;
  estimasiBiaya: number;
  catatan?: string;
  estimasiSelesai?: Date;
  teknisiId?: number | null;
}) {
  const now = new Date();
  const datePrefix = String(now.getFullYear()).slice(2) + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0");
  const prefix = `SRV-${datePrefix}-`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const order = await prisma.$transaction(async (tx) => {
        const latest = await tx.serviceOrder.findFirst({
          where: { noService: { startsWith: prefix } },
          orderBy: { noService: "desc" },
          select: { noService: true },
        });

        const nextSeq = latest ? parseInt(latest.noService.slice(-3)) + 1 : 1;
        const noService = `${prefix}${String(nextSeq).padStart(3, "0")}`;

        const created = await tx.serviceOrder.create({
          data: { ...data, noService },
          include: orderInclude,
        });

        await tx.activityLog.create({
          data: {
            serviceOrderId: created.id,
            action: "ORDER_CREATED",
            detail: `Servis baru berhasil didaftarkan dengan nomor ${noService}.`,
          },
        });

        return created;
      });

      return order;
    } catch (e: unknown) {
      const isUniqueViolation = typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002";
      if (isUniqueViolation && attempt < 2) continue;
      throw e;
    }
  }

  throw new Error("Gagal membuat nomor service, coba lagi.");
}

export async function updateServiceOrder(
  id: number,
  data: {
    merk?: string;
    tipe?: string;
    pin?: string;
    problem?: string;
    estimasiBiaya?: number;
    biayaFinal?: number;
    catatan?: string;
    diagnostik?: string;
    teknisiId?: number;
    estimasiSelesai?: Date | null;
  },
) {
  const current = await prisma.serviceOrder.findUnique({
    where: { id },
  });
  if (!current) throw new Error("Service order not found");

  const updated = await prisma.serviceOrder.update({
    where: { id },
    data,
    include: orderInclude,
  });

  const changes: string[] = [];
  if (data.merk && current.merk !== data.merk) changes.push(`Merk dari "${current.merk}" ke "${data.merk}"`);
  if (data.tipe && current.tipe !== data.tipe) changes.push(`Tipe dari "${current.tipe}" ke "${data.tipe}"`);
  if (data.problem && current.problem !== data.problem) changes.push(`Masalah dari "${current.problem}" ke "${data.problem}"`);
  if (data.catatan !== undefined && current.catatan !== data.catatan) changes.push(`Catatan dari "${current.catatan ?? ""}" ke "${data.catatan ?? ""}"`);

  if (changes.length > 0) {
    await prisma.activityLog.create({
      data: {
        serviceOrderId: id,
        action: "ORDER_UPDATED",
        detail: `Detail perangkat diperbarui: ${changes.join(", ")}`,
      },
    });
  }

  return updated;
}

export async function updateServiceStatus(id: number, status: ServiceStatus, warrantyDays?: number) {
  const current = await prisma.serviceOrder.findUnique({
    where: { id },
    select: { status: true, warrantyUntil: true },
  });
  if (!current) throw new Error("Service order not found");

  const allowedTransitions = NEXT_STATUS[current.status]?.map((a) => a.status) ?? [];
  if (!allowedTransitions.includes(status)) {
    throw new Error(
      `Tidak bisa mengubah status dari "${current.status}" ke "${status}"`,
    );
  }

  const data: { status: ServiceStatus; warrantyUntil?: Date | null } = { status };

  if (status === "selesai") {
    const days = warrantyDays !== undefined ? warrantyDays : 30;
    data.warrantyUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  } else {
    data.warrantyUntil = null;
  }

  const updated = await prisma.serviceOrder.update({
    where: { id },
    data,
    include: orderInclude,
  });

  await prisma.activityLog.create({
    data: {
      serviceOrderId: id,
      action: "STATUS_CHANGED",
      detail: `Status pengerjaan diubah dari "${current.status.toUpperCase()}" ke "${status.toUpperCase()}"`,
    },
  });

  return updated;
}

export async function addServicePart(
  serviceOrderId: number,
  data: { nama: string; harga: number; hargaPokok?: number },
) {
  const order = await prisma.serviceOrder.findUnique({
    where: { id: serviceOrderId },
    select: { noService: true },
  });

  const cost = data.hargaPokok ?? data.harga;

  const part = await prisma.servicePart.create({
    data: {
      serviceOrderId,
      ...data,
      transaction: {
        create: {
          amount: cost,
          type: "OUT",
          category: "SPAREPART",
          description: `Pengeluaran modal sparepart: ${data.nama} untuk nomor service: ${order?.noService ?? ""}`,
          serviceOrderId,
        },
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      serviceOrderId,
      action: "PART_ADDED",
      detail: `Sparepart "${data.nama}" ditambahkan (Modal: ${formatHarga(data.hargaPokok ?? 0)}, Jual: ${formatHarga(data.harga)})`,
    },
  });

  return part;
}

export async function deleteServicePart(id: number) {
  const part = await prisma.servicePart.findUnique({
    where: { id },
    select: { serviceOrderId: true, nama: true },
  });

  if (part) {
    await prisma.activityLog.create({
      data: {
        serviceOrderId: part.serviceOrderId,
        action: "PART_DELETED",
        detail: `Sparepart "${part.nama}" dihapus`,
      },
    });
  }

  return prisma.servicePart.delete({ where: { id } });
}

export function deleteServiceOrder(id: number) {
  return prisma.serviceOrder.delete({ where: { id } });
}

export async function updateServicePayment(
  id: number,
  data: {
    statusBayar: PaymentStatus;
    dpNominal?: number;
    biayaFinal?: number;
    lunasAt?: Date | null;
  },
) {
  const current = await prisma.serviceOrder.findUnique({
    where: { id },
    select: { statusBayar: true, dpNominal: true, biayaFinal: true, estimasiBiaya: true, noService: true, createdAt: true },
  });
  if (!current) throw new Error("Service order not found");

  // Keamanan Logis Transaksi Keuangan:
  // 1. Status LUNAS bersifat final & irreversibel (mencegah manipulasi kasir)
  if (current.statusBayar === "LUNAS" && data.statusBayar !== "LUNAS") {
    throw new Error("Status LUNAS bersifat final dan tidak dapat diubah kembali ke belum lunas atau DP.");
  }

  // 2. Status DP tidak dapat dikembalikan ke BELUM_LUNAS (karena uang muka sudah diterima)
  if (current.statusBayar === "DP" && data.statusBayar === "BELUM_LUNAS") {
    throw new Error("Status DP tidak dapat dikembalikan ke Belum Lunas karena uang muka telah diterima.");
  }

  // 3. Validasi nominal DP
  if (data.statusBayar === "DP") {
    const finalDp = data.dpNominal !== undefined ? data.dpNominal : (current.dpNominal ?? 0);
    const finalBiaya = data.biayaFinal !== undefined ? data.biayaFinal : (current.biayaFinal ?? current.estimasiBiaya);
    if (finalDp <= 0) {
      throw new Error("Nominal uang muka (DP) wajib diisi dan harus lebih besar dari 0.");
    }
    if (finalBiaya !== null && finalDp > finalBiaya) {
      throw new Error("Nominal uang muka (DP) tidak boleh melebihi biaya final tagihan.");
    }
  }

  // 4. Validasi nominal biaya final untuk LUNAS
  if (data.statusBayar === "LUNAS") {
    const finalBiaya = data.biayaFinal !== undefined ? data.biayaFinal : (current.biayaFinal ?? current.estimasiBiaya);
    const finalDp = current.dpNominal ?? 0;
    if (finalBiaya < 0) {
      throw new Error("Biaya final tidak boleh kurang dari 0.");
    }
    if (finalBiaya < finalDp) {
      throw new Error(`Biaya pelunasan (${formatHarga(finalBiaya)}) tidak boleh kurang dari nominal DP yang sudah dibayar (${formatHarga(finalDp)}).`);
    }
  }

  const updated = await prisma.serviceOrder.update({
    where: { id },
    data: {
      ...data,
      ...(data.statusBayar === "LUNAS" && !data.lunasAt
        ? { lunasAt: new Date() }
        : data.statusBayar !== "LUNAS"
          ? { lunasAt: null }
          : {}),
    },
    include: orderInclude,
  });

  // ── Sinkronisasi Buku Kas Harian ──
  const targetStatus = data.statusBayar;

  if (targetStatus === "BELUM_LUNAS") {
    await prisma.cashTransaction.deleteMany({
      where: {
        serviceOrderId: id,
        category: { in: ["DP", "PELUNASAN"] },
      },
    });
  } else if (targetStatus === "DP") {
    const finalDp = data.dpNominal !== undefined ? data.dpNominal : (current.dpNominal ?? 0);
    const existingDpTx = await prisma.cashTransaction.findFirst({
      where: { serviceOrderId: id, category: "DP" },
    });

    if (existingDpTx) {
      await prisma.cashTransaction.update({
        where: { id: existingDpTx.id },
        data: { amount: finalDp },
      });
    } else {
      await prisma.cashTransaction.create({
        data: {
          amount: finalDp,
          type: "IN",
          category: "DP",
          description: `Penerimaan Uang Muka (DP) untuk nomor service: ${current.noService}`,
          serviceOrderId: id,
        },
      });
    }

    await prisma.cashTransaction.deleteMany({
      where: { serviceOrderId: id, category: "PELUNASAN" },
    });
  } else if (targetStatus === "LUNAS") {
    const finalBiaya = data.biayaFinal !== undefined ? data.biayaFinal : (current.biayaFinal ?? current.estimasiBiaya);
    const finalDp = current.dpNominal ?? 0;
    const settlementAmount = finalBiaya - finalDp;

    if (finalDp > 0) {
      const existingDpTx = await prisma.cashTransaction.findFirst({
        where: { serviceOrderId: id, category: "DP" },
      });
      if (!existingDpTx) {
        await prisma.cashTransaction.create({
          data: {
            amount: finalDp,
            type: "IN",
            category: "DP",
            description: `Penerimaan Uang Muka (DP) untuk nomor service: ${current.noService}`,
            serviceOrderId: id,
            createdAt: current.createdAt,
          },
        });
      }
    }

    const existingLunasTx = await prisma.cashTransaction.findFirst({
      where: { serviceOrderId: id, category: "PELUNASAN" },
    });

    if (settlementAmount > 0) {
      if (existingLunasTx) {
        await prisma.cashTransaction.update({
          where: { id: existingLunasTx.id },
          data: { amount: settlementAmount },
        });
      } else {
        await prisma.cashTransaction.create({
          data: {
            amount: settlementAmount,
            type: "IN",
            category: "PELUNASAN",
            description: `Pelunasan pembayaran untuk nomor service: ${current.noService}`,
            serviceOrderId: id,
            createdAt: new Date(),
          },
        });
      }
    } else if (existingLunasTx) {
      await prisma.cashTransaction.delete({
        where: { id: existingLunasTx.id },
      });
    }
  }

  let detailMsg = `Status pembayaran diubah dari "${current.statusBayar}" ke "${data.statusBayar}".`;
  if (data.biayaFinal !== undefined && current.biayaFinal !== data.biayaFinal) {
    detailMsg += ` Biaya final diubah dari ${formatHarga(current.biayaFinal ?? 0)} menjadi ${formatHarga(data.biayaFinal)}.`;
  }
  if (data.dpNominal !== undefined && current.dpNominal !== data.dpNominal) {
    detailMsg += ` Nominal DP diubah dari ${formatHarga(current.dpNominal ?? 0)} menjadi ${formatHarga(data.dpNominal)}.`;
  }

  await prisma.activityLog.create({
    data: {
      serviceOrderId: id,
      action: "PAYMENT_UPDATED",
      detail: detailMsg,
    },
  });

  return updated;
}

export type DashboardStats = {
  diterima: number;
  menungguPart: number;
  dikerjakan: number;
  selesai: number;
  total: number;
  totalCustomers: number;
  revenueBulanIni: number;
  activeServices: Array<{
    id: number;
    merk: string;
    tipe: string;
    status: string;
    customer: { nama: string };
    updatedAt: Date;
  }>;
  recentCompleted: Array<{
    id: number;
    merk: string;
    tipe: string;
    status: string;
    customer: { nama: string };
    updatedAt: Date;
  }>;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
};

export const getTeknisiList = cache(async (): Promise<Array<{ id: number; name: string | null; username: string; role: Role }>> => {
  return prisma.user.findMany({
    select: { id: true, name: true, username: true, role: true },
    orderBy: { name: "asc" },
  });
});

export const getDashboardData = cache(async (teknisiId?: number): Promise<DashboardStats> => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const customerPick = { nama: true } as const;

  const [
    diterima,
    menungguPart,
    dikerjakan,
    selesai,
    total,
    activeServices,
    recentCompleted,
    lunasOrders,
    totalCustomers,
  ] = await Promise.all([
    prisma.serviceOrder.count({
      where: {
        status: "diterima",
        ...(teknisiId ? { OR: [{ teknisiId: null }, { teknisiId }] } : {}),
      },
    }),
    prisma.serviceOrder.count({
      where: {
        status: "menunggu_part",
        ...(teknisiId ? { teknisiId } : {}),
      },
    }),
    prisma.serviceOrder.count({
      where: {
        status: "dikerjakan",
        ...(teknisiId ? { teknisiId } : {}),
      },
    }),
    prisma.serviceOrder.count({
      where: {
        status: "selesai",
        ...(teknisiId ? { teknisiId } : {}),
      },
    }),
    prisma.serviceOrder.count({
      where: {
        ...(teknisiId ? { teknisiId } : {}),
      },
    }),
    prisma.serviceOrder.findMany({
      where: {
        status: { not: "selesai" },
        ...(teknisiId ? { teknisiId } : {}),
      },
      include: { customer: { select: customerPick } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.serviceOrder.findMany({
      where: {
        status: "selesai",
        ...(teknisiId ? { teknisiId } : {}),
      },
      include: { customer: { select: customerPick } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.serviceOrder.findMany({
      where: {
        biayaFinal: { not: null },
        statusBayar: "LUNAS" as PaymentStatus,
        lunasAt: { gte: monthStart, lte: monthEnd },
        ...(teknisiId ? { teknisiId } : {}),
      },
      include: {
        parts: { select: { hargaPokok: true } },
        teknisi: { select: { role: true, komisiPersen: true } },
      },
    }),
    teknisiId
      ? prisma.serviceOrder.groupBy({
          by: ["customerId"],
          where: { teknisiId },
        }).then((res) => res.length)
      : prisma.customer.count(),
  ]);

  let revenueBulanIni = 0;
  if (teknisiId) {
    revenueBulanIni = lunasOrders.reduce((sum, o) => {
      const modalPart = o.parts.reduce((s, p) => s + (p.hargaPokok ?? 0), 0);
      const profit = (o.biayaFinal ?? 0) - modalPart;
      const persen = o.teknisi?.role === "admin" ? 0 : (o.teknisi?.komisiPersen ?? 40);
      return sum + Math.max(0, Math.round(profit * (persen / 100)));
    }, 0);
  } else {
    revenueBulanIni = lunasOrders.reduce((sum, o) => sum + (o.biayaFinal ?? 0), 0);
  }

  // Last 6 months revenue for chart (or technician commission split)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthOrders = await prisma.serviceOrder.findMany({
    where: {
      biayaFinal: { not: null },
      statusBayar: "LUNAS" as PaymentStatus,
      lunasAt: { gte: sixMonthsAgo },
      ...(teknisiId ? { teknisiId } : {}),
    },
    include: {
      parts: { select: { hargaPokok: true } },
      teknisi: { select: { role: true, komisiPersen: true } },
    },
  });

  const monthlyRevenue: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = format(d, "MMM", { locale: id });
    const filteredOrders = monthOrders.filter(
      (o) => o.lunasAt && o.lunasAt.getMonth() === d.getMonth() && o.lunasAt.getFullYear() === d.getFullYear()
    );

    let amount = 0;
    if (teknisiId) {
      amount = filteredOrders.reduce((sum, o) => {
        const modalPart = o.parts.reduce((s, p) => s + (p.hargaPokok ?? 0), 0);
        const profit = (o.biayaFinal ?? 0) - modalPart;
        const persen = o.teknisi?.role === "admin" ? 0 : (o.teknisi?.komisiPersen ?? 40);
        return sum + Math.max(0, Math.round(profit * (persen / 100)));
      }, 0);
    } else {
      amount = filteredOrders.reduce((s, o) => s + (o.biayaFinal ?? 0), 0);
    }
    monthlyRevenue.push({ month: label, revenue: amount });
  }

  return {
    diterima,
    menungguPart,
    dikerjakan,
    selesai,
    total,
    totalCustomers,
    revenueBulanIni,
    activeServices,
    recentCompleted,
    monthlyRevenue,
  } as DashboardStats;
});
