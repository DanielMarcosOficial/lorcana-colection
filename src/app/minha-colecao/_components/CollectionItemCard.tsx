"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { EditItemModal } from "./EditItemModal";

interface CollectionItemCardProps {
  item: {
    id: string;
    cardId: string;
    normalQuantity: number;
    foilQuantity: number;
    normalPurchasePrice: string | null;
    foilPurchasePrice: string | null;
    notes: string | null;
    card: {
      id: string;
      name: string;
      version: string | null;
      fullName: string;
      rarity: string;
      ink: string | null;
      imageNormal: string | null;
      priceUsd: string | null;
      priceUsdFoil: string | null;
      set: { code: string; name: string };
    };
  };
}

const INK_DOT: Record<string, string> = {
  Amber:     "bg-amber-400",
  Amethyst:  "bg-violet-600",
  Emerald:   "bg-emerald-500",
  Ruby:      "bg-red-500",
  Sapphire:  "bg-blue-500",
  Steel:     "bg-slate-400",
};

function fmt(v: string | null | undefined): string {
  if (v == null) return "—";
  return `$${Number(v).toFixed(2)}`;
}

function totalValue(item: CollectionItemCardProps["item"]): string {
  const n = item.normalQuantity * Number(item.card.priceUsd ?? 0);
  const f = item.foilQuantity * Number(item.card.priceUsdFoil ?? 0);
  const total = n + f;
  if (total === 0) return "—";
  return `$${total.toFixed(2)}`;
}

export function CollectionItemCard({ item }: CollectionItemCardProps) {
  const [normalQty, setNormalQty] = useState(item.normalQuantity);
  const [foilQty, setFoilQty] = useState(item.foilQuantity);
  const [hidden, setHidden] = useState(false);
  const [editing, setEditing] = useState(false);

  if (hidden) return null;

  const inkDot = item.card.ink ? INK_DOT[item.card.ink] ?? "bg-slate-400" : null;

  return (
    <>
      <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-navy-600 dark:bg-navy-800">
        {/* Card image */}
        <Link
          href={`/catalogo/${item.card.id}`}
          className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
        >
          <div className="relative h-24 w-16 overflow-hidden rounded-lg bg-slate-100 dark:bg-navy-700">
            {item.card.imageNormal ? (
              <Image
                src={item.card.imageNormal}
                alt={item.card.fullName}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-300 dark:text-navy-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {inkDot && (
                  <span className={`h-2 w-2 shrink-0 rounded-full ${inkDot}`} title={item.card.ink ?? ""} />
                )}
                <Link
                  href={`/catalogo/${item.card.id}`}
                  className="truncate text-sm font-semibold text-slate-900 hover:underline dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                >
                  {item.card.name}
                </Link>
              </div>
              {item.card.version && (
                <p className="truncate text-xs italic text-slate-500 dark:text-navy-300">{item.card.version}</p>
              )}
              <p className="truncate text-xs text-slate-400 dark:text-navy-400">
                {item.card.set.name} · {item.card.rarity}
              </p>
            </div>

            <button
              onClick={() => setEditing(true)}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-navy-700 dark:hover:text-slate-200 transition-colors"
              aria-label="Editar"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
            <span className="text-slate-500 dark:text-navy-300">
              Normal:{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">×{normalQty}</span>
            </span>
            <span className="text-slate-500 dark:text-navy-300">
              Foil:{" "}
              <span className="font-semibold text-amber-600 dark:text-amber-400">×{foilQty}</span>
            </span>
            <span className="text-slate-500 dark:text-navy-300">
              Mercado: <span className="text-slate-700 dark:text-slate-300">{fmt(item.card.priceUsd)}</span>
            </span>
            <span className="text-slate-500 dark:text-navy-300">
              Foil: <span className="text-slate-700 dark:text-slate-300">{fmt(item.card.priceUsdFoil)}</span>
            </span>
            <span className="col-span-2 text-slate-500 dark:text-navy-300">
              Valor estimado:{" "}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {totalValue({ ...item, normalQuantity: normalQty, foilQuantity: foilQty })}
              </span>
            </span>
            {(item.normalPurchasePrice || item.foilPurchasePrice) && (
              <span className="col-span-2 text-slate-400 dark:text-navy-400">
                Compra: {fmt(item.normalPurchasePrice)} / {fmt(item.foilPurchasePrice)}
              </span>
            )}
          </div>

          {item.notes && (
            <p className="mt-1.5 truncate text-xs italic text-slate-400 dark:text-navy-400">
              {item.notes}
            </p>
          )}
        </div>
      </div>

      {editing && (
        <EditItemModal
          cardId={item.cardId}
          cardName={item.card.fullName}
          initialNormalQty={normalQty}
          initialFoilQty={foilQty}
          initialNormalPrice={item.normalPurchasePrice ?? ""}
          initialFoilPrice={item.foilPurchasePrice ?? ""}
          initialNotes={item.notes ?? ""}
          onClose={() => setEditing(false)}
          onSaved={(n, f, deleted) => {
            if (deleted) {
              setHidden(true);
            } else {
              setNormalQty(n);
              setFoilQty(f);
            }
            setEditing(false);
          }}
        />
      )}
    </>
  );
}
