import { Prisma } from "@prisma/client";
import {
  atomicDecrement,
  deleteCollectionItem,
  findCollectionItem,
  updateCollectionItemData,
  upsertCollectionItemFull,
  upsertIncrement,
} from "./collection.repository";

export type CardType = "NORMAL" | "FOIL";

export interface AdjustResult {
  normalQuantity: number;
  foilQuantity: number;
  deleted: boolean;
}

export async function adjustQuantity(
  userId: string,
  cardId: string,
  cardType: CardType,
  delta: number
): Promise<AdjustResult> {
  if (delta === 0) throw new Error("Delta não pode ser zero");

  const field: "normalQuantity" | "foilQuantity" =
    cardType === "NORMAL" ? "normalQuantity" : "foilQuantity";

  if (delta > 0) {
    const item = await upsertIncrement(userId, cardId, field, delta);
    return { normalQuantity: item.normalQuantity, foilQuantity: item.foilQuantity, deleted: false };
  }

  const succeeded = await atomicDecrement(userId, cardId, field, Math.abs(delta));
  if (!succeeded) throw new Error("Quantidade insuficiente ou carta não está na coleção");

  const item = await findCollectionItem(userId, cardId);
  if (!item) return { normalQuantity: 0, foilQuantity: 0, deleted: true };

  if (item.normalQuantity === 0 && item.foilQuantity === 0) {
    await deleteCollectionItem(userId, cardId);
    return { normalQuantity: 0, foilQuantity: 0, deleted: true };
  }

  return { normalQuantity: item.normalQuantity, foilQuantity: item.foilQuantity, deleted: false };
}

export async function setQuantity(
  userId: string,
  cardId: string,
  cardType: CardType,
  quantity: number
): Promise<AdjustResult> {
  if (quantity < 0) throw new Error("Quantidade não pode ser negativa");

  const field: "normalQuantity" | "foilQuantity" =
    cardType === "NORMAL" ? "normalQuantity" : "foilQuantity";

  const existing = await findCollectionItem(userId, cardId);

  if (quantity === 0) {
    if (!existing) return { normalQuantity: 0, foilQuantity: 0, deleted: false };
    const other = cardType === "NORMAL" ? existing.foilQuantity : existing.normalQuantity;
    if (other === 0) {
      await deleteCollectionItem(userId, cardId);
      return { normalQuantity: 0, foilQuantity: 0, deleted: true };
    }
    const updated = await updateCollectionItemData(userId, cardId, { [field]: 0 });
    return { normalQuantity: updated.normalQuantity, foilQuantity: updated.foilQuantity, deleted: false };
  }

  if (!existing) {
    const item = await upsertIncrement(userId, cardId, field, quantity);
    return { normalQuantity: item.normalQuantity, foilQuantity: item.foilQuantity, deleted: false };
  }

  const updated = await updateCollectionItemData(userId, cardId, { [field]: quantity });
  return { normalQuantity: updated.normalQuantity, foilQuantity: updated.foilQuantity, deleted: false };
}

export interface UpdateItemInput {
  normalQuantity?: number;
  foilQuantity?: number;
  normalPurchasePrice?: string | null;
  foilPurchasePrice?: string | null;
  notes?: string | null;
}

const toDecimal = (v: string | null | undefined): Prisma.Decimal | null => {
  if (v == null || v === "") return null;
  return new Prisma.Decimal(v);
};

export async function updateCollectionItem(
  userId: string,
  cardId: string,
  input: UpdateItemInput
): Promise<AdjustResult> {
  const { normalQuantity, foilQuantity, normalPurchasePrice, foilPurchasePrice, notes } = input;

  if (normalQuantity !== undefined && normalQuantity < 0)
    throw new Error("Quantidade normal não pode ser negativa");
  if (foilQuantity !== undefined && foilQuantity < 0)
    throw new Error("Quantidade foil não pode ser negativa");

  const existing = await findCollectionItem(userId, cardId);
  const newNormal = normalQuantity ?? existing?.normalQuantity ?? 0;
  const newFoil = foilQuantity ?? existing?.foilQuantity ?? 0;

  if (newNormal === 0 && newFoil === 0) {
    if (existing) await deleteCollectionItem(userId, cardId);
    return { normalQuantity: 0, foilQuantity: 0, deleted: true };
  }

  const upserted = await upsertCollectionItemFull(userId, cardId, {
    normalQuantity: newNormal,
    foilQuantity: newFoil,
    normalPurchasePrice:
      normalPurchasePrice !== undefined
        ? toDecimal(normalPurchasePrice)
        : existing?.normalPurchasePrice ?? null,
    foilPurchasePrice:
      foilPurchasePrice !== undefined
        ? toDecimal(foilPurchasePrice)
        : existing?.foilPurchasePrice ?? null,
    notes: notes !== undefined ? (notes ?? null) : (existing?.notes ?? null),
  });

  return {
    normalQuantity: upserted.normalQuantity,
    foilQuantity: upserted.foilQuantity,
    deleted: false,
  };
}

export async function removeFromCollection(userId: string, cardId: string): Promise<void> {
  await deleteCollectionItem(userId, cardId);
}
