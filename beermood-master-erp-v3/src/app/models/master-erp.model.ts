export type ActiveTabId = 'giant' | 'koch' | 'dairy-bread' | 'spicelab' | 'tspl';
export type TsplPrintMode = 'PRODUCT' | 'MILK_OK' | 'MILK_BAD';

export interface TechStep {
  id: number;
  title: string;
  desc: string;
  ccpHaccp?: string; // Критическая контрольная точка ХАССП
  tempTime?: string; // Температура и время выдержки
  done: boolean;
}

export interface DetailedTechCard {
  plu: string;
  name: string;
  brand: string;
  dept: string;
  outputNorm: string;
  equipment: string;
  rawMaterials: { name: string; amount: string; note?: string }[];
  steps: TechStep[];
  packagingRule: string;
  storageNorm: string;
}

export interface GiantLineItem {
  plu: string;
  eanPrefix: string;
  brand: string;
  dept: string;
  kzTitle: string;
  subTitle: string;
  name: string;
  monthlyKg: number;
  monthlyUnits: number;
  packG: number;
  priceKg: number;
  prot: number;
  fat: number;
  carb: number;
  shelfDays: number;
  temp: string;
  supplyDays: number[];
  prodDays: number[];
  cycleDays: number;
  shortRisk: boolean;
  pivotRatio?: number;
  isBuffer?: boolean;
  bonusKg?: number;
  pivotAction: string;
  kzPair: string;
  ruPair: string;
  comp: string;
}

export interface KochCardItem {
  plu: string;
  code: string;
  title: string;
  strategy: 'FAST_TURN' | 'HIGH_MARGIN' | 'LONG_BUFFER';
  packGrams: number;
  defaultPriceKg: number;
  retailPricePerKgKzt: number;
  rawCostPerKgKzt: number;
  yieldPct: number;
  meats: { name: string; pct: number }[];
  spices: { name: string; gPerKg: number }[];
  brineDegBe: number;
  injectPct: number;
  coverPct: number;
  techSteps: string;
}

export interface DairyCardItem {
  plu: string;
  title: string;
  equip: string;
  yieldKgPer100L: number;
  packGrams: number;
  defaultPriceKg: number;
  retailPricePerKgKzt: number;
  costPerKgKzt: number;
  milkReq: string;
  ingredientsPer100L: { name: string; amount: string }[];
  regimes: string;
}

export interface BreadCardItem {
  plu: string;
  title: string;
  equip: string;
  rawLoafWeightG: number;
  bakedLoafWeightG: number;
  defaultPriceKg: number;
  retailPricePerKgKzt: number;
  costPerLoafKzt: number;
  bakersFormula: { name: string; bPct: number; note: string }[];
  regimes: string;
}

export interface SpiceStockItem {
  code: string;
  name: string;
  cat: string;
  grind: string;
  stock: number;
  min: number;
  roast: boolean;
}

export interface KramerRecipeItem {
  id: number;
  plu: string;
  title: string;
  region: string;
  prep: string;
  items: { code: string; pct: number }[];
}
