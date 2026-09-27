export interface TechStep {
  stepNumber: number;
  title: string;
  instruction: string;
  durationMinutes: number;
  criticalHaccpPoint?: string;
  completed?: boolean;
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
  requiresBrine?: boolean;
  brineBe?: number;
  brineInjectionPct?: number;
  meats: { name: string; pct: number }[];
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
  requiresBrine?: boolean;
  brinePct?: number;
  steps: TechStep[];
}
