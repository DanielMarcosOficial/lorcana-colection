import type { CollectionStats } from "@/modules/collection/collection.repository";

function StatItem({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-navy-600 dark:bg-navy-800">
      <p className="text-xs font-medium text-slate-500 dark:text-navy-300">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${accent ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-slate-100"}`}>
        {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
      </p>
    </div>
  );
}

export function CollectionStatsBar({ stats }: { stats: CollectionStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatItem label="Cartas distintas" value={stats.distinctCards} accent />
      <StatItem label="Cópias totais" value={stats.totalCopies} />
      <StatItem label="Normal" value={stats.totalNormal} />
      <StatItem label="Foil" value={stats.totalFoil} />
      <StatItem label="Expansões" value={stats.setsStarted} />
    </div>
  );
}
