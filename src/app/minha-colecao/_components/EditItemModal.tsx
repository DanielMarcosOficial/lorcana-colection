"use client";

import { useState, useTransition } from "react";
import { updateCollectionItemAction, removeFromCollectionAction } from "@/app/actions/collection";

interface EditItemModalProps {
  cardId: string;
  cardName: string;
  initialNormalQty: number;
  initialFoilQty: number;
  initialNormalPrice: string;
  initialFoilPrice: string;
  initialNotes: string;
  onClose: () => void;
  onSaved: (normalQty: number, foilQty: number, deleted: boolean) => void;
}

export function EditItemModal({
  cardId,
  cardName,
  initialNormalQty,
  initialFoilQty,
  initialNormalPrice,
  initialFoilPrice,
  initialNotes,
  onClose,
  onSaved,
}: EditItemModalProps) {
  const [normalQty, setNormalQty] = useState(String(initialNormalQty));
  const [foilQty, setFoilQty] = useState(String(initialFoilQty));
  const [normalPrice, setNormalPrice] = useState(initialNormalPrice);
  const [foilPrice, setFoilPrice] = useState(initialFoilPrice);
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isRemoving, startRemoveTransition] = useTransition();

  function handleSave() {
    const parsedNormal = parseInt(normalQty, 10);
    const parsedFoil = parseInt(foilQty, 10);
    if (isNaN(parsedNormal) || parsedNormal < 0) {
      setError("Quantidade normal inválida");
      return;
    }
    if (isNaN(parsedFoil) || parsedFoil < 0) {
      setError("Quantidade foil inválida");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateCollectionItemAction(cardId, {
        normalQuantity: parsedNormal,
        foilQuantity: parsedFoil,
        normalPurchasePrice: normalPrice || null,
        foilPurchasePrice: foilPrice || null,
        notes: notes || null,
      });
      if (result.success) {
        onSaved(result.normalQuantity ?? 0, result.foilQuantity ?? 0, result.deleted ?? false);
      } else {
        setError(result.error ?? "Erro ao salvar");
      }
    });
  }

  function handleRemove() {
    if (!confirm(`Remover "${cardName}" da sua coleção?`)) return;
    startRemoveTransition(async () => {
      const result = await removeFromCollectionAction(cardId);
      if (result.success) {
        onSaved(0, 0, true);
      } else {
        setError(result.error ?? "Erro ao remover");
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100";
  const labelClass = "mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300";
  const disabled = isPending || isRemoving;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Editar ${cardName}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 truncate pr-4">
            {cardName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Qtd. Normal</label>
              <input
                type="number"
                min="0"
                value={normalQty}
                onChange={(e) => setNormalQty(e.target.value)}
                className={inputClass}
                disabled={disabled}
              />
            </div>
            <div>
              <label className={labelClass}>Qtd. Foil</label>
              <input
                type="number"
                min="0"
                value={foilQty}
                onChange={(e) => setFoilQty(e.target.value)}
                className={inputClass}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Preço Normal ($)</label>
              <input
                type="text"
                placeholder="0.00"
                value={normalPrice}
                onChange={(e) => setNormalPrice(e.target.value)}
                className={inputClass}
                disabled={disabled}
              />
            </div>
            <div>
              <label className={labelClass}>Preço Foil ($)</label>
              <input
                type="text"
                placeholder="0.00"
                value={foilPrice}
                onChange={(e) => setFoilPrice(e.target.value)}
                className={inputClass}
                disabled={disabled}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Notas</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="Condição, lote, observações…"
              disabled={disabled}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4 dark:border-gray-700">
          <button
            onClick={handleRemove}
            disabled={disabled}
            className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            {isRemoving ? "Removendo…" : "Remover"}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={disabled}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={disabled}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
            >
              {isPending ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
