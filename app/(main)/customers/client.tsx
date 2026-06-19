"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Search,
  Plus,
  Users,
  Phone,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast-core";
import { createCustomerAction } from "@/lib/actions";
import type { Customer } from "@/lib/generated/prisma/client";

function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const delta = 2;
  const left = Math.max(2, page - delta);
  const right = Math.min(totalPages - 1, page + delta);
  const pages: (number | "...")[] = [1];
  if (left > 2) pages.push("...");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);
  return pages;
}

export function CustomerClient({
  customers,
  search: initialSearch,
  page = 1,
  totalPages = 1,
}: {
  customers: Customer[];
  search: string;
  page?: number;
  totalPages?: number;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const searchRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [state, formAction, pending] = useActionState(createCustomerAction, undefined);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName))) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (state?.error) {
      toast("error", state.error);
    }
  }, [state]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    router.push(`/customers?${params.toString()}`);
  };

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">Data</p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Customer</h1>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger
            render={
              <Button variant="default" size="sm">
                <Plus className="h-4 w-4" />
                Tambah Customer
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Customer</DialogTitle>
              <DialogDescription>
                Masukkan data pelanggan baru untuk dicatat ke dalam sistem.
              </DialogDescription>
            </DialogHeader>

            <form action={formAction}>
              {state?.error && (
                <div className="px-6 pb-0">
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs font-medium text-destructive" role="alert">
                    {state.error}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 px-6 pb-6">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Pelanggan</label>
                  <input
                    name="nama"
                    defaultValue=""
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                    placeholder="cth: Budi Santoso"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nomor Telepon</label>
                  <input
                    name="noHp"
                    defaultValue=""
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                    placeholder="cth: 0812XXXXXXXX"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alamat</label>
                  <input
                    name="alamat"
                    defaultValue=""
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                    placeholder="cth: Jl. Merdeka No. 45"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="ghost" size="sm" />}>
                  Batal
                </DialogClose>
                <Button type="submit" variant="default" size="sm" disabled={pending}>
                  {pending ? "Menyimpan..." : "Simpan Customer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/45" />
        <input
          ref={searchRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cari customer"
          className="w-full rounded-lg border border-border bg-input pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
          placeholder="Cari berdasarkan nama customer atau nomor telepon..."
        />
      </form>

      {/* Customers List Container */}
      <div className="divide-y divide-border/40 rounded-xl bg-card/80 border border-border/40 overflow-hidden backdrop-blur-sm">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center space-y-3">
            <Users className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {search ? "Hasil pencarian tidak ditemukan." : "Belum ada data customer."}
            </p>
          </div>
        ) : (
          customers.map((customer) => (
            <div
              key={customer.id}
              className="group flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-muted/20"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/customers/${customer.id}`}
                  className="font-medium text-sm text-foreground group-hover:text-primary transition-colors"
                >
                  {customer.nama}
                </Link>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                  <span className="num text-[11px] text-muted-foreground/60 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {customer.noHp}
                  </span>
                  {customer.alamat && (
                    <span className="text-[11px] text-muted-foreground/40 flex items-center gap-1 truncate max-w-48">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {customer.alamat}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 ml-4 shrink-0">
                <span className="num text-[10px] text-muted-foreground/40 hidden sm:block">
                  {format(customer.createdAt, "d MMM yyyy", { locale: id })}
                </span>
                <Link href={`/services/new?customerId=${customer.id}`}>
                  <Button variant="outline" size="sm">
                    <Plus className="h-3.5 w-3.5" /> Service
                  </Button>
                </Link>
              </div>
            </div>
          )))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/40 pt-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const params = new URLSearchParams();
              if (search) params.set("search", search);
              if (page > 2) params.set("page", String(page - 1));
              router.push(`/customers?${params.toString()}`);
            }}
            disabled={page <= 1}
          >
            &larr; Sebelumnya
          </Button>
          <div className="hidden sm:flex items-center gap-1.5">
            {getPageNumbers(page, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`e${i}`} className="px-1 text-xs text-muted-foreground/40">&hellip;</span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? "default" : "ghost"}
                  size="icon"
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (search) params.set("search", search);
                    if (p > 1) params.set("page", String(p));
                    router.push(`/customers?${params.toString()}`);
                  }}
                >
                  {p}
                </Button>
              ),
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const params = new URLSearchParams();
              if (search) params.set("search", search);
              params.set("page", String(page + 1));
              router.push(`/customers?${params.toString()}`);
            }}
            disabled={page >= totalPages}
          >
            Selanjutnya &rarr;
          </Button>
        </div>
      )}
    </div>
  );
}
