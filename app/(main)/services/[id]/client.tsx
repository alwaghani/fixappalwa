"use client";

import clsx from "clsx";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import html2canvas from "html2canvas";
import {
  Smartphone,
  User,
  Lock,
  Wrench,
  Plus,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  Pencil,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Check,
  Calendar,
  ShieldAlert,
  Shield,
  History,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast-core";
import {
  addServicePartAction,
  assignTeknisiAction,
  deleteServiceOrderAction,
  deleteServicePartAction,
  updateServiceOrderAction,
  updateServiceStatusAction,
  updatePaymentAction,
} from "@/lib/actions";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_ICONS,
  STATUS_FLOW,
  NEXT_STATUS,
  PAYMENT_LABELS,
  formatHarga,
  getStatusBadgeVariant,
  getStatusBadgeClass,
  getPaymentBadgeVariant,
  getPaymentBadgeClass,
} from "@/lib/constants";
import type { ServiceOrderWithRelations } from "@/lib/data/service-orders";
import type { PaymentStatus, ServiceStatus } from "@/lib/generated/prisma/client";

const StatusStepper = memo(function StatusStepper({ status }: { status: ServiceStatus }) {
  const currentIdx = STATUS_FLOW.findIndex((x) => x.key === status);
  return (
    <div className="rounded-xl bg-card p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5 border-b border-border pb-3">
        <ClipboardList className="h-4 w-4 text-primary" /> Status Pengerjaan
      </h2>
      <div className="flex flex-col sm:flex-row items-start gap-0 sm:gap-0">
        {STATUS_FLOW.map((s, idx) => {
          const done = idx <= currentIdx;
          const isCurrent = s.key === status;

          return (
            <div key={s.key} className="flex-1 flex flex-col items-center w-full">
              <div className="flex items-center w-full">
                {/* Dot / Step Indicator */}
                <div className="relative flex items-center justify-center w-full">
                  <div
                    className={clsx(
                      "relative flex items-center justify-center w-8 h-8 rounded-full shrink-0 z-10 transition-colors duration-200",
                      done
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                        : "bg-muted/50 text-muted-foreground border border-border/60",
                      isCurrent && "ring-2 ring-primary/30 ring-offset-2 ring-offset-card",
                    )}
                  >
                    {done ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                    )}
                  </div>
                  {/* Connector line */}
                  {idx < STATUS_FLOW.length - 1 && (
                    <div
                      className={clsx(
                        "hidden sm:block absolute left-[calc(50%+1.25rem)] right-0 top-1/2 -translate-y-1/2 h-[2px] transition-colors duration-200",
                        done && (idx < currentIdx || (idx === currentIdx && !isCurrent))
                          ? "bg-primary/40"
                          : "bg-border/60",
                      )}
                    />
                  )}
                </div>
              </div>
              {/* Label */}
              <span
                className={clsx(
                  "text-[11px] font-bold text-center mt-2 px-1 leading-tight",
                  done ? "text-primary" : "text-muted-foreground/60",
                  isCurrent && "text-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export function ServiceDetailClient({
  order,
  relatedOrders,
  settings,
  userRole,
  teknisiList,
}: {
  order: NonNullable<ServiceOrderWithRelations>;
  relatedOrders: Array<{ id: number; noService: string; status: string; createdAt: Date; customer: { nama: string; noHp: string } }>;
  settings: Record<string, string>;
  userRole?: string;
  teknisiList: Array<{ id: number; name: string | null; username: string; role: string }>;
}) {
  const router = useRouter();
  const isStaff = userRole === "kasir" || userRole === "admin";
  const [isPending, startTransition] = useTransition();
  const [currentOrder, setCurrentOrder] = useState(order);
  const [prevOrder, setPrevOrder] = useState(order);

  const [selectedMerk, setSelectedMerk] = useState(order.merk);
  const [selectedTipe, setSelectedTipe] = useState(order.tipe);

  if (order !== prevOrder) {
    setPrevOrder(order);
    setCurrentOrder(order);
    setSelectedMerk(order.merk);
    setSelectedTipe(order.tipe);
  }

  const operationRef = useRef(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingService, setEditingService] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const formatAngka = (val: string) =>
    val.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  const [biayaFinalEdit, setBiayaFinalEdit] = useState(
    currentOrder.biayaFinal
      ? formatAngka(String(Math.round(currentOrder.biayaFinal / 100)))
      : "",
  );

  const [biayaFinalPay, setBiayaFinalPay] = useState(
    currentOrder.biayaFinal
      ? formatAngka(String(Math.round(currentOrder.biayaFinal / 100)))
      : formatAngka(String(Math.round(currentOrder.estimasiBiaya / 100))),
  );

  const [dpNominalPay, setDpNominalPay] = useState(
    currentOrder.dpNominal
      ? formatAngka(String(Math.round(currentOrder.dpNominal / 100)))
      : "",
  );

  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus>(order.statusBayar);

  const openPaymentDialog = useCallback(() => {
    setSelectedStatus(currentOrder.statusBayar);
    setBiayaFinalPay(currentOrder.biayaFinal ? formatAngka(String(Math.round(currentOrder.biayaFinal / 100))) : formatAngka(String(Math.round((currentOrder.biayaFinal ?? currentOrder.estimasiBiaya) / 100))));
    setDpNominalPay(currentOrder.dpNominal ? formatAngka(String(Math.round(currentOrder.dpNominal / 100))) : "");
    setPaymentOpen(true);
  }, [currentOrder.statusBayar, currentOrder.biayaFinal, currentOrder.estimasiBiaya, currentOrder.dpNominal]);

  const handleTeknisiChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const selectedId = val ? Number(val) : null;
    const selectedTeknisi = teknisiList.find(t => t.id === selectedId) || null;

    const previousOrder = currentOrder;
    // Optimistic update of state
    setCurrentOrder(prev => ({
      ...prev,
      teknisiId: selectedId,
      teknisi: selectedTeknisi
    }));

    const fd = new FormData();
    fd.set("id", String(currentOrder.id));
    fd.set("teknisiId", val);

    const res = await assignTeknisiAction(undefined, fd);
    if (res.error) {
      toast("error", res.error);
      // Revert state on error
      setCurrentOrder(previousOrder);
    } else {
      toast("success", "Teknisi ditetapkan");
      router.refresh();
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
        return;
      }
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        setEditingService((prev) => !prev);
      }
      if ((e.key === "p" || e.key === "P") && isStaff) {
        e.preventDefault();
        openPaymentDialog();
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        router.back();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router, isStaff, openPaymentDialog]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDeleteOrder, setConfirmDeleteOrder] = useState(false);
  const [, deleteAction, deletePending] = useActionState(deleteServiceOrderAction, undefined);
  const [partNama, setPartNama] = useState("");
  const [partHargaPokok, setPartHargaPokok] = useState("");
  const [addingPart, setAddingPart] = useState(false);
  const [warrantyOpen, setWarrantyOpen] = useState(false);
  const [warrantyInput, setWarrantyInput] = useState("30");



  const StatusIcon = STATUS_ICONS[currentOrder.status];
  const biaya = currentOrder.biayaFinal ?? currentOrder.estimasiBiaya;
  const totalModal = currentOrder.parts.reduce((s, p) => s + (p.hargaPokok ?? 0), 0);
  const laba = currentOrder.biayaFinal !== null ? currentOrder.biayaFinal - totalModal : null;
  const pinArr = currentOrder.pin && /^\d+(,\d+)*$/.test(currentOrder.pin)
    ? currentOrder.pin.split(",").map(Number)
    : null;

  const downloadHtmlAsPng = async (htmlContent: string, fileName: string) => {
    // Enforce 4:5 aspect ratio by wrapping receipt content inside a flex container
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "-9999px";
    wrapper.style.top = "0";
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "center";
    wrapper.style.alignItems = "flex-start";
    wrapper.style.background = "#ffffff";
    wrapper.style.zIndex = "-1000";

    const inner = document.createElement("div");
    inner.style.width = "480px";
    inner.style.background = "#ffffff";
    inner.innerHTML = htmlContent;
    
    wrapper.appendChild(inner);
    document.body.appendChild(wrapper);

    // Remove print buttons from screenshot
    const printBtns = wrapper.querySelectorAll(".print-btn");
    printBtns.forEach((btn) => btn.remove());

    // Wait for images and layouts to settle
    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      const pageElement = wrapper.querySelector(".page") as HTMLElement || inner;
      
      // Measure natural height of the receipt content
      const contentHeight = pageElement.offsetHeight;
      
      const baseWidth = 480;
      const baseHeight = 600; // 480 * 5 / 4 (4:5 Ratio)

      if (contentHeight <= baseHeight) {
        // Content fits inside standard 4:5 aspect ratio
        wrapper.style.width = `${baseWidth}px`;
        wrapper.style.height = `${baseHeight}px`;
      } else {
        // Content is taller; scale the width up proportionally to maintain 4:5 ratio
        const targetWidth = Math.round(contentHeight * 4 / 5);
        wrapper.style.width = `${targetWidth}px`;
        wrapper.style.height = `${contentHeight}px`;
      }

      // Format page styles for a clean screenshot on white background
      pageElement.style.margin = "0 auto";
      pageElement.style.boxShadow = "none";

      const canvas = await html2canvas(wrapper, {
        useCORS: true,
        scale: 2, // high-res
        backgroundColor: "#ffffff",
        logging: false,
      });

      const dataUrl = canvas.toDataURL("image/png");
      
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast("success", "Gambar nota berhasil diunduh.");
    } catch {
      toast("error", "Gagal mengunduh gambar nota.");
    } finally {
      document.body.removeChild(wrapper);
    }
  };

  const handlePrint = async () => {
    const c = currentOrder;
    const parts = [
      `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Invoice ${c.noService}</title>`,
      `<style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui, -apple-system, sans-serif; font-size: 19px; color: #111; background: #ffffff; line-height: 1.5; }
        .page { max-width: 480px; margin: 0 auto; background: #fff; min-height: auto; padding: 32px 28px; box-shadow: 0 0 40px rgba(0,0,0,0.06); }

        .header { text-align: center; margin-bottom: 28px; }
        .header .brand { font-size: 34px; font-weight: 900; letter-spacing: 1.5px; color: #111; }
        .header .brand-sub { font-size: 15px; color: #777; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }

        .inv-num { text-align: center; margin-bottom: 24px; padding: 16px 0; border-top: 2px solid #eee; border-bottom: 2px solid #eee; }
        .inv-num .label { font-size: 15px; color: #888; text-transform: uppercase; letter-spacing: 1.5px; }
        .inv-num .value { font-size: 26px; font-weight: 800; letter-spacing: 0.5px; color: #111; margin-top: 4px; }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 16px; margin-bottom: 20px; }
        .grid-2 .item .lbl { font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .grid-2 .item .val { font-weight: 600; font-size: 18px; }

        .divider { height: 1px; background: #eee; margin: 20px 0; }

        .section { margin-bottom: 20px; }
        .section-title { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 10px; }

        table { width: 100%; border-collapse: collapse; font-size: 17px; }
        th { text-align: left; font-weight: 600; font-size: 14px; color: #888; border-bottom: 1px solid #eee; padding: 8px 0 6px; }
        th.r, td.r { text-align: right; }
        td { padding: 8px 0; }

        .total-box { border-top: 3px solid #111; margin-top: 8px; padding-top: 10px; }
        .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 17px; }
        .total-row.final { font-size: 26px; font-weight: 800; padding: 10px 0 0; border-top: 1px solid #eee; margin-top: 8px; }
        .total-row .lbl { color: #555; }
        .total-row.final .lbl { color: #111; }

        .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .status-badge.lunas { background: #e8f5e9; color: #2e7d32; }
        .status-badge.dp { background: #fff3e0; color: #e65100; }
        .status-badge.belum { background: #ffeef0; color: #c62828; }

        .footer { text-align: center; padding-top: 28px; margin-top: 32px; border-top: 2px solid #111; }
        .footer p { font-size: 15px; color: #666; line-height: 1.7; }
        .footer .ref { font-size: 13px; color: #999; margin-top: 8px; }
        .print-btn { display: block; width: 100%; background: #111; color: #fff; border: 0; padding: 16px; font-size: 16px; font-weight: 600; border-radius: 12px; margin-top: 24px; cursor: pointer; }
        @media print { .print-btn { display: none; } body { background: #fff; } .page { max-width: none; min-height: auto; padding: 20px; box-shadow: none; } }
      </style></head><body><div class="page">`,
      `<div class="header">`,
      `<div class="brand">${settings.nama_toko || "FIXAPP"}</div>`,
      `<div class="brand-sub">${settings.alamat || "Repair Service"}</div>`,
      `<div class="brand-sub" style="margin-top: 4px; font-weight: bold;">Telp: ${settings.no_telepon || ""}</div>`,
      `</div>`,

      `<div class="inv-num"><div class="label">No. Invoice</div><div class="value">${c.noService}</div></div>`,

      `<div class="grid-2">
        <div class="item"><div class="lbl">Tanggal</div><div class="val">${format(c.createdAt, "dd MMM yyyy", { locale: localeId })}</div></div>
        <div class="item"><div class="lbl">Status</div><div class="val">${STATUS_LABELS[c.status]}</div></div>
        <div class="item"><div class="lbl">Pembayaran</div><div class="val">${PAYMENT_LABELS[c.statusBayar]}</div></div>
        ${c.lunasAt ? `<div class="item"><div class="lbl">Lunas</div><div class="val">${format(c.lunasAt, "dd MMM yyyy", { locale: localeId })}</div></div>` : ""}
      </div>`,

      `<div class="divider"></div>`,

      `<div class="section"><div class="section-title">Pelanggan</div>
      <table><tr><td>${c.customer.nama}</td></tr>
      <tr><td style="color:#888">${c.customer.noHp}</td></tr>
      ${c.customer.alamat ? `<tr><td style="color:#888">${c.customer.alamat}</td></tr>` : ""}</table></div>`,

      `<div class="section"><div class="section-title">Perangkat</div>
      <table><tr><td>${c.merk} ${c.tipe}</td></tr>
      <tr><td style="color:#888">${c.problem}</td></tr>
      ${c.catatan ? `<tr><td style="font-size:13px;color:#999">Catatan: ${c.catatan}</td></tr>` : ""}</table></div>`,

      `<div class="section"><div class="section-title">Sparepart</div>`,
      c.parts.length === 0 ? `<p style="color:#bbb;font-style:italic">Tidak ada sparepart</p>` : `<table><tr><th>Nama</th><th class="r">Harga</th></tr>${c.parts.map((p) => `<tr><td>${p.nama}</td><td class="r">${formatHarga(p.harga)}</td></tr>`).join("")}</table>`,
      `</div>`,

      `<div class="total-box">`,
      `<div class="total-row"><span class="lbl">Estimasi Biaya</span><span>${formatHarga(c.estimasiBiaya)}</span></div>`,
      c.biayaFinal != null ? `<div class="total-row"><span class="lbl">Biaya Final</span><span>${formatHarga(c.biayaFinal)}</span></div>` : "",
      c.dpNominal != null && c.dpNominal > 0 ? `<div class="total-row"><span class="lbl">DP Dibayar</span><span>${formatHarga(c.dpNominal)}</span></div>` : "",
      c.biayaFinal != null ? `<div class="total-row final"><span class="lbl">${c.statusBayar === "LUNAS" ? "Status" : "Sisa Tagihan"}</span><span>${c.statusBayar === "LUNAS" ? "<span style='color:#2e7d32'>LUNAS</span>" : formatHarga(c.biayaFinal - (c.dpNominal ?? 0))}</span></div>` : "",
      `</div>`,

      c.status === "selesai" && warrantyEnd ? `<div style="font-size:13px;color:#999;padding:12px 0;border-top:1px solid #eee;margin-top:12px">Garansi berlaku hingga ${format(warrantyEnd, "dd MMM yyyy", { locale: localeId })}</div>` : "",

      `<div class="footer"><p>${(settings.catatan_invoice || "Terima kasih telah mempercayakan perangkat Anda").replace(/\n/g, "<br>")}</p><p class="ref">${c.noService}</p></div>`,
      `<button class="print-btn" onclick="window.print()">Cetak / Simpan PDF</button></div></body></html>`,
    ];
    const lines = parts.filter(Boolean).join("\n");
    await downloadHtmlAsPng(lines, `${c.noService}-invoice.png`);
  };

  const handlePrintReceipt = async () => {
    const c = currentOrder;
    const parts = [
      `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tanda Terima ${c.noService}</title>`,
      `<style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui, -apple-system, sans-serif; font-size: 18px; color: #111; background: #ffffff; line-height: 1.5; }
        .page { max-width: 480px; margin: 0 auto; background: #fff; min-height: auto; padding: 32px 28px; box-shadow: 0 0 40px rgba(0,0,0,0.06); }

        .header { text-align: center; margin-bottom: 24px; }
        .header .brand { font-size: 32px; font-weight: 900; letter-spacing: 1.5px; color: #111; }
        .header .brand-sub { font-size: 15px; color: #555; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }

        .receipt-num { text-align: center; margin-bottom: 24px; padding: 16px 0; border-top: 2px dashed #eee; border-bottom: 2px dashed #eee; }
        .receipt-num .label { font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 1.5px; }
        .receipt-num .value { font-size: 24px; font-weight: 800; letter-spacing: 0.5px; color: #111; margin-top: 4px; }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 12px; margin-bottom: 20px; }
        .grid-2 .item .lbl { font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .grid-2 .item .val { font-weight: 600; font-size: 17px; }

        .divider { height: 1px; background: #eee; margin: 16px 0; }

        .section { margin-bottom: 16px; }
        .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 8px; }

        table { width: 100%; border-collapse: collapse; font-size: 16px; }
        td { padding: 6px 0; }

        .total-box { border-top: 2px dashed #eee; margin-top: 8px; padding-top: 10px; }
        .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 16px; }
        .total-row .lbl { color: #555; }

        .terms { font-size: 13px; color: #666; padding-top: 16px; margin-top: 20px; border-top: 2px dashed #eee; line-height: 1.6; }
        .terms-title { font-weight: bold; text-transform: uppercase; margin-bottom: 6px; color: #111; }
        .terms ol { padding-left: 14px; }

        .footer { text-align: center; margin-top: 24px; }
        .footer p { font-size: 14px; color: #777; }
        
        .print-btn { display: block; width: 100%; background: #111; color: #fff; border: 0; padding: 14px; font-size: 15px; font-weight: 600; border-radius: 10px; margin-top: 24px; cursor: pointer; }
        @media print { .print-btn { display: none; } body { background: #fff; } .page { max-width: none; min-height: auto; padding: 15px; box-shadow: none; } }
      </style></head><body><div class="page">`,
      `<div class="header">`,
      `<div class="brand">${settings.nama_toko || "FIXAPP"}</div>`,
      `<div class="brand-sub">${settings.alamat || "Repair Service"}</div>`,
      `<div class="brand-sub" style="margin-top: 4px; font-weight: bold;">Telp: ${settings.no_telepon || ""}</div>`,
      `</div>`,

      `<div class="receipt-num"><div class="label">Tanda Terima Servis Masuk</div><div class="value">${c.noService}</div></div>`,

      `<div class="grid-2">
        <div class="item"><div class="lbl">Tanggal Masuk</div><div class="val">${format(c.createdAt, "dd MMM yyyy", { locale: localeId })}</div></div>
        <div class="item"><div class="lbl">Status</div><div class="val">${STATUS_LABELS[c.status]}</div></div>
      </div>`,

      `<div class="divider"></div>`,

      `<div class="section"><div class="section-title">Pelanggan</div>
      <table><tr><td>${c.customer.nama}</td></tr>
      <tr><td style="color:#666">${c.customer.noHp}</td></tr></table></div>`,

      `<div class="section"><div class="section-title">Perangkat</div>
      <table><tr><td>${c.merk} ${c.tipe}</td></tr>
      <tr><td style="color:#666">Masalah: ${c.problem}</td></tr>
      ${c.catatan ? `<tr><td style="font-size:13px;color:#777">Catatan: ${c.catatan}</td></tr>` : ""}</table></div>`,

      `<div class="total-box">`,
      `<div class="total-row"><span class="lbl">Estimasi Biaya</span><span>${formatHarga(c.estimasiBiaya)}</span></div>`,
      c.dpNominal != null && c.dpNominal > 0 ? `<div class="total-row"><span class="lbl">DP Dibayar</span><span>${formatHarga(c.dpNominal)}</span></div>` : "",
      `</div>`,

      `<div class="terms">`,
      `<div class="terms-title">Syarat & Ketentuan Servis:</div>`,
      `<ol>`,
      `<li>Pengambilan perangkat wajib membawa struk tanda terima ini.</li>`,
      `<li>Garansi servis berlaku selama 30 hari terhitung sejak tanggal selesai untuk kerusakan/komponen yang sama.</li>`,
      `<li>Kami tidak bertanggung jawab atas hilangnya data internal perangkat selama masa perbaikan. Pastikan Anda melakukan backup data terlebih dahulu.</li>`,
      `<li>Barang servis yang tidak diambil dalam waktu 60 hari di luar tanggung jawab kami apabila terjadi kehilangan atau kerusakan.</li>`,
      `</ol>`,
      `</div>`,

      `<div class="footer"><p class="ref" style="margin-top:16px; font-weight:bold;">${c.noService}</p></div>`,
      `<button class="print-btn" onclick="window.print()">Cetak / Simpan PDF</button></div></body></html>`,
    ];
    const lines = parts.filter(Boolean).join("\n");
    await downloadHtmlAsPng(lines, `${c.noService}-tanda-terima.png`);
  };

  const handleUpdateOrder = async (formData: FormData) => {
    const op = ++operationRef.current;
    setError("");
    setSuccess("");

    const merk = formData.get("merk") as string | null;
    const tipe = formData.get("tipe") as string | null;
    const pin = formData.get("pin") as string | null;
    const problem = formData.get("problem") as string | null;
    const catatan = formData.get("catatan") as string | null;
    const biayaFinalRaw = formData.get("biayaFinal") as string | null;

    formData.set("id", currentOrder.id.toString());
    const result = await updateServiceOrderAction(undefined, formData);
    if (result?.error) {
      if (op === operationRef.current) setError(String(result.error));
      return;
    }

    setCurrentOrder((prev) => ({
      ...prev,
      ...(merk ? { merk } : {}),
      ...(tipe ? { tipe } : {}),
      ...(pin !== null ? { pin } : {}),
      ...(problem ? { problem } : {}),
      ...(catatan !== null ? { catatan } : {}),
      ...(biayaFinalRaw ? { biayaFinal: Math.round(parseFloat(biayaFinalRaw.replace(/\./g, "")) * 100) } : {}),
    }));
    setEditingService(false);
    if (op === operationRef.current) setSuccess("Service berhasil diperbarui");
    router.refresh();
  };

  const handleStatusUpdate = async (newStatus: string, warrantyDays?: number) => {
    startTransition(async () => {
      const op = ++operationRef.current;

      const previousOrder = currentOrder;
      setCurrentOrder((prev) => ({ ...prev, status: newStatus as ServiceStatus }));

      const formData = new FormData();
      formData.set("id", currentOrder.id.toString());
      formData.set("status", newStatus);
      if (warrantyDays !== undefined) {
        formData.set("warrantyDays", warrantyDays.toString());
      }

      const result = await updateServiceStatusAction(undefined, formData);
      if (result?.error) {
        if (op === operationRef.current) {
          setCurrentOrder(previousOrder);
          toast("error", result.error);
        }
        return;
      }

      if (op === operationRef.current) toast("success", `Status diubah ke ${STATUS_LABELS[newStatus]}`);
      router.refresh();
    });
  };

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partNama || !partHargaPokok) return;

    const op = ++operationRef.current;
    setAddingPart(true);

    const previousParts = currentOrder.parts;
    const hargaPokokSen = Math.round(parseFloat(partHargaPokok.replace(/\./g, "")) * 100);
    const tempId = -Date.now();
    const newPart = {
      id: tempId,
      serviceOrderId: currentOrder.id,
      nama: partNama,
      harga: hargaPokokSen,
      hargaPokok: hargaPokokSen,
      createdAt: new Date(),
    };
    setCurrentOrder((prev) => ({
      ...prev,
      parts: [...prev.parts, newPart],
    }));

    const formData = new FormData();
    formData.set("serviceOrderId", currentOrder.id.toString());
    formData.set("nama", partNama);
    formData.set("harga", String(hargaPokokSen));
    formData.set("hargaPokok", String(hargaPokokSen));

    const result = await addServicePartAction(undefined, formData);
    if (result?.error) {
      if (op === operationRef.current) {
        setCurrentOrder((prev) => ({ ...prev, parts: previousParts }));
        toast("error", result.error);
      }
      setAddingPart(false);
      return;
    }

    // Ganti tempId dengan real ID dari server biar delete part ga pake ID palsu
    if (result?.partId && op === operationRef.current) {
      setCurrentOrder((prev) => ({
        ...prev,
        parts: prev.parts.map((p) =>
          p.id === tempId ? { ...p, id: result.partId } : p,
        ),
      }));
    }

    setPartNama("");
    setPartHargaPokok("");
    setAddingPart(false);
    if (op === operationRef.current) toast("success", "Sparepart berhasil ditambahkan");
    router.refresh();
  };

  const handleDeletePart = async (partId: number) => {
    const op = ++operationRef.current;

    const previousParts = currentOrder.parts;
    setCurrentOrder((prev) => ({
      ...prev,
      parts: prev.parts.filter((p) => p.id !== partId),
    }));

    const formData = new FormData();
    formData.set("partId", partId.toString());
    formData.set("orderId", currentOrder.id.toString());

    const result = await deleteServicePartAction(undefined, formData);
    if (result?.error) {
      if (op === operationRef.current) {
        setCurrentOrder((prev) => ({ ...prev, parts: previousParts }));
        toast("error", result.error);
      }
      return;
    }

    setConfirmDelete(null);
    if (op === operationRef.current) toast("success", "Sparepart berhasil dihapus");
    router.refresh();
  };

  const handlePayment = async (formData: FormData) => {
    const op = ++operationRef.current;
    setPaymentLoading(true);

    const statusBayar = formData.get("statusBayar") as string;
    const dpNominalRaw = (formData.get("dpNominal") as string) || "";
    const biayaFinalRaw = (formData.get("biayaFinal") as string) || "";
    const dpNominal = dpNominalRaw ? Number(dpNominalRaw.replace(/\./g, "")) : undefined;
    const biayaFinalRp = biayaFinalRaw ? parseFloat(biayaFinalRaw.replace(/\./g, "")) : undefined;

    // Client-side financial validations
    if (statusBayar === "DP") {
      const finalDp = dpNominal ?? 0;
      const finalBiayaVal = biayaFinalRp !== undefined ? biayaFinalRp : (currentOrder.biayaFinal ? currentOrder.biayaFinal / 100 : biaya / 100);
      if (finalDp <= 0) {
        toast("error", "Nominal uang muka (DP) wajib diisi dan harus lebih besar dari 0");
        setPaymentLoading(false);
        return;
      }
      if (finalDp > finalBiayaVal) {
        toast("error", "Nominal uang muka (DP) tidak boleh melebihi biaya final tagihan");
        setPaymentLoading(false);
        return;
      }
    }

    if (statusBayar === "LUNAS") {
      const finalBiayaVal = biayaFinalRp !== undefined ? biayaFinalRp : (currentOrder.biayaFinal ? currentOrder.biayaFinal / 100 : biaya / 100);
      const finalDpVal = (currentOrder.dpNominal ?? 0) / 100;
      if (finalBiayaVal < 0) {
        toast("error", "Biaya final tidak boleh kurang dari 0");
        setPaymentLoading(false);
        return;
      }
      if (finalBiayaVal < finalDpVal) {
        toast(
          "error",
          `Biaya pelunasan (Rp ${formatAngka(String(Math.round(finalBiayaVal)))}) tidak boleh kurang dari nominal DP yang sudah dibayar (Rp ${formatAngka(String(Math.round(finalDpVal)))})`
        );
        setPaymentLoading(false);
        return;
      }
    }

    formData.set("id", currentOrder.id.toString());
    if (!formData.has("biayaFinal")) {
      formData.set("biayaFinal", String(Math.round(biaya / 100)));
    }

    const result = await updatePaymentAction(undefined, formData);
    if (result?.error) {
      if (op === operationRef.current) {
        toast("error", result.error);
      }
      setPaymentLoading(false);
      return;
    }

    if (op === operationRef.current) {
      setCurrentOrder((prev) => ({
        ...prev,
        statusBayar: (statusBayar ?? prev.statusBayar) as PaymentStatus,
        ...(dpNominal !== undefined ? { dpNominal: Math.round(dpNominal * 100) } : {}),
        ...(biayaFinalRp !== undefined ? { biayaFinal: Math.round(biayaFinalRp * 100) } : {}),
        lunasAt: statusBayar === "LUNAS" ? new Date() : null,
      }));
      toast("success", "Status pembayaran berhasil diperbarui");
    }
    setPaymentOpen(false);
    setPaymentLoading(false);
    router.refresh();
  };

  const warrantyEnd = currentOrder.warrantyUntil;
  const warrantyActive = warrantyEnd && new Date(warrantyEnd) > new Date();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation & Info */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/services")}>
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar
        </Button>
        <span className="text-xs text-muted-foreground/60">
          ID Service: #{currentOrder.id} &middot; Dibuat pada {format(currentOrder.createdAt, "d MMMM yyyy, HH:mm", { locale: localeId })}
        </span>
      </div>

      {/* Main Title Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {currentOrder.merk} {currentOrder.tipe}
          </h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono text-xs text-muted-foreground/60">{currentOrder.noService}</span>
            <span className="mx-2 text-muted-foreground/30">&middot;</span>
            Kelola pengerjaan perangkat, status pembayaran, dan penambahan suku cadang.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={getStatusBadgeVariant(currentOrder.status)}
            className={clsx(
              "text-[10px] font-bold uppercase tracking-wider",
              getStatusBadgeClass(currentOrder.status),
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {STATUS_LABELS[currentOrder.status]}
          </Badge>
          <Badge
            variant={getPaymentBadgeVariant(currentOrder.statusBayar)}
            className={clsx(
              "text-[10px] font-bold uppercase tracking-wider",
              getPaymentBadgeClass(currentOrder.statusBayar),
            )}
          >
            <Banknote className="h-3 w-3" />
            {PAYMENT_LABELS[currentOrder.statusBayar]}
          </Badge>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <p className="flex items-center gap-2.5 rounded-lg border border-accents-green/30 bg-accents-green/10 px-4 py-3 text-sm text-accents-green animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-accents-green/80" />
          {success}
        </p>
      )}
      {error && (
        <p className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-in fade-in">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive/80" />
          {error}
        </p>
      )}

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Timeline, Device Info, Parts */}
        <div className="lg:col-span-2 space-y-6">
          <StatusStepper status={currentOrder.status} />

          {/* Device Detail Card */}

          {/* Device Detail Card */}
          <div className="rounded-xl bg-card p-5 shadow-sm">
            
            <div className="flex items-center justify-between mb-5 border-b border-border pb-3">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Smartphone className="h-4 w-4 text-accents-warm" /> Informasi Perangkat
              </h2>
              {currentOrder.status !== "selesai" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingService(!editingService);
                    setError("");
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {editingService ? "Batal" : "Edit Perangkat"}
                </Button>
              )}
            </div>

            {editingService ? (
              <form action={handleUpdateOrder} className="space-y-4">
                <input type="hidden" name="id" value={currentOrder.id} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Merk</label>
                    <select
                      name="merk"
                      value={selectedMerk}
                      onChange={(e) => setSelectedMerk(e.target.value)}
                      className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                      required
                    >
                      <option value="Samsung">Samsung</option>
                      <option value="iPhone">iPhone</option>
                      <option value="Xiaomi">Xiaomi</option>
                      <option value="Oppo">Oppo</option>
                      <option value="Vivo">Vivo</option>
                      <option value="Realme">Realme</option>
                      <option value="Infinix">Infinix</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipe</label>
                    <input
                      name="tipe"
                      value={selectedTipe}
                      onChange={(e) => setSelectedTipe(e.target.value)}
                      className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                      placeholder="Tulis tipe HP..."
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    PIN / Pola HP <span className="font-normal text-muted-foreground/60">(opsional)</span>
                  </label>
                  <input
                    name="pin"
                    defaultValue={currentOrder.pin || ""}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deskripsi Kerusakan (Problem)</label>
                  <textarea
                    name="problem"
                    defaultValue={currentOrder.problem}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Biaya Final <span className="font-normal text-muted-foreground/60">(Kosongkan jika sama dengan estimasi awal)</span>
                  </label>
                  <input
                    name="biayaFinal"
                    value={biayaFinalEdit}
                    onChange={(e) => setBiayaFinalEdit(formatAngka(e.target.value))}
                    inputMode="numeric"
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                    placeholder={String(Math.round(currentOrder.estimasiBiaya / 100))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Estimasi Selesai (SLA) <span className="font-normal text-muted-foreground/60">(opsional)</span>
                  </label>
                  <input
                    type="date"
                    name="estimasiSelesai"
                    defaultValue={currentOrder.estimasiSelesai ? new Date(currentOrder.estimasiSelesai).toISOString().split('T')[0] : ""}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Catatan Internal <span className="font-normal text-muted-foreground/60">(opsional)</span>
                  </label>
                  <textarea
                    name="catatan"
                    defaultValue={currentOrder.catatan || ""}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Catatan Diagnostik <span className="font-normal text-muted-foreground/60">(kondisi HP saat diterima)</span>
                  </label>
                  <textarea
                    name="diagnostik"
                    defaultValue={currentOrder.diagnostik || ""}
                    rows={3}
                    placeholder="Contoh: Layar retak pojok kiri, body lecet, kamera belakang buram, kelengkapan charger"
                    className="w-full resize-none rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                  />
                </div>
                <div className="flex justify-end gap-2.5 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingService(false)}>
                    Batal
                  </Button>
                  <Button type="submit" variant="default" size="sm">
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 border-b border-border/40 pb-4">
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Brand / Tipe</span>
                    <span className="text-base font-semibold text-foreground">{currentOrder.merk} {currentOrder.tipe}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kunci Pengaman</span>
                    {pinArr ? (
                        <div className="mt-2">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Lock className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                            <span className="text-xs text-muted-foreground">Pola</span>
                          </div>
                          <div className="relative w-fit bg-muted/20 rounded-xl border border-border/50 p-4">
                            {/* SVG lines */}
                            <svg
                              className="absolute pointer-events-none"
                              viewBox="0 0 108 108"
                              style={{ width: 108, height: 108, left: 16, top: 16 }}
                            >
                              {pinArr.length > 1 && pinArr.slice(0, -1).map((from, i) => {
                                const to = pinArr[i + 1];
                                return (
                                  <line
                                    key={from + "-" + to}
                                    x1={((from - 1) % 3) * 40 + 14}
                                    y1={Math.floor((from - 1) / 3) * 40 + 14}
                                    x2={((to - 1) % 3) * 40 + 14}
                                    y2={Math.floor((to - 1) / 3) * 40 + 14}
                                    stroke="#d97757"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                  />
                                );
                              })}
                            </svg>
                            {/* Grid */}
                            <div className="grid grid-cols-3 gap-3 relative">
                              {[1,2,3,4,5,6,7,8,9].map((dot) => {
                                const idx = pinArr!.indexOf(dot);
                                const isSelected = idx !== -1;
                                const isLast = isSelected && idx === pinArr!.length - 1;
                                return (
                                  <div key={dot} className="relative flex items-center justify-center w-7 h-7">
                                    {isSelected && (
                                      <div className="absolute inset-0 rounded-full border-2 border-primary" />
                                    )}
                                    <div className={`w-2.5 h-2.5 rounded-full ${isSelected ? "bg-primary" : "bg-muted-foreground/20"}`} />
                                    {isSelected && (
                                      <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-[8px] font-bold text-primary-foreground shadow-sm">
                                        {idx + 1}
                                      </span>
                                    )}
                                    {isLast && (
                                      <span className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : currentOrder.pin ? (
                        <span className="text-sm font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                          PIN: {currentOrder.pin}
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                          Tidak Ada PIN/Pola
                        </span>
                      )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b border-border/40 pb-4">
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estimasi Selesai (SLA)</span>
                    <span className="text-sm font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                      {currentOrder.estimasiSelesai
                        ? format(new Date(currentOrder.estimasiSelesai), "d MMMM yyyy", { locale: localeId })
                        : "Tidak Ditentukan"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status Garansi</span>
                    {currentOrder.status === "selesai" ? (
                      <span className={clsx("text-sm font-medium flex items-center gap-1.5 mt-0.5", warrantyActive ? "text-accents-green" : "text-destructive")}>
                        <ShieldAlert className="h-3.5 w-3.5" />
                        {warrantyActive 
                          ? `Aktif (s/d ${format(new Date(currentOrder.warrantyUntil!), "d MMM yyyy", { locale: localeId })})`
                          : "Habis / Tidak Aktif"}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground/60 flex items-center gap-1.5 mt-0.5">
                        <Shield className="h-3.5 w-3.5" />
                        Menunggu Servis Selesai
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 border-b border-border/40 pb-4">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deskripsi Masalah</span>
                  <p className="text-sm text-foreground/90 leading-relaxed font-medium bg-muted/20 rounded-xl p-3.5 border border-border/40">
                    {currentOrder.problem}
                  </p>
                </div>

                {currentOrder.catatan && (
                  <div className="space-y-1.5">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Catatan Internal / Tambahan</span>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {currentOrder.catatan}
                    </p>
                  </div>
                )}
                {currentOrder.diagnostik && (
                  <div className="space-y-1.5 pt-2 border-t border-border/30">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Catatan Diagnostik</span>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {currentOrder.diagnostik}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Spareparts Card */}
          <div className="rounded-xl bg-card p-5 shadow-sm">
            
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 border-b border-border pb-3">
              <Wrench className="h-4 w-4 text-accents-green" /> Suku Cadang & Sparepart
            </h2>

            {currentOrder.parts.length > 0 ? (
              <div className="divide-y divide-border/60 border border-border/50 rounded-xl overflow-hidden mb-5">
                {currentOrder.parts.map((part) => (
                  <div key={part.id} className="flex items-center justify-between p-4 bg-muted/10 hover:bg-muted/20 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{part.nama}</p>
                      <span className="text-xs text-muted-foreground/60">
                        @ {formatHarga(part.hargaPokok ?? part.harga)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-foreground">
                        {formatHarga(part.harga)}
                      </span>
                      {currentOrder.status !== "selesai" && (
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => setConfirmDelete(part.id)}
                          title="Hapus Sparepart"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground bg-muted/10 rounded-xl border border-border/40 p-5 text-center mb-5">
                <Wrench className="h-5 w-5 text-muted-foreground/40" />
                <span>Belum ada sparepart yang dipasang untuk servis ini.</span>
              </div>
            )}

            {currentOrder.status !== "selesai" && (
              <form
                onSubmit={handleAddPart}
                className="flex flex-col sm:flex-row items-end gap-3 border-t border-border/50 pt-4"
              >
                <div className="flex-1 w-full space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Part</label>
                  <input
                    value={partNama}
                    onChange={(e) => setPartNama(e.target.value)}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                    placeholder="LCD, Baterai, Konektor..."
                  />
                </div>
                <div className="w-full sm:w-32 space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Harga Beli (Rp)</label>
                  <input
                    value={partHargaPokok ? formatAngka(partHargaPokok) : ""}
                    onChange={(e) => setPartHargaPokok(e.target.value.replace(/\./g, ""))}
                    inputMode="numeric"
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                    placeholder="Rp"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={addingPart || !partNama || !partHargaPokok}
                  variant="default"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>

          {/* Activity Log Card */}
          <div className="rounded-xl bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-6 border-b border-border pb-3">
              <ClipboardList className="h-4 w-4 text-primary" /> Riwayat Perubahan & Aktivitas
            </h2>

            {currentOrder.activityLogs && currentOrder.activityLogs.length > 0 ? (
              <div className="relative pl-5 border-l border-border/80 space-y-5 ml-2.5 my-2">
                {currentOrder.activityLogs.map((log) => (
                  <div key={log.id} className="relative text-xs">
                    {/* Timeline dot */}
                    <span className="absolute -left-[29px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-card border-2 border-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-semibold text-foreground uppercase text-[10px] tracking-wider font-mono">
                          {log.action.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50 shrink-0 font-mono">
                          {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", { locale: localeId })}
                        </span>
                      </div>
                      <p className="text-muted-foreground leading-normal mt-1">{log.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground bg-muted/10 rounded-xl border border-border/40 p-5 text-center">
                <ClipboardList className="h-5 w-5 text-muted-foreground/40" />
                <span>Belum ada riwayat aktivitas untuk servis ini.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer Info, Action, Financial Stats */}
        <div className="space-y-6">
          {/* Quick Actions (Update Status) */}
          {currentOrder.status !== "selesai" && (
            <div className="rounded-xl bg-muted/10 p-5">

              <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3">
                <Wrench className="h-4 w-4 text-accents-orange" /> Aksi Pemrosesan
              </h2>
              <div className="flex flex-col gap-2">
                {(NEXT_STATUS[currentOrder.status] || []).map((action) => (
                  <Button
                    key={action.status}
                    onClick={() => {
                      if (action.status === "selesai") {
                        setWarrantyOpen(true);
                      } else {
                        handleStatusUpdate(action.status);
                      }
                    }}
                    disabled={isPending}
                    variant="default"
                    size="sm"
                    className="w-full"
                  >
                    {isPending ? "Memproses..." : action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div className="rounded-xl bg-muted/10 p-5">

            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Banknote className="h-4 w-4 text-primary" /> Rincian Biaya
              </h2>
              {isStaff && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openPaymentDialog}
                  className="h-8 gap-1.5 text-xs border-border hover:bg-muted"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground/85" />
                  Ganti Status
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Total Tagihan</span>
                <div className="text-right">
                  <p className="text-2xl font-bold tracking-tight text-foreground">{formatHarga(biaya)}</p>
                  {!currentOrder.biayaFinal && (
                    <span className="text-[10px] text-muted-foreground/60">(Menggunakan Estimasi Awal)</span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground border-t border-border/40 pt-3">
                <div className="flex justify-between">
                  <span>Estimasi Biaya Awal</span>
                  <span>{formatHarga(currentOrder.estimasiBiaya)}</span>
                </div>
                {currentOrder.parts.length > 0 && (
                  <div className="flex justify-between">
                    <span>Total Suku Cadang</span>
                    <span>{formatHarga(currentOrder.parts.reduce((s, p) => s + p.harga, 0))}</span>
                  </div>
                )}
                {currentOrder.dpNominal != null && currentOrder.dpNominal > 0 && (
                  <div className="flex justify-between text-accents-warm font-semibold">
                    <span>Uang Muka (DP)</span>
                    <span>-{formatHarga(currentOrder.dpNominal)}</span>
                  </div>
                )}
              </div>

              {isStaff && totalModal > 0 && laba !== null && (
                <div className="flex items-center justify-between rounded-xl bg-accents-green/10 px-3.5 py-2.5 text-xs font-bold text-accents-green border border-accents-green/20">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Estimasi Profit (Laba)
                  </span>
                  <span>{formatHarga(laba)}</span>
                </div>
              )}
              {isStaff && totalModal > 0 && laba === null && (
                <div className="flex items-center justify-between rounded-xl bg-muted/10 px-3.5 py-2.5 text-xs text-muted-foreground border border-border/30">
                  <span>Estimasi Profit (Laba)</span>
                  <span>(tentukan biaya final)</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Contact */}
          <div className="rounded-xl bg-muted/10 p-5">

            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 border-b border-border pb-3">
              <User className="h-4 w-4 text-accents-blue" /> Kontak Customer
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-base font-bold text-foreground">
                  {currentOrder.customer.nama}
                </p>
                <p className="text-sm font-semibold text-primary hover:underline mt-0.5">
                  {currentOrder.customer.noHp}
                </p>
              </div>
              {currentOrder.customer.alamat && (
                <div className="border-t border-border/40 pt-2.5">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alamat Tinggal</span>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {currentOrder.customer.alamat}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Teknisi Assignment */}
          {(isStaff || currentOrder.teknisi) && (
            <div className="rounded-xl bg-muted/10 p-5">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b border-border pb-3">
                <Wrench className="h-4 w-4 text-accents-warm" /> Teknisi
              </h2>
              {isStaff ? (
                <select
                  name="teknisiId"
                  value={currentOrder.teknisi?.id ?? ""}
                  onChange={handleTeknisiChange}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                >
                  <option value="">Pilih teknisi...</option>
                  {teknisiList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name || t.username} {t.role === "admin" ? "(Admin)" : t.role === "kasir" ? "(Kasir)" : "(Teknisi)"}
                    </option>
                  ))}
                  <option value="">— Hapus —</option>
                </select>
              ) : currentOrder.teknisi ? (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/30 text-xs font-bold text-muted-foreground">
                    {(currentOrder.teknisi.name || currentOrder.teknisi.username).charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {currentOrder.teknisi.name || currentOrder.teknisi.username}
                  </span>
                </div>
              ) : null}
            </div>
          )}

          {/* Riwayat Device */}
          {relatedOrders.length > 0 && (
            <div className="rounded-xl bg-muted/10 p-5">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b border-border pb-3">
                <History className="h-4 w-4 text-accents-warm" /> Riwayat Service Device Ini
              </h2>
              <div className="space-y-2">
                {relatedOrders.map((ro) => (
                  <Link
                    key={ro.id}
                    href={`/services/${ro.id}`}
                    className={clsx(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors hover:bg-muted/30",
                      ro.id === currentOrder.id && "bg-muted/20 ring-1 ring-border/60",
                    )}
                  >
                    <div>
                      <span className="font-medium text-foreground">{ro.noService}</span>
                      <span className="text-muted-foreground/50 ml-2">{format(new Date(ro.createdAt), "d MMM", { locale: localeId })}</span>
                    </div>
                    <span
                      className={clsx(
                        "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider font-mono",
                        STATUS_COLORS[ro.status as ServiceStatus] || "bg-black/20 text-muted-foreground",
                      )}
                    >
                      {STATUS_LABELS[ro.status as ServiceStatus] || ro.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Warranty (if completed) */}
          {currentOrder.status === "selesai" && warrantyEnd && (
            <div className="rounded-xl bg-muted/10 p-5">

              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b border-border pb-3">
                <ShieldCheck className="h-4 w-4 text-accents-blue" /> Informasi Garansi
              </h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={warrantyActive ? "default" : "destructive"}
                    className={clsx(
                      "text-[10px] font-bold uppercase tracking-wider",
                      warrantyActive && "bg-accents-green text-white",
                    )}
                  >
                    <ShieldCheck className="h-3 w-3" />
                    {warrantyActive ? "Garansi Aktif" : "Garansi Berakhir"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground/80 mt-1">
                  Berlaku hingga <span className="font-semibold text-foreground">{format(warrantyEnd, "d MMMM yyyy", { locale: localeId })}</span>
                </p>
                <p className="text-[10px] text-muted-foreground/60 leading-normal">
                  Garansi berlaku selama 30 hari kalender terhitung sejak pekerjaan servis diselesaikan.
                </p>
              </div>
            </div>
          )}
        </div>
        {/* Delete Service */}
        <ConfirmDialog
          open={confirmDeleteOrder}
          onOpenChange={setConfirmDeleteOrder}
          title="Hapus Service"
          description="Apakah Anda yakin ingin menghapus service ini? Seluruh data terkait termasuk sparepart akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus Service"
          variant="destructive"
          onConfirm={() => {
            const form = document.getElementById("delete-order-form") as HTMLFormElement;
            form?.requestSubmit();
          }}
          loading={deletePending}
        />
        <form
          id="delete-order-form"
          action={deleteAction}
          className="hidden"
        >
          <input type="hidden" name="id" value={currentOrder.id} />
        </form>
        <button
          type="button"
          onClick={handlePrintReceipt}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-muted/10 px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted/20 transition-colors"
        >
          <Download className="h-4 w-4" />
          Unduh Tanda Terima (PNG)
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-muted/10 px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted/20 transition-colors"
        >
          <Download className="h-4 w-4" />
          Unduh Invoice (PNG)
        </button>
        {isStaff && (
          <button
            type="button"
            onClick={() => setConfirmDeleteOrder(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Hapus Service Ini
          </button>
        )}
      </div>

      {/* Dialog: Update Payment */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="rounded-xl max-w-md p-5">
          <DialogHeader className="border-b border-border pb-3">
            <DialogTitle className="text-lg font-bold">Ubah Status Pembayaran</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              #{currentOrder.id} &mdash; {currentOrder.merk} {currentOrder.tipe}
            </DialogDescription>
          </DialogHeader>

          <form action={handlePayment} className="space-y-4 pt-4">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Tagihan Saat Ini</span>
              <p className="text-xl font-extrabold text-foreground">{formatHarga(biaya)}</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status Pembayaran Baru</label>
              <div className="flex gap-2">
                {(["BELUM_LUNAS", "DP", "LUNAS"] as const).map((status) => {
                  const isDisabled =
                    (currentOrder.statusBayar === "LUNAS" && status !== "LUNAS") ||
                    (currentOrder.statusBayar === "DP" && status === "BELUM_LUNAS");
                  return (
                    <label
                      key={status}
                      className={clsx(
                        "flex-1 flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors duration-200 select-none",
                        isDisabled
                          ? "border-border/40 bg-muted/40 text-muted-foreground/30 cursor-not-allowed opacity-50"
                          : "cursor-pointer border-border hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary",
                      )}
                    >
                      <input
                        type="radio"
                        name="statusBayar"
                        value={status}
                        checked={selectedStatus === status}
                        onChange={() => {
                          if (!isDisabled) setSelectedStatus(status);
                        }}
                        disabled={isDisabled}
                        className="sr-only"
                      />
                      {PAYMENT_LABELS[status]}
                    </label>
                  );
                })}
              </div>

              {/* Warning/Info Keamanan Keuangan */}
              {currentOrder.statusBayar === "LUNAS" && (
                <div className="mt-2 flex gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-[11px] text-amber-500 animate-in fade-in">
                  <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">🔒 Status LUNAS Terkunci</span>
                    Untuk kepatuhan & audit keuangan, status pembayaran yang sudah LUNAS tidak dapat diubah kembali ke Belum Lunas atau DP.
                  </div>
                </div>
              )}
              {currentOrder.statusBayar === "DP" && (
                <div className="mt-2 flex gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-[11px] text-amber-500 animate-in fade-in">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">🔒 Status DP Terproteksi</span>
                    Status DP tidak dapat dikembalikan ke Belum Lunas karena pembayaran uang muka telah diterima secara fisik.
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Biaya Final (Rp)</label>
              <input
                name="biayaFinal"
                value={biayaFinalPay}
                onChange={(e) => setBiayaFinalPay(formatAngka(e.target.value))}
                inputMode="numeric"
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
              />
              {selectedStatus === "LUNAS" && currentOrder.dpNominal && currentOrder.dpNominal > 0 ? (
                <div className="mt-1.5 rounded-lg bg-accents-green/10 px-3 py-2 text-xs font-medium text-accents-green border border-accents-green/20 animate-in fade-in">
                  Uang Muka (DP) Terbayar: <span className="font-bold">{formatHarga(currentOrder.dpNominal)}</span>. 
                  Sisa pelunasan yang perlu ditagih: <span className="font-bold">
                    {(() => {
                      const biayaVal = biayaFinalPay ? Number(biayaFinalPay.replace(/\./g, "")) * 100 : (currentOrder.biayaFinal ?? currentOrder.estimasiBiaya);
                      return formatHarga(Math.max(0, biayaVal - currentOrder.dpNominal));
                    })()}
                  </span>
                </div>
              ) : null}
            </div>

            {selectedStatus === "DP" && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nominal DP Terbayar (Rp)</label>
                <input
                  name="dpNominal"
                  value={dpNominalPay}
                  onChange={(e) => setDpNominalPay(formatAngka(e.target.value))}
                  inputMode="numeric"
                  required
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                  placeholder="Masukkan nominal DP..."
                />
              </div>
            )}

            <DialogFooter className="border-t border-border pt-4 mt-2">
              <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={paymentLoading} variant="default">
                {paymentLoading ? "Menyimpan..." : "Simpan Status"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirm Part Deletion */}
      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}
        title="Hapus Sparepart"
        description="Apakah Anda yakin ingin menghapus sparepart ini dari daftar pekerjaan? Tindakan ini akan memperbarui total tagihan secara otomatis."
        confirmLabel="Hapus Sparepart"
        variant="destructive"
        onConfirm={async () => {
          if (confirmDelete === null) return;
          setDeleteLoading(true);
          await handleDeletePart(confirmDelete);
          setDeleteLoading(false);
        }}
        loading={deleteLoading}
      />

      {/* Dialog: Confirm Service Completion & Set Warranty */}
      <Dialog open={warrantyOpen} onOpenChange={setWarrantyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Selesai Servis</DialogTitle>
            <DialogDescription>
              Tentukan masa garansi untuk pengerjaan servis perangkat ini sebelum menandainya sebagai Selesai.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Masa Garansi (Hari)</label>
              <input
                type="number"
                min="0"
                value={warrantyInput}
                onChange={(e) => setWarrantyInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                placeholder="cth: 30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarrantyOpen(false)} disabled={isPending}>
              Batal
            </Button>
            <Button
              variant="default"
              onClick={async () => {
                const days = parseInt(warrantyInput) || 0;
                setWarrantyOpen(false);
                await handleStatusUpdate("selesai", days);
              }}
              disabled={isPending}
            >
              {isPending ? "Memproses..." : "Selesaikan & Set Garansi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
