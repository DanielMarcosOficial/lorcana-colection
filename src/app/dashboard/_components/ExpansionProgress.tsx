import Link from "next/link";
import type { ExpansionProgressRow } from "@/modules/dashboard/dashboard.repository";

function fmt(d: { toString(): string }): string {
  const n = Number(d.toString());
  if (n === 0) return "—";
  return `$${n.toFixed(2)}`;
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color =
    pct >= 100
      ? "bg-emerald-500 dark:bg-emerald-400"
      : pct >= 75
        ? "bg-indigo-500 dark:bg-indigo-400"
        : pct >= 50
          ? "bg-indigo-400 dark:bg-indigo-500"
          : "bg-slate-400 dark:bg-navy-400";

  return (
    <div
      className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-navy-700"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ExpansionProgress({ rows, showAll = false }: { rows: ExpansionProgressRow[]; showAll?: boolean }) {
  const visible = showAll ? rows : rows.filter((r) => r.ownedCount > 0);

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <svg className="h-10 w-10 text-slate-300 dark:text-navy-600" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="mt-3 text-sm text-slate-500 dark:text-navy-300">
          Adicione cartas ao catálogo para ver o progresso.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {visible.map((row) => {
        const pct = Math.min(100, row.percentage);
        const isComplete = pct >= 100;

        return (
          <div key={row.id}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <Link
                href={`/expansoes/${row.code}`}
                className="truncate text-sm font-medium text-slate-800 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
              >
                {row.name}
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                {isComplete && (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Completo!</span>
                )}
                <span className="text-xs tabular-nums text-slate-500 dark:text-navy-300">
                  {row.ownedCount}/{row.totalCards}
                </span>
              </div>
            </div>

            <ProgressBar value={row.ownedCount} max={row.totalCards} />

            <div className="mt-1 flex items-center justify-between text-xs text-slate-400 dark:text-navy-400">
              <span>{pct.toFixed(1)}% completo</span>
              <span>
                {row.missingCount > 0 ? `${row.missingCount} faltando` : ""}
                {row.ownedValue.gt(0) ? `${row.missingCount > 0 ? " · " : ""}${fmt(row.ownedValue)}` : ""}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
