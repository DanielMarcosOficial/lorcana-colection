import type { DistributionRow } from "@/modules/dashboard/dashboard.repository";

const INK_STYLE: Record<string, { bar: string; dot: string }> = {
  Amber:     { bar: "bg-amber-400",   dot: "bg-amber-400" },
  Amethyst:  { bar: "bg-violet-500",  dot: "bg-violet-500" },
  Emerald:   { bar: "bg-emerald-500", dot: "bg-emerald-500" },
  Ruby:      { bar: "bg-red-500",     dot: "bg-red-500" },
  Sapphire:  { bar: "bg-blue-500",    dot: "bg-blue-500" },
  Steel:     { bar: "bg-slate-400",   dot: "bg-slate-400" },
  "Sem tinta": { bar: "bg-slate-300", dot: "bg-slate-300" },
};

const RARITY_STYLE: Record<string, { bar: string; dot: string }> = {
  Common:       { bar: "bg-slate-400",   dot: "bg-slate-400" },
  Uncommon:     { bar: "bg-emerald-500", dot: "bg-emerald-500" },
  Rare:         { bar: "bg-blue-500",    dot: "bg-blue-500" },
  "Super Rare": { bar: "bg-violet-500",  dot: "bg-violet-500" },
  Legendary:    { bar: "bg-amber-500",   dot: "bg-amber-500" },
  Enchanted:    { bar: "bg-pink-500",    dot: "bg-pink-500" },
  Special:      { bar: "bg-orange-500",  dot: "bg-orange-500" },
};

const FALLBACK = { bar: "bg-slate-400", dot: "bg-slate-400" };

export function DistributionChart({
  rows,
  type,
}: {
  rows: DistributionRow[];
  type: "ink" | "rarity";
  label?: string;
}) {
  const total = rows.reduce((s, r) => s + r.cardCount, 0);
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-sm text-slate-500 dark:text-navy-300">Sem dados.</p>
      </div>
    );
  }

  const styleMap = type === "ink" ? INK_STYLE : RARITY_STYLE;

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const pct = (row.cardCount / total) * 100;
        const { bar, dot } = styleMap[row.key] ?? FALLBACK;
        return (
          <div key={row.key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden="true" />
                {row.key}
              </span>
              <span className="tabular-nums text-slate-500 dark:text-navy-300">
                {row.cardCount} ({pct.toFixed(0)}%)
              </span>
            </div>
            <div
              className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-navy-700"
              role="progressbar"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${row.key}: ${row.cardCount} cartas`}
            >
              <div
                className={`h-full rounded-full transition-all ${bar}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
