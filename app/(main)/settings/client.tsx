"use client";

import { Store, Phone, MapPin, FileText, Save } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-core";
import { updateSettingsAction } from "@/lib/actions";

export function SettingsClient({
  initialSettings,
}: {
  initialSettings: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, undefined);
  const [namaToko, setNamaToko] = useState(initialSettings.nama_toko || "");
  const [alamat, setAlamat] = useState(initialSettings.alamat || "");
  const [noTelepon, setNoTelepon] = useState(initialSettings.no_telepon || "");
  const [catatanInvoice, setCatatanInvoice] = useState(initialSettings.catatan_invoice || "");

  useEffect(() => {
    if (state?.success) {
      toast("success", "Pengaturan toko berhasil diperbarui!");
    } else if (state?.error) {
      toast("error", state.error);
    }
  }, [state]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">Konfigurasi</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pengaturan Toko</h1>
        <p className="text-sm text-muted-foreground/80 mt-1">
          Kelola informasi bisnis Anda yang akan ditampilkan di struk cetak dan dokumen invoice pelanggan.
        </p>
      </div>

      <form action={formAction} className="space-y-5 rounded-xl bg-card p-5 shadow-sm relative overflow-hidden">
        {/* Ambient Top Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="space-y-4">
          {/* Nama Toko */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Store className="h-3.5 w-3.5 text-muted-foreground/60" /> Nama Toko
            </label>
            <input
              name="nama_toko"
              value={namaToko}
              onChange={(e) => setNamaToko(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
              placeholder="cth: FIXAPP"
              required
            />
          </div>

          {/* Nomor Telepon */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Phone className="h-3.5 w-3.5 text-muted-foreground/60" /> Nomor Telepon / WA
            </label>
            <input
              name="no_telepon"
              value={noTelepon}
              onChange={(e) => setNoTelepon(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
              placeholder="cth: 081234567890"
              required
            />
          </div>

          {/* Alamat Lengkap */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground/60" /> Alamat Lengkap Toko
            </label>
            <input
              name="alamat"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
              placeholder="cth: Jl. Raya Pahlawan No. 45, Jakarta"
              required
            />
          </div>

          {/* Catatan Invoice */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <FileText className="h-3.5 w-3.5 text-muted-foreground/60" /> Catatan Struk / Ketentuan Garansi
            </label>
            <textarea
              name="catatan_invoice"
              value={catatanInvoice}
              onChange={(e) => setCatatanInvoice(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
              placeholder="cth: Garansi tidak berlaku jika segel rusak atau terkena air."
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="default" size="sm" disabled={pending} className="gap-2">
            <Save className="h-4 w-4" />
            {pending ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
