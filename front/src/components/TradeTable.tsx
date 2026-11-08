
"use client";
"use no memo";

import { useMemo, useState, type ReactNode } from "react";

import {
    type ColumnDef,
    type PaginationState,
    type Row,
    type RowPinningState,
    type SortingState,
    useTable,
} from "@tanstack/react-table";

import { toast } from "sonner";

import {
    Copy,
    ExternalLink,
    MoreHorizontal,
    ArrowDownUp,
    Pencil,
} from "lucide-react";

import type { Trade } from "../types/types";

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

import { Badge } from "@/components/reui/badge";

import {
    DataGrid,
    DataGridContainer,
    dataGridFeatures,
    type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";

import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";

import {
    DataGridTable,
    DataGridTableRowPin,
} from "@/components/reui/data-grid/data-grid-table";

import { Button } from "@/components/ui/button";

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    validateTrades,
    type TradeValidationIssue,
} from "./trade-validation/trade-validation.utils";

import TradeValidationPanel from "./trade-validation/TradeValidationPanel";

import EditTradeDialog from "./trade-editor/EditTradeDialog";

type TradeFilter = "all" | "long" | "short" | "win" | "loss";

interface TradeTableProps {
    data: Trade[];
    filter: TradeFilter;
    search: string;
    onUpdateTrade: (trade: Trade) => Promise<void>;
}

function formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) return "—";

    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 4,
    }).format(value);
}

