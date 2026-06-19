"use client";

import clsx from "clsx";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Search, ClipboardX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PAYMENT_LABELS,
  STATUS_LABELS,
  formatHarga,
  getPaymentBadgeClass,
  getPaymentBadgeVariant,
  getStatusBadgeClass,
  getStatusBadgeVariant,
} from "@/lib/constants";
import type { ServiceOrderListItem } from "@/lib/data/service-orders";

function AgeBadge({ createdAt, status }: { createdAt: Date | string; status: string }) {
  // eslint-disable-next-line react-hooks/purity
  const ageDays = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  if (status === "selesai" || ageDays < 3) return null;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-destructive/10 text-destructive border border-destructive/25 animate-pulse shrink-0">
      🔴 {ageDays} Hari
    </span>
  );
}

function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
  const pages: (number | "...")[] = [];
  const delta = 2;
  const left = Math.max(2, page - delta);
  const right = Math.min(totalPages - 1, page + delta);
  pages.push(1);
  if (left > 2) pages.push("...");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);
  return pages;
}

export function ServicesClient({
  orders,
  currentStatus,
  search: initialSearch,
  page = 1,
  totalPages = 1,
  userRole,
}: {
  orders: ServiceOrderListItem[];
  currentStatus: string;
  search: string;
  page?: number;
  totalPages?: number;
  userRole?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const searchRef = useRef<HTMLInputElement>(null);
  const statuses = ["", "diterima", "menunggu_part", "dikerjakan", "selesai"];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !["INPUT", "TEXTAREA"].includes(tag))) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "n" && !["INPUT", "TEXTAREA"].includes(tag) && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        router.push("/services/new");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  const setStatus = (s: string) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (s) params.set("status", s);
    const qs = params.toString();
    router.push(qs ? `/services?${qs}` : "/services");
  };

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">Manajemen</p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Daftar Service</h1>
        </div>
        {userRole !== "teknisi" && (
          <Link href="/services/new">
            <Button variant="default" size="sm">
              + Service Baru
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (currentStatus) params.set("status", currentStatus);
            router.push(`/services?${params.toString()}`);
          }}
          className="relative flex-1 group"
        >
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-primary" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari service"
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-10.5 pr-4 text-sm text-foreground placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
            placeholder="Cari berdasarkan nama customer, merk, tipe perangkat…"
          />
        </form>

        {/* Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex h-9 items-center gap-1 rounded-xl bg-muted/10 px-1.5 py-1">
            {statuses.map((s) => (
              <Button
                key={s}
                onClick={() => setStatus(s)}
                variant={currentStatus === s ? "default" : "ghost"}
                size="sm"
                className={clsx(
                  "whitespace-nowrap text-xs font-semibold",
                  currentStatus !== s && "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                {s ? STATUS_LABELS[s] : "Semua"}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Result count */}
      <p className="text-xs text-muted-foreground/60">
        {orders.length > 0 ? `${orders.length} service` : "Tidak ada service"}
      </p>

      <div className="divide-y divide-border/40 rounded-xl bg-card/80 border border-border/40 overflow-hidden backdrop-blur-sm">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center space-y-3">
            <ClipboardX className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Tidak ada pendaftaran service yang ditemukan.</p>
          </div>
        ) : (
          orders.map((order) => (
            <Link
              key={order.id}
              href={`/services/${order.id}`}
              className="group flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-muted/20"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <p className="font-medium text-foreground text-sm group-hover:text-primary transition-colors truncate">{order.customer.nama}</p>
                  <AgeBadge createdAt={order.createdAt} status={order.status} />
                  <span className="num text-[10px] font-mono text-muted-foreground/40 shrink-0">{order.noService}</span>
                </div>
                <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
                  <span className="font-medium text-foreground/70">{order.merk} {order.tipe}</span>
                  <span className="mx-1.5 text-muted-foreground/30">&middot;</span>
                  <span>{order.problem}</span>
                </p>
              </div>

              <div className="flex items-center gap-4 ml-4 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="num text-sm font-semibold text-foreground">{formatHarga(order.biayaFinal ?? order.estimasiBiaya)}</p>
                  <p className="num text-[10px] text-muted-foreground/40 mt-0.5">{format(order.createdAt, "d MMM yyyy", { locale: id })}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={getPaymentBadgeVariant(order.statusBayar)}
                    className={clsx(
                      "text-[10px] font-bold uppercase tracking-wider font-mono rounded",
                      getPaymentBadgeClass(order.statusBayar),
                    )}
                  >
                    {PAYMENT_LABELS[order.statusBayar]}
                  </Badge>
                  <Badge
                    variant={getStatusBadgeVariant(order.status)}
                    className={clsx(
                      "text-[10px] font-bold uppercase tracking-wider font-mono rounded",
                      getStatusBadgeClass(order.status),
                    )}
                  >
                    {STATUS_LABELS[order.status] || order.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/40 pt-5">
          <Button
            onClick={() => {
              const params = new URLSearchParams();
              if (search) params.set("search", search);
              if (currentStatus) params.set("status", currentStatus);
              if (page > 2) params.set("page", String(page - 1));
              router.push(`/services?${params.toString()}`);
            }}
            disabled={page <= 1}
            variant="ghost"
            size="sm"
          >
            &larr; Sebelumnya
          </Button>
          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers(page, totalPages).map((p, i) =>
                p === "..." ? (
                  <span key={`e-${i}`} className="px-1 text-xs text-muted-foreground/40">&hellip;</span>
                ) : (
                  <Button
                    key={p}
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (search) params.set("search", search);
                      if (currentStatus) params.set("status", currentStatus);
                      if (p > 1) params.set("page", String(p));
                      router.push(`/services?${params.toString()}`);
                    }}
                    variant={p === page ? "default" : "ghost"}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs font-semibold"
                  >
                    {p}
                  </Button>
                ),
              )}
          </div>
          <Button
            onClick={() => {
              const params = new URLSearchParams();
              if (search) params.set("search", search);
              if (currentStatus) params.set("status", currentStatus);
              params.set("page", String(page + 1));
              router.push(`/services?${params.toString()}`);
            }}
            disabled={page >= totalPages}
            variant="ghost"
            size="sm"
          >
            Selanjutnya &rarr;
          </Button>
        </div>
      )}
    </div>
  );
}
