"use client";

import { Users, Plus, Percent, Edit, Trash2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

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
import { createUserAction, updateUserAction, deleteUserAction } from "@/lib/actions";
import type { User, Role } from "@/lib/generated/prisma/client";

export function TeknisiClient({ users }: { users: User[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<number | null>(null);

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
                Daftarkan akun karyawan baru (Admin/Kasir atau Teknisi) ke dalam sistem.
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
                    <option value="teknisi">Teknisi</option>
                    <option value="kasir">Admin / Kasir</option>
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
                        u.role === "kasir"
                          ? "bg-accents-blue/10 text-accents-blue border-accents-blue/20"
                          : "bg-primary/10 text-primary border-primary/20"
                      }`}>
                        {u.role === "kasir" ? "Admin / Kasir" : "Teknisi"}
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
                    onClick={() => {
                      setSelectedUser(u);
                      setEditName(u.name || "");
                      setEditRole(u.role);
                      setEditKomisi(u.komisiPersen.toString());
                      setEditPassword("");
                      setShowEditModal(true);
                    }}
                    className="h-8.5"
                  >
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDeleteUserId(u.id)}
                    className="h-8.5 hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

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
                  <option value="teknisi">Teknisi</option>
                  <option value="kasir">Admin / Kasir</option>
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
