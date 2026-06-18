import Image from "next/image";
import Link from "next/link";
import type { Card, CardSet } from "@prisma/client";
import { CollectionControls } from "./CollectionControls";

type CardWithSet = Card & { set: Pick<CardSet, "code" | "name"> };

export interface CollectionSnapshot {
  normalQuantity: number;
  foilQuantity: number;
}

const RARITY_STYLE: Record<string, string> = {
  Common:       "bg-slate-100 text-slate-600 dark:bg-navy-700 dark:text-navy-200",
  Uncommon:     "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Rare:         "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "Super Rare": "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  Legendary:    "bg-amber-50 text-amber-700 dark:bg-foil-950 dark:text-amber-300",
  Enchanted:    "bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
  Special:      "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
};

const INK_DOT: Record<string, string> = {
  Amber:     "bg-amber-400",
  Amethyst:  "bg-violet-600",
  Emerald:   "bg-emerald-500",
  Ruby:      "bg-red-500",
  Sapphire:  "bg-blue-500",
  Steel:     "bg-slate-400",
};

function formatPrice(price: unknown): string {
  if (price == null) return "—";
  return `$${Number(price).toFixed(2)}`;
}

export function CardCard({
  card,
  collectionItem,
}: {
  card: CardWithSet;
  collectionItem?: CollectionSnapshot | null;
}) {
  const rarityClass = RARITY_STYLE[card.rarity] ?? "bg-slate-100 text-slate-600 dark:bg-navy-700 dark:text-navy-200";
  const inkDot = card.ink ? INK_DOT[card.ink] ?? "bg-slate-400" : null;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:border-navy-600 dark:bg-navy-800">
      <Link
        href={`/catalogo/${card.id}`}
        className="group flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
      >
        {/* Image */}
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-100 dark:bg-navy-700">
          {card.imageNormal ? (
            <Image
              src={card.imageNormal}
              alt={card.fullName}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300 dark:text-navy-600">
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Ink dot badge */}
          {inkDot && (
            <div className="absolute top-2 right-2">
              <span
                className={`block h-3 w-3 rounded-full border-2 border-white/60 shadow ${inkDot}`}
                title={card.ink ?? ""}
              />
            </div>
          )}

          {/* Collection quantity badges */}
          {collectionItem != null &&
            (collectionItem.normalQuantity > 0 || collectionItem.foilQuantity > 0) && (
              <div className="absolute bottom-1.5 left-1.5 flex gap-1">
                {collectionItem.normalQuantity > 0 && (
                  <span className="rounded bg-indigo-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                    ×{collectionItem.normalQuantity}
                  </span>
                )}
                {collectionItem.foilQuantity > 0 && (
                  <span className="rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                    ✦×{collectionItem.foilQuantity}
                  </span>
                )}
              </div>
            )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1 p-3">
          <p className="text-[11px] text-slate-400 dark:text-navy-400 truncate">
            {card.set.name} · <span className="font-medium">#{card.collectorNumber}</span>
          </p>
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate leading-tight">
            {card.name}
          </p>
          {card.version && (
            <p className="text-xs text-slate-500 dark:text-navy-300 truncate italic">{card.version}</p>
          )}
          <div className="mt-1 flex items-center justify-between gap-1">
            <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${rarityClass}`}>
              {card.rarity}
            </span>
            {card.cost !== null && (
              <span className="text-xs font-medium text-slate-500 dark:text-navy-300">
                ◆{card.cost}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-700 dark:text-slate-300">{formatPrice(card.priceUsd)}</span>
            {card.priceUsdFoil !== null && (
              <span className="font-medium text-amber-600 dark:text-amber-400" title="Preço foil">
                ✦ {formatPrice(card.priceUsdFoil)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Collection controls — only when user is logged in */}
      {collectionItem !== undefined && (
        <div className="px-3 pb-3">
          <CollectionControls
            cardId={card.id}
            initialNormal={collectionItem?.normalQuantity ?? 0}
            initialFoil={collectionItem?.foilQuantity ?? 0}
          />
        </div>
      )}
    </div>
  );
}
