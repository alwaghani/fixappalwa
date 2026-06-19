"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ArrowLeft, Calendar, MapPin, Phone, Smartphone, User, Wallet, Pencil } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-core";
import { updateCustomerAction } from "@/lib/actions";
import {
  STATUS_LABELS,
  formatHarga,
  getStatusBadgeVariant,
  getStatusBadgeClass,
} from "@/lib/constants";
import type { ServiceOrderListItem } from "@/lib/data/service-orders";
import type { Customer } from "@/lib/generated/prisma/client";

export function CustomerDetailClient({
  customer,
  orders,
}: {
  customer: Customer;
  orders: ServiceOrderListItem[];
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateCustomerAction, undefined);

  const showEditForm = editing && !state?.success;

  useEffect(() => {
    if (state?.success) {
      toast("success", "Customer berhasil diperbarui");
    }
    if (state?.error) {
      toast("error", state.error);
    }
  }, [state]);

  const totalSpending = orders.reduce(
    (sum, o) => sum + (o.biayaFinal ?? o.estimasiBiaya),
    0,
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/customers"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Detail Customer
          </h1>
        </div>
        <Button
          onClick={() => setEditing(!editing)}
          variant="outline"
          size="sm"
        >
          <Pencil className="h-4 w-4" />
          {editing ? "Batal" : "Edit"}
        </Button>
      </div>

      {showEditForm ? (
        <form
          action={formAction}
          className="space-y-4 rounded-xl border border-border bg-card p-5"
        >
          <input type="hidden" name="id" value={customer.id} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama</label>
              <input
                name="nama"
                defaultValue={customer.nama}
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">No. HP</label>
              <input
                name="noHp"
                defaultValue={customer.noHp}
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alamat</label>
              <input
                name="alamat"
                defaultValue={customer.alamat || ""}
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={pending}
            >
              {pending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-xl bg-card p-5 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accents-blue/30 to-accents-blue/10 text-primary">
                <User className="h-7 w-7" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{customer.nama}</p>
                <p className="text-xs text-muted-foreground">
                  Customer sejak {format(customer.createdAt, "d MMM yyyy", { locale: id })}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-muted-foreground/60" /> {customer.noHp}
              </span>
              {customer.alamat && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground/60" /> {customer.alamat}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-muted/10 p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Wallet className="h-4 w-4 text-primary" /> Total Pengeluaran
          </h2>
          <p className="text-xl font-bold text-foreground">{formatHarga(totalSpending)}</p>
        </div>
      </div>

      <div className="rounded-xl bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Smartphone className="h-4 w-4 text-primary" /> Riwayat Service
          </h2>
          <Link href={`/services/new?customerId=${customer.id}`}>
            <Button variant="link" className="text-sm">+ Service Baru</Button>
          </Link>
        </div>
        <div className="divide-y divide-border">
          {orders.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center space-y-3">
              <Smartphone className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-muted-foreground">
                Belum ada riwayat service
              </p>
            </div>
          )}
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/services/${order.id}`}
              className="flex items-center justify-between px-5 py-3 transition-all hover:bg-muted/30 hover:pl-6"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gradient-to-br from-muted to-muted/50 p-2 text-muted-foreground">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {order.merk} {order.tipe}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.problem.substring(0, 60)}
                    {order.problem.length > 60 ? "..." : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-right">
                <span className="text-xs text-muted-foreground/70">
                  <Calendar className="mr-1 inline h-3 w-3" />
                  {format(order.createdAt, "d MMM", { locale: id })}
                </span>
                <Badge
                  variant={getStatusBadgeVariant(order.status)}
                  className={getStatusBadgeClass(order.status)}
                >
                  {STATUS_LABELS[order.status]}
                </Badge>
                <span className="text-sm text-foreground">{formatHarga(order.biayaFinal ?? order.estimasiBiaya)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
