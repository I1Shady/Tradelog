
import { useEffect, useState } from "react";

import StatsCards from "../components/StatsCards";
import TradeTable from "../components/TradeTable";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

import { getTrades } from "@/lib/api";
import type { Trade } from "../types/types";

type TradeFilter = "all" | "long" | "short" | "win" | "loss";

function JournalPage() {
  const [filter, setFilter] = useState<TradeFilter>("all");
  const [search, setSearch] = useState("");

  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTrades() {
      try {
        setLoading(true);
        setError(null);

        const result = await getTrades();

        if (active) {
          setTrades(result);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load trades"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTrades();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <StatsCards trades={trades} />

      <section className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className="rounded-full"
          >
            All
          </Button>

          <Button
            variant={filter === "long" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("long")}
            className="rounded-full"
          >
            Long
          </Button>

          <Button
            variant={filter === "short" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("short")}
            className="rounded-full"
          >
            Short
          </Button>

          <Button
            variant={filter === "win" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("win")}
            className="rounded-full"
          >
            Winners
          </Button>

          <Button
            variant={filter === "loss" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("loss")}
            className="rounded-full"
          >
            Losers
          </Button>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />

          <Input
            type="text"
            placeholder="Search symbol..."
            className="rounded-full pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {loading ? (
        <p className="py-10 text-center text-muted-foreground">
          Loading trades...
        </p>
      ) : error ? (
        <div className="py-10 text-center">
          <p className="text-destructive">{error}</p>

          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <TradeTable
          data={trades}
          filter={filter}
          search={search}
        />
      )}
    </main>
  );
}

export default JournalPage;
