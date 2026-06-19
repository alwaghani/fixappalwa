"use client";

import { clsx } from "clsx";
import {
  Wrench,
  LayoutDashboard,
  Users,
  ClipboardList,
  PlusCircle,
  Wallet,
  LogOut,
  Menu,
  X,
  Settings,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/services", label: "Daftar Service", icon: ClipboardList },
  { href: "/services/new", label: "Service Baru", icon: PlusCircle },
  { href: "/customers", label: "Customer", icon: Users },
  { href: "/teknisi", label: "Teknisi", icon: UserCheck },
  { href: "/keuangan", label: "Keuangan", icon: Wallet },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export default function Sidebar({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [confirmLogout, setConfirmLogout] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const filteredNav = navItems.filter((item) => {
    if (item.href === "/keuangan" || item.href === "/settings" || item.href === "/teknisi") {
      return role === "kasir";
    }
    return true;
  });

  const sortedNav = filteredNav.toSorted((a, b) => b.href.length - a.href.length);
  const activeHref = sortedNav.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  )?.href;

  return (
    <aside
      className={clsx(
        "flex h-full flex-col bg-sidebar border-r border-sidebar-border text-sidebar-foreground transition-[width] duration-300",
        isOpen ? "w-64" : "w-16",
      )}
    >
      <div className="flex h-16 items-center border-b border-sidebar-border px-3.5 justify-between">
        <div
          className={clsx(
            "flex items-center gap-2.5 overflow-hidden transition-[width,opacity] duration-300",
            isOpen ? "w-auto opacity-100" : "w-0 opacity-0",
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <Wrench aria-hidden="true" className="h-4.5 w-4.5 shrink-0" />
          </div>
          <span className="whitespace-nowrap text-base font-bold tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            FixApp
          </span>
        </div>
        <button
          onClick={onToggle}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          aria-label={isOpen ? "Tutup sidebar" : "Buka sidebar"}
        >
          {isOpen ? <X aria-hidden="true" className="h-4 w-4" /> : <Menu aria-hidden="true" className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-2.5 py-4">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeHref === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "group relative flex items-center rounded-xl text-sm font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                isOpen ? "gap-3 px-3.5 py-2.5" : "justify-center px-2 py-2.5",
                isActive
                  ? "bg-primary/8 text-primary font-semibold"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
              title={item.label}
            >
              {isActive && (
                <span className="absolute left-0 top-[25%] h-1/2 w-1 rounded-r-full bg-primary" />
              )}
              <Icon aria-hidden="true" className={clsx(
                "h-5 w-5 shrink-0 transition-colors duration-200",
                isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
              )} />
              <span
                className={clsx(
                  "overflow-hidden whitespace-nowrap transition-[width,opacity] duration-300",
                  isOpen ? "w-auto opacity-100" : "w-0 opacity-0",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-2.5 py-3">
        <button
          onClick={() => setConfirmLogout(true)}
          className={clsx(
            "group flex w-full items-center rounded-xl text-sm font-medium text-sidebar-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive outline-none focus-visible:ring-2 focus-visible:ring-destructive/40",
            isOpen ? "gap-3 px-3.5 py-2.5" : "justify-center px-2 py-2.5",
          )}
          title="Keluar"
        >
          <LogOut aria-hidden="true" className="h-5 w-5 shrink-0 text-sidebar-foreground/40 group-hover:text-destructive/80 transition-colors" />
          <span
            className={clsx(
              "overflow-hidden whitespace-nowrap transition-[width,opacity] duration-300",
              isOpen ? "w-auto opacity-100" : "w-0 opacity-0",
            )}
          >
            Keluar
          </span>
        </button>
      </div>

      <Dialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yakin ingin keluar?</DialogTitle>
            <DialogDescription>Sesi Anda akan berakhir dan perlu login kembali.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmLogout(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={() => signOut({ redirectTo: "/login" })}>
              Keluar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
