import "dotenv/config";
import { LorcastCatalogProvider } from "../src/lib/catalog/providers/lorcast.provider";
import { runLorcastSync } from "../src/lib/catalog/sync/sync.service";
import { findSyncRunById } from "../src/modules/sync/sync.repository";

async function main() {
  console.log("Iniciando sincronização com a Lorcast...\n");
  const provider = new LorcastCatalogProvider();
  const syncRunId = await runLorcastSync(provider);
  const run = await findSyncRunById(syncRunId);

  console.log("\n─── Resultado ───────────────────────────");
  console.log(`Status:          ${run?.status}`);
  console.log(`Expansões criadas: ${run?.setsCreated}`);
  console.log(`Expansões atualizadas: ${run?.setsUpdated}`);
  console.log(`Cartas criadas:   ${run?.cardsCreated}`);
  console.log(`Cartas atualizadas: ${run?.cardsUpdated}`);
  console.log(`Cartas com erro:  ${run?.cardsSkipped}`);
  console.log(`Erros totais:    ${run?.errorCount}`);
  if (run?.finishedAt && run?.startedAt) {
    const secs = ((run.finishedAt.getTime() - run.startedAt.getTime()) / 1000).toFixed(1);
    console.log(`Duração:         ${secs}s`);
  }
  console.log("─────────────────────────────────────────\n");

  if ((run?.errorCount ?? 0) > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
