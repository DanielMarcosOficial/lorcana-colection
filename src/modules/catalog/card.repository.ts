import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import type { ExternalCard } from "@/lib/catalog/providers/types";

export const ALLOWED_SORT = [
  "name",
  "collectorNumber",
  "releasedAt",
  "priceAsc",
  "priceDesc",
  "rarity",
] as const;

export type AllowedSort = (typeof ALLOWED_SORT)[number];

export type OwnershipFilter =
  | "all"
  | "owned"
  | "not_owned"
  | "owned_normal"
  | "owned_foil"
  | "owned_both";

export interface SearchCardsParams {
  q?: string;
  setCode?: string;
  ink?: string;
  rarity?: string;
  type?: string;
  cost?: number;
  hasPriceUsd?: boolean;
  hasPriceUsdFoil?: boolean;
  priceMin?: number;
  priceMax?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  ownershipFilter?: OwnershipFilter;
  currentUserId?: string;
}

function buildOrderBy(
  sortBy: AllowedSort
): Prisma.CardOrderByWithRelationInput | Prisma.CardOrderByWithRelationInput[] {
  switch (sortBy) {
    case "name":
      return { name: "asc" };
    case "collectorNumber":
      return { collectorNumber: "asc" };
    case "releasedAt":
      return { set: { releasedAt: "desc" } };
    case "priceAsc":
      return [
        { priceUsd: { sort: "asc", nulls: "last" } },
        { name: "asc" },
      ];
    case "priceDesc":
      return [
        { priceUsd: { sort: "desc", nulls: "last" } },
        { name: "asc" },
      ];
    case "rarity":
      return [{ rarity: "asc" }, { name: "asc" }];
    default:
      return { name: "asc" };
  }
}

export async function searchCards(params: SearchCardsParams) {
  const {
    q,
    setCode,
    ink,
    rarity,
    type,
    cost,
    hasPriceUsd,
    hasPriceUsdFoil,
    priceMin,
    priceMax,
    page = 1,
    pageSize = 24,
    sortBy = "name",
    ownershipFilter,
    currentUserId,
  } = params;

  if (!ALLOWED_SORT.includes(sortBy as AllowedSort)) {
    throw new Error(
      `Ordenação inválida: "${sortBy}". Valores aceitos: ${ALLOWED_SORT.join(", ")}`
    );
  }

  const where: Prisma.CardWhereInput = {};

  if (q) {
    const term = q.trim();
    where.OR = [
      { name: { contains: term } },
      { version: { contains: term } },
      { fullName: { contains: term } },
      { collectorNumber: { contains: term } },
      { set: { name: { contains: term } } },
    ];
  }

  if (setCode) {
    where.set = { code: setCode };
  }

  if (ink) {
    where.ink = ink;
  }

  if (rarity) {
    where.rarity = rarity;
  }

  if (type) {
    where.type = { array_contains: type };
  }

  if (cost !== undefined) {
    where.cost = cost;
  }

  if (hasPriceUsd === true) {
    where.priceUsd = { not: null };
  }

  if (hasPriceUsdFoil === true) {
    where.priceUsdFoil = { not: null };
  }

  if (priceMin !== undefined || priceMax !== undefined) {
    where.priceUsd = {
      ...(where.priceUsd as object),
      ...(priceMin !== undefined ? { gte: new Prisma.Decimal(priceMin) } : {}),
      ...(priceMax !== undefined ? { lte: new Prisma.Decimal(priceMax) } : {}),
    };
  }

  if (ownershipFilter && ownershipFilter !== "all" && currentUserId) {
    switch (ownershipFilter) {
      case "owned":
        where.collectionItems = { some: { userId: currentUserId } };
        break;
      case "not_owned":
        where.collectionItems = { none: { userId: currentUserId } };
        break;
      case "owned_normal":
        where.collectionItems = {
          some: { userId: currentUserId, normalQuantity: { gt: 0 } },
        };
        break;
      case "owned_foil":
        where.collectionItems = {
          some: { userId: currentUserId, foilQuantity: { gt: 0 } },
        };
        break;
      case "owned_both":
        where.collectionItems = {
          some: {
            userId: currentUserId,
            normalQuantity: { gt: 0 },
            foilQuantity: { gt: 0 },
          },
        };
        break;
    }
  }

  const skip = (page - 1) * pageSize;
  const orderBy = buildOrderBy(sortBy as AllowedSort);

  const [total, cards] = await Promise.all([
    prisma.card.count({ where }),
    prisma.card.findMany({
      where,
      include: { set: { select: { code: true, name: true, releasedAt: true } } },
      orderBy: Array.isArray(orderBy) ? orderBy : [orderBy],
      skip,
      take: pageSize,
    }),
  ]);

  return {
    cards,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function findCardById(id: string) {
  return prisma.card.findUnique({
    where: { id },
    include: { set: true },
  });
}

export async function upsertCard(
  ext: ExternalCard,
  setId: string
): Promise<{ created: boolean; id: string }> {
  const now = new Date();
  const hasPrice = ext.priceUsd !== null || ext.priceUsdFoil !== null;

  const data: Prisma.CardUncheckedCreateInput = {
    externalId: ext.id,
    setId,
    tcgplayerId: ext.tcgplayerId ?? null,
    name: ext.name,
    version: ext.version ?? null,
    fullName: ext.fullName,
    collectorNumber: ext.collectorNumber,
    rarity: ext.rarity,
    ink: ext.ink ?? null,
    cost: ext.cost ?? null,
    inkwell: ext.inkwell,
    type: ext.type as Prisma.InputJsonValue,
    classifications: ext.classifications as Prisma.InputJsonValue,
    strength: ext.strength ?? null,
    willpower: ext.willpower ?? null,
    lore: ext.lore ?? null,
    moveCost: ext.moveCost ?? null,
    rulesText: ext.rulesText ?? null,
    flavorText: ext.flavorText ?? null,
    illustrators: ext.illustrators as Prisma.InputJsonValue,
    imageSmall: ext.imageSmall ?? null,
    imageNormal: ext.imageNormal ?? null,
    imageLarge: ext.imageLarge ?? null,
    priceUsd: ext.priceUsd ? new Prisma.Decimal(ext.priceUsd) : null,
    priceUsdFoil: ext.priceUsdFoil
      ? new Prisma.Decimal(ext.priceUsdFoil)
      : null,
    priceUpdatedAt: hasPrice ? now : null,
    lastSyncedAt: now,
  };

  const existing = await prisma.card.findUnique({
    where: { externalId: ext.id },
    select: { id: true },
  });

  if (existing) {
    await prisma.card.update({
      where: { id: existing.id },
      data: { ...data, updatedAt: now },
    });
    return { created: false, id: existing.id };
  }

  const created = await prisma.card.create({ data });
  return { created: true, id: created.id };
}

export async function countCardsBySetId(setId: string): Promise<number> {
  return prisma.card.count({ where: { setId } });
}
