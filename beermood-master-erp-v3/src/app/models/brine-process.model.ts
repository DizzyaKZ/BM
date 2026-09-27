export interface TechStep {
  stepNumber: number;
  title: string;
  instruction: string;
  durationMinutes: number;
  criticalHaccpPoint?: string;
}

export interface MeatBrineCalcResult {
  waterLiters: number;
  beDegrees: number;
  nitriteSaltGrams: number;
  dextroseGrams: number;
  phosphateGrams: number;
  targetMeatKg: number;
  injectionPct: number;
}

export interface CheeseBrineCalcResult {
  waterLiters: number;
  saltPct: number;
  saltGrams: number;
  cacl2Grams: number;
  targetPh: number;
  tempCelsius: number;
  cheeseWeightKg: number;
  recommendedHours: number;
}
