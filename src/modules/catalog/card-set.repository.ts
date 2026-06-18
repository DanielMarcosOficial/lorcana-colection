import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import type { ExternalSet } from "@/lib/catalog/providers/types";

export type CardSetRow = Awaited<
  ReturnType<typeof findCardSetByCode>
>;

export async function upsertCardSet(ext: ExternalSet): Promise<{
  created: boolean;
  id: string;
}> {
  const data: Prisma.CardSetUncheckedCreateInput = {
    externalId: ext.id,
    code: ext.code,
    name: ext.name,
    releasedAt: ext.releasedAt ? new Date(ext.releasedAt) : null,
    prereleasedAt: ext.prereleasedAt ? new Date(ext.prereleasedAt) : null,
    lastSyncedAt: new Date(),
  };

  const existing = await prisma.cardSet.findUnique({
    where: { externalId: ext.id },
    select: { id: true },
  });

  if (existing) {
    await prisma.cardSet.update({
      where: { id: existing.id },
      data: { ...data, updatedAt: new Date() },
    });
    return { created: false, id: existing.id };
  }

  const created = await prisma.cardSet.create({ data });
  return { created: true, id: created.id };
}

export async function updateCardSetTotalCards(
  id: string,
  total: number
): Promise<void> {
  await prisma.cardSet.update({ where: { id }, data: { totalCards: total } });
}

export async function findCardSetByCode(code: string) {
  return prisma.cardSet.findUnique({
    where: { code },
    include: {
      _count: { select: { cards: true } },
    },
  });
}

export async function findCardSetById(id: string) {
  return prisma.cardSet.findUnique({ where: { id } });
}

export async function findAllCardSets() {
  return prisma.cardSet.findMany({
    orderBy: { releasedAt: "asc" },
    include: { _count: { select: { cards: true } } },
  });
}
