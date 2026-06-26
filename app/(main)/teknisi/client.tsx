"use client";

import {
  Users,
  Plus,
  Percent,
  Edit,
  Trash2,
  Search,
  TrendingUp,
  Coins,
  Briefcase,
  History,
  AlertCircle,
  Calendar,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
  getUserPerformanceAction,
} from "@/lib/actions";
import {
  formatHarga,
  STATUS_LABELS,
  PAYMENT_LABELS,
  getStatusBadgeVariant,
  getStatusBadgeClass,
  getPaymentBadgeVariant,
  getPaymentBadgeClass,
} from "@/lib/constants";
import type { User, Role } from "@/lib/generated/prisma/client";

interface PerformanceStats {
  totalAssigned: number;
  activeCount: number;
  completedCount: number;
  totalRevenue: number;
  totalModalPartCompleted: number;
  totalCommissionLunas: number;
  totalCommissionBelumLunas: number;
}

interface FormattedOrder {
  id: number;
  noService: string;
  customerName: string;
  merk: string;
  tipe: string;
  status: string;
  statusBayar: string;
  biayaFinal: number | null;
  dpNominal: number | null;
  estimasiBiaya: number;
  modalPart: number;
  profit: number;
  komisi: number;
  createdAt: string;
}

interface DetailData {
  user: User;
  stats: PerformanceStats;
  orders: FormattedOrder[];
}

