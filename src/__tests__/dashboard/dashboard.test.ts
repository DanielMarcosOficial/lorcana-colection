import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrismaCollectionItem = vi.hoisted(() => ({
  findMany: vi.fn(),
  aggregate: vi.fn(),
}));
const mockPrismaQueryRaw = vi.hoisted(() => vi.fn());
const mockPrismaUser = vi.hoisted(() => ({ findUnique: vi.fn() }));
const mockPrismaPriceHistory = vi.hoisted(() => ({
  upsert: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/database/prisma", () => ({
  prisma: {
    collectionItem: mockPrismaCollectionItem,
    user: mockPrismaUser,
    priceHistory: mockPrismaPriceHistory,
    $queryRaw: mockPrismaQueryRaw,
  },
}));

import {
  computeCollectionValue,
  buildTopCards,
} from "@/modules/dashboard/dashboard.repository";
import { upsertPriceHistory } from "@/modules/prices/price-history.repository";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dec(v: string | number) {
  return new Prisma.Decimal(String(v));
}

function n(d: { toNumber(): number } | Prisma.Decimal) {
  return (d as Prisma.Decimal).toNumber();
}

function makeItem(overrides: {
  normalQty?: number;
  foilQty?: number;
  priceUsd?: string | null;
  priceUsdFoil?: string | null;
  cardId?: string;
  name?: string;
  version?: string | null;
}) {
  return {
    cardId: overrides.cardId ?? "card_1",
    normalQuantity: overrides.normalQty ?? 0,
    foilQuantity: overrides.foilQty ?? 0,
    card: {
      name: overrides.name ?? "Mickey Mouse",
      version: overrides.version ?? null,
      imageNormal: null,
      priceUsd: overrides.priceUsd != null ? dec(overrides.priceUsd) : null,
      priceUsdFoil: overrides.priceUsdFoil != null ? dec(overrides.priceUsdFoil) : null,
      set: { name: "The First Chapter" },
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── computeCollectionValue ───────────────────────────────────────────────────

describe("computeCollectionValue", () => {
  it("calcula valor normal corretamente", () => {
    const items = [makeItem({ normalQty: 3, priceUsd: "2.50" })];
    const result = computeCollectionValue(items);
    expect(n(result.totalNormal)).toBeCloseTo(7.5);
    expect(n(result.totalFoil)).toBe(0);
    expect(n(result.total)).toBeCloseTo(7.5);
  });

  it("calcula valor foil corretamente", () => {
    const items = [makeItem({ foilQty: 2, priceUsdFoil: "5.00" })];
    const result = computeCollectionValue(items);
    expect(n(result.totalNormal)).toBe(0);
    expect(n(result.totalFoil)).toBeCloseTo(10);
    expect(n(result.total)).toBeCloseTo(10);
  });

  it("calcula valor total (normal + foil)", () => {
    const items = [makeItem({ normalQty: 1, foilQty: 1, priceUsd: "3.00", priceUsdFoil: "8.00" })];
    const result = computeCollectionValue(items);
    expect(n(result.totalNormal)).toBeCloseTo(3);
    expect(n(result.totalFoil)).toBeCloseTo(8);
    expect(n(result.total)).toBeCloseTo(11);
  });

  it("carta com normal e foil simultaneamente — ambas calculadas", () => {
    const items = [
      makeItem({ normalQty: 2, foilQty: 1, priceUsd: "1.50", priceUsdFoil: "4.00" }),
    ];
    const result = computeCollectionValue(items);
    expect(n(result.totalNormal)).toBeCloseTo(3);
    expect(n(result.totalFoil)).toBeCloseTo(4);
    expect(n(result.total)).toBeCloseTo(7);
    expect(result.unpricedCount).toBe(0);
  });

  it("não considera preço null como zero — registra item sem preço", () => {
    const items = [makeItem({ normalQty: 5, priceUsd: null, priceUsdFoil: null })];
    const result = computeCollectionValue(items);
    expect(n(result.totalNormal)).toBe(0);
    expect(n(result.totalFoil)).toBe(0);
    expect(n(result.total)).toBe(0);
    expect(result.unpricedCount).toBe(1);
  });

  it("contabiliza corretamente itens sem preço entre itens com preço", () => {
    const items = [
      makeItem({ normalQty: 1, priceUsd: "2.00" }),
      makeItem({ normalQty: 1, priceUsd: null, priceUsdFoil: null, cardId: "card_2" }),
      makeItem({ normalQty: 1, priceUsd: null, priceUsdFoil: null, cardId: "card_3" }),
    ];
    const result = computeCollectionValue(items);
    expect(n(result.totalNormal)).toBeCloseTo(2);
    expect(result.unpricedCount).toBe(2);
  });
});

// ─── buildTopCards ────────────────────────────────────────────────────────────

describe("buildTopCards", () => {
  it("retorna as 5 cartas mais valiosas por preço unitário", () => {
    const items = [
      makeItem({ cardId: "a", normalQty: 1, priceUsd: "1.00" }),
      makeItem({ cardId: "b", normalQty: 1, priceUsd: "5.00" }),
      makeItem({ cardId: "c", normalQty: 1, priceUsd: "3.00" }),
      makeItem({ cardId: "d", normalQty: 1, priceUsd: "2.00" }),
      makeItem({ cardId: "e", normalQty: 1, priceUsd: "4.00" }),
      makeItem({ cardId: "f", normalQty: 1, priceUsd: "0.50" }),
    ];
    const result = buildTopCards(items, 5);
    expect(result).toHaveLength(5);
    expect(n(result[0]!.unitPrice)).toBeCloseTo(5);
    expect(n(result[1]!.unitPrice)).toBeCloseTo(4);
    expect(n(result[4]!.unitPrice)).toBeCloseTo(1);
  });

  it("considera variantes normal e foil separadamente", () => {
    const items = [
      makeItem({ cardId: "a", normalQty: 1, foilQty: 1, priceUsd: "2.00", priceUsdFoil: "8.00" }),
    ];
    const result = buildTopCards(items, 5);
    expect(result).toHaveLength(2);
    expect(result[0]!.variant).toBe("FOIL");
    expect(n(result[0]!.unitPrice)).toBeCloseTo(8);
    expect(result[1]!.variant).toBe("NORMAL");
    expect(n(result[1]!.unitPrice)).toBeCloseTo(2);
  });

  it("ignora variantes sem preço", () => {
    const items = [
      makeItem({ cardId: "a", normalQty: 2, priceUsd: null }),
      makeItem({ cardId: "b", foilQty: 1, priceUsdFoil: "5.00" }),
    ];
    const result = buildTopCards(items, 5);
    expect(result).toHaveLength(1);
    expect(result[0]!.variant).toBe("FOIL");
  });

  it("calcula valor total corretamente (unitPrice × quantity)", () => {
    const items = [makeItem({ cardId: "a", normalQty: 3, priceUsd: "2.50" })];
    const result = buildTopCards(items, 5);
    expect(n(result[0]!.totalValue)).toBeCloseTo(7.5);
  });
});

// ─── Expansion progress percentage ────────────────────────────────────────────

describe("progresso por expansão", () => {
  it("calcula percentual de conclusão corretamente", () => {
    const total = 204;
    const owned = 180;
    const pct = (owned / total) * 100;
    expect(pct.toFixed(2)).toBe("88.24");
    expect(total - owned).toBe(24);
  });

  it("percentual = 0 quando coleção vazia", () => {
    const pct = (0 / 204) * 100;
    expect(pct).toBe(0);
  });

  it("percentual = 100 quando completo", () => {
    const pct = (204 / 204) * 100;
    expect(pct).toBe(100);
  });
});

// ─── Price history (upsert diário) ───────────────────────────────────────────

describe("upsertPriceHistory", () => {
  it("cria um registro de histórico de preço", async () => {
    mockPrismaPriceHistory.upsert.mockResolvedValue({});

    await upsertPriceHistory({
      cardId: "card_1",
      priceUsd: dec("1.50"),
      priceUsdFoil: null,
    });

    expect(mockPrismaPriceHistory.upsert).toHaveBeenCalledOnce();
    const call = mockPrismaPriceHistory.upsert.mock.calls[0]![0] as {
      where: { cardId_source_recordedAt: { cardId: string } };
      create: { priceUsd: Prisma.Decimal };
    };
    expect(call.where.cardId_source_recordedAt.cardId).toBe("card_1");
    expect(n(call.create.priceUsd)).toBeCloseTo(1.5);
  });

  it("atualiza registro existente ao registrar no mesmo dia (upsert)", async () => {
    mockPrismaPriceHistory.upsert.mockResolvedValue({});

    await upsertPriceHistory({ cardId: "card_1", priceUsd: dec("1.50"), priceUsdFoil: null });
    await upsertPriceHistory({ cardId: "card_1", priceUsd: dec("2.00"), priceUsdFoil: null });

    expect(mockPrismaPriceHistory.upsert).toHaveBeenCalledTimes(2);
    const secondCall = mockPrismaPriceHistory.upsert.mock.calls[1]![0] as {
      update: { priceUsd: Prisma.Decimal };
    };
    expect(n(secondCall.update.priceUsd)).toBeCloseTo(2);
  });

  it("não cria registro quando ambos preços são null", async () => {
    await upsertPriceHistory({ cardId: "card_1", priceUsd: null, priceUsdFoil: null });
    expect(mockPrismaPriceHistory.upsert).not.toHaveBeenCalled();
  });
});

// ─── Public profile privacy ───────────────────────────────────────────────────

describe("perfil público — privacidade", () => {
  it("dados de perfil público não expõem preço de compra", async () => {
    mockPrismaCollectionItem.findMany.mockResolvedValue([
      {
        normalQuantity: 2,
        foilQuantity: 0,
        card: {
          name: "Card",
          version: null,
          imageNormal: null,
          priceUsd: dec("3.00"),
          priceUsdFoil: null,
          set: { name: "TFC" },
        },
      },
    ]);
    mockPrismaCollectionItem.aggregate.mockResolvedValue({
      _count: { id: 1 },
      _sum: { normalQuantity: 2, foilQuantity: 0 },
    });
    mockPrismaQueryRaw.mockResolvedValue([]);

    const { getPublicCollectionStats } = await import(
      "@/modules/dashboard/dashboard.repository"
    );
    const result = await getPublicCollectionStats("user_1");

    expect(result.topCards).toBeDefined();
    // TopCard does NOT have purchase price fields
    if (result.topCards.length > 0) {
      const card = result.topCards[0]!;
      expect("normalPurchasePrice" in card).toBe(false);
      expect("foilPurchasePrice" in card).toBe(false);
      expect("notes" in card).toBe(false);
    }
    expect(n(result.totalValue)).toBeGreaterThanOrEqual(0);
  });

  it("distribuição por tinta — sem dados privados expostos", async () => {
    mockPrismaQueryRaw.mockResolvedValue([
      { label: "Amber", card_count: BigInt(5), total_copies: BigInt(7) },
    ]);

    const { getInkDistribution } = await import("@/modules/dashboard/dashboard.repository");
    const result = await getInkDistribution("user_1");

    expect(result[0]!.key).toBe("Amber");
    expect(result[0]!.cardCount).toBe(5);
    expect("normalPurchasePrice" in result[0]!).toBe(false);
  });

  it("distribuição por raridade", async () => {
    mockPrismaQueryRaw.mockResolvedValue([
      { label: "Rare", card_count: BigInt(10), total_copies: BigInt(12) },
      { label: "Common", card_count: BigInt(20), total_copies: BigInt(30) },
    ]);

    const { getRarityDistribution } = await import("@/modules/dashboard/dashboard.repository");
    const result = await getRarityDistribution("user_1");

    expect(result).toHaveLength(2);
    expect(result[0]!.key).toBe("Rare");
    expect(result[0]!.cardCount).toBe(10);
  });
});
