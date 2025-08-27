export type ScoreParts = {
  priceDiscount: number;
  rentDelta: number;
  cashflowStability: number;
  financing: number;
  upside: number;
  dataQuality: number;
};

export type ScoreResult = {
  total: number;
  grade: string;
  subscores: ScoreParts;
  rentDeltaPct: number;
  bullets: string[];
};

export type ContextMetrics = {
  dscr: number;
  irr: number;
  pricePremium: number;
  cfPosAb: number;
};

export type DecisionBadge = {
  label: string;
  color: string;
  reason?: string;
};
