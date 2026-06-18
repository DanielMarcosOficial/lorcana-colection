import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findCardById, findAlternateVersions } from "@/modules/catalog/card.repository";

interface PageProps {
  params: Promise<{ cardId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cardId } = await params;
  const card = await findCardById(cardId);
  if (!card) return { title: "Carta não encontrada" };
  return { title: card.fullName };
}

function Detail({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-navy-300">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}

function formatPrice(price: unknown): string {
  if (price == null) return "—";
  return `$${Number(price).toFixed(2)}`;
}

const RARITY_STYLE: Record<string, string> = {
  Common:       "bg-slate-100 text-slate-600 dark:bg-navy-700 dark:text-navy-200",
  Uncommon:     "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Rare:         "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "Super Rare": "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  Legendary:    "bg-amber-50 text-amber-700 dark:bg-foil-950 dark:text-amber-300",
  Enchanted:    "bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
  Special:      "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  Promo:        "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
};

export default async function CardDetailPage({ params }: PageProps) {
  const { cardId } = await params;

  const [card, alternates] = await Promise.all([
    findCardById(cardId),
    findAlternateVersions(cardId),
  ]);

  if (!card) notFound();

  const types = Array.isArray(card.type) ? (card.type as string[]) : [];
  const classifications = Array.isArray(card.classifications)
    ? (card.classifications as string[])
    : [];
  const illustrators = Array.isArray(card.illustrators)
    ? (card.illustrators as string[])
    : [];
  const hasPrice = card.priceUsd !== null || card.priceUsdFoil !== null;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link
          href="/catalogo"
          className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
        >
          ← Voltar ao catálogo
        </Link>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Card image */}
        <div className="shrink-0 md:w-64 lg:w-72">
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-slate-100 shadow-xl dark:bg-navy-700">
            {card.imageLarge ?? card.imageNormal ? (
              <Image
                src={(card.imageLarge ?? card.imageNormal)!}
                alt={card.fullName}
                fill
                sizes="(max-width: 768px) 90vw, 288px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-300 dark:text-navy-600">
                <svg className="h-20 w-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {card.name}
          </h1>
          {card.version && (
            <p className="mt-0.5 text-lg italic text-slate-500 dark:text-navy-300">
              {card.version}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${RARITY_STYLE[card.rarity] ?? "bg-slate-100 text-slate-600 dark:bg-navy-700 dark:text-navy-200"}`}>
              {card.rarity}
            </span>
            {card.ink && (
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {card.ink}
              </span>
            )}
            {types.map((t) => (
              <span
                key={t}
                className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              >
                {t}
              </span>
            ))}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Detail
              label="Expansão"
              value={
                <Link
                  href={`/expansoes/${card.set.code}`}
                  className="text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {card.set.name}
                </Link>
              }
            />
            <Detail label="Número" value={`#${card.collectorNumber}`} />
            {card.cost !== null && <Detail label="Custo" value={card.cost} />}
            {card.inkwell && <Detail label="Tinta" value="Pode ser usado como tinta" />}
            {card.strength !== null && <Detail label="Força" value={card.strength} />}
            {card.willpower !== null && <Detail label="Resistência" value={card.willpower} />}
            {card.lore !== null && <Detail label="Lore" value={card.lore} />}
            {card.moveCost !== null && <Detail label="Custo de mover" value={card.moveCost} />}
            {classifications.length > 0 && (
              <Detail label="Classificações" value={classifications.join(", ")} />
            )}
            {illustrators.length > 0 && (
              <Detail
                label={illustrators.length === 1 ? "Ilustrador" : "Ilustradores"}
                value={illustrators.join(", ")}
              />
            )}
            {card.tcgplayerId && (
              <Detail label="TCGplayer ID" value={card.tcgplayerId} />
            )}
          </dl>

          {card.rulesText && (
            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-navy-300">
                Texto
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">
                {card.rulesText}
              </p>
            </div>
          )}

          {card.flavorText && (
            <div className="mt-4">
              <p className="italic text-sm text-slate-500 dark:text-navy-300">
                &ldquo;{card.flavorText}&rdquo;
              </p>
            </div>
          )}

          {hasPrice && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-navy-600 dark:bg-navy-700">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-navy-300">
                Preços de mercado
              </p>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-slate-500 dark:text-navy-300">Normal</p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {formatPrice(card.priceUsd)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-amber-600 dark:text-amber-400">✦ Foil</p>
                  <p className="text-xl font-semibold text-amber-600 dark:text-amber-400">
                    {formatPrice(card.priceUsdFoil)}
                  </p>
                </div>
              </div>
              {card.priceUpdatedAt && (
                <p className="mt-2 text-xs text-slate-400 dark:text-navy-400">
                  Atualizado em{" "}
                  {new Date(card.priceUpdatedAt).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          )}

          {/* ── Versões alternativas ── */}
          {alternates.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-navy-300">
                Outras versões ({alternates.length})
              </p>
              <div className="flex flex-col gap-2">
                {alternates.map((alt) => {
                  const rarityClass = RARITY_STYLE[alt.rarity] ?? "bg-slate-100 text-slate-600 dark:bg-navy-700 dark:text-navy-200";
                  const altHasPrice = alt.priceUsd !== null || alt.priceUsdFoil !== null;

                  return (
                    <Link
                      key={alt.id}
                      href={`/catalogo/${alt.id}`}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-indigo-300 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-navy-600 dark:bg-navy-800 dark:hover:border-indigo-700 transition-all"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-navy-700">
                        {alt.imageNormal ? (
                          <Image
                            src={alt.imageNormal}
                            alt={alt.fullName}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-300 dark:text-navy-600">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${rarityClass}`}>
                            {alt.rarity}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-navy-400">
                            #{alt.collectorNumber}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                          {alt.set.name}
                        </p>
                      </div>

                      {/* Prices */}
                      {altHasPrice && (
                        <div className="shrink-0 text-right">
                          {alt.priceUsd !== null && (
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {formatPrice(alt.priceUsd)}
                            </p>
                          )}
                          {alt.priceUsdFoil !== null && (
                            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                              ✦ {formatPrice(alt.priceUsdFoil)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Arrow */}
                      <svg className="h-4 w-4 shrink-0 text-slate-400 dark:text-navy-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
