import { Card, CardContent } from "@/components/ui/card";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
} from "lucide-react";
import type { Trade } from "../types/types";

interface StatsCardsProps {
  trades: Trade[];
}

function StatsCards({ trades }: StatsCardsProps) {
  const closedTrades = trades.filter(
    (trade) => trade.status === "closed"
  );

  const initialBalance = 1000;

  const totalPnl = closedTrades.reduce(
    (sum, trade) => sum + (Number(trade.pnl) || 0),
    0
  );

  const balance = initialBalance + totalPnl;

  const today = new Date().toLocaleDateString("en-CA");

  const todayPnl = closedTrades
    .filter((trade) => {
      const tradeDate = new Date(trade.date).toLocaleDateString("en-CA");
      return tradeDate === today;
    })
    .reduce((sum, trade) => sum + (Number(trade.pnl) || 0), 0);

  const winners = closedTrades.filter(
    (trade) => (Number(trade.pnl) || 0) > 0
  ).length;

  const winRate =
    closedTrades.length > 0
      ? (winners / closedTrades.length) * 100
      : 0;

  const totalTrades = trades.length;

  const cards = [
    {
      title: "Today's P&L",
      value: `${todayPnl > 0 ? "+" : ""}${todayPnl.toFixed(2)}$`,
      description: "Daily Profit & Loss",
      icon: todayPnl >= 0 ? TrendingUp : TrendingDown,
      iconClass:
        todayPnl >= 0
          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400"
          : "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-400",
      valueClass: todayPnl >= 0
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-red-600 dark:text-red-400",
      badge: `${((todayPnl / initialBalance) * 100).toFixed(2)}%`,
      badgeClass:
        todayPnl >= 0
          ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-400/10 dark:text-emerald-400"
          : "text-red-600 bg-red-50 dark:bg-red-400/10 dark:text-red-400",
    },
    {
      title: "Win Rate",
      value: `${winRate.toFixed(1)}%`,
      description: "Success Ratio",
      icon: Target,
      iconClass:
        "bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400",
      valueClass: "text-slate-900 dark:text-white",
      badge: `${closedTrades.length} closed`,
      badgeClass:
        "bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400",
    },
    {
      title: "Total Trades",
      value: String(totalTrades),
      description: "All Time",
      icon: Activity,
      iconClass:
        "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
      valueClass: "text-slate-900 dark:text-white",
      badge: "Recorded",
      badgeClass:
        "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
    },
  ];

  return (
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

      {/* Balance */}
      <Card className="group relative overflow-hidden rounded-2xl border-0 bg-[#172033] text-white shadow-lg shadow-slate-900/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/15 dark:bg-[#253650]">
        <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-blue-500/15 blur-2xl" />

        <CardContent className="relative flex h-full min-h-[172px] flex-col justify-between gap-6 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-400">
              Account Balance
            </p>

            <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-blue-300">
              <Wallet className="size-5" />
            </div>
          </div>

          <div>
            <p className="text-3xl font-bold tracking-tight tabular-nums">
              ${balance.toFixed(2)}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <TrendingUp className="size-3.5" />
                {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)}
              </span>

              <span className="text-xs text-slate-400">
                Total realized P&L
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remaining Stats */}
      {cards.map((item) => {
        const Icon = item.icon;

        return (
          <Card
            key={item.title}
            className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-900/5 dark:border-white/10 dark:bg-[#1c2a40] dark:hover:border-blue-400/30"
          >
            <CardContent className="flex min-h-[172px] flex-col justify-between gap-6 p-6">

              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {item.title}
                </p>

                <div className={`flex size-10 items-center justify-center rounded-xl ${item.iconClass}`}>
                  <Icon className="size-5" />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-3xl font-bold tracking-tight tabular-nums ${item.valueClass}`}>
                    {item.value}
                  </p>

                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${item.badgeClass}`}>
                    {item.badge}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                  {item.description}
                </p>
              </div>

            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

export default StatsCards;
