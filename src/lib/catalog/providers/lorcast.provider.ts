import { z } from "zod";
import type { CatalogProvider, ExternalCard, ExternalSet } from "./types";

const BASE_URL = "https://api.lorcast.com/v0";
const REQUEST_TIMEOUT_MS = 15_000;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1_000;
const RATE_LIMIT_DELAY_MS = 250;

// ─── Zod schemas ────────────────────────────────────────────────────────────

export const lorcastSetSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  released_at: z.string().nullable().optional(),
  prereleased_at: z.string().nullable().optional(),
});

export type LorcastSet = z.infer<typeof lorcastSetSchema>;

export const lorcastSetsResponseSchema = z.object({
  results: z.array(lorcastSetSchema),
});

const lorcastPricesSchema = z
  .object({
    usd: z.union([z.string(), z.number()]).nullable().optional(),
    usd_foil: z.union([z.string(), z.number()]).nullable().optional(),
  })
  .nullable()
  .optional();

const lorcastImageUrisSchema = z
  .object({
    digital: z
      .object({
        small: z.string().nullable().optional(),
        normal: z.string().nullable().optional(),
        large: z.string().nullable().optional(),
      })
      .optional(),
  })
  .nullable()
  .optional();

export const lorcastCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string().nullable().optional(),
  cost: z.number().nullable().optional(),
  inkwell: z.boolean().optional().default(false),
  ink: z.string().nullable().optional(),
  type: z.preprocess((v) => v ?? [], z.array(z.string())),
  classifications: z.preprocess((v) => v ?? [], z.array(z.string())),
  text: z.string().nullable().optional(),
  move_cost: z.number().nullable().optional(),
  strength: z.number().nullable().optional(),
  willpower: z.number().nullable().optional(),
  lore: z.number().nullable().optional(),
  rarity: z.string(),
  illustrators: z.preprocess((v) => v ?? [], z.array(z.string())),
  collector_number: z.string(),
  flavor_text: z.string().nullable().optional(),
  tcgplayer_id: z.number().nullable().optional(),
  image_uris: lorcastImageUrisSchema,
  prices: lorcastPricesSchema,
  set: z
    .object({
      id: z.string(),
      code: z.string(),
      name: z.string(),
    })
    .optional(),
});

export type LorcastCard = z.infer<typeof lorcastCardSchema>;

// /sets/{code}/cards → plain array
export const lorcastCardsArraySchema = z.array(lorcastCardSchema);

// /cards/search → { results: [...] }
export const lorcastCardsResponseSchema = z.object({
  results: z.array(lorcastCardSchema),
});

// ─── Mapping ─────────────────────────────────────────────────────────────────

export function mapLorcastSet(raw: LorcastSet): ExternalSet {
  return {
    id: raw.id,
    code: raw.code,
    name: raw.name,
    releasedAt: raw.released_at ?? null,
    prereleasedAt: raw.prereleased_at ?? null,
  };
}

export function mapLorcastCard(raw: LorcastCard): ExternalCard {
  const version = raw.version ?? null;
  const fullName = version ? `${raw.name} - ${version}` : raw.name;

  const priceValue = (v: string | number | null | undefined): string | null => {
    if (v == null) return null;
    const str = String(v).trim();
    if (str === "" || str === "0" || str === "0.00") return null;
    return str;
  };

  return {
    id: raw.id,
    name: raw.name,
    version,
    cost: raw.cost ?? null,
    inkwell: raw.inkwell ?? false,
    ink: raw.ink ?? null,
    type: raw.type ?? [],
    classifications: raw.classifications ?? [],
    rulesText: raw.text ?? null,
    moveCost: raw.move_cost ?? null,
    strength: raw.strength ?? null,
    willpower: raw.willpower ?? null,
    lore: raw.lore ?? null,
    rarity: raw.rarity,
    illustrators: raw.illustrators ?? [],
    collectorNumber: raw.collector_number,
    flavorText: raw.flavor_text ?? null,
    tcgplayerId: raw.tcgplayer_id ?? null,
    imageSmall: raw.image_uris?.digital?.small ?? null,
    imageNormal: raw.image_uris?.digital?.normal ?? null,
    imageLarge: raw.image_uris?.digital?.large ?? null,
    priceUsd: priceValue(raw.prices?.usd),
    priceUsdFoil: priceValue(raw.prices?.usd_foil),
    setExternalId: raw.set?.id ?? "",
    setCode: raw.set?.code ?? "",
    setName: raw.set?.name ?? "",
    fullName,
  };
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function fetchWithRetry(url: string): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      const res = await fetchWithTimeout(url);

      if (!res.ok) {
        if (res.status >= 400 && res.status < 500) {
          throw new Error(
            `Lorcast HTTP ${res.status} for ${url}: non-retryable`
          );
        }
        throw new Error(`Lorcast HTTP ${res.status} for ${url}`);
      }

      const json = await res.json();
      return json;
    } catch (err) {
      lastError = err;
      const isNonRetryable =
        err instanceof Error && err.message.includes("non-retryable");
      if (isNonRetryable || attempt === RETRY_ATTEMPTS) break;

      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(
        JSON.stringify({
          event: "lorcast.retry",
          attempt,
          url,
          delay,
          error: String(err),
        })
      );
      await sleep(delay);
    }
  }
  throw lastError;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export class LorcastCatalogProvider implements CatalogProvider {
  async listSets(): Promise<ExternalSet[]> {
    console.log(JSON.stringify({ event: "lorcast.listSets.start" }));
    const raw = await fetchWithRetry(`${BASE_URL}/sets`);
    const parsed = lorcastSetsResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Lorcast /sets response invalid: ${parsed.error.message}`
      );
    }
    const sets = parsed.data.results.map(mapLorcastSet);
    console.log(
      JSON.stringify({ event: "lorcast.listSets.done", count: sets.length })
    );
    return sets;
  }

  async listCardsBySet(setCode: string): Promise<ExternalCard[]> {
    console.log(
      JSON.stringify({ event: "lorcast.listCardsBySet.start", setCode })
    );
    await sleep(RATE_LIMIT_DELAY_MS);
    const raw = await fetchWithRetry(`${BASE_URL}/sets/${setCode}/cards`);
    const parsed = lorcastCardsArraySchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Lorcast /sets/${setCode}/cards response invalid: ${parsed.error.message}`
      );
    }
    const cards = parsed.data.map(mapLorcastCard);
    console.log(
      JSON.stringify({
        event: "lorcast.listCardsBySet.done",
        setCode,
        count: cards.length,
      })
    );
    return cards;
  }

  async searchCards(query: string): Promise<ExternalCard[]> {
    const encoded = encodeURIComponent(query);
    await sleep(RATE_LIMIT_DELAY_MS);
    const raw = await fetchWithRetry(`${BASE_URL}/cards/search?q=${encoded}`);
    const parsed = lorcastCardsResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Lorcast /cards/search response invalid: ${parsed.error.message}`
      );
    }
    return parsed.data.results.map(mapLorcastCard);
  }
}
