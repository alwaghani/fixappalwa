"use client";

export type ToastType = "success" | "error";

let addToastFn: ((type: ToastType, message: string) => void) | null = null;

export function setAddToastFn(fn: ((type: ToastType, message: string) => void) | null) {
  addToastFn = fn;
}

export function toast(type: ToastType, message: string) {
  addToastFn?.(type, message);
}
