import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const STATUS_LABELS: Record<string, string> = {
  diterima: "Diterima",
  menunggu_part: "Menunggu Part",
  dikerjakan: "Dikerjakan",
  selesai: "Selesai",
};

export const STATUS_COLORS: Record<string, string> = {
  diterima: "bg-accents-blue/15 text-accents-blue border border-accents-blue/30",
  menunggu_part: "bg-accents-orange/15 text-accents-orange border border-accents-orange/30",
  dikerjakan: "bg-accents-warm/15 text-accents-warm border border-accents-warm/30",
  selesai: "bg-accents-green/15 text-accents-green border border-accents-green/30",
};

export const STATUS_ICONS: Record<string, LucideIcon> = {
  diterima: ClipboardList,
  menunggu_part: AlertTriangle,
  dikerjakan: Clock,
  selesai: CheckCircle2,
};

export const STATUS_FLOW = [
  { key: "diterima", label: "Diterima" },
  { key: "menunggu_part", label: "Menunggu Part" },
  { key: "dikerjakan", label: "Dikerjakan" },
  { key: "selesai", label: "Selesai" },
];

export const NEXT_STATUS: Record<string, { label: string; status: string }[]> = {
  diterima: [
    { label: "Kerjakan", status: "dikerjakan" },
    { label: "Tunggu Part", status: "menunggu_part" },
  ],
  menunggu_part: [{ label: "Kerjakan", status: "dikerjakan" }],
  dikerjakan: [{ label: "Selesaikan", status: "selesai" }],
  selesai: [],
};

export function formatHarga(sen: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(sen / 100);
}

export const PAYMENT_LABELS: Record<string, string> = {
  BELUM_LUNAS: "Belum Lunas",
  DP: "DP",
  LUNAS: "Lunas",
};

export const PAYMENT_COLORS: Record<string, string> = {
  BELUM_LUNAS: "bg-accents-orange/15 text-accents-orange border border-accents-orange/30",
  DP: "bg-accents-warm/15 text-accents-warm border border-accents-warm/30",
  LUNAS: "bg-accents-green/15 text-accents-green border border-accents-green/30",
};

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

export function getStatusBadgeVariant(status: string): BadgeVariant {
  if (status === "diterima") return "outline";
  if (status === "menunggu_part") return "secondary";
  return "default";
}

export function getStatusBadgeClass(status: string): string {
  return status === "selesai" ? "bg-accents-green text-white" : "";
}

export function getPaymentBadgeVariant(status: string): BadgeVariant {
  if (status === "BELUM_LUNAS") return "destructive";
  if (status === "DP") return "secondary";
  return "default";
}

export function getPaymentBadgeClass(status: string): string {
  return status === "LUNAS" ? "bg-accents-green text-white" : "";
}
