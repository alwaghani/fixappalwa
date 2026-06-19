"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { ToastType } from "./toast-core";
import { setAddToastFn } from "./toast-core";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

let toastId = 0;

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    setAddToastFn((type, message) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, type, message }]);
      const duration = type === "error" ? 8000 : type === "success" ? 3000 : 4000;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    });
    return () => { setAddToastFn(null); };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none" aria-live="polite" aria-atomic="false">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
            className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium shadow-lg backdrop-blur-sm min-w-[300px] max-w-[420px] ${
              t.type === "success"
                ? "border-accents-green/30 bg-accents-green/10 text-accents-green"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle aria-hidden="true" className="h-5 w-5 shrink-0" />
            )}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
