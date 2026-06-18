import Image from "next/image";
import Link from "next/link";
import type { TopCard } from "@/modules/dashboard/dashboard.repository";

function fmt(d: { toString(): string }): string {
  return `$${Number(d.toString()).toFixed(2)}`;
}

const POSITION_COLORS = [
  "bg-amber-400 text-amber-900",
  "bg-slate-300 text-slate-700 dark:bg-slate-600 dark:text-slate-200",
  "bg-orange-300 text-orange-900 dark:bg-orange-700 dark:text-orange-100",
];

export function TopCards({ cards }: { cards: TopCard[] }) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <svg className="h-10 w-10 text-slate-300 dark:text-navy-600" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p className="mt-3 text-sm text-slate-500 dark:text-navy-300">
          Nenhuma carta com cotação.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-slate-100 dark:divide-navy-700">
      {cards.map((card, i) => {
        const isFoil = card.variant === "FOIL";
        const positionColor = POSITION_COLORS[i] ?? "bg-slate-200 text-slate-600 dark:bg-navy-600 dark:text-navy-200";

        return (
          <Link
            key={`${card.cardId}-${card.variant}`}
            href={`/catalogo/${card.cardId}`}
            className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg transition-opacity"
          >
            {/* Position badge */}
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${positionColor}`}>
              {i + 1}
            </span>

            {/* Card image */}
            <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-navy-700">
              {card.imageNormal ? (
                <Image src={card.imageNormal} alt={card.name} fill sizes="40px" className="object-cover" />
              ) : null}
            </div>

            {/* Card info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {card.name}
              </p>
              {card.version && (
                <p className="truncate text-xs italic text-slate-500 dark:text-navy-300">{card.version}</p>
              )}
              <p className="text-xs text-slate-400 dark:text-navy-400">{card.setName}</p>
            </div>

            {/* Price + variant */}
            <div className="shrink-0 text-right">
              <span
                className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                  isFoil
                    ? "bg-amber-100 text-amber-700 dark:bg-foil-950 dark:text-amber-400"
                    : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400"
                }`}
              >
                {isFoil ? "✦" : "◈"} {isFoil ? "Foil" : "Normal"}
              </span>
              <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                {fmt(card.unitPrice)}
              </p>
              <p className="text-xs text-slate-400 dark:text-navy-400">
                ×{card.quantity} = {fmt(card.totalValue)}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
