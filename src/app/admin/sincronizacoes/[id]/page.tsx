import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findSyncRunById } from "@/modules/sync/sync.repository";
import { AdminSyncButton } from "../../_components/AdminSyncButton";

export const metadata: Metadata = { title: "Detalhe da sincronização" };

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
  if (!end) return "Em andamento";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default async function SyncRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await findSyncRunById(id);
  if (!run) notFound();

  const canRetry =
    run.status === "FAILED" || run.status === "PARTIAL";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/sincronizacoes"
            className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            ← Sincronizações
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Detalhe da sincronização
          </h1>
          <p className="font-mono text-xs text-gray-400">{run.id}</p>
        </div>
        {canRetry && (
          <div>
            <p className="mb-1 text-xs text-gray-500">Repetir sincronização:</p>
            <AdminSyncButton />
          </div>
        )}
      </div>

      {/* Summary */}
      <section
        aria-labelledby="summary-heading"
        className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
      >
        <h2
          id="summary-heading"
          className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-100"
        >
          Resumo
        </h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Origem", value: run.source },
            {
              label: "Status",
              value: STATUS_LABEL[run.status as SyncStatus] ?? run.status,
              colorClass:
                STATUS_COLOR[run.status as SyncStatus] ??
                "bg-gray-100 text-gray-700",
              badge: true,
            },
            {
              label: "Início",
              value: new Date(run.startedAt).toLocaleString("pt-BR"),
            },
            { label: "Duração", value: duration(run.startedAt, run.finishedAt) },
            { label: "Expansões criadas", value: run.setsCreated },
            { label: "Expansões atualizadas", value: run.setsUpdated },
            { label: "Cartas criadas", value: run.cardsCreated },
            { label: "Cartas atualizadas", value: run.cardsUpdated },
            { label: "Cartas ignoradas", value: run.cardsSkipped },
            { label: "Erros", value: run.errorCount },
          ].map(({ label, value, colorClass, badge }) => (
            <div key={label}>
              <dt className="text-xs text-gray-500 dark:text-gray-400">
                {label}
              </dt>
              <dd className="mt-0.5">
                {badge ? (
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
                  >
                    {String(value)}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {String(value)}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Errors */}
      {run.errors.length > 0 && (
        <section aria-labelledby="errors-heading">
          <h2
            id="errors-heading"
            className="mb-3 text-base font-semibold text-gray-800 dark:text-gray-100"
          >
            Erros ({run.errors.length})
          </h2>
          <div className="overflow-x-auto rounded-xl border border-red-200 dark:border-red-900">
            <table className="w-full text-sm">
              <thead className="bg-red-50 dark:bg-red-950">
                <tr>
                  {["Tipo", "ID externo", "Mensagem"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100 dark:divide-red-900 bg-white dark:bg-gray-900">
                {run.errors.map((err) => (
                  <tr key={err.id}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {err.entityType}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      {err.externalId ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-red-700 dark:text-red-300">
                      {err.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {run.errors.length === 0 && run.status === "SUCCESS" && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Nenhum erro registrado.
        </p>
      )}
    </div>
  );
}
