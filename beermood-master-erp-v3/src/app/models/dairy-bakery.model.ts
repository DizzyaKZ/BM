export interface DairyRecipe {
  id: string;
  name: string;
  nameKz: string;
  category: 'CHEESE' | 'SOUR_MILK' | 'DESSERT';
  starterCulture: string; // e.g. Sacco MS062, MS064
  starterDosagePer100L: string;
  enzyme: string; // e.g. Сычужный фермент Chymosin 100% / микробиальный
  tempCoagulationC: number;
  cuttingTimeMinutes: number;
  targetYieldPct: number; // e.g. 12% for Suluguni, 15% for Adyghe
  wheyYieldLitersPer100L: number; // ~85L whey per 100L milk
  packaging: string;
  shelfLifeDays: number;
  description: string;
  techSteps: string[];
}

export interface BakeryRecipe {
  id: string;
  name: string;
  nameKz: string;
  flourBlend: string;
  hydrationPct: number; // 75 - 82%
  wheyUsedPct: number; // 100% substitution of water with warm whey!
  fermentationHours: number;
  ovenTempC: number;
  targetWeightG: number;
  cogsPerLoafKzt: number;
  retailPriceKzt: number;
  zeroWasteNotes: string;
}
