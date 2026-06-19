"use server";

import "server-only";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { createCustomer, updateCustomer } from "@/lib/data/customers";
import {
  createServiceOrder,
  updateServiceOrder,
  updateServiceStatus,
  addServicePart,
  deleteServicePart,
  deleteServiceOrder,
  updateServicePayment,
} from "@/lib/data/service-orders";
import { updateSettings } from "@/lib/data/settings";
import { normalizePhone } from "@/lib/utils";
import {
  customerSchema,
  customerUpdateSchema,
  paymentUpdateSchema,
  serviceOrderSchema,
  serviceOrderUpdateSchema,
  servicePartSchema,
  serviceStatusSchema,
} from "@/lib/validations";

// ── Helpers ──

const rupiahToSen = (val: FormDataEntryValue | null | undefined): number => {
  if (!val) return 0;
  return Math.round(Number(String(val).replace(/\./g, "")) * 100);
};

const stripDots = (val: FormDataEntryValue | null | undefined): number | undefined => {
  if (!val || String(val).trim() === "") return undefined;
  return Number(String(val).replace(/\./g, ""));
};

// ── Customer ──

export async function createCustomerAction(
  prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const rawNoHp = formData.get("noHp");
  const normalizedNoHp = typeof rawNoHp === "string" ? normalizePhone(rawNoHp) : rawNoHp;

  const parsed = customerSchema.safeParse({
    nama: formData.get("nama"),
    noHp: normalizedNoHp,
    alamat: formData.get("alamat") || undefined,
  });

  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: first || "Validasi gagal" };
  }

  try {
    await createCustomer(parsed.data);
  } catch {
    return { error: "No HP sudah terdaftar. Gunakan nomor lain." };
  }
  revalidatePath("/customers");
  redirect("/customers");
}

export async function updateCustomerAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const id = Number(formData.get("id"));
  if (!id) return { error: "ID customer tidak valid" };

  const rawNoHp = formData.get("noHp");
  const normalizedNoHp = typeof rawNoHp === "string" ? normalizePhone(rawNoHp) : undefined;

  const parsed = customerUpdateSchema.safeParse({
    nama: formData.get("nama") || undefined,
    noHp: normalizedNoHp || undefined,
    alamat: formData.get("alamat") || undefined,
  });

  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: first || "Validasi gagal" };
  }

  await updateCustomer(id, parsed.data);
  revalidatePath("/customers");
  return { success: true };
}

// ── Service Order ──

export async function createServiceOrderAction(
  prevState: { error?: string; id?: number } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const parsed = serviceOrderSchema.safeParse({
    customerId: Number(formData.get("customerId")),
    merk: formData.get("merk"),
    tipe: formData.get("tipe"),
    pin: formData.get("pin") || undefined,
    problem: formData.get("problem"),
    estimasiBiaya: rupiahToSen(formData.get("estimasiBiaya")),
    catatan: formData.get("catatan") || undefined,
    estimasiSelesai: formData.get("estimasiSelesai") || undefined,
    teknisiId: formData.get("teknisiId") && formData.get("teknisiId") !== ""
      ? Number(formData.get("teknisiId"))
      : undefined,
  });

  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: first || "Validasi gagal" };
  }

  const order = await createServiceOrder({
    ...parsed.data,
    estimasiSelesai: parsed.data.estimasiSelesai ? new Date(parsed.data.estimasiSelesai) : undefined,
  });
  revalidatePath("/services");
  redirect(`/services/${order.id}`);
}

// ── Service Parts ──

export async function addServicePartAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const parsed = servicePartSchema.safeParse({
    serviceOrderId: Number(formData.get("serviceOrderId")),
    nama: formData.get("nama"),
    harga: stripDots(formData.get("harga")) ?? 0,
    hargaPokok: formData.get("hargaPokok") ? stripDots(formData.get("hargaPokok")) : undefined,
  });

  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: first || "Validasi gagal" };
  }

  const part = await addServicePart(parsed.data.serviceOrderId, {
    nama: parsed.data.nama,
    harga: parsed.data.harga,
    ...(parsed.data.hargaPokok !== undefined ? { hargaPokok: parsed.data.hargaPokok } : {}),
  });
  revalidatePath(`/services/${parsed.data.serviceOrderId}`);
  return { success: true, partId: part.id };
}

export async function deleteServicePartAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const partId = Number(formData.get("partId"));
  const orderId = Number(formData.get("orderId"));

  if (!partId || !orderId) return { error: "Data tidak valid" };

  try {
    await deleteServicePart(partId);
  } catch {
    return { error: "Part tidak ditemukan" };
  }

  revalidatePath(`/services/${orderId}`);
  return { success: true };
}

// ── Service Order Update ──

