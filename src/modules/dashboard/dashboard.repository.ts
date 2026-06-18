import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CollectionValue {
  totalNormal: Prisma.Decimal;
  totalFoil: Prisma.Decimal;
  total: Prisma.Decimal;
  unpricedCount: number;
}

export interface TopCard {
  cardId: string;
  name: string;
  version: string | null;
  imageNormal: string | null;
  setName: string;
  variant: "NORMAL" | "FOIL";
  quantity: number;
  unitPrice: Prisma.Decimal;
  totalValue: Prisma.Decimal;
}

export interface ExpansionProgressRow {
  id: string;
  code: string;
  name: string;
  totalCards: number;
  releasedAt: Date | null;
  ownedCount: number;
  missingCount: number;
  percentage: number;
  ownedValue: Prisma.Decimal;
}

export interface DistributionRow {
  key: string;
  cardCount: number;
  totalCopies: number;
}

export interface ValuePoint {
  date: Date;
  totalValue: Prisma.Decimal;
}

// ─── Collection value ─────────────────────────────────────────────────────────

export async function getCollectionValue(userId: string): Promise<CollectionValue> {
  const items = await prisma.collectionItem.findMany({
    where: { userId },
    select: {
      normalQuantity: true,
      foilQuantity: true,
      card: { select: { priceUsd: true, priceUsdFoil: true } },
    },
  });

  return computeCollectionValue(items);
}

export function computeCollectionValue(
  items: Array<{
    normalQuantity: number;
    foilQuantity: number;
    card: { priceUsd: Prisma.Decimal | null; priceUsdFoil: Prisma.Decimal | null };
  }>
): CollectionValue {
  let totalNormal = new Prisma.Decimal(0);
  let totalFoil = new Prisma.Decimal(0);
  let unpricedCount = 0;

  for (const item of items) {
    const hasNormalPrice = item.card.priceUsd != null;
    const hasFoilPrice = item.card.priceUsdFoil != null;

    if (hasNormalPrice && item.normalQuantity > 0) {
      totalNormal = totalNormal.add(
        new Prisma.Decimal(item.normalQuantity).mul(item.card.priceUsd!)
      );
    }
    if (hasFoilPrice && item.foilQuantity > 0) {
      totalFoil = totalFoil.add(
        new Prisma.Decimal(item.foilQuantity).mul(item.card.priceUsdFoil!)
      );
    }
    if (!hasNormalPrice && !hasFoilPrice) {
      unpricedCount++;
    }
  }

  return { totalNormal, totalFoil, total: totalNormal.add(totalFoil), unpricedCount };
}

// ─── Top valuable cards ───────────────────────────────────────────────────────

export async function getTopValueCards(userId: string, limit = 5): Promise<TopCard[]> {
  const items = await prisma.collectionItem.findMany({
    where: {
      userId,
      OR: [{ normalQuantity: { gt: 0 } }, { foilQuantity: { gt: 0 } }],
    },
    select: {
      normalQuantity: true,
      foilQuantity: true,
      cardId: true,
      card: {
        select: {
          name: true,
          version: true,
          imageNormal: true,
          priceUsd: true,
          priceUsdFoil: true,
          set: { select: { name: true } },
        },
      },
    },
  });

  return buildTopCards(items, limit);
}

export function buildTopCards(
  items: Array<{
    cardId: string;
    normalQuantity: number;
    foilQuantity: number;
    card: {
      name: string;
      version: string | null;
      imageNormal: string | null;
      priceUsd: Prisma.Decimal | null;
      priceUsdFoil: Prisma.Decimal | null;
      set: { name: string };
    };
  }>,
  limit: number
): TopCard[] {
  const variants: TopCard[] = [];

  for (const item of items) {
    if (item.normalQuantity > 0 && item.card.priceUsd != null) {
      variants.push({
        cardId: item.cardId,
        name: item.card.name,
        version: item.card.version,
        imageNormal: item.card.imageNormal,
        setName: item.card.set.name,
        variant: "NORMAL",
        quantity: item.normalQuantity,
        unitPrice: item.card.priceUsd,
        totalValue: item.card.priceUsd.mul(item.normalQuantity),
      });
    }
    if (item.foilQuantity > 0 && item.card.priceUsdFoil != null) {
      variants.push({
        cardId: item.cardId,
        name: item.card.name,
        version: item.card.version,
        imageNormal: item.card.imageNormal,
        setName: item.card.set.name,
        variant: "FOIL",
        quantity: item.foilQuantity,
        unitPrice: item.card.priceUsdFoil,
        totalValue: item.card.priceUsdFoil.mul(item.foilQuantity),
      });
    }
  }

  variants.sort((a, b) => b.unitPrice.comparedTo(a.unitPrice));
  return variants.slice(0, limit);
}

// ─── Recently added ───────────────────────────────────────────────────────────

export async function getRecentlyAddedCards(userId: string, limit = 5) {
  return prisma.collectionItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      normalQuantity: true,
      foilQuantity: true,
      createdAt: true,
      card: {
        select: {
          id: true,
          name: true,
          version: true,
          imageNormal: true,
          rarity: true,
          ink: true,
          set: { select: { code: true, name: true } },
        },
      },
    },
  });
}

// ─── Expansion progress ───────────────────────────────────────────────────────

type RawExpansionRow = {
  id: string;
  code: string;
  name: string;
  total_cards: number;
  released_at: Date | null;
  owned_count: bigint;
  owned_value: string | null;
};

