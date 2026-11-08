import type { Trade } from "../../types/types";

export type ValidationSeverity = "error" | "warning";

export interface TradeValidationIssue {
  tradeId: Trade["id"];
  symbol: string;
  field: keyof Trade;
  label: string;
  severity: ValidationSeverity;
  message: string;
}

interface ValidationRule {
  field: keyof Trade;
  label: string;
  severity: ValidationSeverity;
  message: string;
  applies?: (trade: Trade) => boolean;
}

const validationRules: ValidationRule[] = [
  {
    field: "date",
    label: "Date",
    severity: "error",
    message: "Trade date is missing.",
  },
  {
    field: "symbol",
    label: "Symbol",
    severity: "error",
    message: "Trading symbol is missing.",
  },
  {
    field: "side",
    label: "Side",
    severity: "error",
    message: "Trade direction is missing.",
  },
  {
    field: "entryPrice",
    label: "Entry Price",
    severity: "error",
    message: "Entry price is missing.",
  },
  {
    field: "exchange",
    label: "Exchange",
    severity: "warning",
    message: "Exchange information is missing.",
  },
  {
    field: "timeframe",
    label: "Timeframe",
    severity: "warning",
    message: "Timeframe is missing.",
  },
  {
    field: "stopLoss",
    label: "Stop Loss",
    severity: "warning",
    message: "Stop Loss is not specified.",
  },
  {
    field: "takeProfit",
    label: "Take Profit",
    severity: "warning",
    message: "Take Profit is not specified.",
  },
  {
    field: "orderType",
    label: "Order Type",
    severity: "warning",
    message: "Order Type is missing.",
  },
  {
    field: "strategy",
    label: "Strategy",
    severity: "warning",
    message: "Strategy is not specified.",
  },
  {
    field: "mentalState",
    label: "Mental State",
    severity: "warning",
    message: "Mental State is missing.",
  },
  {
    field: "pnl",
    label: "PnL",
    severity: "warning",
    message: "Closed trade has no PnL value.",
    applies: (trade) => trade.status === "closed",
  },
];

export function isMissingValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  return false;
}

export function validateTrade(
  trade: Trade
): TradeValidationIssue[] {
  return validationRules.flatMap((rule) => {
    if (rule.applies && !rule.applies(trade)) {
      return [];
    }

    if (!isMissingValue(trade[rule.field])) {
      return [];
    }

    return [{
      tradeId: trade.id,
      symbol: trade.symbol || "Unknown Trade",
      field: rule.field,
      label: rule.label,
      severity: rule.severity,
      message: rule.message,
    }];
  });
}

export function validateTrades(
  trades: Trade[]
): TradeValidationIssue[] {
  return trades.flatMap(validateTrade);
}