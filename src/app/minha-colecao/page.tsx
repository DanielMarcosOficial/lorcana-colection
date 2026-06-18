import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/auth";
import { getCollectionStats, searchUserCollection } from "@/modules/collection/collection.repository";
import { findAllCardSets } from "@/modules/catalog/card-set.repository";
import { prisma } from "@/lib/database/prisma";
import { CollectionStatsBar } from "./_components/CollectionStats";
import { CollectionFilters } from "./_components/CollectionFilters";
import { CollectionItemCard } from "./_components/CollectionItemCard";
import { Pagination } from "@/app/catalogo/_components/Pagination";

export const metadata: Metadata = { title: "Minha Coleção" };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getString(val: string | string[] | undefined, fallback = ""): string {
  if (!val) return fallback;
  return Array.isArray(val) ? (val[0] ?? fallback) : val;
}

async function getFilterOptions(userId: string) {
  const [inks, rarities] = await Promise.all([
    prisma.collectionItem
      .findMany({
        where: { userId, card: { ink: { not: null } } },
        select: { card: { select: { ink: true } } },
        distinct: [],
      })
      .then((rows) =>
        Array.from(new Set(rows.map((r) => r.card.ink as string))).sort()
      ),
    prisma.collectionItem
      .findMany({
        where: { userId },
        select: { card: { select: { rarity: true } } },
      })
      .then((rows) =>
        Array.from(new Set(rows.map((r) => r.card.rarity))).sort()
      ),
  ]);
  return { inks, rarities };
}

export default async function MinhaColecaoPage({ searchParams }: PageProps) {
  const user = await requireUser();

  const sp = await searchParams;
  const q = getString(sp["q"]);
  const setCode = getString(sp["setCode"]);
  const ink = getString(sp["ink"]);
  const rarity = getString(sp["rarity"]);
  const hasNormal = getString(sp["hasNormal"]);
  const hasFoil = getString(sp["hasFoil"]);
  const hasDuplicates = getString(sp["hasDuplicates"]);
  const hasPrice = getString(sp["hasPrice"]);
  const sortBy = getString(sp["sortBy"], "recentlyAdded");
  const pageStr = getString(sp["page"], "1");
  const page = Math.max(1, parseInt(pageStr, 10) || 1);

  const [stats, result, sets, filterOpts] = await Promise.all([
    getCollectionStats(user.id),
    searchUserCollection(user.id, {
      q: q || undefined,
      setCode: setCode || undefined,
      ink: ink || undefined,
      rarity: rarity || undefined,
      hasNormal: hasNormal === "1",
      hasFoil: hasFoil === "1",
      hasDuplicates: hasDuplicates === "1",
      hasPrice: hasPrice === "1",
      sortBy,
      page,
      pageSize: 24,
    }),
    findAllCardSets(),
    getFilterOptions(user.id),
  ]);

  const currentValues = {
    q, setCode, ink, rarity,
    hasNormal, hasFoil, hasDuplicates, hasPrice, sortBy,
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Minha Coleção
      </h1>

      <div className="mb-6">
        <CollectionStatsBar stats={stats} />
      </div>

      {stats.distinctCards === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg font-medium text-slate-500 dark:text-navy-300">
            Sua coleção está vazia
          </p>
          <p className="mt-1 text-sm text-slate-400 dark:text-navy-400">
            Adicione cartas usando os botões + no{" "}
            <Link href="/catalogo" className="text-indigo-600 hover:underline dark:text-indigo-400">
              Catálogo
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="flex gap-6 lg:gap-8">
          {/* sidebar */}
          <div className="hidden w-52 shrink-0 lg:block xl:w-60">
            <Suspense>
              <CollectionFilters
                sets={sets.map((s) => ({ code: s.code, name: s.name }))}
                inks={filterOpts.inks}
                rarities={filterOpts.rarities}
                currentValues={currentValues}
              />
            </Suspense>
          </div>

          {/* main */}
          <div className="min-w-0 flex-1">
            <p className="mb-3 text-sm text-slate-500 dark:text-navy-300">
              {result.total.toLocaleString("pt-BR")}{" "}
              {result.total === 1 ? "carta" : "cartas"} encontrada{result.total === 1 ? "" : "s"}
            </p>

            {result.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-slate-500 dark:text-navy-300">
                  Nenhuma carta corresponde aos filtros.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {result.items.map((item) => (
                    <CollectionItemCard
                      key={item.id}
                      item={{
                        ...item,
                        normalPurchasePrice: item.normalPurchasePrice
                          ? String(item.normalPurchasePrice)
                          : null,
                        foilPurchasePrice: item.foilPurchasePrice
                          ? String(item.foilPurchasePrice)
                          : null,
                        card: {
                          ...item.card,
                          priceUsd: item.card.priceUsd
                            ? String(item.card.priceUsd)
                            : null,
                          priceUsdFoil: item.card.priceUsdFoil
                            ? String(item.card.priceUsdFoil)
                            : null,
                        },
                      }}
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
      )}
    </div>
  );
}
