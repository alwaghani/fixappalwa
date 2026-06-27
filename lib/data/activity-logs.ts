import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";

import type { Prisma } from "@/lib/generated/prisma/client";
import prisma from "@/lib/prisma";

export type ActivityLogFilter = {
  search?: string;
  action?: string;
  page?: number;
  limit?: number;
};

export const getActivityLogs = cache(async (filters: ActivityLogFilter = {}) => {
  "use cache";
  cacheLife("minutes");
  cacheTag("activity-logs");

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 25;
  const skip = (page - 1) * limit;

  const where: Prisma.ActivityLogWhereInput = {};

  if (filters.action && filters.action !== "ALL") {
    where.action = filters.action;
  }

  if (filters.search) {
    where.OR = [
      { detail: { contains: filters.search } },
      { serviceOrder: { noService: { contains: filters.search } } },
      { serviceOrder: { customer: { nama: { contains: filters.search } } } },
      { serviceOrder: { merk: { contains: filters.search } } },
      { serviceOrder: { tipe: { contains: filters.search } } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            role: true,
          },
        },
        serviceOrder: {
          select: {
            id: true,
            noService: true,
            merk: true,
            tipe: true,
            customer: {
              select: {
                nama: true,
              },
            },
          },
        },
      },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    logs,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
});
