export interface TechStep {
  stepNumber: number;
  title: string;
  instruction: string;
  durationMinutes: number;
  criticalHaccpPoint?: string;
}

export interface KochCardItem {
  code: string;
  plu: string;
  title: string;
  titleKz: string;
  yieldPct: number;
  packGrams: number;
  retailPricePerKgKzt: number;
  cogsKgKzt: number;
  steps: TechStep[];
}

export interface DairyCardItem {
  code: string;
  plu: string;
  title: string;
  titleKz: string;
  milkNormPerKg: number;
  packGrams: number;
  retailPricePerPackKzt: number;
  cogsPackKzt: number;
  steps: TechStep[];
}

export interface MeatBrineResult {
  waterLiters: number;
  beDegrees: number;
  nitriteSaltGrams: number;
  dextroseGrams: number;
  phosphateGrams: number;
}

export interface CheeseBrineResult {
  waterLiters: number;
  saltPct: number;
  saltGrams: number;
  cacl2Grams: number;
  targetPh: number;
  tempCelsius: number;
  cheeseWeightKg: number;
  saltingHours: number;
}
