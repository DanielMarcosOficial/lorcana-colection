import type { CatalogProvider } from "@/lib/catalog/providers/types";
import {
  createSyncRun,
  updateSyncRun,
  createSyncError,
} from "@/modules/sync/sync.repository";
import {
  upsertCardSet,
  updateCardSetTotalCards,
} from "@/modules/catalog/card-set.repository";
import { upsertCard, countCardsBySetId } from "@/modules/catalog/card.repository";
import { upsertPriceHistory } from "@/modules/prices/price-history.repository";
import { Prisma } from "@prisma/client";

const SET_CONCURRENCY = 1; // one set at a time — respect rate limits

export async function runLorcastSync(provider: CatalogProvider, origin = "manual") {
  const run = await createSyncRun(`lorcast:${origin}`);

  const counters = {
    setsCreated: 0,
    setsUpdated: 0,
    cardsCreated: 0,
    cardsUpdated: 0,
    cardsSkipped: 0,
    errorCount: 0,
  };

  console.log(
    JSON.stringify({ event: "sync.start", syncRunId: run.id })
  );

  // ── 1. Fetch sets ──────────────────────────────────────────────────────────
  let externalSets;
  try {
    externalSets = await provider.listSets();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await createSyncError({
      syncRunId: run.id,
      entityType: "set_list",
      message,
      details: { error: String(err) },
    });
    await updateSyncRun(run.id, {
      status: "FAILED",
      finishedAt: new Date(),
      errorCount: 1,
    });
    console.log(
      JSON.stringify({ event: "sync.failed", syncRunId: run.id, error: message })
    );
    return run.id;
  }

  console.log(
    JSON.stringify({
      event: "sync.sets_fetched",
      count: externalSets.length,
    })
  );

  // ── 2. Process sets sequentially ──────────────────────────────────────────
  const setsToProcess = externalSets;
  for (let i = 0; i < setsToProcess.length; i += SET_CONCURRENCY) {
    const batch = setsToProcess.slice(i, i + SET_CONCURRENCY);

    for (const extSet of batch) {
      // 2a. Upsert the set — outside transaction, no lock held during API call
      let setId: string;
      try {
        const result = await upsertCardSet(extSet);
        setId = result.id;
        if (result.created) {
          counters.setsCreated++;
        } else {
          counters.setsUpdated++;
        }
        console.log(
          JSON.stringify({
            event: "sync.set_upserted",
            code: extSet.code,
            created: result.created,
          })
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        counters.errorCount++;
        await createSyncError({
          syncRunId: run.id,
          entityType: "set",
          externalId: extSet.id,
          message,
          details: { setCode: extSet.code, error: String(err) },
        });
        console.log(
          JSON.stringify({
            event: "sync.set_error",
            setCode: extSet.code,
            error: message,
          })
        );
        continue;
      }

      // 2b. Fetch cards for this set — API call outside DB transaction
      let externalCards;
      try {
        externalCards = await provider.listCardsBySet(extSet.code);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        counters.errorCount++;
        await createSyncError({
          syncRunId: run.id,
          entityType: "card_list",
          externalId: extSet.id,
          message,
          details: { setCode: extSet.code, error: String(err) },
        });
        console.log(
          JSON.stringify({
            event: "sync.card_list_error",
            setCode: extSet.code,
            error: message,
          })
        );
        continue;
      }

      // 2c. Upsert cards one by one — individual errors don't stop the set
      for (const extCard of externalCards) {
        try {
          const result = await upsertCard(extCard, setId);
          if (result.created) {
            counters.cardsCreated++;
          } else {
            counters.cardsUpdated++;
          }
          // Record price history (fire-and-forget, non-critical)
          if (extCard.priceUsd !== null || extCard.priceUsdFoil !== null) {
            upsertPriceHistory({
              cardId: result.id,
              priceUsd: extCard.priceUsd ? new Prisma.Decimal(extCard.priceUsd) : null,
              priceUsdFoil: extCard.priceUsdFoil ? new Prisma.Decimal(extCard.priceUsdFoil) : null,
            }).catch(() => {});
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          counters.errorCount++;
          counters.cardsSkipped++;
          await createSyncError({
            syncRunId: run.id,
            entityType: "card",
            externalId: extCard.id,
            message,
            details: { setCode: extSet.code, error: String(err) },
          });
        }
      }

      // 2d. Update totalCards on the set
      try {
        const total = await countCardsBySetId(setId);
        await updateCardSetTotalCards(setId, total);
      } catch {
        // non-critical — continue
      }

      console.log(
        JSON.stringify({
          event: "sync.set_complete",
          setCode: extSet.code,
          cards: externalCards.length,
        })
      );
    }
  }

  // ── 3. Finalize ────────────────────────────────────────────────────────────
  const totalProcessed =
    counters.setsCreated +
    counters.setsUpdated +
    counters.cardsCreated +
    counters.cardsUpdated;

  const finalStatus =
    counters.errorCount === 0
      ? "SUCCESS"
      : totalProcessed > 0
        ? "PARTIAL"
        : "FAILED";

  await updateSyncRun(run.id, {
    ...counters,
    status: finalStatus,
    finishedAt: new Date(),
  });

  console.log(
    JSON.stringify({
      event: "sync.finished",
      syncRunId: run.id,
      status: finalStatus,
      ...counters,
    })
  );

  return run.id;
}
