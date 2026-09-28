export type ActiveTab =
  | 'giant_planning'
  | 'milk_lab'
  | 'meat_lab'
  | 'arai_orders'
  | 'koch_cards'
  | 'cheese_bakery'
  | 'market_intelligence'
  | 'tspl_printer'
  | 'matrix';

export type CurrencyMode = 'BOTH' | 'KZT' | 'USD';

export interface PrinterConfig {
  ip: string;
  port: number;
  widthMm: number;
  heightMm: number;
  gapMm: number;
  dpi: number;
  online: boolean;
}

export interface ApiConfig {
  baseUrl: string;
  useMock: boolean;
  connected: boolean;
}

export interface GlobalKpiSummary {
  todayRevenueKzt: number;
  activeBatchKg: number;
  milkProcessedLiters: number;
  araiOrdersPending: number;
  averageFoodCostPct: number;
  averageMarkupPct: number;
  monthlyProjectedEbitdaKzt: number;
  activeRecommendationsCount: number;
}
