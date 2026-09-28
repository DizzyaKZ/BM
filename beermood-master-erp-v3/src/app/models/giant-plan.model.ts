export type EquipmentType =
  | 'CASARO_CHEESE_VAT'
  | 'IZHITZA_SMOKER'
  | 'BILTONG_CHAMBER'
  | 'UNOX_OVEN'
  | 'PUB_KITCHEN';

export interface EquipmentStatus {
  id: EquipmentType;
  name: string;
  location: string;
  capacityMax: string;
  powerKw: number;
  currentCycle: string;
  progressPct: number;
  status: 'IDLE' | 'RUNNING' | 'CLEANING' | 'MAINTENANCE';
  estimatedFinishTime: string;
}

export interface ProductionTask {
  id: string;
  shiftDate: string;
  equipment: EquipmentType;
  productName: string;
  batchInputKgOrL: number;
  expectedOutputKg: number;
  laborHours: number;
  operator: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}
