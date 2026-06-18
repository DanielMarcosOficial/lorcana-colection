import type { Metadata } from "next";
import Link from "next/link";
import { findAllCardSets } from "@/modules/catalog/card-set.repository";

export const metadata: Metadata = { title: "Expansões" };

export default async function ExpansoesPage() {
  const sets = await findAllCardSets();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Expansões
      </h1>

      {sets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
            Nenhuma expansão importada ainda.
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Sincronize o catálogo em Configurações para importar as expansões.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sets.map((set) => (
            <Link
              key={set.code}
              href={`/expansoes/${set.code}`}
              className="group flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <span className="inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                  {set.code}
                </span>
                <span className="text-xs text-gray-400">{set.totalCards} cartas</span>
              </div>
              <h2 className="font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-gray-100 dark:group-hover:text-indigo-400 transition-colors">
                {set.name}
              </h2>
              {set.releasedAt && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Lançamento:{" "}
                  {new Date(set.releasedAt).toLocaleDateString("pt-BR")}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
