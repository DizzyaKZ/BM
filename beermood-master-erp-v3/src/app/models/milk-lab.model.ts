export type MilkGrade = 'EXTRA' | 'FIRST' | 'SECOND' | 'REJECT';
export type LabStatus = 'ACCEPTED' | 'QUARANTINE' | 'REJECTED';

export interface MilkLabRecord {
  id: string;
  sampleTime: string;
  supplier: string;
  batchCode: string;
  volumeLiters: number;
  fatPct: number;       // e.g. 3.8% (Базис РК 3.6%)
  proteinPct: number;   // e.g. 3.25% (Базис РК 3.2%)
  snfPct: number;       // СОМО (Сухой обезжиренный молочный остаток, >= 8.2%)
  densityDegree: number;// Плотность в градусах Ареометра (°A, >= 27.0 °A / 1.027 г/см3)
  addedWaterPct: number;// Добавленная вода (0.0%)
  freezingPoint: number;// Точка замерзания (-0.525 °C)
  temperatureC: number; // Температура при приемке (4 - 8 °C)
  acidityPh: number;    // pH (6.60 - 6.80)
  acidityTurner: number;// Кислотность по Тернеру (°T 16 - 18)
  calculatedGrade: MilkGrade;
  cheeseSuitabilityScore: number; // 0 - 100%
  basePricePerLiterKzt: number;
  adjustedPricePerLiterKzt: number;
  totalSumKzt: number;
  status: LabStatus;
  notes?: string;
}
