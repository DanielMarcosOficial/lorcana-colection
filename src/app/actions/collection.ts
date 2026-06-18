"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/auth";
import {
  adjustQuantity,
  removeFromCollection,
  updateCollectionItem,
} from "@/modules/collection/collection.service";

export interface CollectionActionResult {
  success: boolean;
  error?: string;
  normalQuantity?: number;
  foilQuantity?: number;
  deleted?: boolean;
}

const cardTypeSchema = z.enum(["NORMAL", "FOIL"]);

export async function adjustQuantityAction(
  cardId: string,
  cardType: string,
  delta: number
): Promise<CollectionActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const type = cardTypeSchema.safeParse(cardType);
  if (!type.success) return { success: false, error: "Tipo inválido" };
  if (!Number.isInteger(delta) || delta === 0)
    return { success: false, error: "Delta inválido" };

  try {
    const result = await adjustQuantity(user.id, cardId, type.data, delta);
    return {
      success: true,
      normalQuantity: result.normalQuantity,
      foilQuantity: result.foilQuantity,
      deleted: result.deleted,
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro" };
  }
}

const updateItemSchema = z.object({
  normalQuantity: z.number().int().min(0).optional(),
  foilQuantity: z.number().int().min(0).optional(),
  normalPurchasePrice: z.string().nullable().optional(),
  foilPurchasePrice: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export async function updateCollectionItemAction(
  cardId: string,
  input: z.infer<typeof updateItemSchema>
): Promise<CollectionActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Dados inválidos" };
  }

  try {
    const result = await updateCollectionItem(user.id, cardId, parsed.data);
    return {
      success: true,
      normalQuantity: result.normalQuantity,
      foilQuantity: result.foilQuantity,
      deleted: result.deleted,
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro" };
  }
}

export async function removeFromCollectionAction(
  cardId: string
): Promise<CollectionActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Não autenticado" };

  try {
    await removeFromCollection(user.id, cardId);
    return { success: true, deleted: true, normalQuantity: 0, foilQuantity: 0 };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro" };
  }
}
