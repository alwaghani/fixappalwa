import "server-only";

import { cache } from "react";

import prisma from "@/lib/prisma";

export const getUsers = cache(async () => {
  return prisma.user.findMany({
    orderBy: [
      { role: "asc" },
      { username: "asc" },
    ],
  });
});

export const getUserById = cache(async (id: number) => {
  return prisma.user.findUnique({
    where: { id },
  });
});
