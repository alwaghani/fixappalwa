import { format } from "date-fns";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "kasir" && session?.user?.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const bulan = searchParams.get("bulan") ? Number(searchParams.get("bulan")) : now.getMonth() + 1;
  const tahun = searchParams.get("tahun") ? Number(searchParams.get("tahun")) : now.getFullYear();

  const monthStart = new Date(tahun, bulan - 1, 1);
  const monthEnd = new Date(tahun, bulan, 0, 23, 59, 59, 999);

  // Ambil semua order yang lunas bulan ini ATAU yang membayar DP bulan ini
  const orders = await prisma.serviceOrder.findMany({
    where: {
      OR: [
        {
          statusBayar: "LUNAS",
          lunasAt: { gte: monthStart, lte: monthEnd },
        },
        {
          statusBayar: "DP",
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        {
          statusBayar: "BELUM_LUNAS",
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      ],
    },
    include: {
      customer: true,
      parts: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Susun header CSV
  const csvHeaders = [
    "No Service",
    "Tanggal Masuk",
    "Pelanggan",
    "No HP Pelanggan",
    "Perangkat",
    "Kerusakan (Problem)",
    "Estimasi Biaya (Rp)",
    "Biaya Final (Rp)",
    "Status Bayar",
    "DP Terbayar (Rp)",
    "Total Modal Sparepart (Rp)",
    "Laba Bersih Estimasi (Rp)",
    "Tanggal Lunas",
  ].join(",");

  const csvRows = orders.map((o) => {
    const formatUang = (sen: number | null) => (sen ? Math.round(sen / 100) : 0);
    const dateLunas = o.lunasAt ? format(new Date(o.lunasAt), "yyyy-MM-dd") : "-";
    const dateMasuk = format(new Date(o.createdAt), "yyyy-MM-dd");
    const totalSparepart = o.parts.reduce((s, p) => s + (p.hargaPokok ?? 0), 0);
    const labaBersih = o.biayaFinal ? (o.biayaFinal - totalSparepart) : 0;

    // Bersihkan karakter pemisah CSV di text
    const cleanText = (str: string | null) => {
      if (!str) return "";
      return `"${str.replace(/"/g, '""').replace(/\r?\n|\r/g, " ")}"`;
    };

    return [
      o.noService,
      dateMasuk,
      cleanText(o.customer.nama),
      o.customer.noHp,
      cleanText(`${o.merk} ${o.tipe}`),
      cleanText(o.problem),
      formatUang(o.estimasiBiaya),
      o.biayaFinal ? formatUang(o.biayaFinal) : 0,
      o.statusBayar,
      o.dpNominal ? formatUang(o.dpNominal) : 0,
      formatUang(totalSparepart),
      formatUang(labaBersih),
      dateLunas,
    ].join(",");
  });

  const csvContent = [csvHeaders, ...csvRows].join("\r\n");
  const filename = `laporan-keuangan-${String(bulan).padStart(2, "0")}-${tahun}.csv`;

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
