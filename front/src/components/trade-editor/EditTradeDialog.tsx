
import { useEffect, useState, type FormEvent } from "react";

import {
    X,
    Save,
    Loader2,
    AlertCircle,
} from "lucide-react";

import { toast } from "sonner";

import type { Trade } from "@/types/types";

interface EditTradeDialogProps {
    trade: Trade | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (trade: Trade) => Promise<void>;
}

const inputClass =
    "h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#111c30] dark:text-white";

const textareaClass =
    "min-h-[90px] w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#111c30] dark:text-white";

const labelClass =
    "mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300";

function dateInputValue(value: string): string {
    if (!value) return "";

    return value.slice(0, 10);
}

function numberValue(value: string): number | null {
    if (value.trim() === "") return null;

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
}

function EditTradeDialog({
    trade,
    open,
    onOpenChange,
    onSave,
}: EditTradeDialogProps) {
    const [form, setForm] = useState<Trade | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        if (open && trade) {
            setForm({
                ...trade,
                checkItems: trade.checkItems
                    ? { ...trade.checkItems }
                    : {
                          volume: false,
                          time: false,
                          trend: false,
                          btc: false,
                      },
            });

            setSaveError(null);
        }
    }, [open, trade]);

    if (!open || !trade || !form) {
        return null;
    }

    function updateField<K extends keyof Trade>(
        field: K,
        value: Trade[K]
    ) {
        setForm((previous) =>
            previous
                ? {
                      ...previous,
                      [field]: value,
                  }
                : previous
        );
    }

    function updateNumberField(
        field:
            | "entryPrice"
            | "stopLoss"
            | "takeProfit"
            | "positionMargin"
            | "leverage"
            | "orderValue"
            | "positionToAcc"
            | "pnl",
        value: string
    ) {
        updateField(field, numberValue(value));
    }

    function updateTextField(
        field:
            | "symbol"
            | "exchange"
            | "timeframe"
            | "orderType"
            | "mentalState"
            | "strategy"
            | "mistakes"
            | "notes"
            | "entryScreenshot"
            | "exitScreenshot"
            | "exitType",
        value: string
    ) {
        updateField(field, value === "" ? null : value);
    }

    function updateChecklist(
        field: "volume" | "time" | "trend" | "btc",
        checked: boolean
    ) {
        setForm((previous) => {
            if (!previous) return previous;

            return {
                ...previous,
                checkItems: {
                    volume: previous.checkItems?.volume ?? false,
                    time: previous.checkItems?.time ?? false,
                    trend: previous.checkItems?.trend ?? false,
                    btc: previous.checkItems?.btc ?? false,
                    [field]: checked,
                },
            };
        });
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!form || saving) return;

        if (!form.symbol.trim()) {
            setSaveError("Symbol is required.");
            return;
        }

        if (!form.date) {
            setSaveError("Trade date is required.");
            return;
        }

        if (
            form.entryPrice !== null &&
            !Number.isFinite(form.entryPrice)
        ) {
            setSaveError("Entry price must be a valid number.");
            return;
        }

        setSaving(true);
        setSaveError(null);

        try {
            const updatedTrade: Trade = {
                ...form,
                symbol: form.symbol.trim(),
                status: form.pnl === null ? "open" : "closed",
            };

            await onSave(updatedTrade);

            toast.success("Trade updated successfully", {
                description: `${updatedTrade.symbol} has been saved.`,
            });

            onOpenChange(false);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to save trade.";

            setSaveError(message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !saving) {
                    onOpenChange(false);
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-trade-title"
                className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1c2a40]"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10 sm:px-6">
                    <div>
                        <h2
                            id="edit-trade-title"
                            className="text-base font-bold text-slate-900 dark:text-white"
                        >
                            Edit Trade
                        </h2>

                        <p className="mt-1 text-xs text-slate-400">
                            Update trade #{trade.id} information
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => onOpenChange(false)}
                        className="flex size-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="min-h-0 flex-1 overflow-y-auto"
                >
                    <div className="space-y-7 p-5 sm:p-6">

                        {/* Basic Information */}
                        <section>
                            <h3 className="mb-4 text-sm font-bold text-slate-800 dark:text-white">
                                Basic Information
                            </h3>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Date</label>
                                    <input
                                        type="date"
                                        required
                                        className={inputClass}
                                        value={dateInputValue(form.date)}
                                        onChange={(e) =>
                                            updateField("date", e.target.value)
                                        }
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Symbol</label>
                                    <input
                                        required
                                        className={inputClass}
                                        value={form.symbol}
                                        onChange={(e) =>
                                            updateField("symbol", e.target.value)
                                        }
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Exchange</label>
                                    <input
                                        className={inputClass}
                                        value={form.exchange ?? ""}
                                        onChange={(e) =>
                                            updateTextField("exchange", e.target.value)
                                        }
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Timeframe</label>
                                    <input
                                        className={inputClass}
                                        placeholder="e.g. 1H, 4H, 1D"
                                        value={form.timeframe ?? ""}
                                        onChange={(e) =>
                                            updateTextField("timeframe", e.target.value)
                                        }
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Side</label>
                                    <select
                                        className={inputClass}
                                        value={form.side}
                                        onChange={(e) =>
                                            updateField(
                                                "side",
                                                e.target.value as Trade["side"]
                                            )
                                        }
                                    >
                                        <option value="LONG">LONG</option>
                                        <option value="SHORT">SHORT</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={labelClass}>Order Type</label>
                                    <input
                                        className={inputClass}
                                        value={form.orderType ?? ""}
                                        onChange={(e) =>
                                            updateTextField("orderType", e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Prices */}
                        <section>
                            <h3 className="mb-4 text-sm font-bold text-slate-800 dark:text-white">
                                Prices & Position
                            </h3>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {([
                                    ["entryPrice", "Entry Price"],
                                    ["stopLoss", "Stop Loss"],
                                    ["takeProfit", "Take Profit"],
                                    ["positionMargin", "Margin"],
                                    ["leverage", "Leverage"],
                                    ["orderValue", "Order Value"],
                                    ["positionToAcc", "Position %"],
                                ] as const).map(([field, label]) => (
                                    <div key={field}>
                                        <label className={labelClass}>
                                            {label}
                                        </label>

                                        <input
                                            type="number"
                                            step="any"
                                            className={inputClass}
                                            value={form[field] ?? ""}
                                            onChange={(e) =>
                                                updateNumberField(field, e.target.value)
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Results */}
                        <section>
                            <h3 className="mb-4 text-sm font-bold text-slate-800 dark:text-white">
                                Trade Results
                            </h3>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>PnL</label>
                                    <input
                                        type="number"
                                        step="any"
                                        className={inputClass}
                                        placeholder="Leave empty for open trade"
                                        value={form.pnl ?? ""}
                                        onChange={(e) =>
                                            updateNumberField("pnl", e.target.value)
                                        }
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Exit Type</label>
                                    <input
                                        className={inputClass}
                                        placeholder="e.g. TP, SL, Manual"
                                        value={form.exitType ?? ""}
                                        onChange={(e) =>
                                            updateTextField("exitType", e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            <p className="mt-2 text-[11px] text-slate-400">
                                PnL determines whether the trade is Open or Closed.
                            </p>
                        </section>

                        {/* Psychology */}
                        <section>
                            <h3 className="mb-4 text-sm font-bold text-slate-800 dark:text-white">
                                Strategy & Psychology
                            </h3>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Mental State</label>
                                    <input
                                        className={inputClass}
                                        value={form.mentalState ?? ""}
                                        onChange={(e) =>
                                            updateTextField("mentalState", e.target.value)
                                        }
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Strategy</label>
                                    <input
                                        className={inputClass}
                                        value={form.strategy ?? ""}
                                        onChange={(e) =>
                                            updateTextField("strategy", e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className={labelClass}>Mistakes</label>
                                <textarea
                                    className={textareaClass}
                                    value={form.mistakes ?? ""}
                                    onChange={(e) =>
                                        updateTextField("mistakes", e.target.value)
                                    }
                                />
                            </div>
                        </section>

                        {/* Checklist */}
                        <section>
                            <h3 className="mb-4 text-sm font-bold text-slate-800 dark:text-white">
                                Checklist
                            </h3>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {([
                                    ["volume", "Volume"],
                                    ["time", "Timing"],
                                    ["trend", "Trend"],
                                    ["btc", "BTC Alignment"],
                                ] as const).map(([field, label]) => (
                                    <label
                                        key={field}
                                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-[#111c30] dark:text-slate-300"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={form.checkItems?.[field] ?? false}
                                            onChange={(e) =>
                                                updateChecklist(field, e.target.checked)
                                            }
                                            className="size-4 accent-blue-600"
                                        />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </section>

                        {/* Screenshots */}
                        <section>
                            <h3 className="mb-4 text-sm font-bold text-slate-800 dark:text-white">
                                Screenshots
                            </h3>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>
                                        Entry Screenshot URL
                                    </label>
                                    <input
                                        type="url"
                                        className={inputClass}
                                        value={form.entryScreenshot ?? ""}
                                        onChange={(e) =>
                                            updateTextField(
                                                "entryScreenshot",
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        Exit Screenshot URL
                                    </label>
                                    <input
                                        type="url"
                                        className={inputClass}
                                        value={form.exitScreenshot ?? ""}
                                        onChange={(e) =>
                                            updateTextField(
                                                "exitScreenshot",
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Notes */}
                        <section>
                            <h3 className="mb-4 text-sm font-bold text-slate-800 dark:text-white">
                                Notes
                            </h3>

                            <textarea
                                className={textareaClass}
                                value={form.notes ?? ""}
                                onChange={(e) =>
                                    updateTextField("notes", e.target.value)
                                }
                                placeholder="Write your trade notes..."
                            />
                        </section>

                        {saveError && (
                            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400">
                                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                                <span>{saveError}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-[#1c2a40] sm:px-6">
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => onOpenChange(false)}
                            className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Save className="size-4" />
                            )}

                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditTradeDialog;
