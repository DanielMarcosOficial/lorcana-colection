import type { Metadata } from "next";
import { Suspense } from "react";
import { searchCards } from "@/modules/catalog/card.repository";
import type { OwnershipFilter } from "@/modules/catalog/card.repository";
import { findAllCardSets } from "@/modules/catalog/card-set.repository";
import { getCurrentUser } from "@/lib/auth/auth";
import { findCollectionItemsByCardIds } from "@/modules/collection/collection.repository";
import { prisma } from "@/lib/database/prisma";
import { CardCard } from "./_components/CardCard";
import { CatalogFilters } from "./_components/CatalogFilters";
import { Pagination } from "./_components/Pagination";

export const metadata: Metadata = { title: "Catálogo" };

// Distinct ink / rarity / type values for filter dropdowns
async function getFilterOptions() {
  const [inks, rarities, rawTypes] = await Promise.all([
    prisma.card
      .findMany({ select: { ink: true }, distinct: ["ink"], where: { ink: { not: null } }, orderBy: { ink: "asc" } })
      .then((rows) => rows.map((r) => r.ink as string)),
    prisma.card
      .findMany({ select: { rarity: true }, distinct: ["rarity"], orderBy: { rarity: "asc" } })
      .then((rows) => rows.map((r) => r.rarity)),
    prisma.card.findMany({ select: { type: true }, take: 500 }),
  ]);

  const types = Array.from(
    new Set(
      rawTypes.flatMap((r) =>
        Array.isArray(r.type) ? (r.type as string[]) : []
      )
    )
  ).sort();

  return { inks, rarities, types };
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getString(
  val: string | string[] | undefined,
  fallback = ""
): string {
  if (!val) return fallback;
  return Array.isArray(val) ? (val[0] ?? fallback) : val;
}

export default async function CatalogoPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const q = getString(sp["q"]);
  const setCode = getString(sp["setCode"]);
  const ink = getString(sp["ink"]);
  const rarity = getString(sp["rarity"]);
  const type = getString(sp["type"]);
  const costStr = getString(sp["cost"]);
  const hasPriceUsd = getString(sp["hasPriceUsd"]);
  const hasPriceUsdFoil = getString(sp["hasPriceUsdFoil"]);
  const sortBy = getString(sp["sortBy"], "name");
  const ownershipRaw = getString(sp["ownership"], "all");
  const VALID_OWNERSHIP = ["all","owned","not_owned","owned_normal","owned_foil","owned_both"];
  const ownership = VALID_OWNERSHIP.includes(ownershipRaw)
    ? (ownershipRaw as OwnershipFilter)
    : "all";
  const pageStr = getString(sp["page"], "1");
  const page = Math.max(1, parseInt(pageStr, 10) || 1);

  const user = await getCurrentUser();

  const [result, sets, filterOpts] = await Promise.all([
    searchCards({
      q: q || undefined,
      setCode: setCode || undefined,
      ink: ink || undefined,
      rarity: rarity || undefined,
      type: type || undefined,
      cost: costStr ? parseInt(costStr, 10) : undefined,
      hasPriceUsd: hasPriceUsd === "1" ? true : undefined,
      hasPriceUsdFoil: hasPriceUsdFoil === "1" ? true : undefined,
      sortBy,
      page,
      pageSize: 24,
      ownershipFilter: user ? ownership : undefined,
      currentUserId: user?.id,
    }),
    findAllCardSets(),
    getFilterOptions(),
  ]);

  const cardIds = result.cards.map((c) => c.id);
  const collectionMap = user
    ? await findCollectionItemsByCardIds(user.id, cardIds)
    : null;

  const currentValues = {
    q,
    setCode,
    ink,
    rarity,
    type,
    cost: costStr,
    hasPriceUsd,
    hasPriceUsdFoil,
    sortBy,
    ownership,
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Catálogo
        {result.total > 0 && (
          <span className="ml-2 text-base font-normal text-slate-500 dark:text-navy-300">
            ({result.total.toLocaleString("pt-BR")} cartas)
          </span>
        )}
      </h1>

      <div className="flex gap-6 lg:gap-8">
        {/* sidebar */}
        <div className="hidden w-52 shrink-0 lg:block xl:w-60">
          <Suspense>
            <CatalogFilters
              sets={sets.map((s) => ({ code: s.code, name: s.name }))}
              inks={filterOpts.inks}
              rarities={filterOpts.rarities}
              types={filterOpts.types}
              currentValues={currentValues}
              showOwnershipFilter={!!user}
            />
          </Suspense>
        </div>

        {/* main */}
        <div className="min-w-0 flex-1">
          {result.cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <svg
                className="mb-4 h-16 w-16 text-slate-300 dark:text-navy-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg font-medium text-slate-500 dark:text-navy-300">
                Nenhuma carta encontrada
              </p>
              <p className="mt-1 text-sm text-slate-400 dark:text-navy-400">
                Tente ajustar os filtros ou sincronize o catálogo em
                Configurações.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
              <Suspense>
                <Pagination page={result.page} totalPages={result.totalPages} />
              </Suspense>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
