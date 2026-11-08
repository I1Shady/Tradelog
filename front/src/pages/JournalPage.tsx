
import { useEffect, useState } from "react";

import StatsCards from "../components/StatsCards";
import TradeTable from "../components/TradeTable";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
    Search,
    BookOpen,
    ArrowDownUp,
    X,
    RefreshCw,
} from "lucide-react";

import { toast } from "sonner";

import { getTrades, updateTrade } from "@/lib/api";

import type { Trade } from "../types/types";

type TradeFilter = "all" | "long" | "short" | "win" | "loss";

const filters: {
    label: string;
    value: TradeFilter;
}[] = [
    { label: "All Trades", value: "all" },
    { label: "Long", value: "long" },
    { label: "Short", value: "short" },
    { label: "Winners", value: "win" },
    { label: "Losers", value: "loss" },
];

function JournalPage() {
    const [filter, setFilter] = useState<TradeFilter>("all");
    const [search, setSearch] = useState("");

    const [trades, setTrades] = useState<Trade[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load trades.
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

    // Update trade directly in PostgreSQL.
    const handleUpdateTrade = async (updatedTrade: Trade) => {
        const savedTrade = await updateTrade(
            updatedTrade.id,
            updatedTrade
        );

        // Update local state without refreshing the page.
        setTrades((previousTrades) =>
            previousTrades.map((trade) =>
                trade.id === savedTrade.id
                    ? savedTrade
                    : trade
            )
        );

        toast.success("Trade saved successfully");
    };

    return (
        <main className="min-h-screen bg-[#F4F6FA] px-4 py-8 text-slate-900 transition-colors duration-300 dark:bg-[#111c30] dark:text-white sm:px-6 lg:px-10">

            <div className="mx-auto max-w-[1600px]">

                {/* Page Header */}
                <section className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <span className="size-2 rounded-full bg-emerald-500" />

                            <span className="text-[11px] font-bold tracking-[0.18em] text-slate-400">
                                YOUR PERFORMANCE SPACE
                            </span>
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Trading Journal
                        </h1>

                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Review your trades, analyze your performance, and keep improving.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[#1c2a40] sm:self-auto">

                        <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                            <BookOpen className="size-4" />
                        </div>

                        <div>
                            <p className="text-lg font-bold tabular-nums">
                                {trades.length}
                            </p>

                            <p className="text-[10px] font-medium text-slate-400">
                                Total Records
                            </p>
                        </div>
                    </div>
                </section>

                {/* Statistics */}
                <StatsCards trades={trades} />

                {/* Trade Controls */}
                <section className="mb-6">

                    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                        <div>
                            <h2 className="text-lg font-bold tracking-tight">
                                Trade History
                            </h2>

                            <p className="mt-1 text-xs text-slate-400">
                                Browse and filter your trading activity.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                            <ArrowDownUp className="size-3.5" />
                            <span>Filter & Search</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#1c2a40] sm:flex-row sm:items-center sm:justify-between">

                        {/* Filter Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {filters.map((item) => {
                                const active = filter === item.value;

                                return (
                                    <Button
                                        key={item.value}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setFilter(item.value)}
                                        className={`h-9 rounded-xl px-3 text-xs font-semibold transition-all duration-200 ${
                                            active
                                                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:text-white"
                                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                                        }`}
                                    >
                                        {item.label}
                                    </Button>
                                );
                            })}
                        </div>

                        {/* Search */}
                        <div className="relative w-full sm:max-w-[280px]">

                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                            <Input
                                type="text"
                                placeholder="Search symbol or exchange..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-9 pr-9 text-xs shadow-none transition-all placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-blue-400/20 dark:border-white/10 dark:bg-[#111c30] dark:text-white dark:focus-visible:border-blue-400"
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    aria-label="Clear search"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-white"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* Trade Content */}
                {loading ? (
                    <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#1c2a40]">

                        <div className="size-9 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600 dark:border-white/10 dark:border-t-blue-400" />

                        <p className="text-sm font-medium text-slate-400">
                            Loading your trades...
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-red-200 bg-white p-8 text-center dark:border-red-400/20 dark:bg-[#1c2a40]">

                        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-400/10">
                            <RefreshCw className="size-5" />
                        </div>

                        <h3 className="font-semibold">
                            Unable to load trades
                        </h3>

                        <p className="mt-2 max-w-md text-sm text-slate-400">
                            {error}
                        </p>

                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-5 rounded-xl"
                            onClick={() => window.location.reload()}
                        >
                            <RefreshCw className="mr-2 size-3.5" />
                            Try Again
                        </Button>
                    </div>
                ) : (
                    <TradeTable
                        data={trades}
                        filter={filter}
                        search={search}
                        onUpdateTrade={handleUpdateTrade}
                    />
                )}

                {/* Footer */}
                <footer className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-slate-200/70 py-5 text-[11px] text-slate-400 dark:border-white/10 sm:flex-row">
                    <span>TradeLog — Your trades. Your progress.</span>

                    <span>Built for better trading decisions.</span>
                </footer>

            </div>
        </main>
    );
}

export default JournalPage;
