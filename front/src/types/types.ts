export interface Trade {
  id: number;
  date: string;
  symbol: string;
  exchange: string | null;
  timeframe: string | null;
  side: 'LONG' | 'SHORT';
  entryPrice: number | null;
  positionMargin: number | null;
  leverage: number | null;
  orderValue: number | null;
  orderType: string | null;
  entryScreenshot?: string | null;
  mentalState: string | null;
  strategy: string | null;
  mistakes: string | null;
  checkItems: { volume: boolean; time: boolean; trend: boolean; btc: boolean } | null;
  notes?: string | null;
  stopLoss: number | null;
  takeProfit: number | null;
  exitScreenshot?: string | null;
  positionToAcc: number | null;
  pnl: number | null;
  status: 'closed' | 'open';
  exitType?: string | null;
}