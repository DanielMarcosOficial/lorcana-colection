import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findCardById } from "@/modules/catalog/card.repository";

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

export default async function CardDetailPage({ params }: PageProps) {
  const { cardId } = await params;
  const card = await findCardById(cardId);
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
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {card.name}
          </h1>
          {card.version && (
            <p className="mt-0.5 text-lg italic text-slate-500 dark:text-navy-300">
              {card.version}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-navy-700 dark:text-navy-200">
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
        </div>
      </div>
    </div>
  );
}
