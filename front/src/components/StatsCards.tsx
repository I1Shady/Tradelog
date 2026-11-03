
import { Badge } from "@/components/reui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import type { Trade } from "../types/types";

interface StatsCardsProps {
  trades: Trade[];
}

function StatsCards({ trades }: StatsCardsProps) {
  // Only closed trades are used for P&L and win rate.
  const closedTrades = trades.filter(
    (trade) => trade.status === "closed"
  );

  // Calculate total account balance from the initial balance and realized P&L.
  const initialBalance = 1000;

  const totalPnl = closedTrades.reduce(
    (sum, trade) => sum + (Number(trade.pnl) || 0),
    0
  );

  const balance = initialBalance + totalPnl;

  // Calculate today's realized P&L.
  const today = new Date().toLocaleDateString("en-CA");

  const todayPnl = closedTrades
    .filter((trade) => {
      const tradeDate = new Date(trade.date).toLocaleDateString("en-CA");
      return tradeDate === today;
    })
    .reduce((sum, trade) => sum + (Number(trade.pnl) || 0), 0);

  // Calculate win rate.
  const winners = closedTrades.filter(
    (trade) => (Number(trade.pnl) || 0) > 0
  ).length;

  const winRate =
    closedTrades.length > 0
      ? (winners / closedTrades.length) * 100
      : 0;

  const totalTrades = trades.length;

  return (
    <section className="mb-8 grid grid-cols-2 gap-6 md:grid-cols-2 lg:grid-cols-4">

      {/* Balance */}
      <Card className="w-full">
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-muted-foreground text-sm font-medium">
              Balance
            </h3>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className="text-foreground text-2xl font-medium tracking-tight tabular-nums">
                ${balance.toFixed(2)}
              </span>

              <Badge variant="success-light">
                <ArrowUpIcon aria-hidden="true" />
                Total
              </Badge>
            </div>

            <Separator />

            <div className="text-muted-foreground text-xs">
              Total Account Value
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today P&L */}
      <Card className="w-full">
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-muted-foreground text-sm font-medium">
              Today P&L
            </h3>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span
                className={`text-2xl font-medium tracking-tight tabular-nums ${
                  todayPnl >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {todayPnl > 0 ? "+" : ""}
                {todayPnl.toFixed(2)}$
              </span>

              <Badge
                variant={
                  todayPnl >= 0 ? "success-light" : "destructive-light"
                }
              >
                {todayPnl >= 0 ? (
                  <ArrowUpIcon aria-hidden="true" />
                ) : (
                  <ArrowDownIcon aria-hidden="true" />
                )}
                {((todayPnl / initialBalance) * 100).toFixed(2)}%
              </Badge>
            </div>

            <Separator />

            <div className="text-muted-foreground text-xs">
              Daily Profit & Loss
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Win Rate */}
      <Card className="w-full">
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-muted-foreground text-sm font-medium">
              Win Rate
            </h3>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className="text-foreground text-2xl font-medium tracking-tight tabular-nums">
                {winRate.toFixed(1)}%
              </span>

              <Badge variant="info-light">
                {closedTrades.length} closed
              </Badge>
            </div>

            <Separator />

            <div className="text-muted-foreground text-xs">
              Success Ratio
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Trades */}
      <Card className="w-full">
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-muted-foreground text-sm font-medium">
              Total Trades
            </h3>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className="text-foreground text-2xl font-medium tracking-tight tabular-nums">
                {totalTrades}
              </span>
            </div>

            <Separator />

            <div className="text-muted-foreground text-xs">
              All Time
            </div>
          </div>
        </CardContent>
      </Card>

    </section>
  );
}

export default StatsCards;