function formatDate(value: string): string {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

// Validation cell.
function ValidationCell({
    tradeId,
    field,
    issue,
    children,
}: {
    tradeId: Trade["id"];
    field: keyof Trade;
    issue?: TradeValidationIssue;
    children: ReactNode;
}) {
    const isError = issue?.severity === "error";

    return (
        <span
            id={`trade-cell-${tradeId}-${String(field)}`}
            title={issue?.message}
            className={`inline-flex max-w-full items-center gap-1.5 rounded-sm transition-colors ${
                issue
                    ? isError
                        ? "border-b border-dashed border-red-500/70 text-red-500 dark:border-red-400"
                        : "border-b border-dashed border-amber-500/70 text-amber-500 dark:border-amber-400"
                    : ""
            }`}
        >
            {children}

            {issue && (
                <span
                    className={`size-1.5 shrink-0 rounded-full ${
                        isError ? "bg-red-500" : "bg-amber-500"
                    }`}
                />
            )}
        </span>
    );
}

// Row actions.
function ActionsCell({
    row,
    onEdit,
}: {
    row: Row<DataGridFeatures, Trade>;
    onEdit: (trade: Trade) => void;
}) {
    const { copyToClipboard } = useCopyToClipboard();

    const isPinned = row.getIsPinned();
    const trade = row.original;

    const handleCopyId = () => {
        copyToClipboard(String(trade.id));

        toast.success("Trade ID copied", {
            description: String(trade.id),
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        className="size-8 rounded-lg"
                        size="icon"
                        variant="ghost"
                    >
                        <MoreHorizontal className="size-4" />
                    </Button>
                }
            />

            <DropdownMenuContent side="bottom" align="end">
                <DropdownMenuItem
                    onClick={() => onEdit(trade)}
                >
                    <Pencil className="mr-2 size-4" />
                    Edit Trade
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => row.pin(isPinned ? false : "top")}
                >
                    {isPinned ? "Unpin row" : "Pin to top"}
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleCopyId}>
                    <Copy className="mr-2 size-4" />
                    Copy Trade ID
                </DropdownMenuItem>

                {trade.entryScreenshot && (
                    <DropdownMenuItem
                        onClick={() =>
                            window.open(
                                trade.entryScreenshot!,
                                "_blank",
                                "noopener,noreferrer"
                            )
                        }
                    >
                        <ExternalLink className="mr-2 size-4" />
                        Open Entry Screenshot
                    </DropdownMenuItem>
                )}

                {trade.exitScreenshot && (
                    <DropdownMenuItem
                        onClick={() =>
                            window.open(
                                trade.exitScreenshot!,
                                "_blank",
                                "noopener,noreferrer"
                            )
                        }
                    >
                        <ExternalLink className="mr-2 size-4" />
                        Open Exit Screenshot
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() =>
                        toast.info(
                            "Delete functionality is not connected yet"
                        )
                    }
                    variant="destructive"
                >
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function TradeTable({
    data,
    filter,
    search,
    onUpdateTrade,
}: TradeTableProps) {
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    const [sorting, setSorting] = useState<SortingState>([
        { id: "date", desc: true },
    ]);

    const [rowPinning, setRowPinning] = useState<RowPinningState>({
        top: [],
        bottom: [],
    });

    const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

    const [editDialogOpen, setEditDialogOpen] = useState(false);

    // Open edit dialog.
    const handleEditTrade = (trade: Trade) => {
        setEditingTrade(trade);
        setEditDialogOpen(true);
    };

    // Close edit dialog.
    const handleEditDialogChange = (open: boolean) => {
        setEditDialogOpen(open);

        if (!open) {
            setEditingTrade(null);
        }
    };

    // Filter trades.
    const filteredData = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return data.filter((trade) => {
            const matchesSearch =
                !normalizedSearch ||
                trade.symbol.toLowerCase().includes(normalizedSearch) ||
                (trade.exchange ?? "")
                    .toLowerCase()
                    .includes(normalizedSearch);

            let matchesFilter = true;

            switch (filter) {
                case "long":
                    matchesFilter = trade.side === "LONG";
                    break;

                case "short":
                    matchesFilter = trade.side === "SHORT";
                    break;

                case "win":
                    matchesFilter = (trade.pnl ?? 0) > 0;
                    break;

                case "loss":
                    matchesFilter = (trade.pnl ?? 0) < 0;
                    break;
            }

            return matchesSearch && matchesFilter;
        });
    }, [data, filter, search]);

    // Validate all trades.
    const issues = useMemo(
        () => validateTrades(data),
        [data]
    );

    // Create lookup map.
    const issuesByCell = useMemo(() => {
        const map = new Map<string, TradeValidationIssue>();

        for (const issue of issues) {
            map.set(
                `${issue.tradeId}-${String(issue.field)}`,
                issue
            );
        }

        return map;
    }, [issues]);

    const getCellIssue = (
        trade: Trade,
        field: keyof Trade
    ) => {
        return issuesByCell.get(
            `${trade.id}-${String(field)}`
        );
    };

    // Scroll to problematic cell.
    const handleIssueClick = (
        issue: TradeValidationIssue
    ) => {
        const element = document.getElementById(
            `trade-cell-${issue.tradeId}-${String(issue.field)}`
        );

        element?.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
        });
    };

    // Table columns.
    const columns = useMemo<ColumnDef<DataGridFeatures, Trade>[]>(
        () => [
            {
                id: "pin",
                header: "",
                cell: ({ row }) => (
                    <DataGridTableRowPin row={row} />
                ),
                size: 40,
                enableSorting: false,
                enableHiding: false,
                enableResizing: false,
            },
            {
                accessorKey: "date",
                id: "date",
                header: ({ column }) => (
                    <DataGridColumnHeader title="Date" column={column} />
                ),
                cell: ({ row }) => (
                    <ValidationCell
                        tradeId={row.original.id}
                        field="date"
                        issue={getCellIssue(row.original, "date")}
                    >
                        <span className="whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                            {formatDate(row.original.date)}
                        </span>
                    </ValidationCell>
                ),
                size: 140,
                enableSorting: true,
            },
            {
                accessorKey: "symbol",
                id: "symbol",
                header: ({ column }) => (
                    <DataGridColumnHeader title="Symbol" column={column} />
                ),
                cell: ({ row }) => (
                    <ValidationCell
                        tradeId={row.original.id}
                        field="symbol"
                        issue={getCellIssue(row.original, "symbol")}
                    >
                        <span className="font-bold text-slate-900 dark:text-white">
                            {row.original.symbol || "—"}
                        </span>
                    </ValidationCell>
                ),
                minSize: 120,
                enableSorting: true,
            },
            {
                accessorKey: "exchange",
                id: "exchange",
                header: ({ column }) => (
                    <DataGridColumnHeader title="Exchange" column={column} />
                ),
                cell: ({ row }) => (
                    <ValidationCell
                        tradeId={row.original.id}
                        field="exchange"
                        issue={getCellIssue(row.original, "exchange")}
                    >
                        <span className="text-slate-500 dark:text-slate-400">
                            {row.original.exchange ?? "—"}
                        </span>
                    </ValidationCell>
                ),
                size: 120,
                enableSorting: true,
            },
            {
                accessorKey: "timeframe",
                id: "timeframe",
                header: ({ column }) => (
                    <DataGridColumnHeader title="Timeframe" column={column} />
                ),
                cell: ({ row }) => (
                    <ValidationCell
                        tradeId={row.original.id}
                        field="timeframe"
                        issue={getCellIssue(row.original, "timeframe")}
                    >
                        {row.original.timeframe ?? "—"}
                    </ValidationCell>
                ),
                size: 100,
                enableSorting: true,
            },
            {
                accessorKey: "side",
                id: "side",
                header: ({ column }) => (
                    <DataGridColumnHeader title="Side" column={column} />
                ),
                cell: ({ row }) => (
                    <ValidationCell
                        tradeId={row.original.id}
                        field="side"
                        issue={getCellIssue(row.original, "side")}
                    >
                        <Badge
                            variant={
                                row.original.side === "LONG"
                                    ? "success-outline"
                                    : "destructive-outline"
                            }
                            className="rounded-md px-2.5 font-bold"
                        >
                            {row.original.side || "—"}
                        </Badge>
                    </ValidationCell>
                ),
                size: 100,
                enableSorting: true,
            },
            {
                accessorKey: "entryPrice",
                id: "entryPrice",
                header: ({ column }) => (
                    <DataGridColumnHeader title="Entry Price" column={column} />
                ),
                cell: ({ row }) => (
                    <ValidationCell
                        tradeId={row.original.id}
                        field="entryPrice"
                        issue={getCellIssue(row.original, "entryPrice")}
                    >
                        <span className="font-medium tabular-nums text-slate-700 dark:text-slate-300">
                            {formatNumber(row.original.entryPrice)}
                        </span>
                    </ValidationCell>
                ),
                size: 130,
                enableSorting: true,
            },
            {
                accessorKey: "stopLoss",
                id: "stopLoss",
                header: ({ column }) => (
                    <DataGridColumnHeader title="Stop Loss" column={column} />
                ),
                cell: ({ row }) => (
                    <ValidationCell
                        tradeId={row.original.id}
                        field="stopLoss"
                        issue={getCellIssue(row.original, "stopLoss")}
                    >
                        <span className="tabular-nums text-red-500">
                            {formatNumber(row.original.stopLoss)}
                        </span>
                    </ValidationCell>
                ),
                size: 120,
                enableSorting: true,
            },
            {
                accessorKey: "takeProfit",
                id: "takeProfit",
                header: ({ column }) => (
                    <DataGridColumnHeader title="Take Profit" column={column} />
                ),
                cell: ({ row }) => (
                    <ValidationCell
                        tradeId={row.original.id}
                        field="takeProfit"
                        issue={getCellIssue(row.original, "takeProfit")}
                    >
                        <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                            {formatNumber(row.original.takeProfit)}
                        </span>
                    </ValidationCell>
                ),
                size: 130,
                enableSorting: true,
            },
            {
                accessorKey: "positionMargin",
                id: "positionMargin",
                header: ({ column }) => (
                    <DataGridColumnHeader title="Margin" column={column} />
                ),
                cell: ({ row }) => (
                    <ValidationCell
                        tradeId={row.original.id}
                        field="positionMargin"
                        issue={getCellIssue(row.original, "positionMargin")}
                    >
                        {formatNumber(row.original.positionMargin)}
                    </ValidationCell>
                ),
                size: 110,
                enableSorting: true,
            },
            {
                accessorKey: "leverage",
                id: "leverage",
                header: ({ column }) => (
                    <DataGridColumnHeader title="Leverage" column={column} />
                ),
                cell: ({ row }) =>
                    row.original.leverage !== null
                        ? `${row.original.leverage}x`
                        : "—",
                size: 100,
                enableSorting: true,
            },
            {
                accessorKey: "orderValue",
                id: "orderValue",
                header: ({ column }) => (
                    <DataGridColumnHeader title="Order Value" column={column} />
                ),
                cell: ({ row }) => (
                    <ValidationCell
                        tradeId={row.original.id}
                        field="orderValue"
                        issue={getCellIssue(row.original, "orderValue")}
                    >
                        {formatNumber(row.original.orderValue)}
                    </ValidationCell>
                ),
                size: 130,
                enableSorting: true,
            },
            {
                accessorKey: "orderType",
                id: "orderType",
                header: ({ column }) => (
                    <DataGridColumnHeader title="Order Type" column={column} />
                ),
                cell: ({ row }) => (
                    <ValidationCell
                        tradeId={row.original.id}
                        field="orderType"
                        issue={getCellIssue(row.original, "orderType")}
                    >
                        {row.original.orderType ?? "—"}
                    </ValidationCell>
                ),
                size: 120,
                enableSorting: true,
            },
            {
                accessorKey: "mentalState",
                id: "mentalState",
                header: ({ column }) => (
                    <DataGridColumnHeader title="Mental State" column={column} />
                ),
                cell: ({ row }) => (
                    <ValidationCell
                        tradeId={row.original.id}
                        field="mentalState"
                        issue={getCellIssue(row.original, "mentalState")}
                    >
                        {row.original.mentalState ?? "—"}
                    </ValidationCell>
                ),
                size: 140,
                enableSorting: true,
            },
            {
                accessorKey: "strategy",
                id: "strategy",
                header: ({ column }) => (
                    <DataGridColumnHeader title="Strategy" column={column} />
                ),
                cell: ({ row }) => (
                    <ValidationCell
                        tradeId={row.original.id}
                        field="strategy"
                        issue={getCellIssue(row.original, "strategy")}
                    >
                        {row.original.strategy ?? "—"}
                    </ValidationCell>
                ),
                size: 140,
                enableSorting: true,
            },
            {
                accessorKey: "mistakes",
                id: "mistakes",
                header: ({ column }) => (
                    <DataGridColumnHeader title="Mistakes" column={column} />
                ),
                cell: ({ row }) => (
                    <span
                        className="block max-w-[180px] truncate text-slate-500 dark:text-slate-400"
                        title={row.original.mistakes ?? ""}
                    >
                        {row.original.mistakes || "—"}
                    </span>
                ),
                size: 180,
                enableSorting: true,
            },
            {
                id: "checkItems",
                header: "Checklist",
                cell: ({ row }) => {
                    const checks = row.original.checkItems;

                    if (!checks) return "—";

                    const completed = Object.values(checks).filter(Boolean).length;
                    const total = Object.keys(checks).length;

                    return (
                        <span className="font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                            {completed}/{total}
                        </span>
                    );
                },
                size: 110,
                enableSorting: false,
            },
            {
                accessorKey: "notes",
                id: "notes",
                header: ({ column }) => (
                    <DataGridColumnHeader title="Notes" column={column} />
                ),
                cell: ({ row }) => (
                    <span
                        className="block max-w-[200px] truncate text-slate-500 dark:text-slate-400"
                        title={row.original.notes ?? ""}
                    >
                        {row.original.notes || "—"}
                    </span>
                ),
                size: 200,
                enableSorting: false,
            },
            {
                accessorKey: "positionToAcc",
                id: "positionToAcc",
                header: ({ column }) => (
                    <DataGridColumnHeader title="Position %" column={column} />
                ),
                cell: ({ row }) => {
                    const value = row.original.positionToAcc;

                    return value !== null
                        ? `${formatNumber(value)}%`
                        : "—";
                },
                size: 120,
                enableSorting: true,
            },
            {
                accessorKey: "pnl",
                id: "pnl",
                header: ({ column }) => (
                    <DataGridColumnHeader title="PnL" column={column} />
                ),
                cell: ({ row }) => {
                    const pnl = row.original.pnl;

                    return (
                        <ValidationCell
                            tradeId={row.original.id}
                            field="pnl"
                            issue={getCellIssue(row.original, "pnl")}
                        >
                            <span
                                className={`font-bold tabular-nums ${
                                    pnl === null
                                        ? "text-slate-500"
                                        : pnl > 0
                                          ? "text-emerald-600 dark:text-emerald-400"
                                          : pnl < 0
                                            ? "text-red-500 dark:text-red-400"
                                            : "text-slate-600 dark:text-slate-300"
                                }`}
                            >
                                {pnl !== null
                                    ? `${pnl > 0 ? "+" : ""}${formatNumber(pnl)}`
                                    : "—"}
                            </span>
                        </ValidationCell>
                    );
                },
                size: 120,
                enableSorting: true,
            },
            {
                accessorKey: "status",
                id: "status",
                header: ({ column }) => (
                    <DataGridColumnHeader title="Status" column={column} />
                ),
                cell: ({ row }) =>
                    row.original.status === "open" ? (
                        <Badge variant="warning-outline" className="rounded-md">
                            Open
                        </Badge>
                    ) : (
                        <Badge variant="info-outline" className="rounded-md">
                            Closed
                        </Badge>
                    ),
                size: 100,
                enableSorting: true,
            },
            {
                accessorKey: "exitType",
                id: "exitType",
                header: ({ column }) => (
                    <DataGridColumnHeader title="Exit Type" column={column} />
                ),
                cell: ({ row }) => row.original.exitType ?? "—",
                size: 120,
                enableSorting: true,
            },
            {
                id: "actions",
                header: "",
                cell: ({ row }) => (
                    <ActionsCell
                        row={row}
                        onEdit={handleEditTrade}
                    />
                ),
                size: 60,
                enableSorting: false,
                enableHiding: false,
                enableResizing: false,
            },
        ],
        [issuesByCell]
    );

    const table = useTable({
        features: dataGridFeatures,
        columns,
        data: filteredData,
        pageCount: Math.ceil(
            filteredData.length / pagination.pageSize
        ),
        getRowId: (row: Trade) => String(row.id),
        enableRowPinning: true,
        keepPinnedRows: true,
        state: {
            pagination,
            sorting,
            rowPinning,
        },
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        onRowPinningChange: setRowPinning,
    });

    return (
        <>
            <DataGrid
                table={table}
                recordCount={filteredData.length}
                tableLayout={{
                    rowsPinnable: true,
                    columnsResizable: true,
                }}
            >
                <Card className="trade-table-card group/trade-grid w-full gap-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 shadow-sm transition-colors dark:border-white/[0.08] dark:bg-[#1c2a40]">

                    <CardHeader className="flex flex-col items-start justify-between gap-3 border-b border-slate-200/80 bg-slate-50/80 px-4 py-4 dark:border-white/[0.08] dark:bg-[#202f46] sm:flex-row sm:items-center sm:px-5">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                                <ArrowDownUp className="size-4" />
                            </div>

                            <div className="min-w-0">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                                    Trade History
                                </h3>

                                <p className="mt-1 text-[11px] text-slate-400">
                                    Your complete trading activity
                                </p>
                            </div>

                            {(rowPinning.top?.length ?? 0) > 0 && (
                                <Badge variant="primary-outline" size="sm">
                                    {rowPinning.top?.length} pinned
                                </Badge>
                            )}
                        </div>

                        {(rowPinning.top?.length ?? 0) > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="shrink-0 rounded-lg text-xs text-slate-500 hover:text-red-500"
                                onClick={() =>
                                    setRowPinning({
                                        top: [],
                                        bottom: [],
                                    })
                                }
                            >
                                Unpin all
                            </Button>
                        )}
                    </CardHeader>

                    <CardContent className="min-w-0 p-0">
                        <TradeValidationPanel
                            issues={issues}
                            onIssueClick={handleIssueClick}
                        />

                        <div className="trade-table-scroll overflow-x-auto overscroll-x-contain">
                            <DataGridContainer>
                                <DataGridScrollArea>
                                    <DataGridTable />
                                </DataGridScrollArea>
                            </DataGridContainer>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col items-start justify-between gap-3 border-t border-slate-200/80 bg-slate-50/80 px-4 py-4 dark:border-white/[0.08] dark:bg-[#17243a] sm:flex-row sm:items-center sm:px-5">
                        <span className="text-[11px] font-medium text-slate-400">
                            Showing {filteredData.length} filtered records
                        </span>

                        <div className="w-full min-w-0 sm:w-auto">
                            <DataGridPagination />
                        </div>
                    </CardFooter>

                </Card>
            </DataGrid>

            {/* Edit dialog */}
            <EditTradeDialog
                trade={editingTrade}
                open={editDialogOpen}
                onOpenChange={handleEditDialogChange}
                onSave={onUpdateTrade}
            />
        </>
    );
}

export default TradeTable;
