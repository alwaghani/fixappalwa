import { z } from "zod";

import { ServiceStatus, PaymentStatus, Role } from "@/lib/generated/prisma/client";

export const customerSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(100).trim(),
  noHp: z.string().min(1, "No HP wajib diisi").max(20).trim(),
  alamat: z.string().max(500).trim().optional(),
});

export const customerUpdateSchema = z.object({
  nama: z.string().min(1).max(100).trim().optional(),
  noHp: z.string().min(1).max(20).trim().optional(),
  alamat: z.string().max(500).trim().optional(),
});

export const serviceOrderSchema = z.object({
  customerId: z.number().int().positive(),
  merk: z.string().min(1, "Merk wajib diisi").max(50).trim(),
  tipe: z.string().min(1, "Tipe wajib diisi").max(50).trim(),
  pin: z.string().max(50).trim().optional(),
  problem: z.string().min(1, "Problem wajib diisi").max(2000).trim(),
  estimasiBiaya: z.number().int().min(0),
  catatan: z.string().max(2000).trim().optional(),
  diagnostik: z.string().max(5000).trim().optional(),
  estimasiSelesai: z.string().optional(),
  teknisiId: z.number().int().positive().nullable().optional(),
});

export const serviceOrderUpdateSchema = z.object({
  merk: z.string().min(1).max(50).trim().optional(),
  tipe: z.string().min(1).max(50).trim().optional(),
  pin: z.string().max(50).trim().optional(),
  problem: z.string().min(1).max(2000).trim().optional(),
  estimasiBiaya: z.number().int().min(0).optional(),
  biayaFinal: z.number().int().min(0).optional(),
  catatan: z.string().max(2000).trim().optional(),
  diagnostik: z.string().max(5000).trim().optional(),
  estimasiSelesai: z.string().optional(),
});

export const servicePartSchema = z.object({
  serviceOrderId: z.number().int().positive(),
  nama: z.string().min(1, "Nama part wajib diisi").max(100).trim(),
  harga: z.number().int().min(0),
  hargaPokok: z.number().int().min(0).optional(),
});

export const paymentUpdateSchema = z.object({
  id: z.number().int().positive(),
  statusBayar: z.nativeEnum(PaymentStatus),
  dpNominal: z.number().int().min(0).optional(),
  biayaFinal: z.number().int().min(0).optional(),
}).refine(
  (data) => {
    if (data.statusBayar !== "DP") return true;
    if (!data.dpNominal || !data.biayaFinal) return true;
    return data.dpNominal <= data.biayaFinal;
  },
  { message: "DP tidak boleh melebihi total tagihan final", path: ["dpNominal"] },
);

export const serviceStatusSchema = z.object({
  status: z.nativeEnum(ServiceStatus),
});

export const userSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter").max(50).trim().toLowerCase(),
  name: z.string().max(100).trim().optional().or(z.literal("")),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.nativeEnum(Role),
  komisiPersen: z.number().int().min(0, "Komisi minimal 0%").max(100, "Komisi maksimal 100%"),
});

export const userUpdateSchema = z.object({
  name: z.string().max(100).trim().optional().or(z.literal("")),
  password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
  role: z.nativeEnum(Role),
  komisiPersen: z.number().int().min(0, "Komisi minimal 0%").max(100, "Komisi maksimal 100%"),
});
