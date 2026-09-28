export type RawMaterialCategory =
  | 'MEAT'
  | 'MILK'
  | 'FLOUR'
  | 'SPICE'
  | 'CASING'
  | 'PACKAGING'
  | 'ENERGY'
  | 'SAUCE_INGREDIENT'
  | 'DAIRY_CULTURE'
  | 'GLASS_PACKAGING';

export type SectorFilter = 'ALL' | 'MEAT' | 'DAIRY' | 'BAKERY' | 'SAUCES_SPICES';

export type PriceTrend = 'UP' | 'DOWN' | 'STABLE';
export type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'OPPORTUNITY';
export type RecommendationType = 'RAW_MATERIAL' | 'RECIPE_PRICE' | 'PRODUCTION_VOLUME' | 'COST_SAVING';

export interface RawMaterialMarketPrice {
  id: string;
  code: string;
  category: RawMaterialCategory;
  sector: 'MEAT' | 'DAIRY' | 'BAKERY' | 'SAUCES_SPICES';
  name: string;
  unit: string;
  currentCostKzt: number;
  marketAverageKzt: number;
  marketMinKzt: number;
  marketMaxKzt: number;
  trend: PriceTrend;
  trendPct: number;
  forecast30d: string;
  forecastComment: string;
  supplier: string;
  lastUpdated: string;
}

export interface CompetitorBenchmark {
  id: string;
  category: string;
  sector: 'MEAT' | 'DAIRY' | 'BAKERY' | 'SAUCES_SPICES';
  ourProductTitle: string;
  ourPriceKzt: number;
  ourUnit: string;
  competitorName: string;
  competitorPriceKzt: number;
  priceGapPct: number;
  trend: PriceTrend;
  forecast30d: string;
  forecastComment: string;
  qualityTier: 'PREMIUM_CRAFT' | 'RESTAURANT' | 'MASS_MARKET';
  channel: 'RETAIL' | 'DELIVERY_APP' | 'PUB_DINEIN';
  notes: string;
}

export interface FinancialForecastPeriod {
  periodLabel: string;
  revenuePubKzt: number;
  revenueTakeawayKzt: number;
  revenueAraiDeliveryKzt: number;
  totalRevenueKzt: number;
  rawMaterialCogsKzt: number;
  packagingAndConsumablesKzt: number;
  totalCogsKzt: number;
  grossProfitKzt: number;
  grossMarginPct: number;
  fixedOpexKzt: {
    rentZharokovaKzt: number;
    payrollStaffKzt: number;
    utilitiesAndPowerKzt: number;
    logisticsAndMarketingKzt: number;
  };
  totalFixedOpexKzt: number;
  ebitdaKzt: number;
  ebitdaMarginPct: number;
  breakevenRevenueKzt: number;
  breakevenBatchesKg: number;
}

export interface PricingRecommendation {
  id: string;
  type: RecommendationType;
  sector: 'MEAT' | 'DAIRY' | 'BAKERY' | 'SAUCES_SPICES';
  targetCode: string;
  targetTitle: string;
  title: string;
  rationale: string;
  currentValue: number;
  recommendedValue: number;
  unit: string;
  financialImpactKzt: number;
  priority: RecommendationPriority;
  isApplied: boolean;
  appliedAt?: string;
}
