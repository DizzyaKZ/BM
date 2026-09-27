export type ErpTabId = 'giant' | 'qc_warehouse' | 'orders_demand' | 'koch' | 'dairy_bread' | 'spicelab' | 'tspl';

export interface HaccpStep {
  id: number;
  title: string;
  desc: string;
  ccp?: string;
  tempTime?: string;
  done: boolean;
}

export interface GiantLine {
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
  costKg: number;
  yieldPct: number;
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
  shelfStockUnits: number;
  equipment: string;
  rawNorms: { name: string; qty: string }[];
  steps: HaccpStep[];
}

export interface RawBatchQc {
  batchId: string;
  supplier: string;
  category: 'Молоко сырое' | 'Мясные отруба' | 'Мука и солод' | 'Специи и тара';
  qty: number;
  unit: string;
  fatPct: number;
  protPct: number;
  phVal: number;
  waterAddedPct: number;
  verdict: 'PASSED' | 'REJECTED';
  receivedAt: string;
}

export interface StockMovement {
  id: number;
  batchCode: string;
  plu: string;
  productName: string;
  fromLoc: string;
  toLoc: string;
  qtyUnits: number;
  movedAt: string;
}

export interface CustomerOrder {
  orderId: number;
  source: 'Telegram ЖК Арай' | 'Зал BEERMOOD.PUB' | 'Витрина Take-away';
  apt: string;
  phone: string;
  slot: 'MORNING_0730' | 'EVENING_1830';
  isPrepaidKaspi: boolean;
  status: 'NEW' | 'PACKED' | 'DELIVERED';
  items: { plu: string; name: string; qty: number; pricePackKzt: number }[];
}

export interface SpiceStock {
  code: string;
  name: string;
  grind: string;
  stock: number;
  min: number;
  roast: boolean;
}
