import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";

function todayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function upsertPriceHistory(params: {
  cardId: string;
  priceUsd: Prisma.Decimal | null;
  priceUsdFoil: Prisma.Decimal | null;
  source?: string;
}): Promise<void> {
  const { cardId, priceUsd, priceUsdFoil, source = "lorcast" } = params;

  if (priceUsd == null && priceUsdFoil == null) return;

  const recordedAt = todayUTC();

  await prisma.priceHistory.upsert({
    where: {
      cardId_source_recordedAt: { cardId, source, recordedAt },
    },
    create: { cardId, priceUsd, priceUsdFoil, source, recordedAt },
    update: { priceUsd, priceUsdFoil },
  });
}

export async function findPriceHistory(cardId: string, days = 30) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  since.setUTCHours(0, 0, 0, 0);

  return prisma.priceHistory.findMany({
    where: { cardId, recordedAt: { gte: since } },
    orderBy: { recordedAt: "asc" },
  });
}
