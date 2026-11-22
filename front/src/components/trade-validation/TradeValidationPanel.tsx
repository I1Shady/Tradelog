"use client";

import { useState } from "react";

import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Code2,
} from "lucide-react";

import type {
  TradeValidationIssue,
} from "./trade-validation.utils";

interface TradeValidationPanelProps {
  issues: TradeValidationIssue[];
  onIssueClick?: (issue: TradeValidationIssue) => void;
}

function TradeValidationPanel({
  issues,
  onIssueClick,
}: TradeValidationPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const errors = issues.filter(
    (issue) => issue.severity === "error"
  );

  const warnings = issues.filter(
    (issue) => issue.severity === "warning"
  );

  return (
    <section className="mx-0 mb-0 overflow-hidden border-b border-slate-200 dark:border-white/[0.08]">

      {/* Header */}
      <div className="flex h-11 items-center justify-between bg-slate-100/80 px-4 dark:bg-[#17243a]">

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex items-center gap-2 text-xs font-semibold"
        >
          {expanded ? (
            <ChevronDown className="size-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="size-3.5 text-slate-400" />
          )}

          <Code2 className="size-4 text-blue-500" />

          <span className="text-slate-700 dark:text-slate-200">
            Problems
          </span>

          <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] tabular-nums text-slate-600 dark:bg-white/10 dark:text-slate-300">
            {issues.length}
          </span>
        </button>

        <div className="flex items-center gap-3 text-[11px]">

          <span className="flex items-center gap-1.5 text-red-500">
            <AlertCircle className="size-3.5" />
            {errors.length}
          </span>

          <span className="flex items-center gap-1.5 text-amber-500">
            <AlertTriangle className="size-3.5" />
            {warnings.length}
          </span>

        </div>
      </div>

      {/* Problems List */}
      {expanded && (
        <div className="max-h-[210px] overflow-y-auto bg-white dark:bg-[#131f32]">

          {issues.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3 text-xs text-emerald-500">
              <Code2 className="size-4" />
              No problems detected.
            </div>
          ) : (
            issues.map((issue) => {
              const isError = issue.severity === "error";

              return (
                <button
                  key={`${issue.tradeId}-${String(issue.field)}`}
                  type="button"
                  onClick={() => onIssueClick?.(issue)}
                  className="group flex w-full items-center gap-3 border-t border-slate-100 px-4 py-2 text-left transition-colors hover:bg-slate-50 dark:border-white/[0.04] dark:hover:bg-white/[0.035]"
                >
                  <span className={
                    isError
                      ? "text-red-500"
                      : "text-amber-500"
                  }>
                    {isError ? (
                      <AlertCircle className="size-3.5" />
                    ) : (
                      <AlertTriangle className="size-3.5" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1 truncate text-[11px] text-slate-700 dark:text-slate-300">
                    {issue.message}
                  </span>

                  <span className="shrink-0 text-[10px] text-slate-400">
                    {issue.symbol}
                  </span>

                  <span className="shrink-0 text-[10px] text-slate-400">
                    {issue.label}
                  </span>

                  <span className="shrink-0 text-[10px] text-slate-400">
                    #{issue.tradeId}
                  </span>

                  <ChevronRight className="size-3 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-500" />
                </button>
              );
            })
          )}

        </div>
      )}

    </section>
  );
}

export default TradeValidationPanel;