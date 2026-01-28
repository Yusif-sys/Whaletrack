export interface RawTrade {
  id: string;
  market?: string;
  question?: string;
  maker?: string;
  taker?: string;
  outcome?: string;
  side?: string;
  price?: number | string;
  size?: number | string;
  amount?: number | string;
  timestamp?: number;
  created_at?: string;
}

export interface WhaleSnapshot {
  address: string;
  totalVolume: number;
  tradeCount: number;
  lastSeenTs: number;
}

export interface NormalizedTrade {
  tradeId: string;
  wallet: string;
  side: "BUY" | "SELL";
  outcome: "YES" | "NO" | "UNKNOWN";
  size: number;
  price: number;
  notional: number;
  timestamp: number;
  marketId: string;
  marketQuestion: string;
}

