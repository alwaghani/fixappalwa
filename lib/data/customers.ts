import "server-only";

import { cache } from "react";

import type { Customer } from "@/lib/generated/prisma/client";
import prisma from "@/lib/prisma";

export const getCustomers = cache(async (search?: string, take = 50, skip = 0) => {
  if (!search) {
    return prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
  }

  const like = `%${search}%`;
  const cleanSearch = search.replace(/\D/g, "");
  const normalizedPhoneSearch = cleanSearch ? cleanSearch.replace(/^0/, "62") : "";
  const phoneLike = normalizedPhoneSearch ? `%${normalizedPhoneSearch}%` : like;

  return prisma.$queryRawUnsafe<Customer[]>(
    `SELECT * FROM "Customer"
     WHERE LOWER("nama") LIKE LOWER(?)
        OR LOWER("noHp") LIKE LOWER(?)
     ORDER BY "createdAt" DESC
     LIMIT ? OFFSET ?`,
    like,
    phoneLike,
    take,
    skip,
  );
});

export const countCustomers = cache(async (search?: string) => {
  if (!search) {
    return prisma.customer.count();
  }

  const like = `%${search}%`;
  const cleanSearch = search.replace(/\D/g, "");
  const normalizedPhoneSearch = cleanSearch ? cleanSearch.replace(/^0/, "62") : "";
  const phoneLike = normalizedPhoneSearch ? `%${normalizedPhoneSearch}%` : like;

  const result = await prisma.$queryRawUnsafe<[{ "count(*)": number }]>(
    `SELECT COUNT(*) FROM "Customer"
     WHERE LOWER("nama") LIKE LOWER(?)
        OR LOWER("noHp") LIKE LOWER(?)`,
    like,
    phoneLike,
  );
  return Number(result[0]["count(*)"]);
});

export const getCustomerById = cache(async (id: number) => {
  return prisma.customer.findUnique({ where: { id } });
});

export function createCustomer(data: { nama: string; noHp: string; alamat?: string }) {
  return prisma.customer.create({ data });
}

export function updateCustomer(id: number, data: { nama?: string; noHp?: string; alamat?: string }) {
  return prisma.customer.update({ where: { id }, data });
}
