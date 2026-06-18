import { prisma } from "@/lib/database/prisma";
import type { Role } from "@prisma/client";

export async function getAdminStats() {
  const [
    totalUsers,
    totalSets,
    totalCards,
    collectionAggregate,
    cardsWithoutPrice,
    cardsWithoutImage,
    setsWithoutCards,
    lastSync,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.cardSet.count(),
    prisma.card.count(),
    prisma.collectionItem.aggregate({
      _sum: { normalQuantity: true, foilQuantity: true },
    }),
    prisma.card.count({ where: { priceUsd: null, priceUsdFoil: null } }),
    prisma.card.count({ where: { imageNormal: null } }),
    prisma.cardSet.count({ where: { totalCards: 0 } }),
    prisma.syncRun.findFirst({ orderBy: { startedAt: "desc" } }),
  ]);

  return {
    totalUsers,
    totalSets,
    totalCards,
    totalCollectionItems:
      (collectionAggregate._sum.normalQuantity ?? 0) +
      (collectionAggregate._sum.foilQuantity ?? 0),
    cardsWithoutPrice,
    cardsWithoutImage,
    setsWithoutCards,
    lastSync,
  };
}

export async function listUsers(page = 1, limit = 25) {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        profilePublic: true,
        createdAt: true,
        _count: { select: { collectionItems: true } },
      },
    }),
    prisma.user.count(),
  ]);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function setUserRole(userId: string, role: Role) {
  return prisma.user.update({ where: { id: userId }, data: { role } });
}

export async function hasSyncRunning(): Promise<boolean> {
  const running = await prisma.syncRun.findFirst({
    where: { status: "RUNNING" },
  });
  return running != null;
}
