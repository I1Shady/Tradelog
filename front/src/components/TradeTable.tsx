"use client";
"use no memo";

import { useMemo, useState } from "react";

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

type TradeFilter = "all" | "long" | "short" | "win" | "loss";

interface TradeTableProps {
  data: Trade[];
  filter: TradeFilter;
  search: string;
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

function ActionsCell({
  row,
}: {
  row: Row<DataGridFeatures, Trade>;
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
          <Button className="size-7" size="icon" variant="ghost">
            <MoreHorizontal />
          </Button>
        }
      />

      <DropdownMenuContent side="bottom" align="end">
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
              window.open(trade.entryScreenshot!, "_blank", "noopener,noreferrer")
            }
          >
            <ExternalLink className="mr-2 size-4" />
            Open Entry Screenshot
          </DropdownMenuItem>
        )}

        {trade.exitScreenshot && (
          <DropdownMenuItem
            onClick={() =>
              window.open(trade.exitScreenshot!, "_blank", "noopener,noreferrer")
            }
          >
            <ExternalLink className="mr-2 size-4" />
            Open Exit Screenshot
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => toast.info("Delete functionality is not connected yet")}
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

  const filteredData = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return data.filter((trade) => {
      const matchesSearch =
        !normalizedSearch ||
        trade.symbol.toLowerCase().includes(normalizedSearch) ||
        (trade.exchange ?? "").toLowerCase().includes(normalizedSearch);

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

  const columns = useMemo<ColumnDef<DataGridFeatures, Trade>[]>(
    () => [
      {
        id: "pin",
        header: "",
        cell: ({ row }) => <DataGridTableRowPin row={row} />,
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
          <span className="whitespace-nowrap text-foreground">
            {formatDate(row.original.date)}
          </span>
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
          <span className="font-semibold text-foreground">
            {row.original.symbol}
          </span>
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
          <span className="text-muted-foreground">
            {row.original.exchange ?? "—"}
          </span>
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
        cell: ({ row }) => row.original.timeframe ?? "—",
        size: 100,
        enableSorting: true,
      },
      {
        accessorKey: "side",
        id: "side",
        header: ({ column }) => (
          <DataGridColumnHeader title="Side" column={column} />
        ),
        cell: ({ row }) => {
          const side = row.original.side;

          return side === "LONG" ? (
            <Badge variant="success-outline">LONG</Badge>
          ) : (
            <Badge variant="destructive-outline">SHORT</Badge>
          );
        },
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
          <span className="tabular-nums">
            {formatNumber(row.original.entryPrice)}
          </span>
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
        cell: ({ row }) => formatNumber(row.original.stopLoss),
        size: 120,
        enableSorting: true,
      },
      {
        accessorKey: "takeProfit",
        id: "takeProfit",
        header: ({ column }) => (
          <DataGridColumnHeader title="Take Profit" column={column} />
        ),
        cell: ({ row }) => formatNumber(row.original.takeProfit),
        size: 130,
        enableSorting: true,
      },
      {
        accessorKey: "positionMargin",
        id: "positionMargin",
        header: ({ column }) => (
          <DataGridColumnHeader title="Margin" column={column} />
        ),
        cell: ({ row }) => formatNumber(row.original.positionMargin),
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
        cell: ({ row }) => formatNumber(row.original.orderValue),
        size: 130,
        enableSorting: true,
      },
      {
        accessorKey: "orderType",
        id: "orderType",
        header: ({ column }) => (
          <DataGridColumnHeader title="Order Type" column={column} />
        ),
        cell: ({ row }) => row.original.orderType ?? "—",
        size: 120,
        enableSorting: true,
      },
      {
        accessorKey: "mentalState",
        id: "mentalState",
        header: ({ column }) => (
          <DataGridColumnHeader title="Mental State" column={column} />
        ),
        cell: ({ row }) => row.original.mentalState ?? "—",
        size: 140,
        enableSorting: true,
      },
      {
        accessorKey: "strategy",
        id: "strategy",
        header: ({ column }) => (
          <DataGridColumnHeader title="Strategy" column={column} />
        ),
        cell: ({ row }) => row.original.strategy ?? "—",
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
            className="block max-w-[180px] truncate text-muted-foreground"
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
            <span className="tabular-nums text-muted-foreground">
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
            className="block max-w-[200px] truncate text-muted-foreground"
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

          return value !== null ? `${formatNumber(value)}%` : "—";
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

          if (pnl === null) return "—";

          return (
            <span
              className={`font-semibold tabular-nums ${
                pnl > 0
                  ? "text-emerald-500"
                  : pnl < 0
                    ? "text-red-500"
                    : "text-foreground"
              }`}
            >
              {pnl > 0 ? "+" : ""}
              {formatNumber(pnl)}
            </span>
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
            <Badge variant="warning-outline">Open</Badge>
          ) : (
            <Badge variant="info-outline">Closed</Badge>
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
        cell: ({ row }) => <ActionsCell row={row} />,
        size: 60,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    [],
  );

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: filteredData,
    pageCount: Math.ceil(filteredData.length / pagination.pageSize),
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
    <DataGrid
      table={table}
      recordCount={filteredData.length}
      tableLayout={{
        rowsPinnable: true,
        columnsResizable: true,
      }}
    >
      <Card className="w-full gap-0 p-0">
        <CardHeader className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              Trade History
            </span>

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
              onClick={() => setRowPinning({ top: [], bottom: [] })}
            >
              Unpin all
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <DataGridContainer>
            <DataGridScrollArea>
              <DataGridTable />
            </DataGridScrollArea>
          </DataGridContainer>
        </CardContent>

        <CardFooter className="border-none bg-transparent! px-3 py-2">
          <DataGridPagination />
        </CardFooter>
      </Card>
    </DataGrid>
  );
}

export default TradeTable;