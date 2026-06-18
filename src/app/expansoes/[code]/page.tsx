import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findCardSetByCode } from "@/modules/catalog/card-set.repository";
import { searchCards } from "@/modules/catalog/card.repository";
import { getCurrentUser } from "@/lib/auth/auth";
import { findCollectionItemsByCardIds } from "@/modules/collection/collection.repository";
import { CardCard } from "@/app/catalogo/_components/CardCard";

interface PageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const set = await findCardSetByCode(code);
  if (!set) return { title: "Expansão não encontrada" };
  return { title: set.name };
}

export default async function ExpansaoDetailPage({ params }: PageProps) {
  const { code } = await params;
  const set = await findCardSetByCode(code);
  if (!set) notFound();

  const [result, user] = await Promise.all([
    searchCards({ setCode: code, sortBy: "collectorNumber", pageSize: 300 }),
    getCurrentUser(),
  ]);

  const cardIds = result.cards.map((c) => c.id);
  const collectionMap = user
    ? await findCollectionItemsByCardIds(user.id, cardIds)
    : null;

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/expansoes"
          className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
        >
          ← Expansões
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
            {set.code}
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {set.name}
          </h1>
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
          {set.releasedAt && (
            <span>
              Lançamento:{" "}
              {new Date(set.releasedAt).toLocaleDateString("pt-BR")}
            </span>
          )}
          <span>{result.total} cartas</span>
        </div>
        {set.description && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            {set.description}
          </p>
        )}
      </div>

      {result.cards.length === 0 ? (
        <div className="py-16 text-center text-gray-500 dark:text-gray-400">
          Nenhuma carta importada para esta expansão.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {result.cards.map((card) => (
            <CardCard
              key={card.id}
              card={card}
              collectionItem={
                collectionMap
                  ? (collectionMap.get(card.id) ?? null)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
