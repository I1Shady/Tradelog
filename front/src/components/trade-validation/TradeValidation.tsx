"use client";

import { useMemo } from "react";

import type { Trade } from "../../types/types";

import TradeValidationPanel from "./TradeValidationPanel";

import {
  validateTrades,
  type TradeValidationIssue,
} from "./trade-validation.utils";

interface TradeValidationProps {
  trades: Trade[];
  onIssueClick?: (issue: TradeValidationIssue) => void;
}

function TradeValidation({
  trades,
  onIssueClick,
}: TradeValidationProps) {
  const issues = useMemo(
    () => validateTrades(trades),
    [trades]
  );

  return (
    <TradeValidationPanel
      issues={issues}
      onIssueClick={onIssueClick}
    />
  );
}

export default TradeValidation;