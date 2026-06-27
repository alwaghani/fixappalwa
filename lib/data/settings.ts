import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";

import prisma from "@/lib/prisma";

export const DEFAULT_SETTINGS: Record<string, string> = {
  nama_toko: "FIXAPP",
  alamat: "Gg. Damai 2, Jepang, Kec. Mejobo, Kabupaten Kudus, Jawa Tengah 59381",
  no_telepon: "08989310341",
  catatan_invoice: "Terima kasih telah mempercayakan servis HP Anda kepada kami. Garansi berlaku untuk sparepart yang sama.",
};

export const getSettings = cache(async (): Promise<Record<string, string>> => {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  const dbSettings = await prisma.setting.findMany();
  const settings = { ...DEFAULT_SETTINGS };

  for (const item of dbSettings) {
    settings[item.key] = item.value;
  }

  return settings;
});

const ALLOWED_SETTING_KEYS = new Set(["nama_toko", "alamat", "no_telepon", "catatan_invoice"]);

export async function updateSettings(data: Record<string, string>) {
  const promises = Object.entries(data)
    .filter(([key]) => ALLOWED_SETTING_KEYS.has(key))
    .map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    });

  await Promise.all(promises);
}
