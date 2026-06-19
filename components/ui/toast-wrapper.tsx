"use client";

import dynamic from "next/dynamic";

const ToastContainer = dynamic(
  () => import("@/components/ui/toast").then((m) => m.ToastContainer),
  { ssr: false },
);

export default function ToastWrapper() {
  return <ToastContainer />;
}