export async function getExpansionProgress(userId: string): Promise<ExpansionProgressRow[]> {
  const rows = await prisma.$queryRaw<RawExpansionRow[]>`
    SELECT
      cs.id,
      cs.code,
      cs.name,
      cs.totalCards AS total_cards,
      cs.releasedAt AS released_at,
      COALESCE((
        SELECT COUNT(DISTINCT c.id)
        FROM cards c
        JOIN collection_items ci ON ci.cardId = c.id
        WHERE c.setId = cs.id
          AND ci.userId = ${userId}
          AND (ci.normalQuantity > 0 OR ci.foilQuantity > 0)
      ), 0) AS owned_count,
      COALESCE((
        SELECT CAST(SUM(
          CASE WHEN c2.priceUsd IS NOT NULL THEN ci2.normalQuantity * c2.priceUsd ELSE 0 END +
          CASE WHEN c2.priceUsdFoil IS NOT NULL THEN ci2.foilQuantity * c2.priceUsdFoil ELSE 0 END
        ) AS CHAR)
        FROM cards c2
        JOIN collection_items ci2 ON ci2.cardId = c2.id
        WHERE c2.setId = cs.id
          AND ci2.userId = ${userId}
      ), '0') AS owned_value
    FROM card_sets cs
    WHERE cs.totalCards > 0
    ORDER BY owned_count DESC, cs.releasedAt DESC
  `;

  return rows.map((r) => {
    const ownedCount = Number(r.owned_count);
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      totalCards: r.total_cards,
      releasedAt: r.released_at,
      ownedCount,
      missingCount: r.total_cards - ownedCount,
      percentage: r.total_cards > 0 ? (ownedCount / r.total_cards) * 100 : 0,
      ownedValue: new Prisma.Decimal(r.owned_value ?? "0"),
    };
  });
}

// ─── Ink distribution ─────────────────────────────────────────────────────────

type RawDistRow = { label: string | null; card_count: bigint; total_copies: bigint };

export async function getInkDistribution(userId: string): Promise<DistributionRow[]> {
  const rows = await prisma.$queryRaw<RawDistRow[]>`
    SELECT
      c.ink AS label,
      COUNT(DISTINCT c.id) AS card_count,
      SUM(ci.normalQuantity + ci.foilQuantity) AS total_copies
    FROM collection_items ci
    JOIN cards c ON c.id = ci.cardId
    WHERE ci.userId = ${userId}
    GROUP BY c.ink
    ORDER BY card_count DESC
  `;

  return rows.map((r) => ({
    key: r.label ?? "Sem tinta",
    cardCount: Number(r.card_count),
    totalCopies: Number(r.total_copies),
  }));
}

// ─── Rarity distribution ─────────────────────────────────────────────────────

export async function getRarityDistribution(userId: string): Promise<DistributionRow[]> {
  const rows = await prisma.$queryRaw<RawDistRow[]>`
    SELECT
      c.rarity AS label,
      COUNT(DISTINCT c.id) AS card_count,
      SUM(ci.normalQuantity + ci.foilQuantity) AS total_copies
    FROM collection_items ci
    JOIN cards c ON c.id = ci.cardId
    WHERE ci.userId = ${userId}
    GROUP BY c.rarity
    ORDER BY card_count DESC
  `;

  return rows.map((r) => ({
    key: r.label ?? "Desconhecida",
    cardCount: Number(r.card_count),
    totalCopies: Number(r.total_copies),
  }));
}

// ─── Value evolution ──────────────────────────────────────────────────────────

type RawEvolutionRow = { recorded_at: Date; total_value: string };

export async function getValueEvolution(userId: string, days = 30): Promise<ValuePoint[]> {
  const rows = await prisma.$queryRaw<RawEvolutionRow[]>`
    SELECT
      ph.recordedAt AS recorded_at,
      CAST(COALESCE(SUM(
        CASE WHEN ph.priceUsd IS NOT NULL AND ci.normalQuantity > 0
          THEN ci.normalQuantity * ph.priceUsd ELSE 0 END +
        CASE WHEN ph.priceUsdFoil IS NOT NULL AND ci.foilQuantity > 0
          THEN ci.foilQuantity * ph.priceUsdFoil ELSE 0 END
      ), 0) AS CHAR) AS total_value
    FROM price_history ph
    JOIN collection_items ci ON ci.cardId = ph.cardId AND ci.userId = ${userId}
    WHERE ph.recordedAt >= DATE_SUB(CURDATE(), INTERVAL ${Prisma.raw(String(days))} DAY)
    GROUP BY ph.recordedAt
    ORDER BY ph.recordedAt ASC
  `;

  return rows.map((r) => ({
    date: r.recorded_at,
    totalValue: new Prisma.Decimal(r.total_value),
  }));
}

// ─── Public profile stats ─────────────────────────────────────────────────────

export async function getPublicCollectionStats(userId: string) {
  const [value, stats, topCards] = await Promise.all([
    getCollectionValue(userId),
    prisma.collectionItem.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: { normalQuantity: true, foilQuantity: true },
    }),
    getTopValueCards(userId, 5),
  ]);

  const distinctSets = await prisma.collectionItem.findMany({
    where: { userId },
    select: { card: { select: { setId: true } } },
  });
  const setsStarted = new Set(distinctSets.map((i) => i.card.setId)).size;

  return {
    distinctCards: stats._count.id,
    totalCopies: (stats._sum.normalQuantity ?? 0) + (stats._sum.foilQuantity ?? 0),
    totalValue: value.total,
    setsStarted,
    topCards,
  };
}
