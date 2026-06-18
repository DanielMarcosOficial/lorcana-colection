import type { CollectionValue } from "@/modules/dashboard/dashboard.repository";
import type { CollectionStats } from "@/modules/collection/collection.repository";

function fmt(d: { toString(): string }): string {
  return `$${Number(d.toString()).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function CardsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function CollectionIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function TrendingUpIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M8.5 6.5a3.5 3.5 0 013.5-3.5v0a3.5 3.5 0 013.5 3.5v0a3.5 3.5 0 01-3.5 3.5v0A3.5 3.5 0 018.5 6.5zM5 15a4 4 0 004 4h6a4 4 0 004-4" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  variant?: "default" | "primary" | "foil" | "danger";
  size?: "sm" | "md";
}

function MetricCard({ label, value, sub, icon, variant = "default", size = "md" }: MetricCardProps) {
  const iconWrap: Record<string, string> = {
    default: "bg-slate-100 text-slate-500 dark:bg-navy-700 dark:text-navy-300",
    primary: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
    foil: "bg-amber-100 text-amber-600 dark:bg-foil-950 dark:text-amber-400",
    danger: "bg-red-100 text-red-500 dark:bg-red-950 dark:text-red-400",
  };

  const valueColor: Record<string, string> = {
    default: "text-slate-900 dark:text-slate-100",
    primary: "text-indigo-700 dark:text-indigo-300",
    foil: "text-amber-700 dark:text-amber-300",
    danger: "text-red-600 dark:text-red-400",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-navy-600 dark:bg-navy-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 dark:text-navy-300">{label}</p>
          <p className={`mt-1 font-bold tabular-nums ${size === "md" ? "text-2xl" : "text-xl"} ${valueColor[variant]}`}>
            {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
          </p>
          {sub && (
            <p className="mt-0.5 text-xs text-slate-400 dark:text-navy-400">{sub}</p>
          )}
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconWrap[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface DashboardStatsProps {
  collStats: CollectionStats;
  value: CollectionValue;
}

export function DashboardStats({ collStats, value }: DashboardStatsProps) {
  return (
    <div className="space-y-3">
      {/* Primary metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label="Valor total da coleção"
          value={fmt(value.total)}
          sub={value.unpricedCount > 0 ? `${value.unpricedCount} carta${value.unpricedCount > 1 ? "s" : ""} sem cotação` : undefined}
          icon={<TrendingUpIcon />}
          variant="primary"
        />
        <MetricCard
          label="Cartas distintas"
          value={collStats.distinctCards}
          sub={`${collStats.totalCopies.toLocaleString("pt-BR")} cópias no total`}
          icon={<CardsIcon />}
          variant="default"
        />
        <MetricCard
          label="Expansões na coleção"
          value={collStats.setsStarted}
          sub="expansões com ao menos 1 carta"
          icon={<CollectionIcon />}
          variant="default"
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Normal"
          value={collStats.totalNormal}
          sub={fmt(value.totalNormal)}
          icon={<LayersIcon />}
          variant="default"
          size="sm"
        />
        <MetricCard
          label="Foil"
          value={collStats.totalFoil}
          sub={fmt(value.totalFoil)}
          icon={<SparkleIcon />}
          variant="foil"
          size="sm"
        />
        <MetricCard
          label="Valor normal"
          value={fmt(value.totalNormal)}
          icon={<DollarIcon />}
          variant="default"
          size="sm"
        />
        <MetricCard
          label="Sem cotação"
          value={value.unpricedCount}
          sub="cartas sem preço"
          icon={<AlertIcon />}
          variant={value.unpricedCount > 0 ? "danger" : "default"}
          size="sm"
        />
      </div>
    </div>
  );
}
