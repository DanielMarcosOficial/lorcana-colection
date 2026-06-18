import type { Metadata } from "next";
import Link from "next/link";
import { getAdminStats } from "@/modules/admin/admin.repository";
import { AdminSyncButton } from "./_components/AdminSyncButton";

export const metadata: Metadata = { title: "Dashboard" };

const STATUS_LABEL: Record<string, string> = {
  SUCCESS: "Sucesso",
  PARTIAL: "Parcial",
  FAILED: "Falha",
  RUNNING: "Em andamento",
  PENDING: "Pendente",
};

const STATUS_COLOR: Record<string, string> = {
  SUCCESS: "text-green-600 dark:text-green-400",
  PARTIAL: "text-yellow-600 dark:text-yellow-400",
  FAILED: "text-red-600 dark:text-red-400",
  RUNNING: "text-blue-600 dark:text-blue-400",
  PENDING: "text-gray-500",
};

function StatCard({
  label,
  value,
  warn,
}: {
  label: string;
  value: string | number;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        warn
          ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
      }`}
    >
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-bold ${warn ? "text-yellow-700 dark:text-yellow-300" : "text-gray-900 dark:text-gray-100"}`}
      >
        {value.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const lastSyncDate = stats.lastSync?.startedAt
    ? new Date(stats.lastSync.startedAt).toLocaleString("pt-BR")
    : "—";
  const lastSyncStatus = stats.lastSync?.status ?? "—";
  const lastSyncErrors = stats.lastSync?.errorCount ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Administração
        </h1>
        <AdminSyncButton />
      </div>

      {/* Catalog stats */}
      <section aria-labelledby="catalog-heading">
        <h2
          id="catalog-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
        >
          Catálogo
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Usuários" value={stats.totalUsers} />
          <StatCard label="Expansões" value={stats.totalSets} />
          <StatCard label="Cartas" value={stats.totalCards} />
          <StatCard
            label="Itens em coleções"
            value={stats.totalCollectionItems}
          />
        </div>
      </section>

      {/* Quality stats */}
      <section aria-labelledby="quality-heading">
        <h2
          id="quality-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
        >
          Qualidade dos dados
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            label="Cartas sem preço"
            value={stats.cardsWithoutPrice}
            warn={stats.cardsWithoutPrice > 0}
          />
          <StatCard
            label="Cartas sem imagem"
            value={stats.cardsWithoutImage}
            warn={stats.cardsWithoutImage > 0}
          />
          <StatCard
            label="Expansões sem cartas"
            value={stats.setsWithoutCards}
            warn={stats.setsWithoutCards > 0}
          />
        </div>
      </section>

      {/* Last sync */}
      <section
        aria-labelledby="sync-heading"
        className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="flex items-center justify-between">
          <h2
            id="sync-heading"
            className="text-base font-semibold text-gray-800 dark:text-gray-100"
          >
            Última sincronização
          </h2>
          <Link
            href="/admin/sincronizacoes"
            className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Ver todas →
          </Link>
        </div>
        {stats.lastSync ? (
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Data", value: lastSyncDate },
              {
                label: "Status",
                value: STATUS_LABEL[lastSyncStatus] ?? lastSyncStatus,
                colorClass: STATUS_COLOR[lastSyncStatus] ?? "",
              },
              { label: "Erros", value: lastSyncErrors },
              {
                label: "Cartas criadas",
                value: stats.lastSync.cardsCreated,
              },
            ].map(({ label, value, colorClass }) => (
              <div key={label}>
                <dt className="text-xs text-gray-500 dark:text-gray-400">
                  {label}
                </dt>
                <dd
                  className={`mt-0.5 text-sm font-semibold ${colorClass ?? "text-gray-900 dark:text-gray-100"}`}
                >
                  {String(value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-3 text-sm text-gray-400">
            Nenhuma sincronização realizada ainda.
          </p>
        )}
      </section>
    </div>
  );
}
