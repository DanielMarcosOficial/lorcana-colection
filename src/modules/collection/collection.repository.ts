import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";

export type CollectionItemWithCard = Prisma.CollectionItemGetPayload<{
  include: {
    card: {
      include: { set: { select: { code: true; name: true } } };
    };
  };
}>;

export interface CollectionSearchParams {
  q?: string;
  setCode?: string;
  ink?: string;
  rarity?: string;
  hasNormal?: boolean;
  hasFoil?: boolean;
  hasDuplicates?: boolean;
  hasPrice?: boolean;
  minQty?: number;
  maxQty?: number;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

export interface CollectionSearchResult {
  items: CollectionItemWithCard[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CollectionStats {
  distinctCards: number;
  totalNormal: number;
  totalFoil: number;
  totalCopies: number;
  setsStarted: number;
}

const INCLUDE_CARD = {
  include: {
    card: {
      include: { set: { select: { code: true, name: true } } },
    },
  },
} as const;

export async function getCollectionStats(userId: string): Promise<CollectionStats> {
  const [agg, sets] = await Promise.all([
    prisma.collectionItem.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: { normalQuantity: true, foilQuantity: true },
    }),
    prisma.collectionItem.findMany({
      where: { userId },
      select: { card: { select: { setId: true } } },
    }),
  ]);

  const distinctSets = new Set(sets.map((i) => i.card.setId));
  const totalNormal = agg._sum.normalQuantity ?? 0;
  const totalFoil = agg._sum.foilQuantity ?? 0;

