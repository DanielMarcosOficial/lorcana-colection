import type { ValuePoint } from "@/modules/dashboard/dashboard.repository";

function fmt(d: { toString(): string }): string {
  return `$${Number(d.toString()).toFixed(2)}`;
}

function fmtDate(d: Date | unknown): string {
  if (d instanceof Date) return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return String(d);
}

export function ValueEvolution({ points }: { points: ValuePoint[] }) {
  if (points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <svg className="h-10 w-10 text-slate-300 dark:text-navy-600" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <p className="mt-3 text-sm text-slate-500 dark:text-navy-300">Dados insuficientes</p>
        <p className="mt-0.5 text-xs text-slate-400 dark:text-navy-400">
          O histórico será criado na próxima sincronização.
        </p>
      </div>
    );
  }

  if (points.length === 1) {
    return (
      <div className="py-4 text-center">
        <p className="text-xs text-slate-500 dark:text-navy-300 mb-1">Valor atual</p>
        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          {fmt(points[0]!.totalValue)}
        </p>
        <p className="text-xs text-slate-400 dark:text-navy-400 mt-1">
          {fmtDate(points[0]!.date)}
        </p>
      </div>
    );
  }

  const values = points.map((p) => Number(p.totalValue.toString()));
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;

  const first = values[0]!;
  const last = values[values.length - 1]!;
  const change = last - first;
  const changeSign = change >= 0 ? "+" : "";
  const isPositive = change >= 0;

  return (
    <div>
      {/* Header: range label + delta */}
      <div className="mb-4 flex items-end justify-between text-xs">
        <span className="text-slate-500 dark:text-navy-300">Últimos {points.length} registros</span>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-slate-900 dark:text-slate-100">
            {fmt({ toString: () => String(last) })}
          </span>
          <span
            className={`rounded-md px-1.5 py-0.5 font-semibold ${
              isPositive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
            }`}
          >
            {changeSign}${Math.abs(change).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Bar chart */}
      <div
        className="flex items-end gap-0.5"
        style={{ height: "72px" }}
        aria-label="Evolução do valor da coleção"
      >
        {points.map((p, i) => {
          const val = Number(p.totalValue.toString());
          const heightPct = maxVal === 0 ? 0 : ((val - minVal) / range) * 100;
          const isLast = i === points.length - 1;
          return (
            <div
              key={i}
              className="group relative flex-1"
              style={{ height: "72px" }}
            >
              <div
                className={`absolute bottom-0 w-full rounded-t transition-all ${
                  isLast
                    ? "bg-indigo-500 dark:bg-indigo-400"
                    : "bg-indigo-200 group-hover:bg-indigo-300 dark:bg-navy-600 dark:group-hover:bg-navy-500"
                }`}
                style={{ height: `${Math.max(3, heightPct)}%` }}
                title={`${fmtDate(p.date)}: ${fmt(p.totalValue)}`}
              />
            </div>
          );
        })}
      </div>

      {/* Date labels */}
      <div className="mt-2 flex items-center justify-between text-xs text-slate-400 dark:text-navy-400">
        <span>{fmtDate(points[0]!.date)}</span>
        <span>{fmtDate(points[points.length - 1]!.date)}</span>
      </div>
    </div>
  );
}
