export interface ExternalSet {
  id: string;
  code: string;
  name: string;
  releasedAt: string | null;
  prereleasedAt: string | null;
}

export interface ExternalCard {
  id: string;
  name: string;
  version: string | null;
  fullName: string;
  cost: number | null;
  inkwell: boolean;
  ink: string | null;
  type: string[];
  classifications: string[];
  rulesText: string | null;
  moveCost: number | null;
  strength: number | null;
  willpower: number | null;
  lore: number | null;
  rarity: string;
  illustrators: string[];
  collectorNumber: string;
  flavorText: string | null;
  tcgplayerId: number | null;
  imageSmall: string | null;
  imageNormal: string | null;
  imageLarge: string | null;
  priceUsd: string | null;
  priceUsdFoil: string | null;
  setExternalId: string;
  setCode: string;
  setName: string;
}

export interface CatalogProvider {
  listSets(): Promise<ExternalSet[]>;
  listCardsBySet(setCode: string): Promise<ExternalCard[]>;
  searchCards(query: string): Promise<ExternalCard[]>;
}
