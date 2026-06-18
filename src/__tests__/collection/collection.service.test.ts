import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindCollectionItem = vi.hoisted(() => vi.fn());
const mockUpsertIncrement = vi.hoisted(() => vi.fn());
const mockAtomicDecrement = vi.hoisted(() => vi.fn());
const mockDeleteCollectionItem = vi.hoisted(() => vi.fn());
const mockUpdateCollectionItemData = vi.hoisted(() => vi.fn());
const mockUpsertCollectionItemFull = vi.hoisted(() => vi.fn());

vi.mock("@/modules/collection/collection.repository", () => ({
  findCollectionItem: mockFindCollectionItem,
  upsertIncrement: mockUpsertIncrement,
  atomicDecrement: mockAtomicDecrement,
  deleteCollectionItem: mockDeleteCollectionItem,
  updateCollectionItemData: mockUpdateCollectionItemData,
  upsertCollectionItemFull: mockUpsertCollectionItemFull,
}));

import {
  adjustQuantity,
  setQuantity,
  updateCollectionItem,
  removeFromCollection,
} from "@/modules/collection/collection.service";

const baseItem = {
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
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("adjustQuantity", () => {
  it("cria CollectionItem ao adicionar carta normal pela primeira vez", async () => {
    mockUpsertIncrement.mockResolvedValue({ ...baseItem, normalQuantity: 1, foilQuantity: 0 });

    const result = await adjustQuantity("user_1", "card_1", "NORMAL", 1);

    expect(mockUpsertIncrement).toHaveBeenCalledWith("user_1", "card_1", "normalQuantity", 1);
    expect(result.normalQuantity).toBe(1);
    expect(result.foilQuantity).toBe(0);
    expect(result.deleted).toBe(false);
  });

  it("incrementa quantidade normal", async () => {
    mockUpsertIncrement.mockResolvedValue({ ...baseItem, normalQuantity: 3 });

    const result = await adjustQuantity("user_1", "card_1", "NORMAL", 1);

    expect(result.normalQuantity).toBe(3);
    expect(result.deleted).toBe(false);
  });

  it("incrementa quantidade foil", async () => {
    mockUpsertIncrement.mockResolvedValue({ ...baseItem, foilQuantity: 2 });

    const result = await adjustQuantity("user_1", "card_1", "FOIL", 1);

    expect(mockUpsertIncrement).toHaveBeenCalledWith("user_1", "card_1", "foilQuantity", 1);
    expect(result.foilQuantity).toBe(2);
    expect(result.deleted).toBe(false);
  });

  it("decrementa quantidade com sucesso", async () => {
    mockAtomicDecrement.mockResolvedValue(true);
    mockFindCollectionItem.mockResolvedValue({ ...baseItem, normalQuantity: 1, foilQuantity: 1 });

    const result = await adjustQuantity("user_1", "card_1", "NORMAL", -1);

    expect(mockAtomicDecrement).toHaveBeenCalledWith("user_1", "card_1", "normalQuantity", 1);
    expect(result.normalQuantity).toBe(1);
    expect(result.deleted).toBe(false);
  });

  it("lança erro ao tentar decrementar além da quantidade disponível", async () => {
    mockAtomicDecrement.mockResolvedValue(false);

    await expect(
      adjustQuantity("user_1", "card_1", "NORMAL", -1)
    ).rejects.toThrow("Quantidade insuficiente");
  });

  it("lança erro se delta for zero", async () => {
    await expect(
      adjustQuantity("user_1", "card_1", "NORMAL", 0)
    ).rejects.toThrow("Delta não pode ser zero");
  });

  it("remove item automaticamente quando ambas quantidades chegam a zero", async () => {
    mockAtomicDecrement.mockResolvedValue(true);
    mockFindCollectionItem.mockResolvedValue({ ...baseItem, normalQuantity: 0, foilQuantity: 0 });

    const result = await adjustQuantity("user_1", "card_1", "NORMAL", -2);

    expect(mockDeleteCollectionItem).toHaveBeenCalledWith("user_1", "card_1");
    expect(result.deleted).toBe(true);
    expect(result.normalQuantity).toBe(0);
    expect(result.foilQuantity).toBe(0);
  });

  it("operação atômica rejeita quando outra operação já decrementou (count=0)", async () => {
    mockAtomicDecrement.mockResolvedValue(false);

    await expect(
      adjustQuantity("user_1", "card_1", "FOIL", -1)
    ).rejects.toThrow();
    expect(mockDeleteCollectionItem).not.toHaveBeenCalled();
  });
});

describe("setQuantity", () => {
  it("lança erro para quantidade negativa", async () => {
    await expect(
      setQuantity("user_1", "card_1", "NORMAL", -1)
    ).rejects.toThrow("não pode ser negativa");
  });

  it("define quantidade de um item existente", async () => {
    mockFindCollectionItem.mockResolvedValue(baseItem);
    mockUpdateCollectionItemData.mockResolvedValue({ ...baseItem, normalQuantity: 5 });

    const result = await setQuantity("user_1", "card_1", "NORMAL", 5);
    expect(result.normalQuantity).toBe(5);
    expect(result.deleted).toBe(false);
  });

  it("remove item quando ambas quantidades são zero", async () => {
    mockFindCollectionItem.mockResolvedValue({ ...baseItem, normalQuantity: 1, foilQuantity: 0 });

    const result = await setQuantity("user_1", "card_1", "NORMAL", 0);

    expect(mockDeleteCollectionItem).toHaveBeenCalled();
    expect(result.deleted).toBe(true);
  });

  it("mantém item quando apenas uma quantidade chega a zero mas a outra é positiva", async () => {
    mockFindCollectionItem.mockResolvedValue({ ...baseItem, normalQuantity: 2, foilQuantity: 3 });
    mockUpdateCollectionItemData.mockResolvedValue({ ...baseItem, normalQuantity: 0, foilQuantity: 3 });

    const result = await setQuantity("user_1", "card_1", "NORMAL", 0);

    expect(mockDeleteCollectionItem).not.toHaveBeenCalled();
    expect(result.deleted).toBe(false);
    expect(result.foilQuantity).toBe(3);
  });
});

describe("updateCollectionItem", () => {
  it("define preço de compra normal e foil", async () => {
    mockFindCollectionItem.mockResolvedValue(baseItem);
    mockUpsertCollectionItemFull.mockResolvedValue({
      ...baseItem,
      normalPurchasePrice: "1.50",
      foilPurchasePrice: "3.00",
    });

    const result = await updateCollectionItem("user_1", "card_1", {
      normalPurchasePrice: "1.50",
      foilPurchasePrice: "3.00",
    });

    expect(mockUpsertCollectionItemFull).toHaveBeenCalledWith(
      "user_1",
      "card_1",
      expect.objectContaining({ normalQuantity: 2, foilQuantity: 1 })
    );
    expect(result.deleted).toBe(false);
  });

  it("lança erro para quantidade normal negativa", async () => {
    await expect(
      updateCollectionItem("user_1", "card_1", { normalQuantity: -1 })
    ).rejects.toThrow("não pode ser negativa");
  });

  it("lança erro para quantidade foil negativa", async () => {
    await expect(
      updateCollectionItem("user_1", "card_1", { foilQuantity: -1 })
    ).rejects.toThrow("não pode ser negativa");
  });

  it("remove item quando ambas quantidades são definidas como zero", async () => {
    mockFindCollectionItem.mockResolvedValue(baseItem);

    const result = await updateCollectionItem("user_1", "card_1", {
      normalQuantity: 0,
      foilQuantity: 0,
    });

    expect(mockDeleteCollectionItem).toHaveBeenCalledWith("user_1", "card_1");
    expect(result.deleted).toBe(true);
  });
});

describe("removeFromCollection", () => {
  it("somente o dono pode remover — userId é passado na query", async () => {
    mockDeleteCollectionItem.mockResolvedValue({ count: 1 });

    await removeFromCollection("user_1", "card_1");

    expect(mockDeleteCollectionItem).toHaveBeenCalledWith("user_1", "card_1");
    expect(mockDeleteCollectionItem).not.toHaveBeenCalledWith("user_2", "card_1");
  });
});
