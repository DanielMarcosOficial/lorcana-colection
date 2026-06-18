"use client";

import { useState, useTransition } from "react";
import { adjustQuantityAction } from "@/app/actions/collection";

interface CollectionControlsProps {
  cardId: string;
  initialNormal: number;
  initialFoil: number;
}

function QtyRow({
  label,
  qty,
  onAdjust,
  disabled,
}: {
  label: string;
  qty: number;
  onAdjust: (delta: number) => void;
  disabled: boolean;
}) {
  const btnBase =
    "flex h-6 w-6 items-center justify-center rounded border text-xs font-bold leading-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40";
  const btnActive =
    "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600";

  return (
    <div className="flex items-center justify-between gap-1">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-10">{label}</span>
      <div className="flex items-center gap-1">
        <button
          className={`${btnBase} ${btnActive}`}
          aria-label={`Remover ${label}`}
          disabled={disabled || qty === 0}
          onClick={() => onAdjust(-1)}
        >
          −
        </button>
        <span className="w-5 text-center text-xs font-semibold tabular-nums text-gray-800 dark:text-gray-100">
          {qty}
        </span>
        <button
          className={`${btnBase} ${btnActive}`}
          aria-label={`Adicionar ${label}`}
          disabled={disabled}
          onClick={() => onAdjust(1)}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function CollectionControls({
  cardId,
  initialNormal,
  initialFoil,
}: CollectionControlsProps) {
  const [normal, setNormal] = useState(initialNormal);
  const [foil, setFoil] = useState(initialFoil);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function adjust(type: "NORMAL" | "FOIL", delta: number) {
    const current = type === "NORMAL" ? normal : foil;
    if (delta < 0 && current === 0) return;

    const optimistic = Math.max(0, current + delta);
    if (type === "NORMAL") setNormal(optimistic);
    else setFoil(optimistic);
    setError(null);

    startTransition(async () => {
      const result = await adjustQuantityAction(cardId, type, delta);
      if (result.success) {
        setNormal(result.normalQuantity ?? 0);
        setFoil(result.foilQuantity ?? 0);
      } else {
        if (type === "NORMAL") setNormal(current);
        else setFoil(current);
        setError(result.error ?? "Erro");
      }
    });
  }

  return (
    <div
      className="mt-2 flex flex-col gap-1 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
      aria-label="Controles de coleção"
    >
      <QtyRow
        label="Normal"
        qty={normal}
        onAdjust={(d) => adjust("NORMAL", d)}
        disabled={isPending}
      />
      <QtyRow
        label="Foil"
        qty={foil}
        onAdjust={(d) => adjust("FOIL", d)}
        disabled={isPending}
      />
      {error && (
        <p className="mt-0.5 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
