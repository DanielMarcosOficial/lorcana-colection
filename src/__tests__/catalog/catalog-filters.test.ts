import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/database/prisma", () => ({
  prisma: {
    card: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/database/prisma";
import { searchCards, ALLOWED_SORT } from "@/modules/catalog/card.repository";

const mockCardRow = {
  id: "card_001",
  name: "Elsa",
  version: "Snow Queen",
  fullName: "Elsa - Snow Queen",
  collectorNumber: "42",
  rarity: "Rare",
  ink: "Sapphire",
  cost: 3,
  inkwell: false,
  type: ["Character"],
  classifications: ["Storyborn"],
  strength: 2,
  willpower: 3,
  lore: 2,
  priceUsd: new Prisma.Decimal("0.50"),
  priceUsdFoil: null,
  set: { code: "1", name: "The First Chapter", releasedAt: new Date() },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.card.count).mockResolvedValue(1);
  vi.mocked(prisma.card.findMany).mockResolvedValue([mockCardRow] as never);
});

describe("searchCards — filtros", () => {
  it("busca sem filtros retorna todos os cards", async () => {
    vi.mocked(prisma.card.count).mockResolvedValue(10);
    vi.mocked(prisma.card.findMany).mockResolvedValue([mockCardRow] as never);
    const result = await searchCards({});
    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
    expect(result.total).toBe(10);
    expect(result.cards).toHaveLength(1);
  });

  it("filtra por nome com OR conditions", async () => {
    await searchCards({ q: "elsa" });
    const call = vi.mocked(prisma.card.findMany).mock.calls[0]?.[0];
    expect(call?.where?.OR).toBeDefined();
    expect(call?.where?.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: { contains: "elsa" } }),
        expect.objectContaining({ fullName: { contains: "elsa" } }),
      ])
    );
  });

  it("filtra por tinta (ink)", async () => {
    await searchCards({ ink: "Sapphire" });
    const call = vi.mocked(prisma.card.findMany).mock.calls[0]?.[0];
    expect(call?.where?.ink).toBe("Sapphire");
  });

  it("filtra por raridade", async () => {
    await searchCards({ rarity: "Rare" });
    const call = vi.mocked(prisma.card.findMany).mock.calls[0]?.[0];
    expect(call?.where?.rarity).toBe("Rare");
  });

  it("filtra por expansão (setCode)", async () => {
    await searchCards({ setCode: "1" });
    const call = vi.mocked(prisma.card.findMany).mock.calls[0]?.[0];
    expect(call?.where?.set).toEqual({ code: "1" });
  });

  it("filtra por tipo com array_contains", async () => {
    await searchCards({ type: "Character" });
    const call = vi.mocked(prisma.card.findMany).mock.calls[0]?.[0];
    expect(call?.where?.type).toEqual({ array_contains: "Character" });
  });

  it("filtra hasPriceUsd=true", async () => {
    await searchCards({ hasPriceUsd: true });
    const call = vi.mocked(prisma.card.findMany).mock.calls[0]?.[0];
    expect(call?.where?.priceUsd).toEqual({ not: null });
  });

  it("filtra hasPriceUsdFoil=true", async () => {
    await searchCards({ hasPriceUsdFoil: true });
    const call = vi.mocked(prisma.card.findMany).mock.calls[0]?.[0];
    expect(call?.where?.priceUsdFoil).toEqual({ not: null });
  });
});

describe("searchCards — paginação", () => {
  it("retorna página 1 com skip=0 e take=24", async () => {
    await searchCards({ page: 1, pageSize: 24 });
    const call = vi.mocked(prisma.card.findMany).mock.calls[0]?.[0];
    expect(call?.skip).toBe(0);
    expect(call?.take).toBe(24);
  });

  it("retorna página 2 com skip=24", async () => {
    await searchCards({ page: 2, pageSize: 24 });
    const call = vi.mocked(prisma.card.findMany).mock.calls[0]?.[0];
    expect(call?.skip).toBe(24);
    expect(call?.take).toBe(24);
  });

  it("calcula totalPages corretamente", async () => {
    vi.mocked(prisma.card.count).mockResolvedValue(50);
    const result = await searchCards({ pageSize: 24 });
    expect(result.totalPages).toBe(3);
  });

  it("retorna meta de paginação", async () => {
    vi.mocked(prisma.card.count).mockResolvedValue(100);
    const result = await searchCards({ page: 3, pageSize: 24 });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(24);
    expect(result.totalPages).toBe(5);
  });
});

describe("searchCards — ordenação", () => {
  it("ordena por nome por padrão", async () => {
    await searchCards({});
    const call = vi.mocked(prisma.card.findMany).mock.calls[0]?.[0];
    expect(call?.orderBy).toEqual(expect.arrayContaining([{ name: "asc" }]));
  });

  it("ordena por collectorNumber", async () => {
    await searchCards({ sortBy: "collectorNumber" });
    const call = vi.mocked(prisma.card.findMany).mock.calls[0]?.[0];
    expect(call?.orderBy).toEqual(
      expect.arrayContaining([{ collectorNumber: "asc" }])
    );
  });

  it("ordena por priceAsc com nulls last", async () => {
    await searchCards({ sortBy: "priceAsc" });
    const call = vi.mocked(prisma.card.findMany).mock.calls[0]?.[0];
    const orderBy = call?.orderBy as unknown[];
    expect(orderBy).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ priceUsd: { sort: "asc", nulls: "last" } }),
      ])
    );
  });

  it("ordena por priceDesc com nulls last", async () => {
    await searchCards({ sortBy: "priceDesc" });
    const call = vi.mocked(prisma.card.findMany).mock.calls[0]?.[0];
    const orderBy = call?.orderBy as unknown[];
    expect(orderBy).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ priceUsd: { sort: "desc", nulls: "last" } }),
      ])
    );
  });

  it("todos os valores de ordenação são válidos", async () => {
    for (const sort of ALLOWED_SORT) {
      vi.mocked(prisma.card.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.card.count).mockResolvedValue(0);
      await expect(searchCards({ sortBy: sort })).resolves.not.toThrow();
    }
  });

  it("rejeita ordenação inválida", async () => {
    await expect(
      searchCards({ sortBy: "DROP TABLE cards; --" })
    ).rejects.toThrow("Ordenação inválida");
  });

  it("rejeita ordenação vazia desconhecida", async () => {
    await expect(searchCards({ sortBy: "invalid_field" })).rejects.toThrow(
      "Ordenação inválida"
    );
  });
});