export function TeknisiClient({ users }: { users: User[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<number | null>(null);

  // Detail Performance states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [jobsSearch, setJobsSearch] = useState("");
  const [jobsFilter, setJobsFilter] = useState<"semua" | "aktif" | "selesai">("semua");

  const handleShowDetail = async (user: User) => {
    setShowDetailModal(true);
    setLoadingDetail(true);
    setDetailData(null);
    setJobsSearch("");
    setJobsFilter("semua");
    try {
      const res = await getUserPerformanceAction(user.id);
      if (res.error) {
        toast("error", res.error);
      } else if (res.data) {
        setDetailData(res.data as DetailData);
      }
    } catch {
      toast("error", "Gagal memuat detail kinerja karyawan");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Form states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Add User State
  const [addRole, setAddRole] = useState<Role>("teknisi");
  const [addState, addFormAction, addPending] = useActionState(createUserAction, undefined);

  // Edit User State
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<Role>("teknisi");
  const [editKomisi, setEditKomisi] = useState("40");
  const [editPassword, setEditPassword] = useState("");
  const [editState, editFormAction, editPending] = useActionState(updateUserAction, undefined);

  // Delete User State
  const [deleteState, deleteFormAction, deletePending] = useActionState(deleteUserAction, undefined);

  // Handle toast notifications and modal closings for Add Action
  useEffect(() => {
    if (addState?.success) {
      toast("success", "User baru berhasil ditambahkan!");
      setTimeout(() => setShowAddModal(false), 0);
      router.refresh();
    } else if (addState?.error) {
      toast("error", addState.error);
    }
  }, [addState, router]);

  // Handle toast notifications and modal closings for Edit Action
  useEffect(() => {
    if (editState?.success) {
      toast("success", "Data user berhasil diperbarui!");
      setTimeout(() => {
        setShowEditModal(false);
        setSelectedUser(null);
      }, 0);
      router.refresh();
    } else if (editState?.error) {
      toast("error", editState.error);
    }
  }, [editState, router]);

  // Handle toast notifications and modal closings for Delete Action
  useEffect(() => {
    if (deleteState?.success) {
      toast("success", "User berhasil dihapus!");
      setTimeout(() => setConfirmDeleteUserId(null), 0);
      router.refresh();
    } else if (deleteState?.error) {
      toast("error", deleteState.error);
      setTimeout(() => setConfirmDeleteUserId(null), 0);
    }
  }, [deleteState, router]);

  // Filter users by search term
  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      (u.name || "").toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term)
    );
  });

  // Filter jobs of selected detailUser
  const filteredOrders = detailData
    ? (detailData.orders || []).filter((o: FormattedOrder) => {
        const matchSearch =
          o.noService.toLowerCase().includes(jobsSearch.toLowerCase()) ||
          o.customerName.toLowerCase().includes(jobsSearch.toLowerCase()) ||
          `${o.merk} ${o.tipe}`.toLowerCase().includes(jobsSearch.toLowerCase());

        if (jobsFilter === "semua") return matchSearch;
        if (jobsFilter === "aktif") return matchSearch && o.status !== "selesai";
        if (jobsFilter === "selesai") return matchSearch && o.status === "selesai";
        return matchSearch;
      })
    : [];

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">Manajemen</p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Daftar User & Teknisi</h1>
          <p className="text-xs text-muted-foreground/80 mt-0.5">Kelola akun dan persentase komisi bagi hasil teknisi.</p>
        </div>

        {/* Add User Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger
            render={
              <Button variant="default" size="sm">
                <Plus className="h-4 w-4" />
                Tambah User
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
              <DialogDescription>
                Daftarkan akun karyawan baru (Admin, Kasir, atau Teknisi) ke dalam sistem.
              </DialogDescription>
            </DialogHeader>

            <form action={addFormAction}>
              {addState?.error && (
                <div className="px-6 pb-0">
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs font-medium text-destructive" role="alert">
                    {addState.error}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 px-6 pb-6">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</label>
                  <input
                    name="username"
                    defaultValue=""
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                    placeholder="cth: budi.teknisi (tanpa spasi)"
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Lengkap</label>
                  <input
                    name="name"
                    defaultValue=""
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                    placeholder="cth: Budi Santoso"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
                  <input
                    type="password"
                    name="password"
                    defaultValue=""
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                    placeholder="Minimal 6 karakter"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Peran (Role)</label>
                  <select
                    name="role"
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as Role)}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                    required
                  >
                    <option value="admin">Admin</option>
                    <option value="kasir">Kasir</option>
                    <option value="teknisi">Teknisi</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Komisi Bagi Hasil (%)
                  </label>
                  <input
                    type="number"
                    name="komisiPersen"
                    defaultValue="40"
                    min="0"
                    max="100"
                    disabled={addRole !== "teknisi"}
                    className="w-full rounded-lg border border-border bg-input disabled:opacity-40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose render={<Button type="button" variant="ghost" size="sm" />}>
                  Batal
                </DialogClose>
                <Button type="submit" variant="default" size="sm" disabled={addPending}>
                  {addPending ? "Menyimpan..." : "Simpan User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/45" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-input pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
          placeholder="Cari user berdasarkan nama atau username..."
        />
      </div>

      {/* Users Card List */}
      <div className="divide-y divide-border/40 rounded-xl bg-card/80 border border-border/40 overflow-hidden backdrop-blur-sm">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center space-y-3">
            <Users className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {search ? "User tidak ditemukan." : "Belum ada data user."}
            </p>
          </div>
        ) : (
          filteredUsers.map((u) => {
            const initials = (u.name || u.username).slice(0, 2).toUpperCase();
            return (
              <div
                key={u.id}
                className="group flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-muted/20"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-sm font-semibold text-primary">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-sm text-foreground block">
                      {u.name || u.username}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                        @{u.username}
                      </span>
                      <span className="text-muted-foreground/30 text-[10px]">•</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
                        u.role === "admin"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : u.role === "kasir"
                            ? "bg-accents-blue/10 text-accents-blue border-accents-blue/20"
                            : "bg-primary/10 text-primary border-primary/20"
                      }`}>
                        {u.role === "admin" ? "Admin" : u.role === "kasir" ? "Kasir" : "Teknisi"}
                      </span>
                      {u.role === "teknisi" && (
                        <>
                          <span className="text-muted-foreground/30 text-[10px]">•</span>
                          <span className="text-[11px] text-muted-foreground/70 flex items-center gap-0.5 font-medium">
                            <Percent className="h-3 w-3 text-primary/70" /> Bagi Hasil: {u.komisiPersen}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShowDetail(u)}
                    className="h-8.5 text-accents-blue border-accents-blue/20 hover:bg-accents-blue/10 hover:text-accents-blue font-medium"
                  >
                    <TrendingUp className="h-3.5 w-3.5" /> Detail
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(u);
                      setEditName(u.name || "");
                      setEditRole(u.role);
                      setEditKomisi(u.komisiPersen.toString());
                      setEditPassword("");
                      setShowEditModal(true);
                    }}
                    className="h-8.5 font-medium"
                  >
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDeleteUserId(u.id)}
                    className="h-8.5 hover:bg-destructive/10 hover:text-destructive text-muted-foreground font-medium"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Performance Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl p-6 bg-[#1a1a19] text-[#faf9f5] border border-border/40">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2.5 text-lg font-bold">
              <UserCheck className="h-5 w-5 text-primary" />
              Kinerja & Detail Karyawan
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Analisis mendalam performa pekerjaan, pendapatan bruto, dan pembagian komisi bagi hasil karyawan.
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground animate-pulse font-medium">Memuat data kinerja...</p>
            </div>
          ) : detailData ? (
            <div className="space-y-6">
              {/* Karyawan Profile Summary */}
              <div className="rounded-xl bg-muted/10 p-5 border border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-lg font-bold text-primary">
                    {(detailData.user.name || detailData.user.username).slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">{detailData.user.name || detailData.user.username}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">@{detailData.user.username}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        detailData.user.role === "admin"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : detailData.user.role === "kasir"
                            ? "bg-accents-blue/10 text-accents-blue border-accents-blue/20"
                            : "bg-primary/10 text-primary border-primary/20"
                      }`}>
                        {detailData.user.role === "admin" ? "Admin" : detailData.user.role === "kasir" ? "Kasir" : "Teknisi"}
                      </span>
                      {detailData.user.role === "teknisi" && (
                        <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1 font-medium bg-muted/20 px-2 py-0.5 rounded-md">
                          <Percent className="h-3 w-3 text-primary/70" /> Bagi Hasil: {detailData.user.komisiPersen}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-left md:text-right text-xs text-muted-foreground self-start md:self-center">
                  <p className="flex items-center md:justify-end gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Terdaftar sejak:
                  </p>
                  <p className="font-medium text-foreground mt-0.5">
                    {new Date(detailData.user.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl bg-card p-5 shadow-sm border border-border/40 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pekerjaan</span>
                    <Briefcase className="h-4 w-4 text-accents-blue" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{detailData.stats.totalAssigned}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                      <span className="text-accents-warm font-medium">{detailData.stats.activeCount} Aktif</span>
                      <span>•</span>
                      <span className="text-accents-green font-medium">{detailData.stats.completedCount} Selesai</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-card p-5 shadow-sm border border-border/40 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Revenue Bruto</span>
                    <TrendingUp className="h-4 w-4 text-accents-green" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground leading-snug">{formatHarga(detailData.stats.totalRevenue)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Bruto dari {detailData.stats.completedCount} selesai</p>
                  </div>
                </div>

                <div className="rounded-xl bg-card p-5 shadow-sm border border-border/40 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Komisi Lunas</span>
                    <Coins className="h-4 w-4 text-accents-green" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-accents-green leading-snug">{formatHarga(detailData.stats.totalCommissionLunas)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Status bayar Lunas</p>
                  </div>
                </div>

                <div className="rounded-xl bg-card p-5 shadow-sm border border-border/40 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Komisi Pending</span>
                    <Coins className="h-4 w-4 text-accents-orange" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-accents-orange leading-snug">{formatHarga(detailData.stats.totalCommissionBelumLunas)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Status bayar Belum Lunas / DP</p>
                  </div>
                </div>
              </div>

              {/* Job History Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <History className="h-4.5 w-4.5 text-muted-foreground" />
                    <h4 className="font-bold text-sm text-foreground">Riwayat Pekerjaan Karyawan</h4>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex rounded-lg bg-muted/20 p-1 border border-border/40 max-w-fit">
                    {(["semua", "aktif", "selesai"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setJobsFilter(tab)}
                        className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                          jobsFilter === tab
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search bar inside history */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    value={jobsSearch}
                    onChange={(e) => setJobsSearch(e.target.value)}
                    className="w-full rounded-lg border border-border bg-input pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                    placeholder="Cari berdasarkan No. Service, device, atau pelanggan..."
                  />
                </div>

                {/* Job Table */}
                <div className="overflow-x-auto rounded-xl border border-border/40 bg-card/45">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/10 text-muted-foreground font-semibold uppercase tracking-wider">
                        <th className="px-4 py-3">No. Service</th>
                        <th className="px-4 py-3">Device</th>
                        <th className="px-4 py-3">Pelanggan</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">Pembayaran</th>
                        <th className="px-4 py-3 text-right">Biaya Final</th>
                        <th className="px-4 py-3 text-right">Komisi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                            Tidak ada pekerjaan yang cocok dengan filter / pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((o: FormattedOrder) => (
                          <tr key={o.id} className="hover:bg-muted/10 transition-colors">
                            <td className="px-4 py-3.5 font-medium text-foreground whitespace-nowrap">
                              <a
                                href={`/services/${o.id}`}
                                className="hover:underline text-primary"
                              >
                                {o.noService}
                              </a>
                            </td>
                            <td className="px-4 py-3.5 font-medium text-foreground whitespace-nowrap">
                              {o.merk} {o.tipe}
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground">
                              {o.customerName}
                            </td>
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <Badge
                                variant={getStatusBadgeVariant(o.status)}
                                className={getStatusBadgeClass(o.status)}
                              >
                                {STATUS_LABELS[o.status] || o.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <Badge
                                variant={getPaymentBadgeVariant(o.statusBayar)}
                                className={getPaymentBadgeClass(o.statusBayar)}
                              >
                                {PAYMENT_LABELS[o.statusBayar] || o.statusBayar}
                              </Badge>
                            </td>
                            <td className="px-4 py-3.5 text-right font-medium text-foreground whitespace-nowrap">
                              {o.biayaFinal !== null && o.biayaFinal !== undefined ? formatHarga(o.biayaFinal) : "-"}
                            </td>
                            <td className="px-4 py-3.5 text-right font-bold text-foreground whitespace-nowrap">
                              {o.status === "selesai" ? (
                                <span className={o.statusBayar === "LUNAS" ? "text-accents-green" : "text-accents-orange"}>
                                  {formatHarga(o.komisi)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/60 italic font-normal">
                                  est. {formatHarga(o.profit * (detailData.user.role === "admin" ? 0 : detailData.user.komisiPersen / 100))}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm font-medium text-destructive">Gagal memuat data detail.</p>
            </div>
          )}

          <DialogFooter className="mt-6 border-t border-border/40 pt-4">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowDetailModal(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User: @{selectedUser?.username}</DialogTitle>
            <DialogDescription>
              Ubah data karyawan dan pengaturan komisi bagi hasil.
            </DialogDescription>
          </DialogHeader>

          <form action={editFormAction}>
            {editState?.error && (
              <div className="px-6 pb-0">
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs font-medium text-destructive" role="alert">
                  {editState.error}
                </div>
              </div>
            )}
            
            <input type="hidden" name="id" value={selectedUser?.id || ""} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 px-6 pb-6">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Lengkap</label>
                <input
                  name="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                  placeholder="cth: Budi Santoso"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ganti Password <span className="font-normal text-muted-foreground">(opsional)</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                  placeholder="Kosongkan jika tidak ingin mengganti"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Peran (Role)</label>
                <select
                  name="role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="kasir">Kasir</option>
                  <option value="teknisi">Teknisi</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Komisi Bagi Hasil (%)
                </label>
                <input
                  type="number"
                  name="komisiPersen"
                  value={editRole === "teknisi" ? editKomisi : "0"}
                  onChange={(e) => setEditKomisi(e.target.value)}
                  min="0"
                  max="100"
                  disabled={editRole !== "teknisi"}
                  className="w-full rounded-lg border border-border bg-input disabled:opacity-40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowEditModal(false)}>
                Batal
              </Button>
              <Button type="submit" variant="default" size="sm" disabled={editPending}>
                {editPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirm */}
      <ConfirmDialog
        open={confirmDeleteUserId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteUserId(null);
        }}
        title="Hapus Akun Karyawan"
        description="Apakah Anda yakin ingin menghapus user ini? Tindakan ini akan menghapus akun permanen dari database. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        variant="destructive"
        onConfirm={() => {
          const form = document.getElementById("delete-user-form") as HTMLFormElement;
          form?.requestSubmit();
        }}
        loading={deletePending}
      />
      <form id="delete-user-form" action={deleteFormAction} className="hidden">
        <input type="hidden" name="id" value={confirmDeleteUserId ?? ""} />
      </form>
    </div>
  );
}
