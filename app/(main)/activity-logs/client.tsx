"use client";

import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  History,
  Search,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type LogItem = {
  id: number;
  serviceOrderId: number;
  action: string;
  detail: string;
  createdAt: Date;
  serviceOrder: {
    id: number;
    noService: string;
    merk: string;
    tipe: string;
    customer: {
      nama: string;
    };
  };
};

type Props = {
  initialLogs: LogItem[];
  totalPages: number;
  currentPage: number;
  total: number;
  initialSearch: string;
  initialAction: string;
};

const ACTION_BADGES: Record<string, string> = {
  ORDER_CREATED: "bg-accents-blue/15 text-accents-blue border border-accents-blue/30 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono",
  ORDER_UPDATED: "bg-accents-warm/15 text-accents-warm border border-accents-warm/30 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono",
  STATUS_CHANGED: "bg-accents-blue/15 text-accents-blue border border-accents-blue/30 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono",
  PART_ADDED: "bg-accents-green/15 text-accents-green border border-accents-green/30 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono",
  PART_DELETED: "bg-destructive/15 text-destructive border border-destructive/30 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono",
  PAYMENT_UPDATED: "bg-accents-orange/15 text-accents-orange border border-accents-orange/30 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono",
};

const ACTION_LABELS: Record<string, string> = {
  ORDER_CREATED: "Servis Masuk",
  ORDER_UPDATED: "Edit Perangkat",
  STATUS_CHANGED: "Ubah Status",
  PART_ADDED: "Tambah Part",
  PART_DELETED: "Hapus Part",
  PAYMENT_UPDATED: "Pembayaran",
};

export function ActivityLogsClient({
  initialLogs,
  totalPages,
  currentPage,
  total,
  initialSearch,
  initialAction,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [action, setAction] = useState(initialAction);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const applyFilters = (newSearch: string, newAction: string, newPage: number) => {
    const params = new URLSearchParams();
    if (newSearch.trim()) params.set("search", newSearch.trim());
    if (newAction && newAction !== "ALL") params.set("action", newAction);
    if (newPage > 1) params.set("page", newPage.toString());
    const qs = params.toString();
    router.push(qs ? `/activity-logs?${qs}` : "/activity-logs");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(search, action, 1);
  };

  const handleActionSelect = (val: string | null) => {
    const nextAction = val ?? "ALL";
    setAction(nextAction);
    applyFilters(search, nextAction, 1);
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">
            Audit Trail
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Log Aktivitas & Audit
          </h1>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-primary" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari detail, nomor servis, nama pelanggan..."
            className="w-full rounded-lg border border-border bg-input pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
          />
        </form>

        {/* Action Type Dropdown */}
        <div className="w-full sm:w-56">
          <Select value={action} onValueChange={handleActionSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tipe Aktivitas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Aktivitas</SelectItem>
              <SelectItem value="ORDER_CREATED">Servis Masuk</SelectItem>
              <SelectItem value="ORDER_UPDATED">Edit Perangkat</SelectItem>
              <SelectItem value="STATUS_CHANGED">Perubahan Status</SelectItem>
              <SelectItem value="PART_ADDED">Penambahan Part</SelectItem>
              <SelectItem value="PART_DELETED">Penghapusan Part</SelectItem>
              <SelectItem value="PAYMENT_UPDATED">Transaksi & Pembayaran</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Tanggal & Waktu</TableHead>
              <TableHead className="w-[150px]">No. Servis</TableHead>
              <TableHead className="w-[200px]">Pelanggan / Perangkat</TableHead>
              <TableHead className="w-[150px]">Aktivitas</TableHead>
              <TableHead>Detail Perubahan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2.5">
                    <ClipboardList className="h-8 w-8 text-muted-foreground/25 animate-pulse" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Tidak ditemukan riwayat aktivitas yang cocok.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              initialLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/10">
                  <TableCell className="num text-xs text-muted-foreground/70 font-mono">
                    {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", {
                      locale: localeId,
                    })}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/services/${log.serviceOrder.id}`}
                      className="num font-semibold text-primary hover:underline"
                    >
                      {log.serviceOrder.noService}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-semibold text-foreground truncate max-w-[180px]">
                      {log.serviceOrder.customer.nama}
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 mt-0.5 truncate max-w-[180px] font-mono">
                      {log.serviceOrder.merk} {log.serviceOrder.tipe}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={ACTION_BADGES[log.action] || "bg-black/20 text-muted-foreground border border-border"}>
                      {ACTION_LABELS[log.action] || log.action.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground leading-relaxed">
                    {log.detail}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Total <span className="font-semibold text-foreground">{total}</span> aktivitas
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => applyFilters(search, action, currentPage - 1)}
              className="h-8 px-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium px-3 text-muted-foreground">
              Halaman <span className="font-semibold text-foreground">{currentPage}</span> dari{" "}
              <span className="font-semibold text-foreground">{totalPages}</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => applyFilters(search, action, currentPage + 1)}
              className="h-8 px-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
