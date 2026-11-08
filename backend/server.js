
import express from "express";
import cors from "cors";
import { pool } from "./db.js";

const app = express();

app.use(express.json());

app.use(
    cors({
        origin: [
            "https://i1shady.github.io",
            "http://localhost:5173",
        ],
        credentials: true,
    })
);

// Convert database row to frontend Trade.
function formatTradeRow(row) {
    return {
        id: row.id,
        date: row.trade_date,
        symbol: row.symbol,
        exchange: row.exchange,
        timeframe: row.timeframe,
        side: row.side,
        entryPrice: row.entry_price,
        positionMargin: row.margin,
        leverage: row.leverage,
        orderValue: row.order_value,
        orderType: row.order_type,
        entryScreenshot: row.entry_screenshot,
        mentalState: row.mental,
        strategy: row.strategy,
        mistakes: row.mistakes,
        checkItems: row.checklist,
        notes: row.notes,
        stopLoss: row.stop_loss,
        takeProfit: row.take_profit,
        exitScreenshot: row.exit_screenshot,
        positionToAcc: row.position_pct,
        pnl: row.pnl_amount,
        status: row.pnl_amount !== null ? "closed" : "open",
        exitType: row.pnl_result,
    };
}

// Root.
app.get("/", (req, res) => {
    res.json({ message: "TradeLog API is running" });
});

// Get all trades.
app.get("/api/trades", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM journal_entries ORDER BY id DESC"
        );

        res.json(result.rows.map(formatTradeRow));
    } catch (err) {
        console.error("GET /api/trades error:", err);
        res.status(500).json({ error: "internal error" });
    }
});

// Get one trade.
app.get("/api/trades/:id", async (req, res) => {
    try {
        const id = Number.parseInt(req.params.id, 10);

        if (!Number.isInteger(id)) {
            return res.status(400).json({ error: "Invalid trade ID" });
        }

        const result = await pool.query(
            "SELECT * FROM journal_entries WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Trade not found" });
        }

        res.json(formatTradeRow(result.rows[0]));
    } catch (err) {
        console.error("GET /api/trades/:id error:", err);
        res.status(500).json({ error: "internal error" });
    }
});

// Add a new trade.
app.post("/api/trades", async (req, res) => {
    try {
        const b = req.body;

        const result = await pool.query(
            `INSERT INTO journal_entries (
                symbol, exchange, timeframe, side, entry_price, margin, leverage,
                order_value, order_type,
                mental, strategy, mistakes, checklist, notes,
                stop_loss, take_profit, position_pct,
                pnl_amount, pnl_currency, pnl_result
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,
                $8,$9,$10,
                $11,$12,$13,$14,$15,$16,
                $17,$18,$19,$20
            )
            RETURNING *`,
            [
                b.symbol ?? null,
                b.exchange ?? null,
                b.timeframe ?? null,
                b.side ?? null,
                b.entry_price ?? null,
                b.margin ?? null,
                b.leverage ?? null,
                b.order_value ?? null,
                b.order_type ?? null,
                b.mental ?? null,
                b.strategy ?? null,
                b.mistakes ?? null,
                b.checklist ? JSON.stringify(b.checklist) : null,
                b.notes ?? null,
                b.stop_loss ?? null,
                b.take_profit ?? null,
                b.position_pct ?? null,
                b.pnl_amount ?? null,
                b.pnl_currency ?? null,
                b.pnl_result ?? null,
            ]
        );

        res.status(201).json(formatTradeRow(result.rows[0]));
    } catch (err) {
        console.error("POST /api/trades error:", err);
        res.status(500).json({ error: "internal error" });
    }
});

// Update an existing trade.
app.put("/api/trades/:id", async (req, res) => {
    try {
        const id = Number.parseInt(req.params.id, 10);

        if (!Number.isInteger(id)) {
            return res.status(400).json({ error: "Invalid trade ID" });
        }

        const fieldMap = {
            date: "trade_date",
            symbol: "symbol",
            exchange: "exchange",
            timeframe: "timeframe",
            side: "side",
            entryPrice: "entry_price",
            positionMargin: "margin",
            leverage: "leverage",
            orderValue: "order_value",
            orderType: "order_type",
            entryScreenshot: "entry_screenshot",
            mentalState: "mental",
            strategy: "strategy",
            mistakes: "mistakes",
            checkItems: "checklist",
            notes: "notes",
            stopLoss: "stop_loss",
            takeProfit: "take_profit",
            exitScreenshot: "exit_screenshot",
            positionToAcc: "position_pct",
            pnl: "pnl_amount",
            exitType: "pnl_result",
        };

        const entries = Object.entries(req.body).filter(
            ([key, value]) =>
                key !== "id" &&
                key !== "status" &&
                Object.hasOwn(fieldMap, key) &&
                value !== undefined
        );

        if (entries.length === 0) {
            return res.status(400).json({
                error: "No valid fields provided",
            });
        }

        const values = [];
        const setClauses = [];

        for (const [key, value] of entries) {
            const column = fieldMap[key];

            const normalizedValue =
                key === "checkItems" && value !== null
                    ? JSON.stringify(value)
                    : value;

            values.push(normalizedValue);

            setClauses.push(
                `"${column}" = $${values.length}`
            );
        }

        values.push(id);

        const query = `
            UPDATE journal_entries
            SET ${setClauses.join(", ")}
            WHERE id = $${values.length}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Trade not found",
            });
        }

        res.json(formatTradeRow(result.rows[0]));
    } catch (err) {
        console.error("PUT /api/trades/:id error:", err);

        res.status(500).json({
            error: "Failed to update trade",
        });
    }
});

// Start server.
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on port ${PORT}`);

    try {
        await pool.query("SELECT NOW()");
        console.log("Connected to PostgreSQL");
    } catch (err) {
        console.error("Failed to connect to PostgreSQL:", err.message);
    }
});
