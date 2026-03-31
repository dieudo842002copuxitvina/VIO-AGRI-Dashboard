
export interface Insight {
  title: string;
  type: 'opportunity' | 'risk' | 'info';
  confidence: number;
}

export interface Recommendation {
  action: 'BUY' | 'SELL' | 'HOLD';
  commodity: string;
  reason: string;
}
