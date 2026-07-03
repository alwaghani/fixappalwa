"use client";

import clsx from "clsx";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Banknote,
  Award,
  TrendingUp,
  Download,
  Receipt,
  Scale,
  Trash2,
} from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState, useEffect, useActionState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast-core";
import {
  createManualTransactionAction,
  deleteManualTransactionAction,
  createCashAuditAction,
} from "@/lib/actions";
import { formatHarga } from "@/lib/constants";
import type { ProfitStats, RevenueStats, TransactionDetail } from "@/lib/data/keuangan";

interface CashAuditData {
  id: number;
  expectedCash: number;
  actualCash: number;
  selisih: number;
  catatan: string | null;
  createdAt: Date;
  createdBy: string;
}

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
  transactions,
  cashAudits,
  bulan,
  tahun,
  startDate,
  endDate,
  userRole,
}: {
  stats: RevenueStats;
  profitStats: ProfitStats;
  transactions: TransactionDetail[];
  cashAudits: CashAuditData[];
  bulan?: number;
  tahun?: number;
  startDate?: string;
  endDate?: string;
  userRole?: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"transaksi" | "audit" | "servis">("transaksi");

  // Modals state
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<"IN" | "OUT">("OUT");
  const [txState, txAction, txPending] = useActionState(createManualTransactionAction, undefined);

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [actualCashInput, setActualCashInput] = useState("");
  const [auditState, auditAction, auditPending] = useActionState(createCashAuditAction, undefined);

  const [confirmDeleteTxId, setConfirmDeleteTxId] = useState<number | null>(null);
  const [deleteTxState, deleteTxAction, deleteTxPending] = useActionState(deleteManualTransactionAction, undefined);

  useEffect(() => {
    if (txState?.success) {
      toast("success", "Transaksi berhasil dicatat!");
      setTimeout(() => setShowTxModal(false), 0);
      router.refresh();
    } else if (txState?.error) {
      toast("error", txState.error);
    }
  }, [txState, router]);

  useEffect(() => {
    if (auditState?.success) {
      toast("success", "Audit kas harian berhasil disimpan!");
      setTimeout(() => {
        setShowAuditModal(false);
        setActualCashInput("");
      }, 0);
      router.refresh();
    } else if (auditState?.error) {
      toast("error", auditState.error);
    }
  }, [auditState, router]);

  useEffect(() => {
    if (deleteTxState?.success) {
      toast("success", "Transaksi berhasil dihapus!");
      setTimeout(() => setConfirmDeleteTxId(null), 0);
      router.refresh();
    } else if (deleteTxState?.error) {
      toast("error", deleteTxState.error);
      setTimeout(() => setConfirmDeleteTxId(null), 0);
    }
  }, [deleteTxState, router]);
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
          <div className="flex gap-2.5 mt-4 pt-3 border-t border-border/40">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTxType("OUT");
                setShowTxModal(true);
              }}
              className="w-full text-xs font-semibold gap-1.5 text-foreground hover:bg-muted/10 font-medium"
            >
              <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
              Catat Manual (IN/OUT)
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setActualCashInput("");
                setShowAuditModal(true);
              }}
              className="w-full text-xs font-semibold gap-1.5 bg-accents-green hover:bg-accents-green/90 text-white font-medium"
            >
              <Scale className="h-3.5 w-3.5" />
              Audit Laci Kas
            </Button>
          </div>
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

      <div className="rounded-xl bg-card border border-border/40 p-5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5 border-b border-border/40 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Buku Kas & Rekonsiliasi
          </h2>
          
          <div className="flex rounded-lg bg-muted/20 p-1 border border-border/40 max-w-fit">
            {(
              [
                { key: "transaksi", label: "Jurnal Transaksi" },
                { key: "audit", label: "Log Audit Harian" },
                { key: "servis", label: "Penerimaan Servis" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeTab === tab.key
                    ? "bg-card text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "transaksi" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="overflow-x-auto rounded-xl border border-border/40 bg-card/45">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/10 text-muted-foreground font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Tanggal & Waktu</th>
                    <th className="px-4 py-3 text-center">Tipe</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Keterangan</th>
                    <th className="px-4 py-3 text-right">Nominal</th>
                    {userRole === "admin" && <th className="px-4 py-3 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={userRole === "admin" ? 6 : 5} className="px-4 py-8 text-center text-muted-foreground">
                        Belum ada riwayat transaksi kas untuk periode ini.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {format(new Date(tx.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            tx.type === "IN"
                              ? "bg-accents-green/10 text-accents-green border-accents-green/20"
                              : "bg-destructive/10 text-destructive border-destructive/20"
                          }`}>
                            {tx.type === "IN" ? "MASUK" : "KELUAR"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-semibold text-foreground">{tx.category}</span>
                        </td>
                        <td className="px-4 py-3 text-foreground font-medium">
                          {tx.description}
                          {tx.serviceOrderNo && (
                            <span className="ml-1.5 text-[10px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-mono">
                              {tx.serviceOrderNo}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-foreground whitespace-nowrap">
                          <span className={tx.type === "IN" ? "text-accents-green" : "text-destructive"}>
                            {tx.type === "IN" ? "+" : "-"}{formatHarga(tx.amount)}
                          </span>
                        </td>
                        {userRole === "admin" && (
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {!tx.serviceOrderNo && tx.category === "LAINNYA" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setConfirmDeleteTxId(tx.id)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/40 italic">Otomatis</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "audit" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="overflow-x-auto rounded-xl border border-border/40 bg-card/45">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/10 text-muted-foreground font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Tanggal Audit</th>
                    <th className="px-4 py-3 text-right">Kas Tercatat (Sistem)</th>
                    <th className="px-4 py-3 text-right">Uang Fisik (Laci)</th>
                    <th className="px-4 py-3 text-center">Selisih</th>
                    <th className="px-4 py-3">Catatan</th>
                    <th className="px-4 py-3">Auditor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {cashAudits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Belum ada riwayat audit kas harian untuk periode ini.
                      </td>
                    </tr>
                  ) : (
                    cashAudits.map((a: CashAuditData) => (
                      <tr key={a.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap font-medium font-mono">
                          {format(new Date(a.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground whitespace-nowrap">
                          {formatHarga(a.expectedCash)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-foreground whitespace-nowrap font-mono">
                          {formatHarga(a.actualCash)}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            a.selisih === 0
                              ? "bg-accents-green/10 text-accents-green border-accents-green/20"
                              : a.selisih > 0
                                ? "bg-accents-blue/10 text-accents-blue border-accents-blue/20"
                                : "bg-destructive/10 text-destructive border-destructive/20"
                          }`}>
                            {a.selisih === 0 ? "Cocok (Rp 0)" : a.selisih > 0 ? `Lebih (+${formatHarga(a.selisih)})` : `Kurang (${formatHarga(a.selisih)})`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground font-medium max-w-xs truncate">
                          {a.catatan || "-"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-semibold whitespace-nowrap">
                          {a.createdBy}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "servis" && (
          <div className="animate-in fade-in duration-150">
            {stats.recentPaid.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center space-y-3">
                <Banknote className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Belum ada pembayaran servis
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
                            {format(new Date(order.lunasAt), "d MMM yyyy", { locale: localeId })}
                          </p>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Tambah Transaksi Manual */}
      <Dialog open={showTxModal} onOpenChange={setShowTxModal}>
        <DialogContent className="sm:max-w-md rounded-xl p-6 bg-[#1a1a19] text-[#faf9f5] border border-border/40">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Receipt className="h-5 w-5 text-primary" />
              Catat Transaksi Kas Manual
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Catat pemasukan atau pengeluaran kas tambahan toko yang tidak terkait dengan order service.
            </DialogDescription>
          </DialogHeader>

          <form action={txAction}>
            {txState?.error && (
              <div className="px-6 pb-2">
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs font-medium text-destructive animate-in fade-in" role="alert">
                  {txState.error}
                </div>
              </div>
            )}

            <div className="space-y-4 px-6 pb-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipe Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxType("IN")}
                    className={`py-2 px-3 rounded-lg border text-sm font-semibold transition-colors ${
                      txType === "IN"
                        ? "bg-accents-green/10 border-accents-green/50 text-accents-green"
                        : "bg-input border-border text-muted-foreground hover:bg-muted/10"
                    }`}
                  >
                    Kas Masuk (IN)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType("OUT")}
                    className={`py-2 px-3 rounded-lg border text-sm font-semibold transition-colors ${
                      txType === "OUT"
                        ? "bg-destructive/10 border-destructive/50 text-destructive"
                        : "bg-input border-border text-muted-foreground hover:bg-muted/10"
                    }`}
                  >
                    Kas Keluar (OUT)
                  </button>
                </div>
                <input type="hidden" name="type" value={txType} />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kategori</label>
                <select
                  name="category"
                  defaultValue="LAINNYA"
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50 font-medium"
                  required
                >
                  <option value="LAINNYA">Lain-lain (Operasional/Umum)</option>
                  <option value="SPAREPART">Pembelian Sparepart / Alat</option>
                  <option value="PELUNASAN">Pemasukan Tambahan Toko</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nominal (Rupiah)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">Rp</span>
                  <input
                    type="text"
                    name="amount"
                    className="w-full rounded-lg border border-border bg-input pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50 font-semibold"
                    placeholder="cth: 50.000"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Keterangan / Deskripsi</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                  placeholder="cth: Beli kopi dan air galon toko"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose render={<Button type="button" variant="ghost" size="sm" />}>
                Batal
              </DialogClose>
              <Button type="submit" variant="default" size="sm" disabled={txPending}>
                {txPending ? "Menyimpan..." : "Simpan Transaksi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Audit Laci Kas */}
      <Dialog open={showAuditModal} onOpenChange={setShowAuditModal}>
        <DialogContent className="sm:max-w-md rounded-xl p-6 bg-[#1a1a19] text-[#faf9f5] border border-border/40">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Scale className="h-5 w-5 text-primary" />
              Audit Rekonsiliasi Kas Harian
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Bandingkan jumlah uang fisik riil di laci kasir dengan saldo tercatat sistem hari ini.
            </DialogDescription>
          </DialogHeader>

          <form action={auditAction}>
            {auditState?.error && (
              <div className="px-6 pb-2">
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs font-medium text-destructive animate-in fade-in" role="alert">
                  {auditState.error}
                </div>
              </div>
            )}

            <div className="space-y-4 px-6 pb-6">
              <div className="rounded-lg bg-muted/10 p-3.5 border border-border/20 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-semibold">Kas Laci Tercatat (Sistem):</span>
                  <span className="font-bold text-foreground">{formatHarga(stats.netCashHariIni)}</span>
                </div>
                <input type="hidden" name="expectedCash" value={Math.round(stats.netCashHariIni / 100).toString()} />
                
                {actualCashInput && (
                  <>
                    <div className="flex justify-between text-xs border-t border-border/40 pt-2">
                      <span className="text-muted-foreground font-semibold">Uang Fisik Aktual (Input):</span>
                      <span className="font-bold text-foreground">
                        {formatHarga(Number(actualCashInput.replace(/\./g, "")) * 100)}
                      </span>
                    </div>
                    {(() => {
                      const expected = stats.netCashHariIni;
                      const actual = Math.round(Number(actualCashInput.replace(/\./g, "")) * 100);
                      const diff = actual - expected;
                      return (
                        <div className="flex justify-between text-xs font-bold pt-1">
                          <span>Selisih:</span>
                          <span className={diff === 0 ? "text-accents-green" : diff > 0 ? "text-accents-blue" : "text-destructive"}>
                            {diff === 0 ? "Cocok (Rp 0)" : diff > 0 ? `Lebih (+${formatHarga(diff)})` : `Kurang (${formatHarga(diff)})`}
                          </span>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Uang Fisik di Laci (Rupiah)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">Rp</span>
                  <input
                    type="text"
                    value={actualCashInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      if (val === "") {
                        setActualCashInput("");
                      } else {
                        setActualCashInput(new Intl.NumberFormat("id-ID").format(Number(val)));
                      }
                    }}
                    className="w-full rounded-lg border border-border bg-input pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50 font-bold"
                    placeholder="Hitung uang di laci lalu masukkan"
                    required
                  />
                  <input type="hidden" name="actualCash" value={actualCashInput.replace(/\./g, "")} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Catatan Audit <span className="font-normal text-muted-foreground">(opsional)</span></label>
                <textarea
                  name="catatan"
                  rows={2}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                  placeholder="Keterangan mengenai selisih atau catatan harian..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAuditModal(false)}>
                Batal
              </Button>
              <Button type="submit" variant="default" size="sm" disabled={auditPending}>
                {auditPending ? "Menyimpan..." : "Simpan Hasil Audit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Manual Transaction */}
      <ConfirmDialog
        open={confirmDeleteTxId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteTxId(null);
        }}
        title="Hapus Transaksi Kas"
        description="Apakah Anda yakin ingin menghapus transaksi manual ini? Tindakan ini akan menghapusnya secara permanen dari laci kasir."
        confirmLabel="Ya, Hapus"
        variant="destructive"
        onConfirm={() => {
          const form = document.getElementById("delete-tx-form") as HTMLFormElement;
          form?.requestSubmit();
        }}
        loading={deleteTxPending}
      />
      <form id="delete-tx-form" action={deleteTxAction} className="hidden">
        <input type="hidden" name="id" value={confirmDeleteTxId ?? ""} />
      </form>

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-5">
          <div className="rounded-lg bg-muted/20 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Laba Kotor</p>
            <p className="text-lg font-semibold text-foreground">{formatHarga(profitStats.totalProfit)}</p>
          </div>
          <div className="rounded-lg bg-muted/20 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Komisi Teknisi</p>
            <p className="text-lg font-semibold text-accents-orange">{formatHarga(profitStats.totalKomisi)}</p>
          </div>
          <div className="rounded-lg bg-muted/20 p-3.5 bg-destructive/5 border border-destructive/20">
            <p className="text-[10px] font-bold uppercase tracking-widest text-destructive mb-1">Beban Operasional</p>
            <p className="text-lg font-semibold text-destructive">{formatHarga(profitStats.totalPengeluaranOperasional)}</p>
          </div>
          <div className="rounded-lg bg-muted/20 p-3.5 bg-accents-green/5 border border-accents-green/20">
            <p className="text-[10px] font-bold uppercase tracking-widest text-accents-green mb-1">Laba Bersih Aktual</p>
            <p className="text-lg font-bold text-accents-green">{formatHarga(profitStats.totalLabaBersih)}</p>
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
              <span className="col-span-4">Customer / Device / Teknisi</span>
              <span className="col-span-2 text-right">Revenue</span>
              <span className="col-span-2 text-right">Modal</span>
              <span className="col-span-2 text-right">Laba Kotor</span>
              <span className="col-span-2 text-right">Laba Bersih</span>
            </div>
            {profitStats.topServices.map((s) => (
              <div key={s.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs hover:bg-muted/20 transition-colors">
                <div className="col-span-4 min-w-0">
                  <p className="text-foreground font-medium truncate">{s.customer}</p>
                  <p className="text-muted-foreground/60 truncate text-[10px]">
                    {s.merk} {s.tipe} {s.teknisiName ? `• ${s.teknisiName} (Kms: ${formatHarga(s.komisi)})` : ""}
                  </p>
                </div>
                <p className="col-span-2 text-right text-foreground self-center">{formatHarga(s.biayaFinal)}</p>
                <p className="col-span-2 text-right text-muted-foreground self-center">{formatHarga(s.modalPart)}</p>
                <p className="col-span-2 text-right font-medium self-center" style={{ color: s.profit >= 0 ? "var(--color-foreground)" : "var(--color-destructive)" }}>
                  {formatHarga(s.profit)}
                </p>
                <p className="col-span-2 text-right font-medium self-center text-accents-green">
                  {formatHarga(s.labaBersih)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
