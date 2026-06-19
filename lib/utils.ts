import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizePhone(hp: string): string {
  return hp.replace(/\s|-/g, "").replace(/^0/, "62").replace(/^\+/, "");
}
