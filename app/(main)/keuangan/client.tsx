"use client";

import clsx from "clsx";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Banknote, Award, TrendingUp, Download } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { formatHarga } from "@/lib/constants";
import type { ProfitStats, RevenueStats } from "@/lib/data/keuangan";

function KeuanganFilter({
  bulan,
  tahun,
  startDate,
  endDate,
}: {
  bulan?: number;
  tahun?: number;
  startDate?: string;
  endDate?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const now = new Date();
  const currentMonth = bulan ?? now.getMonth() + 1;
  const currentYear = tahun ?? now.getFullYear();

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {!startDate && !endDate ? (
        <>
          <Select
            value={String(currentMonth)}
            onValueChange={(val) => setFilter("bulan", val)}
          >
            <SelectTrigger className="w-40 font-medium">
              <span className="text-foreground">
                {currentMonth ? format(new Date(2000, currentMonth - 1), "MMMM", { locale: localeId }) : "Bulan"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {format(new Date(2000, i), "MMMM", { locale: localeId })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(currentYear)}
            onValueChange={(val) => setFilter("tahun", val)}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      ) : null}
      <input
        type="date"
        defaultValue={startDate ?? ""}
        onChange={(e) => setFilter("startDate", e.target.value || null)}
        className="rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground [color-scheme:dark]"
        aria-label="Tanggal mulai"
      />
      <span className="text-muted-foreground/50 text-xs">—</span>
      <input
        type="date"
        defaultValue={endDate ?? ""}
        onChange={(e) => setFilter("endDate", e.target.value || null)}
        className="rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground [color-scheme:dark]"
        aria-label="Tanggal akhir"
      />
      {(startDate || endDate || bulan) ? (
        <button
          onClick={() => router.push(pathname)}
          className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors"
          title="Reset filter"
        >
          &times;
        </button>
      ) : null}
    </div>
  );
}

export function KeuanganClient({
  stats,
  profitStats,
  bulan,
  tahun,
  startDate,
  endDate,
}: {
  stats: RevenueStats;
  profitStats: ProfitStats;
  bulan?: number;
  tahun?: number;
  startDate?: string;
  endDate?: string;
}) {
  const totalOrders = stats.totalLunas + stats.totalDP + stats.totalBelumLunas;

  const maxCount = Math.max(stats.totalLunas, stats.totalDP, stats.totalBelumLunas, 1);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (bulan) params.set("bulan", String(bulan));
    if (tahun) params.set("tahun", String(tahun));
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    window.open(`/api/keuangan/export?${params.toString()}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">Laporan</p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Keuangan</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 border-border/60 hover:bg-muted/10 text-xs font-semibold">
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            Ekspor CSV
          </Button>
          <Suspense fallback={<div className="h-9 w-64 animate-pulse rounded-lg bg-muted" />}>
            <KeuanganFilter bulan={bulan} tahun={tahun} startDate={startDate} endDate={endDate} />
          </Suspense>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-card/80 border border-border/40 p-4 backdrop-blur-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Revenue Bulan Ini</p>
          <p className="num mt-2 text-2xl font-semibold text-foreground">
            {formatHarga(stats.revenueBulanIni)}
          </p>
        </div>
        <div className="rounded-xl bg-card/80 border border-border/40 p-4 backdrop-blur-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Revenue Tahun Ini</p>
          <p className="num mt-2 text-2xl font-semibold text-foreground">
            {formatHarga(stats.revenueTahunIni)}
          </p>
        </div>
        <div className="rounded-xl bg-card/80 border border-border/40 p-4 backdrop-blur-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Laba Kotor</p>
          <p className="num mt-2 text-2xl font-semibold text-accents-green">
            {formatHarga(stats.labaKotor)}
          </p>
        </div>
        <div className="rounded-xl bg-card/80 border border-border/40 p-4 backdrop-blur-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Piutang</p>
          <p className="num mt-2 text-2xl font-semibold text-accents-orange">
            {formatHarga(stats.piutang)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kas Harian */}
        <div className="lg:col-span-2 rounded-xl bg-card p-5 relative overflow-hidden">
          {/* Ambient Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accents-green/30 to-transparent" />
          
          <h2 className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1.5"><Banknote className="h-4 w-4 text-accents-green" /> Kas Harian Terkini</span>
            <span className="text-[10px] font-normal normal-case text-muted-foreground/50 font-mono">Tgl: {format(new Date(), "dd MMMM yyyy", { locale: localeId })}</span>
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-muted/10 p-3 sm:p-4 border border-border/20">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Cash In (Masuk)</span>
              <span className="text-sm sm:text-base font-extrabold text-accents-green">{formatHarga(stats.cashInHariIni)}</span>
            </div>
            <div className="rounded-lg bg-muted/10 p-3 sm:p-4 border border-border/20">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Cash Out (Keluar)</span>
              <span className="text-sm sm:text-base font-extrabold text-destructive">{formatHarga(stats.cashOutHariIni)}</span>
            </div>
            <div className="rounded-lg bg-muted/10 p-3 sm:p-4 border border-border/20">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Kas Laci Fisik</span>
              <span className="text-sm sm:text-base font-extrabold text-foreground">{formatHarga(stats.netCashHariIni)}</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/60 leading-relaxed border-t border-border/40 pt-3">
            💡 <strong>Rujukan Rekonsiliasi Kas:</strong> Jumlah uang tunai fisik di laci kasir harus sesuai dengan angka <strong>Kas Laci Fisik</strong> di atas. Ini dihitung secara kumulatif dari semua penerimaan riil (Uang muka DP + Pelunasan cash) dikurangi pengeluaran modal beli sparepart yang terdaftar hari ini.
          </p>
        </div>

        {/* Status Pembayaran */}
        <div className="rounded-xl bg-card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Status Pembayaran
          </h2>
          <div className="space-y-3">
            {[
              { label: "Lunas", count: stats.totalLunas, color: "bg-accents-green", light: "bg-accents-green/20" },
              { label: "DP", count: stats.totalDP, color: "bg-accents-warm", light: "bg-accents-warm/20" },
              { label: "Belum Lunas", count: stats.totalBelumLunas, color: "bg-accents-orange", light: "bg-accents-orange/20" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-20 text-sm text-foreground">{item.label}</span>
                <div className="flex-1 rounded-full bg-muted">
                  <div
                    className={clsx(
                      "h-6 rounded-full transition-[width] flex items-center justify-end pr-2",
                      item.color,
                    )}
                    style={{
                      width: `${(item.count / maxCount) * 100}%`,
                      minWidth: item.count > 0 ? "2.5rem" : undefined,
                    }}
                  >
                    {item.count > 0 && item.count / maxCount > 0.15 && (
                      <span className="text-xs font-medium text-white">{item.count}</span>
                    )}
                  </div>
                </div>
                {(!(item.count > 0 && item.count / maxCount > 0.15)) && (
                  <span className="w-12 text-right text-sm font-medium text-foreground">
                    {item.count}
                  </span>
                )}
              </div>
            ))}
            <div className="flex items-center gap-3 border-t border-border pt-2 text-sm text-muted-foreground">
              <span className="w-20">Total</span>
              <span className="flex-1" />
              <span className="w-12 text-right font-medium">{totalOrders}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card/80 border border-border/40 p-5 backdrop-blur-sm">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Riwayat Pembayaran
        </p>
        {stats.recentPaid.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center space-y-3">
            <Banknote className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Belum ada pembayaran
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {stats.recentPaid.map((order) => (
              <a
                key={order.id}
                href={`/services/${order.id}`}
                className="flex items-center justify-between py-3 transition-colors hover:bg-muted/20 -mx-5 px-5"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {order.merk} {order.tipe}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    {order.customer.nama}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <Badge variant="default" className="bg-accents-green text-white font-mono rounded text-[10px]">Lunas</Badge>
                  <div>
                    <p className="num text-sm font-semibold text-foreground">
                      {formatHarga(order.biayaFinal)}
                    </p>
                    {order.lunasAt && (
                      <p className="num text-[10px] text-muted-foreground/50">
                        {format(order.lunasAt, "d MMM yyyy", { locale: localeId })}
                      </p>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-card p-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Top Customer
        </h2>
        {stats.topCustomers.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center space-y-3">
            <Award className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Belum ada data
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {stats.topCustomers.map((item, idx) => (
              <div
                key={item.customer.id}
                className="flex items-center justify-between py-3 transition-[background-color,padding-left] hover:bg-muted/30 hover:pl-2 -mx-5 px-5"
              >
                <div className="flex items-center gap-3">
                  <span className={clsx(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    idx === 0
                      ? "bg-accents-orange/20 text-accents-orange"
                      : idx === 1
                      ? "bg-muted text-muted-foreground"
                      : idx === 2
                      ? "bg-accents-warm/20 text-accents-warm"
                      : "bg-muted text-muted-foreground",
                  )}>
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.customer.nama}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.customer.noHp}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {formatHarga(item.totalRevenue)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analisa Laba */}
      <div className="rounded-xl bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5 text-accents-green" /> Analisa Laba
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <div className="rounded-lg bg-muted/20 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Total Laba</p>
            <p className="text-lg font-semibold text-accents-green">{formatHarga(profitStats.totalProfit)}</p>
          </div>
          <div className="rounded-lg bg-muted/20 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Margin Rata-rata</p>
            <p className={clsx("text-lg font-semibold", profitStats.marginPercent >= 30 ? "text-accents-green" : "text-accents-warm")}>
              {profitStats.marginPercent}%
            </p>
          </div>
          <div className="rounded-lg bg-muted/20 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Total Modal Part</p>
            <p className="text-lg font-semibold text-foreground">{formatHarga(profitStats.totalModal)}</p>
          </div>
          <div className="rounded-lg bg-muted/20 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Service Selesai</p>
            <p className="text-lg font-semibold text-foreground">{profitStats.serviceCount}</p>
          </div>
        </div>

        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Top 10 Service Paling Profitabel</h3>
        {profitStats.topServices.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center space-y-2 rounded-xl border border-border/40 bg-muted/10">
            <TrendingUp className="h-6 w-6 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground/50">Belum ada data laba</p>
            <p className="text-[10px] text-muted-foreground/30">Selesaikan service untuk melihat analisa laba</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60 rounded-xl overflow-hidden border border-border/60">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 bg-muted/20">
              <span className="col-span-4">Customer / Device</span>
              <span className="col-span-2 text-right">Revenue</span>
              <span className="col-span-2 text-right">Modal</span>
              <span className="col-span-2 text-right">Laba</span>
              <span className="col-span-2 text-right">Margin</span>
            </div>
            {profitStats.topServices.map((s) => (
              <div key={s.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs hover:bg-muted/20 transition-colors">
                <div className="col-span-4 min-w-0">
                  <p className="text-foreground font-medium truncate">{s.customer}</p>
                  <p className="text-muted-foreground/60 truncate text-[10px]">{s.merk} {s.tipe}</p>
                </div>
                <p className="col-span-2 text-right text-foreground self-center">{formatHarga(s.biayaFinal)}</p>
                <p className="col-span-2 text-right text-muted-foreground self-center">{formatHarga(s.modalPart)}</p>
                <p className="col-span-2 text-right font-medium self-center" style={{ color: s.profit >= 0 ? "var(--color-accents-green)" : "var(--color-destructive)" }}>
                  {formatHarga(s.profit)}
                </p>
                <p className="col-span-2 text-right self-center">
                  <span className={clsx(
                    "rounded px-1.5 py-0.5 text-[10px] font-bold",
                    s.margin >= 50
                      ? "bg-accents-green/15 text-accents-green"
                      : s.margin >= 25
                      ? "bg-accents-blue/15 text-accents-blue"
                      : "bg-muted/50 text-muted-foreground",
                  )}>
                    {s.margin}%
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
