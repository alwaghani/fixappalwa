"use client";

import clsx from "clsx";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import Sidebar from "./sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const showSidebar = !pathname.startsWith("/login");

  if (!showSidebar) {
    return <div className="h-full">{children}</div>;
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="hidden h-full bg-sidebar lg:block">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
      </div>

      <div className="lg:hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div
          className={clsx(
            "fixed left-0 top-0 z-50 h-full bg-sidebar transition-transform duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar isOpen={true} onToggle={() => setSidebarOpen(false)} />
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 lg:hidden shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label="Buka sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-base font-bold text-foreground">FixApp</span>
          </div>
        </header>

        <main className="relative flex-1 overflow-auto bg-background p-6 animate-in fade-in duration-300 dot-grid">
          {children}
        </main>
      </div>
    </div>
  );
}
