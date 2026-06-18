import type { Metadata } from "next";
import Link from "next/link";
import { findAllSyncRuns } from "@/modules/sync/sync.repository";
import { AdminSyncButton } from "../_components/AdminSyncButton";

export const metadata: Metadata = { title: "Sincronizações" };

type SyncStatus = "PENDING" | "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED";

const STATUS_LABEL: Record<SyncStatus, string> = {
  SUCCESS: "Sucesso",
  PARTIAL: "Parcial",
  FAILED: "Falha",
  RUNNING: "Em andamento",
  PENDING: "Pendente",
};

const STATUS_COLOR: Record<SyncStatus, string> = {
  SUCCESS: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  PARTIAL: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  RUNNING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PENDING: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

function duration(start: Date, end: Date | null) {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default async function SyncRunsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const runs = await findAllSyncRuns(50);

  const filtered =
    status && status !== "all"
      ? runs.filter((r) => r.status === status)
      : runs;

  const statuses: SyncStatus[] = [
    "SUCCESS",
    "PARTIAL",
    "FAILED",
    "RUNNING",
    "PENDING",
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Sincronizações
        </h1>
        <AdminSyncButton />
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por status">
        <Link
          href="/admin/sincronizacoes"
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !status || status === "all"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
          }`}
        >
          Todas
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/sincronizacoes?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              status === s
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nenhuma sincronização encontrada.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {[
                  "Origem",
                  "Status",
                  "Início",
                  "Duração",
                  "Criados",
                  "Atualizados",
                  "Erros",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {filtered.map((run) => (
                <tr
                  key={run.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {run.source}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[run.status as SyncStatus] ?? ""}`}
                    >
                      {STATUS_LABEL[run.status as SyncStatus] ?? run.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {new Date(run.startedAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {duration(run.startedAt, run.finishedAt)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {run.cardsCreated + run.setsCreated}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {run.cardsUpdated + run.setsUpdated}
                  </td>
                  <td className="px-4 py-3">
                    {run._count.errors > 0 ? (
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {run._count.errors}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/sincronizacoes/${run.id}`}
                      className="text-indigo-600 hover:underline dark:text-indigo-400 text-xs"
                    >
                      Detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
