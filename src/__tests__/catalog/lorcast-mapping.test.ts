import { describe, it, expect } from "vitest";
import {
  lorcastSetSchema,
  lorcastCardSchema,
  mapLorcastSet,
  mapLorcastCard,
  type LorcastCard,
} from "@/lib/catalog/providers/lorcast.provider";

// ── Payload validation ─────────────────────────────────────────────────────

describe("lorcastSetSchema", () => {
  it("valida um set completo", () => {
    const raw = {
      id: "set_abc",
      name: "The First Chapter",
      code: "1",
      released_at: "2023-08-18",
      prereleased_at: "2023-08-18",
    };
    const result = lorcastSetSchema.safeParse(raw);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("set_abc");
      expect(result.data.code).toBe("1");
    }
  });

  it("aceita set sem campos opcionais", () => {
    const raw = { id: "set_xyz", name: "Promo", code: "P1" };
    const result = lorcastSetSchema.safeParse(raw);
    expect(result.success).toBe(true);
  });

  it("rejeita set sem id", () => {
    const result = lorcastSetSchema.safeParse({ name: "X", code: "X" });
    expect(result.success).toBe(false);
  });
});

describe("lorcastCardSchema", () => {
  const validCard = {
    id: "crd_001",
    name: "Elsa",
    version: "Snow Queen",
    rarity: "Rare",
    collector_number: "42",
    inkwell: true,
    ink: "Sapphire",
    type: ["Character"],
    classifications: ["Storyborn", "Hero"],
    illustrators: ["John Doe"],
    cost: 3,
    strength: 2,
    willpower: 3,
    lore: 2,
    image_uris: {
      digital: { small: "https://ex.com/s.jpg", normal: "https://ex.com/n.jpg", large: "https://ex.com/l.jpg" },
    },
    prices: { usd: "0.50", usd_foil: "1.25" },
  };

  it("valida carta completa", () => {
    const result = lorcastCardSchema.safeParse(validCard);
    expect(result.success).toBe(true);
  });

  it("aceita prices como number", () => {
    const result = lorcastCardSchema.safeParse({
      ...validCard,
      prices: { usd: 0.5, usd_foil: 1.25 },
    });
    expect(result.success).toBe(true);
  });

  it("aceita carta sem campos opcionais", () => {
    const minimal = { id: "crd_002", name: "Pooh", rarity: "Common", collector_number: "1" };
    const result = lorcastCardSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it("rejeita carta sem rarity", () => {
    const noRarity = { ...validCard } as Record<string, unknown>;
    delete noRarity["rarity"];
    const result = lorcastCardSchema.safeParse(noRarity);
    expect(result.success).toBe(false);
  });

  it("rejeita carta sem collector_number", () => {
    const noNum = { ...validCard } as Record<string, unknown>;
    delete noNum["collector_number"];
    const result = lorcastCardSchema.safeParse(noNum);
    expect(result.success).toBe(false);
  });
});

// ── Mapping ────────────────────────────────────────────────────────────────

describe("mapLorcastSet", () => {
  it("mapeia todos os campos", () => {
    const raw = lorcastSetSchema.parse({
      id: "set_123",
      name: "Rise of the Floodborn",
      code: "2",
      released_at: "2023-11-17",
      prereleased_at: "2023-11-10",
    });
    const ext = mapLorcastSet(raw);
    expect(ext.id).toBe("set_123");
    expect(ext.code).toBe("2");
    expect(ext.name).toBe("Rise of the Floodborn");
    expect(ext.releasedAt).toBe("2023-11-17");
    expect(ext.prereleasedAt).toBe("2023-11-10");
  });

  it("mapeia campos ausentes como null", () => {
    const raw = lorcastSetSchema.parse({ id: "set_x", name: "Promo", code: "P1" });
    const ext = mapLorcastSet(raw);
    expect(ext.releasedAt).toBeNull();
    expect(ext.prereleasedAt).toBeNull();
  });
});

describe("mapLorcastCard", () => {
  const baseRaw: LorcastCard = {
    id: "crd_aaa",
    name: "Elsa",
    version: "Concerned Sister",
    rarity: "Uncommon",
    collector_number: "125",
    inkwell: true,
    ink: "Ruby",
    type: ["Character"],
    classifications: ["Storyborn"],
    illustrators: ["Hollie Hibbert"],
    cost: 3,
    strength: 2,
    willpower: 2,
    lore: 2,
    move_cost: null,
    text: "CLEAR THE WAY …",
    flavor_text: "Flavor text here",
    tcgplayer_id: 673302,
    image_uris: {
      digital: {
        small: "https://cards.lorcast.io/s.jpg",
        normal: "https://cards.lorcast.io/n.jpg",
        large: "https://cards.lorcast.io/l.jpg",
      },
    },
    prices: { usd: "0.12", usd_foil: "0.26" },
    set: { id: "set_zzz", code: "11", name: "Winterspell" },
  };

  it("constrói fullName com versão", () => {
    const ext = mapLorcastCard(baseRaw);
    expect(ext.fullName).toBe("Elsa - Concerned Sister");
  });

  it("constrói fullName sem versão", () => {
    const ext = mapLorcastCard({ ...baseRaw, version: null });
    expect(ext.fullName).toBe("Elsa");
    expect(ext.version).toBeNull();
  });

  it("mapeia imagens corretamente", () => {
    const ext = mapLorcastCard(baseRaw);
    expect(ext.imageSmall).toBe("https://cards.lorcast.io/s.jpg");
    expect(ext.imageNormal).toBe("https://cards.lorcast.io/n.jpg");
    expect(ext.imageLarge).toBe("https://cards.lorcast.io/l.jpg");
  });

  it("retorna null para imagens ausentes", () => {
    const ext = mapLorcastCard({ ...baseRaw, image_uris: null });
    expect(ext.imageSmall).toBeNull();
    expect(ext.imageNormal).toBeNull();
    expect(ext.imageLarge).toBeNull();
  });

  it("converte preços para string", () => {
    const ext = mapLorcastCard(baseRaw);
    expect(ext.priceUsd).toBe("0.12");
    expect(ext.priceUsdFoil).toBe("0.26");
  });

  it("converte preços numéricos para string", () => {
    const ext = mapLorcastCard({ ...baseRaw, prices: { usd: 0.5, usd_foil: 1.25 } });
    expect(ext.priceUsd).toBe("0.5");
    expect(ext.priceUsdFoil).toBe("1.25");
  });

  it("retorna null para preços ausentes", () => {
    const ext = mapLorcastCard({ ...baseRaw, prices: null });
    expect(ext.priceUsd).toBeNull();
    expect(ext.priceUsdFoil).toBeNull();
  });

  it("retorna null para preço zero", () => {
    const ext = mapLorcastCard({ ...baseRaw, prices: { usd: "0", usd_foil: 0 } });
    expect(ext.priceUsd).toBeNull();
    expect(ext.priceUsdFoil).toBeNull();
  });

  it("mapeia atributos de personagem", () => {
    const ext = mapLorcastCard(baseRaw);
    expect(ext.strength).toBe(2);
    expect(ext.willpower).toBe(2);
    expect(ext.lore).toBe(2);
    expect(ext.inkwell).toBe(true);
    expect(ext.cost).toBe(3);
    expect(ext.ink).toBe("Ruby");
  });

  it("mapeia arrays corretamente", () => {
    const ext = mapLorcastCard(baseRaw);
    expect(ext.type).toEqual(["Character"]);
    expect(ext.classifications).toEqual(["Storyborn"]);
    expect(ext.illustrators).toEqual(["Hollie Hibbert"]);
  });
});
