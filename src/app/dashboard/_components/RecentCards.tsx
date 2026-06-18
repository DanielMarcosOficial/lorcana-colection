import Image from "next/image";
import Link from "next/link";

type RecentItem = {
  normalQuantity: number;
  foilQuantity: number;
  createdAt: Date;
  card: {
    id: string;
    name: string;
    version: string | null;
    imageNormal: string | null;
    rarity: string;
    ink: string | null;
    set: { code: string; name: string };
  };
};

const INK_DOT: Record<string, string> = {
  Amber: "bg-amber-400",
  Amethyst: "bg-violet-600",
  Emerald: "bg-emerald-500",
  Ruby: "bg-red-500",
  Sapphire: "bg-blue-500",
  Steel: "bg-slate-400",
};

export function RecentCards({ items }: { items: RecentItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <svg className="h-10 w-10 text-slate-300 dark:text-navy-600" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p className="mt-3 text-sm text-slate-500 dark:text-navy-300">
          Nenhuma carta na coleção ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-slate-100 dark:divide-navy-700">
      {items.map((item, i) => {
        const inkDot = item.card.ink ? INK_DOT[item.card.ink] : null;
        return (
          <Link
            key={`${item.card.id}-${i}`}
            href={`/catalogo/${item.card.id}`}
            className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg transition-opacity"
          >
            {/* Card image */}
            <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-navy-700">
              {item.card.imageNormal && (
                <Image src={item.card.imageNormal} alt={item.card.name} fill sizes="40px" className="object-cover" />
              )}
            </div>

            {/* Card info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {inkDot && (
                  <span className={`h-2 w-2 shrink-0 rounded-full ${inkDot}`} title={item.card.ink ?? ""} />
                )}
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {item.card.name}
                </p>
              </div>
              {item.card.version && (
                <p className="truncate text-xs italic text-slate-500 dark:text-navy-300">{item.card.version}</p>
              )}
              <p className="text-xs text-slate-400 dark:text-navy-400">
                {item.card.set.name} · {item.card.rarity}
              </p>
            </div>

            {/* Quantity badges */}
            <div className="shrink-0 flex flex-col items-end gap-1">
              {item.normalQuantity > 0 && (
                <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  ×{item.normalQuantity}
                </span>
              )}
              {item.foilQuantity > 0 && (
                <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-foil-950 dark:text-amber-400">
                  ✦×{item.foilQuantity}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
