import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrismaCollectionItem = vi.hoisted(() => ({
  aggregate: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
}));

vi.mock("@/lib/database/prisma", () => ({
  prisma: {
    collectionItem: mockPrismaCollectionItem,
  },
}));

import {
  getCollectionStats,
  searchUserCollection,
} from "@/modules/collection/collection.repository";

const makeItem = (overrides = {}) => ({
  id: "ci_1",
  userId: "user_1",
  cardId: "card_1",
  normalQuantity: 2,
  foilQuantity: 1,
  normalPurchasePrice: null,
  foilPurchasePrice: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  card: {
    id: "card_1",
    name: "Mickey Mouse",
    version: "Brave Little Tailor",
    fullName: "Mickey Mouse - Brave Little Tailor",
    rarity: "Rare",
    ink: "Amber",
    imageNormal: null,
    priceUsd: "1.50",
    priceUsdFoil: null,
    set: { code: "TFC", name: "The First Chapter" },
    setId: "set_1",
    ...overrides,
  },
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCollectionStats", () => {
  it("retorna totalizadores corretos da coleção", async () => {
    mockPrismaCollectionItem.aggregate.mockResolvedValue({
      _count: { id: 5 },
      _sum: { normalQuantity: 10, foilQuantity: 3 },
    });
    mockPrismaCollectionItem.findMany.mockResolvedValue([
      { card: { setId: "set_1" } },
      { card: { setId: "set_1" } },
      { card: { setId: "set_2" } },
      { card: { setId: "set_2" } },
      { card: { setId: "set_3" } },
    ]);

    const stats = await getCollectionStats("user_1");

    expect(stats.distinctCards).toBe(5);
    expect(stats.totalNormal).toBe(10);
    expect(stats.totalFoil).toBe(3);
    expect(stats.totalCopies).toBe(13);
    expect(stats.setsStarted).toBe(3);
  });

  it("retorna zeros quando a coleção está vazia", async () => {
    mockPrismaCollectionItem.aggregate.mockResolvedValue({
      _count: { id: 0 },
      _sum: { normalQuantity: null, foilQuantity: null },
    });
    mockPrismaCollectionItem.findMany.mockResolvedValue([]);

    const stats = await getCollectionStats("user_1");

    expect(stats.distinctCards).toBe(0);
    expect(stats.totalNormal).toBe(0);
    expect(stats.totalFoil).toBe(0);
    expect(stats.totalCopies).toBe(0);
    expect(stats.setsStarted).toBe(0);
  });
});

describe("searchUserCollection — filtros", () => {
  beforeEach(() => {
    mockPrismaCollectionItem.count.mockResolvedValue(1);
    mockPrismaCollectionItem.findMany.mockResolvedValue([makeItem()]);
  });

  it("filtra itens que o usuário possui (owned filter)", async () => {
    const result = await searchUserCollection("user_1", {});

    expect(mockPrismaCollectionItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user_1" }),
      })
    );
    expect(result.items).toHaveLength(1);
  });

  it("filtra por nome da carta", async () => {
    await searchUserCollection("user_1", { q: "Mickey" });

    expect(mockPrismaCollectionItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          card: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: "Mickey" }) }),
            ]),
          }),
        }),
      })
    );
  });

  it("filtra por expansão", async () => {
    await searchUserCollection("user_1", { setCode: "TFC" });

    expect(mockPrismaCollectionItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          card: expect.objectContaining({ set: { code: "TFC" } }),
        }),
      })
    );
  });

  it("filtra cartas com quantidade normal > 0", async () => {
    await searchUserCollection("user_1", { hasNormal: true });

    expect(mockPrismaCollectionItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ normalQuantity: { gt: 0 } }),
      })
    );
  });

  it("filtra cartas com quantidade foil > 0", async () => {
    await searchUserCollection("user_1", { hasFoil: true });

    expect(mockPrismaCollectionItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ foilQuantity: { gt: 0 } }),
      })
    );
  });

  it("retorna paginação correta", async () => {
    mockPrismaCollectionItem.count.mockResolvedValue(50);
    mockPrismaCollectionItem.findMany.mockResolvedValue(
      Array.from({ length: 24 }, (_, i) => makeItem({ id: `card_${i}` }))
    );

    const result = await searchUserCollection("user_1", { page: 2, pageSize: 24 });

    expect(result.page).toBe(2);
    expect(result.total).toBe(50);
    expect(result.totalPages).toBe(3);
  });
});
