import clsx from "clsx";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Wrench,
  Users,
  ClipboardList,
  ClipboardX,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { STATUS_COLORS, STATUS_LABELS, formatHarga } from "@/lib/constants";
import { getDashboardData } from "@/lib/data/service-orders";

// ── Skeleton Fallbacks ──

function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-24 rounded-xl border bg-card p-4">
          <div className="h-3 w-20 shimmer rounded mb-3" />
          <div className="h-7 w-16 shimmer rounded" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-48 rounded-xl border bg-card/80 p-5">
      <div className="h-3 w-32 shimmer rounded mb-5" />
      <div className="flex items-end gap-2 h-24">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-1 h-16 shimmer rounded-sm" />
        ))}
      </div>
    </div>
  );
}

function ListSectionSkeleton() {
  return (
    <section>
      <div className="mb-2 h-4 w-36 shimmer rounded" />
      <div className="divide-y rounded-xl border bg-card/80">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3.5">
            <div className="space-y-1.5">
              <div className="h-4 w-28 shimmer rounded" />
              <div className="h-3 w-20 shimmer rounded" />
            </div>
            <div className="h-5 w-16 shimmer rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}

function BottomStatsSkeleton() {
  return (
    <div className="flex items-center gap-6 py-4 border-t border-border/30">
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg shimmer" />
        <div className="space-y-1">
          <div className="h-3 w-20 shimmer rounded" />
          <div className="h-5 w-10 shimmer rounded" />
        </div>
      </div>
      <div className="w-px h-7 bg-border/30" />
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg shimmer" />
        <div className="space-y-1">
          <div className="h-3 w-16 shimmer rounded" />
          <div className="h-5 w-10 shimmer rounded" />
        </div>
      </div>
    </div>
  );
}

// ── Async Data Components ──

async function StatsCards() {
  const data = await getDashboardData();
  const cards = [
    { label: "Diterima", value: data.diterima, icon: ClipboardList },
    { label: "Menunggu Part", value: data.menungguPart, icon: AlertTriangle },
    { label: "Dikerjakan", value: data.dikerjakan, icon: Clock },
    { label: "Selesai", value: data.selesai, icon: CheckCircle2 },
    { label: "Revenue Bulan Ini", value: formatHarga(data.revenueBulanIni), icon: Wallet },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="relative flex flex-col gap-3 overflow-hidden rounded-xl bg-card/80 p-4 border border-border/40 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                {card.label}
              </span>
              <Icon className="h-3.5 w-3.5 text-muted-foreground/30" />
            </div>
            <p className="num text-2xl font-semibold tracking-tight text-foreground">{card.value}</p>
          </div>
        );
      })}
    </div>
  );
}

async function RevenueChart() {
  const data = await getDashboardData();
  if (!data.monthlyRevenue || !data.monthlyRevenue.some((m) => m.revenue > 0)) return null;

  const maxRev = Math.max(...data.monthlyRevenue.map((x) => x.revenue), 0);

  return (
    <div className="bg-card/80 rounded-xl p-5 border border-border/40 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Revenue 6 Bulan</p>
        <span className="num text-xs text-muted-foreground/50">{formatHarga(data.revenueBulanIni)}</span>
      </div>
      <div className="flex items-end gap-2 h-24">
        {data.monthlyRevenue.map((m) => {
          const pct = maxRev > 0 ? (m.revenue / maxRev) * 100 : 0;
          const isMax = m.revenue === maxRev && m.revenue > 0;
          return (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-sm relative" style={{ height: `${Math.max(pct, 4)}%` }}>
                <div
                  className={clsx(
                    "absolute inset-0 rounded-sm transition-all duration-700",
                    isMax ? "bg-primary/60" : "bg-muted/50"
                  )}
                />
                {isMax && (
                  <div className="absolute inset-0 rounded-sm bg-primary/20 blur-sm" />
                )}
              </div>
              <span className="text-[9px] font-mono text-muted-foreground/40 tracking-tight">{m.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

async function ActiveServices() {
  const data = await getDashboardData();

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
          <Wrench className="h-3 w-3" />
          Sedang Dikerjakan
        </p>
        <Link href="/services" className="text-[10px] font-mono text-muted-foreground/50 hover:text-primary transition-colors">
          lihat semua →
        </Link>
      </div>
      <div className="divide-y divide-border/40 rounded-xl bg-card/80 border border-border/40 overflow-hidden backdrop-blur-sm">
        {data.activeServices.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center space-y-2">
            <ClipboardX className="h-6 w-6 text-muted-foreground/25" />
            <p className="text-xs text-muted-foreground/50">Tidak ada service aktif</p>
          </div>
        ) : (
          data.activeServices.map((order) => (
            <Link
              key={order.id}
              href={`/services/${order.id}`}
              className="group flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-muted/20"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {order.customer.nama}
                </p>
                <p className="num text-[11px] text-muted-foreground/50 mt-0.5">
                  {order.merk} {order.tipe}
                </p>
              </div>
              <span
                className={clsx(
                  "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono",
                  STATUS_COLORS[order.status] || "bg-black/20 text-muted-foreground border border-border"
                )}
              >
                {STATUS_LABELS[order.status] || order.status.replace("_", " ")}
              </span>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

async function CompletedSection() {
  const data = await getDashboardData();

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
          <CheckCircle2 className="h-3 w-3 text-accents-green" />
          Riwayat Selesai
        </p>
        <Link href="/services?status=selesai" className="text-[10px] font-mono text-muted-foreground/50 hover:text-primary transition-colors">
          lihat semua →
        </Link>
      </div>
      {data.recentCompleted.length === 0 ? (
        <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground/50">
          <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/30" />
          Belum ada service selesai
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-1">
          {data.recentCompleted.map((order) => (
            <Link
              key={order.id}
              href={`/services/${order.id}`}
              className="group flex items-center justify-between rounded-lg bg-card/50 border border-border/30 px-4 py-2.5 hover:bg-muted/20 hover:border-border/60 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-medium text-foreground truncate">{order.customer.nama}</span>
                <span className="num text-[10px] text-muted-foreground/40 shrink-0">{order.merk} {order.tipe}</span>
              </div>
              <span className="num text-[10px] text-muted-foreground/40 shrink-0">{format(order.updatedAt, "d MMM", { locale: id })}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

async function BottomStats() {
  const data = await getDashboardData();

  return (
    <div className="flex items-center gap-6 py-4 border-t border-border/30">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accents-blue/10 text-accents-blue">
          <Users className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Total Customer</p>
          <p className="num text-base font-semibold text-foreground">{data.totalCustomers}</p>
        </div>
      </div>
      <div className="w-px h-7 bg-border/30" />
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accents-green/10 text-accents-green">
          <Wrench className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Total Service</p>
          <p className="num text-base font-semibold text-foreground">{data.total}</p>
        </div>
      </div>
    </div>
  );
}

// ── Page ──

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      {/* Ambient top glow */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">Overview</p>
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <span className="text-xs text-muted-foreground/40 font-mono">{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
        </div>
      </div>

      {/* Stats Cards Grid — streamed */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      {/* Mini Revenue Chart — streamed */}
      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />
      </Suspense>

      {/* Active Services — streamed */}
      <Suspense fallback={<ListSectionSkeleton />}>
        <ActiveServices />
      </Suspense>

      {/* Completed History — streamed */}
      <Suspense fallback={<ListSectionSkeleton />}>
        <CompletedSection />
      </Suspense>

      {/* Bottom Stats Bar — streamed */}
      <Suspense fallback={<BottomStatsSkeleton />}>
        <BottomStats />
      </Suspense>
    </div>
  );
}
