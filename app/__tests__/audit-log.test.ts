import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
vi.mock("server-only", () => ({}));

import {
  createServiceOrder,
  updateServiceOrder,
  updateServiceStatus,
  addServicePart,
  deleteServicePart,
  updateServicePayment,
  getServiceOrderById
} from "@/lib/data/service-orders";
import prisma from "@/lib/prisma";

describe("Audit Log / Activity Log System", () => {
  let customerId: number;
  let orderId: number;
  let teknisiId: number;

  beforeAll(async () => {
    // Buat customer untuk testing
    const customer = await prisma.customer.create({
      data: {
        nama: "Vitest Customer Audit",
        noHp: "6289555555555",
        alamat: "Alamat Testing Vitest"
      }
    });
    customerId = customer.id;

    // Buat user teknisi untuk testing
    const teknisi = await prisma.user.create({
      data: {
        username: "vitest_teknisi_audit",
        passwordHash: "somehash",
        name: "Vitest Teknisi",
        role: "teknisi"
      }
    });
    teknisiId = teknisi.id;
  });

  afterAll(async () => {
    // Clean up data customer
    await prisma.customer.delete({
      where: { id: customerId }
    });
    // Clean up user teknisi
    await prisma.user.delete({
      where: { id: teknisiId }
    });
  });

  it("should create ORDER_CREATED log when creating a service order", async () => {
    const order = await createServiceOrder({
      customerId,
      merk: "Apple",
      tipe: "iPhone 15 Pro",
      pin: "2525",
      problem: "Baterai kembung",
      estimasiBiaya: 120000000 // Rp 1.200.000
    });
    orderId = order.id;

    const logs = await prisma.activityLog.findMany({
      where: { serviceOrderId: orderId }
    });

    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe("ORDER_CREATED");
    expect(logs[0].detail).toContain("Servis baru berhasil didaftarkan");
  });

  it("should create ORDER_UPDATED log when updating device details", async () => {
    await updateServiceOrder(orderId, {
      tipe: "iPhone 15 Pro Max",
      catatan: "Ganti baterai kualitas original"
    });

    const logs = await prisma.activityLog.findMany({
      where: { serviceOrderId: orderId },
      orderBy: { createdAt: "desc" }
    });

    // Log terbaru harus di paling atas
    expect(logs[0].action).toBe("ORDER_UPDATED");
    expect(logs[0].detail).toContain("Tipe dari \"iPhone 15 Pro\" ke \"iPhone 15 Pro Max\"");
    expect(logs[0].detail).toContain("Catatan dari \"\" ke \"Ganti baterai kualitas original\"");
  });

  it("should create STATUS_CHANGED log when updating order status", async () => {
    await updateServiceStatus(orderId, "dikerjakan");

    const logs = await prisma.activityLog.findMany({
      where: { serviceOrderId: orderId },
      orderBy: { createdAt: "desc" }
    });

    expect(logs[0].action).toBe("STATUS_CHANGED");
    expect(logs[0].detail).toContain("Status pengerjaan diubah dari \"DITERIMA\" ke \"DIKERJAKAN\"");
  });

  it("should create PART_ADDED log when adding a service part", async () => {
    const part = await addServicePart(orderId, {
      nama: "Baterai iPhone 15",
      harga: 85000000, // Rp 850.000
      hargaPokok: 50000000 // Rp 500.000
    });

    const logs = await prisma.activityLog.findMany({
      where: { serviceOrderId: orderId },
      orderBy: { createdAt: "desc" }
    });

    expect(logs[0].action).toBe("PART_ADDED");
    expect(logs[0].detail).toContain("Sparepart \"Baterai iPhone 15\" ditambahkan");

    // Hapus part untuk dibersihkan & test log delete
    await deleteServicePart(part.id);
  });

  it("should create PART_DELETED log when deleting a service part", async () => {
    const logs = await prisma.activityLog.findMany({
      where: { serviceOrderId: orderId },
      orderBy: { createdAt: "desc" }
    });

    expect(logs[0].action).toBe("PART_DELETED");
    expect(logs[0].detail).toContain("Sparepart \"Baterai iPhone 15\" dihapus");
  });

  it("should create PAYMENT_UPDATED log when updating payment status", async () => {
    await updateServicePayment(orderId, {
      statusBayar: "DP",
      dpNominal: 20000000, // Rp 200.000
      biayaFinal: 110000000 // Rp 1.100.000
    });

    const logs = await prisma.activityLog.findMany({
      where: { serviceOrderId: orderId },
      orderBy: { createdAt: "desc" }
    });

    expect(logs[0].action).toBe("PAYMENT_UPDATED");
    expect(logs[0].detail).toContain("Status pembayaran diubah dari \"BELUM_LUNAS\" ke \"DP\"");
    expect(logs[0].detail).toContain("Nominal DP diubah");
    expect(logs[0].detail).toContain("200.000");
  });

  it("should retrieve logs via getServiceOrderById with correct order (newest first)", async () => {
    const detail = await getServiceOrderById(orderId);
    expect(detail).not.toBeNull();
    expect(detail?.activityLogs).not.toBeUndefined();
    expect(detail!.activityLogs.length).toBeGreaterThanOrEqual(5);

    // Cek urutan desc (yang paling baru / log terakhir di paling atas)
    const logs = detail!.activityLogs;
    const isSortedDesc = logs.every((val, i) => i === 0 || new Date(val.createdAt) <= new Date(logs[i - 1].createdAt));
    expect(isSortedDesc).toBe(true);

    // Hapus order test
    await prisma.serviceOrder.delete({
      where: { id: orderId }
    });
  });

  it("should assign technician when creating a service order if teknisiId is provided", async () => {
    const order = await createServiceOrder({
      customerId,
      merk: "Samsung",
      tipe: "Galaxy S24",
      pin: "1234",
      problem: "Layar retak",
      estimasiBiaya: 250000000, // Rp 2.500.000
      teknisiId: teknisiId
    });

    expect(order.teknisiId).toBe(teknisiId);

    // Clean up this specific order
    await prisma.serviceOrder.delete({
      where: { id: order.id }
    });
  });
});
