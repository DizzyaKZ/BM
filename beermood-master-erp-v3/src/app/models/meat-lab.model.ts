export type MeatAnimalType = 'HORSE' | 'BEEF' | 'PORK' | 'LAMB';
export type MeatThermalState = 'CHILLED' | 'FROZEN' | 'WARM';
export type MeatQualityGrade = 'EXTRA_CRAFT' | 'FIRST_GRADE' | 'PROCESSING_ONLY' | 'REJECT';
export type MeatQualityDefect = 'NOR' | 'PSE' | 'DFD';
export type MeatLabStatus = 'ACCEPTED' | 'QUARANTINE' | 'REJECTED';

export interface MeatLabRecord {
  id: string;
  sampleTime: string;
  supplier: string;
  batchCode: string;
  vetDocNumber: string;
  animalType: MeatAnimalType;
  cutCode: string; // R1, R2, R4, S1, S2, S4b, S8, RIBS
  cutName: string;
  weightKg: number;
  temperatureC: number;
  thermalState: MeatThermalState;
  acidityPh: number;
  defectType: MeatQualityDefect;
  waterBindingCapacityPct: number;
  fatColor: string;
  organolepticScore: number;
  hasVetStamp: boolean;
  isHalalCertified?: boolean;
  calculatedGrade: MeatQualityGrade;
  craftSuitabilityScore: number;
  basePricePerKgKzt: number;
  adjustedPricePerKgKzt: number;
  totalSumKzt: number;
  status: MeatLabStatus;
  operator: string;
  notes?: string;
}
