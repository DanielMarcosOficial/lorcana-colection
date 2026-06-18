import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ExternalSet, ExternalCard, CatalogProvider } from "@/lib/catalog/providers/types";

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("@/modules/sync/sync.repository", () => ({
  createSyncRun: vi.fn(),
  updateSyncRun: vi.fn(),
  createSyncError: vi.fn(),
}));

vi.mock("@/modules/catalog/card-set.repository", () => ({
  upsertCardSet: vi.fn(),
  updateCardSetTotalCards: vi.fn(),
}));

vi.mock("@/modules/catalog/card.repository", () => ({
  upsertCard: vi.fn(),
  countCardsBySetId: vi.fn(),
}));

vi.mock("@/modules/prices/price-history.repository", () => ({
  upsertPriceHistory: vi.fn().mockResolvedValue(undefined),
}));

import * as syncRepo from "@/modules/sync/sync.repository";
import * as setRepo from "@/modules/catalog/card-set.repository";
import * as cardRepo from "@/modules/catalog/card.repository";
import { runLorcastSync } from "@/lib/catalog/sync/sync.service";

const mockSet: ExternalSet = {
  id: "set_001",
  code: "1",
  name: "The First Chapter",
  releasedAt: "2023-08-18",
  prereleasedAt: "2023-08-18",
};

const mockCard: ExternalCard = {
  id: "crd_001",
  tcgplayerId: null,
  name: "Elsa",
  version: "Snow Queen",
  fullName: "Elsa - Snow Queen",
  collectorNumber: "42",
  rarity: "Rare",
  ink: "Sapphire",
  cost: 3,
  inkwell: false,
  type: ["Character"],
  classifications: ["Storyborn"],
  strength: 2,
  willpower: 3,
  lore: 2,
  moveCost: null,
  rulesText: null,
  flavorText: null,
  illustrators: ["Artist"],
  imageSmall: null,
  imageNormal: null,
  imageLarge: null,
  priceUsd: "0.50",
  priceUsdFoil: null,
  setExternalId: "set_001",
  setCode: "1",
  setName: "The First Chapter",
};

