export type StandardMode = 'kz' | 'halal' | 'de';
export type SalesChannel = 'takeaway' | 'pub';
export type ProfitGoal = 'all' | 'SNACK_MAX' | 'PUB_DRIVER' | 'LOW_LABOR' | 'TAKEAWAY_CORE' | 'ZERO_WASTE';
export type SortOption = 'profit_desc' | 'markup_desc' | 'fc_asc' | 'labor_asc' | 'code_asc';

export interface MeatStandardItem {
  code: string;
  de: string;
  kz: string;
  halal: string;
  kzt: number;
  halalKzt: number;
  priceChangePct?: number;
  priceChangeTrend?: 'UP' | 'DOWN' | 'STABLE';
  forecast30d?: string;
  forecastComment?: string;
}

export interface RecipeMeatAllocation {
  code: string;
  kg: number;
  forceHalal?: boolean;
}

export interface RecipeSpiceAllocation {
  name: string;
  g: number;
}

export interface KochTechCard {
  code: string;
  plu: string;
  eanPrefix: string;
  title: string;
  titleKz: string;
  goal: ProfitGoal;
  tierLabel: string;
  laborScore: number; // 1 (low) to 5 (high)
  yieldRatio: number; // e.g. 0.50 = 50%
  addonPerFinishedKgKzt: number;
  priceTakeawayKzt: number;
  pricePubKzt: number;
  spiceFactor?: number;
  meats: RecipeMeatAllocation[];
  spices: RecipeSpiceAllocation[];
  casing: string;
  shelfLifeDays: number;
  tech: string;
}

export interface CalculatedEconomics {
  finishedKg: number;
  rawMeatCostKzt: number;
  addonsCostKzt: number;
  totalCogsKzt: number;
  cogsPerFinishedKgKzt: number;
  sellPricePerKgKzt: number;
  totalRevenueKzt: number;
  grossProfitKzt: number;
  profitPerFinishedKgKzt: number;
  markupPct: number;
  foodCostPct: number;
}

export interface EnrichedTechCard {
  card: KochTechCard;
  econ: CalculatedEconomics;
}