  return {
    distinctCards: agg._count.id,
    totalNormal,
    totalFoil,
    totalCopies: totalNormal + totalFoil,
    setsStarted: distinctSets.size,
  };
}

export async function searchUserCollection(
  userId: string,
  params: CollectionSearchParams
): Promise<CollectionSearchResult> {
  const {
    q,
    setCode,
    ink,
    rarity,
    hasNormal,
    hasFoil,
    hasDuplicates,
    hasPrice,
    minQty,
    maxQty,
    sortBy = "recentlyAdded",
    page = 1,
    pageSize = 24,
  } = params;

  const cardWhere: Prisma.CardWhereInput = {};
  if (q) {
    cardWhere.OR = [
      { name: { contains: q } },
      { version: { contains: q } },
      { fullName: { contains: q } },
    ];
  }
  if (setCode) cardWhere.set = { code: setCode };
  if (ink) cardWhere.ink = ink;
  if (rarity) cardWhere.rarity = rarity;

  const where: Prisma.CollectionItemWhereInput = {
    userId,
    card: Object.keys(cardWhere).length > 0 ? cardWhere : undefined,
  };

  if (hasNormal) where.normalQuantity = { gt: 0 };
  if (hasFoil) where.foilQuantity = { gt: 0 };
  if (hasPrice) {
    where.OR = [
      { normalPurchasePrice: { not: null } },
      { foilPurchasePrice: { not: null } },
    ];
  }
  if (minQty !== undefined) {
    where.OR = [
      { normalQuantity: { gte: minQty } },
      { foilQuantity: { gte: minQty } },
    ];
  }

  const needsAppSort = sortBy === "quantity" || sortBy === "totalValue";
  const fetchSize = needsAppSort ? 10_000 : pageSize;
  const skip = needsAppSort ? 0 : (page - 1) * pageSize;

  const orderBy = buildOrderBy(sortBy);

  const [total, rows] = await Promise.all([
    prisma.collectionItem.count({ where }),
    prisma.collectionItem.findMany({
      where,
      ...INCLUDE_CARD,
      orderBy,
      skip,
      take: fetchSize,
    }),
  ]);

  let items = rows;

  if (needsAppSort) {
    if (sortBy === "quantity") {
      items = rows.sort(
        (a, b) =>
          b.normalQuantity + b.foilQuantity - (a.normalQuantity + a.foilQuantity)
      );
    } else {
      items = rows.sort((a, b) => {
        const valA =
          a.normalQuantity * Number(a.card.priceUsd ?? 0) +
          a.foilQuantity * Number(a.card.priceUsdFoil ?? 0);
        const valB =
          b.normalQuantity * Number(b.card.priceUsd ?? 0) +
          b.foilQuantity * Number(b.card.priceUsdFoil ?? 0);
        return valB - valA;
      });
    }
    items = items.slice((page - 1) * pageSize, page * pageSize);
  }

  if (hasDuplicates) {
    items = items.filter(
      (i) => i.normalQuantity + i.foilQuantity > 1
    );
  }

  if (maxQty !== undefined) {
    items = items.filter(
      (i) => i.normalQuantity <= maxQty && i.foilQuantity <= maxQty
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return { items, total, page, totalPages };
}

export async function findCollectionItem(userId: string, cardId: string) {
  return prisma.collectionItem.findUnique({
    where: { userId_cardId: { userId, cardId } },
  });
}

export async function findCollectionItemsByCardIds(
  userId: string,
  cardIds: string[]
): Promise<Map<string, { normalQuantity: number; foilQuantity: number }>> {
  if (cardIds.length === 0) return new Map();
  const items = await prisma.collectionItem.findMany({
    where: { userId, cardId: { in: cardIds } },
    select: { cardId: true, normalQuantity: true, foilQuantity: true },
  });
  return new Map(items.map((i) => [i.cardId, i]));
}

export async function upsertIncrement(
  userId: string,
  cardId: string,
  field: "normalQuantity" | "foilQuantity",
  amount: number
) {
  return prisma.collectionItem.upsert({
    where: { userId_cardId: { userId, cardId } },
    create: {
      userId,
      cardId,
      normalQuantity: field === "normalQuantity" ? amount : 0,
      foilQuantity: field === "foilQuantity" ? amount : 0,
    },
    update: { [field]: { increment: amount } },
  });
}

export async function atomicDecrement(
  userId: string,
  cardId: string,
  field: "normalQuantity" | "foilQuantity",
  amount: number
): Promise<boolean> {
  const result = await prisma.collectionItem.updateMany({
    where: { userId, cardId, [field]: { gte: amount } },
    data: { [field]: { decrement: amount } },
  });
  return result.count > 0;
}

export async function deleteCollectionItem(userId: string, cardId: string) {
  return prisma.collectionItem.deleteMany({
    where: { userId, cardId },
  });
}

export async function updateCollectionItemData(
  userId: string,
  cardId: string,
  data: {
    normalPurchasePrice?: Prisma.Decimal | null;
    foilPurchasePrice?: Prisma.Decimal | null;
    normalQuantity?: number;
    foilQuantity?: number;
    notes?: string | null;
  }
) {
  return prisma.collectionItem.update({
    where: { userId_cardId: { userId, cardId } },
    data,
  });
}

export async function upsertCollectionItemFull(
  userId: string,
  cardId: string,
  data: {
    normalQuantity: number;
    foilQuantity: number;
    normalPurchasePrice?: Prisma.Decimal | null;
    foilPurchasePrice?: Prisma.Decimal | null;
    notes?: string | null;
  }
) {
  return prisma.collectionItem.upsert({
    where: { userId_cardId: { userId, cardId } },
    create: { userId, cardId, ...data },
    update: data,
  });
}

function buildOrderBy(
  sortBy: string
): Prisma.CollectionItemOrderByWithRelationInput | Prisma.CollectionItemOrderByWithRelationInput[] {
  switch (sortBy) {
    case "name":
      return { card: { name: "asc" } };
    case "set":
      return [{ card: { set: { name: "asc" } } }, { card: { collectorNumber: "asc" } }];
    case "marketPrice":
      return [{ card: { priceUsd: { sort: "desc", nulls: "last" } } }, { card: { name: "asc" } }];
    case "recentlyAdded":
    default:
      return { createdAt: "desc" };
  }
}