function makeProvider(overrides?: Partial<CatalogProvider>): CatalogProvider {
  return {
    listSets: vi.fn().mockResolvedValue([mockSet]),
    listCardsBySet: vi.fn().mockResolvedValue([mockCard]),
    searchCards: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(syncRepo.createSyncRun).mockResolvedValue({
    id: "run_001",
    source: "lorcast",
    status: "RUNNING",
    startedAt: new Date(),
    finishedAt: null,
    setsCreated: 0,
    setsUpdated: 0,
    cardsCreated: 0,
    cardsUpdated: 0,
    cardsSkipped: 0,
    errorCount: 0,
    metadata: null,
  });
  vi.mocked(setRepo.upsertCardSet).mockResolvedValue({ created: true, id: "cardset_001" });
  vi.mocked(cardRepo.upsertCard).mockResolvedValue({ created: true, id: "card_001" });
  vi.mocked(cardRepo.countCardsBySetId).mockResolvedValue(1);
  vi.mocked(syncRepo.updateSyncRun).mockResolvedValue(undefined as never);
  vi.mocked(syncRepo.createSyncError).mockResolvedValue(undefined as never);
  vi.mocked(setRepo.updateCardSetTotalCards).mockResolvedValue(undefined as never);
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("runLorcastSync", () => {
  it("cria um SyncRun no início", async () => {
    await runLorcastSync(makeProvider());
    expect(syncRepo.createSyncRun).toHaveBeenCalledWith("lorcast:manual");
  });

  it("busca expansões do provider", async () => {
    const provider = makeProvider();
    await runLorcastSync(provider);
    expect(provider.listSets).toHaveBeenCalledOnce();
  });

  it("cria expansão no banco (upsert created=true)", async () => {
    await runLorcastSync(makeProvider());
    expect(setRepo.upsertCardSet).toHaveBeenCalledWith(mockSet);
    const finalUpdate = vi.mocked(syncRepo.updateSyncRun).mock.calls.at(-1)?.[1];
    expect(finalUpdate?.setsCreated).toBe(1);
    expect(finalUpdate?.setsUpdated).toBe(0);
  });

  it("atualiza expansão existente (upsert created=false)", async () => {
    vi.mocked(setRepo.upsertCardSet).mockResolvedValue({ created: false, id: "cardset_001" });
    await runLorcastSync(makeProvider());
    const finalUpdate = vi.mocked(syncRepo.updateSyncRun).mock.calls.at(-1)?.[1];
    expect(finalUpdate?.setsUpdated).toBe(1);
    expect(finalUpdate?.setsCreated).toBe(0);
  });

  it("busca cartas de cada expansão", async () => {
    const provider = makeProvider();
    await runLorcastSync(provider);
    expect(provider.listCardsBySet).toHaveBeenCalledWith("1");
  });

  it("cria carta no banco (upsert created=true)", async () => {
    await runLorcastSync(makeProvider());
    expect(cardRepo.upsertCard).toHaveBeenCalledWith(mockCard, "cardset_001");
    const finalUpdate = vi.mocked(syncRepo.updateSyncRun).mock.calls.at(-1)?.[1];
    expect(finalUpdate?.cardsCreated).toBe(1);
    expect(finalUpdate?.cardsUpdated).toBe(0);
  });

  it("atualiza preço em segunda sincronização (upsert created=false)", async () => {
    vi.mocked(cardRepo.upsertCard).mockResolvedValue({ created: false, id: "card_001" });
    await runLorcastSync(makeProvider());
    const finalUpdate = vi.mocked(syncRepo.updateSyncRun).mock.calls.at(-1)?.[1];
    expect(finalUpdate?.cardsUpdated).toBe(1);
    expect(finalUpdate?.cardsCreated).toBe(0);
  });

  it("finaliza com SUCCESS quando não há erros", async () => {
    await runLorcastSync(makeProvider());
    const finalUpdate = vi.mocked(syncRepo.updateSyncRun).mock.calls.at(-1)?.[1];
    expect(finalUpdate?.status).toBe("SUCCESS");
    expect(finalUpdate?.finishedAt).toBeInstanceOf(Date);
  });

  it("registra SyncError em falha de carta e seta status PARTIAL", async () => {
    vi.mocked(cardRepo.upsertCard).mockRejectedValue(new Error("DB error"));
    await runLorcastSync(makeProvider());

    expect(syncRepo.createSyncError).toHaveBeenCalledWith(
      expect.objectContaining({
        syncRunId: "run_001",
        entityType: "card",
        externalId: "crd_001",
        message: "DB error",
      })
    );

    const finalUpdate = vi.mocked(syncRepo.updateSyncRun).mock.calls.at(-1)?.[1];
    expect(finalUpdate?.status).toBe("PARTIAL");
    expect(finalUpdate?.errorCount).toBe(1);
    expect(finalUpdate?.cardsSkipped).toBe(1);
  });

  it("registra SyncError e seta FAILED quando falha ao buscar sets", async () => {
    const provider = makeProvider({
      listSets: vi.fn().mockRejectedValue(new Error("Network error")),
    });
    await runLorcastSync(provider);

    expect(syncRepo.createSyncError).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "set_list",
        message: "Network error",
      })
    );
    const finalUpdate = vi.mocked(syncRepo.updateSyncRun).mock.calls.at(-1)?.[1];
    expect(finalUpdate?.status).toBe("FAILED");
  });

  it("continua para próxima expansão em falha de listagem de cartas", async () => {
    const set2: ExternalSet = { ...mockSet, id: "set_002", code: "2", name: "Floodborn" };
    const provider = makeProvider({
      listSets: vi.fn().mockResolvedValue([mockSet, set2]),
      listCardsBySet: vi
        .fn()
        .mockRejectedValueOnce(new Error("API down"))
        .mockResolvedValueOnce([mockCard]),
    });
    vi.mocked(setRepo.upsertCardSet)
      .mockResolvedValueOnce({ created: true, id: "cardset_001" })
      .mockResolvedValueOnce({ created: true, id: "cardset_002" });

    await runLorcastSync(provider);

    const finalUpdate = vi.mocked(syncRepo.updateSyncRun).mock.calls.at(-1)?.[1];
    expect(finalUpdate?.cardsCreated).toBe(1);
    expect(finalUpdate?.errorCount).toBe(1);
    expect(finalUpdate?.status).toBe("PARTIAL");
  });

  it("idempotente: segunda execução com mesmas cartas não duplica", async () => {
    vi.mocked(setRepo.upsertCardSet).mockResolvedValue({ created: false, id: "cardset_001" });
    vi.mocked(cardRepo.upsertCard).mockResolvedValue({ created: false, id: "card_001" });

    await runLorcastSync(makeProvider());
    await runLorcastSync(makeProvider());

    expect(setRepo.upsertCardSet).toHaveBeenCalledTimes(2);
    expect(cardRepo.upsertCard).toHaveBeenCalledTimes(2);

    const [call1, call2] = vi.mocked(syncRepo.updateSyncRun).mock.calls
      .filter((c) => c[1]?.status !== undefined)
      .slice(-2);

    expect(call1?.[1]?.setsCreated).toBe(0);
    expect(call2?.[1]?.setsCreated).toBe(0);
  });
});