export async function updateServiceOrderAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const id = Number(formData.get("id"));
  if (!id) return { error: "ID service tidak valid" };

  const parsed = serviceOrderUpdateSchema.safeParse({
    merk: formData.get("merk") || undefined,
    tipe: formData.get("tipe") || undefined,
    pin: formData.get("pin") || undefined,
    problem: formData.get("problem") || undefined,
    estimasiBiaya: formData.get("estimasiBiaya") ? stripDots(formData.get("estimasiBiaya")) : undefined,
    biayaFinal: formData.get("biayaFinal") ? stripDots(formData.get("biayaFinal")) : undefined,
    catatan: formData.get("catatan") || undefined,
    diagnostik: formData.get("diagnostik") || undefined,
    estimasiSelesai: formData.get("estimasiSelesai") || undefined,
  });

  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: first || "Validasi gagal" };
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.merk !== undefined) data.merk = parsed.data.merk;
  if (parsed.data.tipe !== undefined) data.tipe = parsed.data.tipe;
  if (parsed.data.pin !== undefined) data.pin = parsed.data.pin;
  if (parsed.data.problem !== undefined) data.problem = parsed.data.problem;
  if (parsed.data.estimasiBiaya !== undefined) data.estimasiBiaya = Math.round(Number(parsed.data.estimasiBiaya) * 100);
  if (parsed.data.biayaFinal !== undefined) data.biayaFinal = Math.round(Number(parsed.data.biayaFinal) * 100);
  if (parsed.data.catatan !== undefined) data.catatan = parsed.data.catatan;
  if (parsed.data.diagnostik !== undefined) data.diagnostik = parsed.data.diagnostik;
  if (parsed.data.estimasiSelesai !== undefined) {
    data.estimasiSelesai = parsed.data.estimasiSelesai ? new Date(parsed.data.estimasiSelesai) : null;
  }

  await updateServiceOrder(id, data);
  revalidatePath(`/services/${id}`);
  return { success: true };
}

// ── Payment ──

export async function updatePaymentAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if (session.user.role !== "kasir") return { error: "Akses ditolak (Hanya Kasir)" };

  const parsed = paymentUpdateSchema.safeParse({
    id: Number(formData.get("id")),
    statusBayar: formData.get("statusBayar"),
    dpNominal: formData.get("dpNominal") ? rupiahToSen(formData.get("dpNominal")) : undefined,
    biayaFinal: formData.get("biayaFinal") ? rupiahToSen(formData.get("biayaFinal")) : undefined,
  });

  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: first || "Validasi gagal" };
  }

  try {
    await updateServicePayment(parsed.data.id, {
      statusBayar: parsed.data.statusBayar,
      ...(parsed.data.dpNominal !== undefined ? { dpNominal: parsed.data.dpNominal } : {}),
      ...(parsed.data.biayaFinal !== undefined ? { biayaFinal: parsed.data.biayaFinal } : {}),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal update pembayaran";
    return { error: message };
  }

  revalidatePath(`/services/${parsed.data.id}`);
  return { success: true };
}

// ── Status ──

export async function assignTeknisiAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "kasir") return { error: "Unauthorized" };

  const id = Number(formData.get("id"));
  if (!id) return { error: "ID tidak valid" };

  const teknisiId = formData.get("teknisiId") ? Number(formData.get("teknisiId")) : null;

  await import("@/lib/data/service-orders").then(async ({ updateServiceOrder }) => {
    await updateServiceOrder(id, { teknisiId: teknisiId ?? undefined });
  });
  revalidatePath(`/services/${id}`);
  revalidatePath("/services");
  return { success: true };
}

export async function updateServiceStatusAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const id = Number(formData.get("id"));
  const newStatus = formData.get("status") as string;
  const warrantyDays = formData.get("warrantyDays") ? Number(formData.get("warrantyDays")) : undefined;

  if (!id) return { error: "ID tidak valid" };

  const parsed = serviceStatusSchema.safeParse({ status: newStatus });
  if (!parsed.success) return { error: "Status tidak valid" };

  try {
    await updateServiceStatus(id, parsed.data.status, warrantyDays);
  } catch {
    return { error: "Gagal update status" };
  }

  revalidatePath(`/services/${id}`);
  return { success: true };
}

// ── Delete ──

export async function deleteServiceOrderAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if (session.user.role !== "kasir") return { error: "Akses ditolak (Hanya Kasir)" };

  const id = Number(formData.get("id"));
  if (!id) return { error: "ID tidak valid" };

  try {
    await deleteServiceOrder(id);
  } catch {
    return { error: "Gagal menghapus service" };
  }

  revalidatePath("/services");
  redirect("/services");
}

export async function updateSettingsAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if (session.user.role !== "kasir") return { error: "Akses ditolak (Hanya Kasir)" };

  const nama_toko = formData.get("nama_toko") as string;
  const alamat = formData.get("alamat") as string;
  const no_telepon = formData.get("no_telepon") as string;
  const catatan_invoice = formData.get("catatan_invoice") as string;

  if (!nama_toko || !alamat || !no_telepon) {
    return { error: "Nama toko, alamat, dan nomor telepon wajib diisi" };
  }

  try {
    await updateSettings({
      nama_toko,
      alamat,
      no_telepon,
      catatan_invoice: catatan_invoice || "",
    });
  } catch {
    return { error: "Gagal menyimpan pengaturan" };
  }

  revalidatePath("/settings");
  updateTag("settings");
  return { success: true };
}
