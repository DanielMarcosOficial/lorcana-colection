import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const run = await prisma.syncRun.findFirst({
  orderBy: { startedAt: "desc" },
  include: { errors: { take: 10 } },
});

if (!run) {
  console.log("Nenhum SyncRun encontrado.");
} else {
  console.log("Status:          ", run.status);
  console.log("setsCreated:     ", run.setsCreated);
  console.log("setsUpdated:     ", run.setsUpdated);
  console.log("cardsCreated:    ", run.cardsCreated);
  console.log("cardsUpdated:    ", run.cardsUpdated);
  console.log("cardsSkipped:    ", run.cardsSkipped);
  console.log("errorCount:      ", run.errorCount);
  console.log("startedAt:       ", run.startedAt);
  console.log("finishedAt:      ", run.finishedAt);

  if (run.errors.length) {
    console.log("\nErros registrados:");
    for (const e of run.errors) {
      console.log(" -", e.entityType, "|", e.message.slice(0, 200));
    }
  } else {
    console.log("\nNenhum erro registrado.");
  }
}

const cardCount = await prisma.card.count();
const setCount = await prisma.cardSet.count();
console.log("\nNo banco agora:");
console.log("  card_sets:", setCount);
console.log("  cards:    ", cardCount);

await prisma.$disconnect();
