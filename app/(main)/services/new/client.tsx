"use client";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast-core";
import { createServiceOrderAction } from "@/lib/actions";
import { ALL_BRANDS } from "@/lib/data/device-models";
import type { Customer, Role } from "@/lib/generated/prisma/client";

const getDotCenter = (dot: number): { x: number; y: number } => {
  const CELL = 56; // dot(44px) + gap(12px)
  const row = Math.floor((dot - 1) / 3);
  const col = (dot - 1) % 3;
  return { x: col * CELL + 22, y: row * CELL + 22 };
};

export function NewServiceClient({
  customers,
  selectedCustomerId,
  teknisiList,
}: {
  customers: Customer[];
  selectedCustomerId?: number;
  teknisiList: Array<{ id: number; name: string | null; username: string; role: Role }>;
}) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(selectedCustomerId?.toString() || "");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [state, formAction, pending] = useActionState(createServiceOrderAction, undefined);
  const [pinMode, setPinMode] = useState<"pin" | "pola">("pin");
  const [polaPattern, setPolaPattern] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const polaValue = polaPattern.join(",");
  const gridRef = useRef<HTMLDivElement>(null);
  const [selectedMerk, setSelectedMerk] = useState("");
  const [selectedTipe, setSelectedTipe] = useState("");
  const [estimasiDisplay, setEstimasiDisplay] = useState("");
  const [showBatalConfirm, setShowBatalConfirm] = useState(false);

  useEffect(() => {
    if (state?.error) {
      toast("error", state.error);
    }
  }, [state]);

  const filteredCustomers = useMemo(() => {
    const cleanSearch = customerSearch.replace(/\D/g, "");
    return customers.filter((c) => {
      const matchNama = c.nama.toLowerCase().includes(customerSearch.toLowerCase());
      if (matchNama) return true;
      if (!cleanSearch) return false;

      const cleanCustomerPhone = c.noHp.replace(/\D/g, "");
      const normalizedSearch = cleanSearch.replace(/^0/, "62");
      return cleanCustomerPhone.includes(normalizedSearch) || cleanCustomerPhone.includes(cleanSearch);
    });
  }, [customers, customerSearch]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id.toString() === customerId),
    [customers, customerId],
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Service Baru</h1>

      <form action={formAction} className="space-y-5 rounded-xl bg-card p-5 shadow-sm relative overflow-hidden">
        {/* Gradient top bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</label>
          <div className="relative">
            <input type="hidden" name="customerId" value={customerId} />
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground transition-colors"
            >
              <span className={customerId ? "text-foreground" : "text-muted-foreground"}>
                {selectedCustomer
                  ? `${selectedCustomer.nama} (${selectedCustomer.noHp})`
                  : "Pilih customer"}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
            {showDropdown && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-xl shadow-black/30">
                <div className="p-2">
                  <input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full rounded-md border border-border bg-input px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                    placeholder="Cari customer..."
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {filteredCustomers.length === 0 && (
                  <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                    Customer tidak ditemukan
                  </p>
                )}
                {filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCustomerId(c.id.toString());
                      setShowDropdown(false);
                      setCustomerSearch("");
                    }}
                    className={clsx(
                      "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors",
                      c.id.toString() === customerId
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-accent",
                    )}
                  >
                    <span className="font-medium">{c.nama}</span>
                    <span className="text-muted-foreground">{c.noHp}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Merk HP</label>
            <select
              name="merk"
              value={selectedMerk}
              onChange={(e) => setSelectedMerk(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
              required
            >
              <option value="" disabled>Pilih merk HP</option>
              {ALL_BRANDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipe HP</label>
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

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            PIN / Pola HP{" "}
            <span className="font-normal text-muted-foreground">(opsional)</span>
          </label>

          {/* Toggle mode */}
          <div className="flex gap-1 mb-3 bg-muted/60 rounded-lg p-0.5 w-fit border border-border">
            <button
              type="button"
              onClick={() => setPinMode("pin")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                pinMode === "pin"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              PIN
            </button>
            <button
              type="button"
              onClick={() => setPinMode("pola")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                pinMode === "pola"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pola
            </button>
          </div>

          {pinMode === "pin" ? (
            <input
              name="pin"
              defaultValue=""
              type="number"
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="Masukkan PIN angka..."
            />
          ) : (
            <div>
              <input type="hidden" name="pin" value={polaValue} />
              <div
                ref={gridRef}
                className="relative w-fit mx-auto select-none touch-none"
                onPointerDown={(e) => {
                  const rect = gridRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const CELL = 56;
                  const col = Math.floor(x / CELL);
                  const row = Math.floor(y / CELL);
                  if (col < 0 || col > 2 || row < 0 || row > 2) return;
                  const dot = row * 3 + col + 1;
                  setIsDragging(true);
                  setPolaPattern([dot]);
                  setPointerPos({ x, y });
                }}
                onPointerMove={(e) => {
                  if (!isDragging || !gridRef.current) return;
                  const rect = gridRef.current.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  setPointerPos({ x, y });
                  const CELL = 56;
                  const col = Math.floor(x / CELL);
                  const row = Math.floor(y / CELL);
                  if (col < 0 || col > 2 || row < 0 || row > 2) return;
                  const dot = row * 3 + col + 1;
                  setPolaPattern((prev) => {
                    if (prev.includes(dot) || prev.length >= 9) return prev;
                    return [...prev, dot];
                  });
                }}
                onPointerUp={() => {
                  setIsDragging(false);
                  setPointerPos(null);
                }}
                onPointerLeave={() => {
                  if (isDragging) {
                    setIsDragging(false);
                    setPointerPos(null);
                  }
                }}
              >
                {/* SVG garis penghubung */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 156 156"
                  style={{ width: 156, height: 156 }}
                >
                  {polaPattern.length > 1 &&
                    polaPattern.slice(0, -1).map((from, i) => {
                      const to = polaPattern[i + 1];
                      const fr = getDotCenter(from);
                      const t = getDotCenter(to);
                      return (
                        <line
                          key={from + "-" + to}
                          x1={fr.x}
                          y1={fr.y}
                          x2={t.x}
                          y2={t.y}
                          stroke="#d97757"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      );
                    })}
                  {/* Garis mengikuti pointer saat dragging */}
                  {isDragging && pointerPos && polaPattern.length > 0 && (
                    <line
                      x1={getDotCenter(polaPattern[polaPattern.length - 1]).x}
                      y1={getDotCenter(polaPattern[polaPattern.length - 1]).y}
                      x2={pointerPos.x}
                      y2={pointerPos.y}
                      stroke="#d97757"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="6 4"
                      opacity={0.5}
                    />
                  )}
                </svg>
                {/* 3x3 grid */}
                <div className="grid grid-cols-3 gap-3 pointer-events-none">
                  {[1,2,3,4,5,6,7,8,9].map((dot) => {
                    const idx = polaPattern.indexOf(dot);
                    const isSelected = idx !== -1;
                    const isLast = isSelected && idx === polaPattern.length - 1;
                    return (
                      <div
                        key={dot}
                        className="relative flex items-center justify-center w-11 h-11 rounded-full border-2 transition-all duration-150 pointer-events-none"
                      >
                        <div
                          className={`w-3 h-3 rounded-full transition-all duration-150 ${
                            isSelected ? "bg-primary scale-100" : "bg-muted-foreground/40 scale-75"
                          }`}
                        />
                        {isLast && (
                          <span className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
                        )}
                        {/* Lingkaran luar untuk selected */}
                        {isSelected && (
                          <div className="absolute inset-0 rounded-full border-2 border-primary" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {polaPattern.length > 0 && (
                <div className="flex items-center justify-center gap-3 mt-3">
                  <span className="text-xs text-muted-foreground">
                    {polaPattern.length} titik
                  </span>
                  <button
                    type="button"
                    onClick={() => setPolaPattern([])}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Problem</label>
          <textarea
            name="problem"
            defaultValue=""
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
            placeholder="Deskripsi kerusakan..."
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Estimasi Biaya
            </label>
            <input
              name="estimasiBiaya"
              value={estimasiDisplay}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                setEstimasiDisplay(raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "");
              }}
              inputMode="numeric"
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
              placeholder="Rp 300.000"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Estimasi Selesai (SLA) <span className="font-normal text-muted-foreground">(opsional)</span>
            </label>
            <input
              type="date"
              name="estimasiSelesai"
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Teknisi <span className="font-normal text-muted-foreground">(opsional)</span>
          </label>
          <select
            name="teknisiId"
            defaultValue=""
            className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
          >
            <option value="">Pilih teknisi...</option>
            {teknisiList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name || t.username} {t.role === "admin" ? "(Admin)" : t.role === "kasir" ? "(Kasir)" : "(Teknisi)"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Catatan{" "}
            <span className="font-normal text-muted-foreground">(opsional)</span>
          </label>
          <textarea
            name="catatan"
            defaultValue=""
            rows={2}
            className="w-full resize-none rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
            placeholder="Catatan internal..."
          />
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowBatalConfirm(true)}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={pending}
          >
            {pending ? "Menyimpan..." : "Simpan Service"}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={showBatalConfirm}
        onOpenChange={setShowBatalConfirm}
        title="Batalkan service?"
        description="Data yang sudah diisi akan hilang."
        confirmLabel="Ya, Batalkan"
        cancelLabel="Tetap Isi"
        variant="destructive"
        onConfirm={() => router.back()}
      />
    </div>
  );
}
