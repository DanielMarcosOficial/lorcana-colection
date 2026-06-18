import type { Metadata } from "next";
import { Suspense } from "react";
import { searchCards } from "@/modules/catalog/card.repository";
import { CardCard } from "@/app/catalogo/_components/CardCard";
import { SearchForm } from "./_components/SearchForm";

export const metadata: Metadata = { title: "Busca" };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BuscaPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const rawQ = sp["q"];
  const q = (Array.isArray(rawQ) ? (rawQ[0] ?? "") : (rawQ ?? "")).trim();

  const result =
    q.length >= 2
      ? await searchCards({ q, pageSize: 48, sortBy: "name" })
      : null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Busca global
      </h1>

      <Suspense>
        <SearchForm />
      </Suspense>

      <div className="mt-8">
        {!q && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Digite pelo menos 2 caracteres para buscar cartas.
          </p>
        )}

        {q && q.length < 2 && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Digite pelo menos 2 caracteres.
          </p>
        )}

        {result && result.total === 0 && (
          <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
              Nenhum resultado para &ldquo;{q}&rdquo;
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Tente um termo diferente ou verifique se o catálogo foi
              sincronizado.
            </p>
          </div>
        )}

        {result && result.total > 0 && (
          <>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              {result.total.toLocaleString("pt-BR")} resultado
              {result.total !== 1 ? "s" : ""} para &ldquo;{q}&rdquo;
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {result.cards.map((card) => (
                <CardCard key={card.id} card={card} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
