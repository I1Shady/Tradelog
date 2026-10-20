import express from "express";
import cors from "cors";
import { pool } from "./db.js";

const app = express();
app.use(express.json());

//Cors
app.use(cors({
    origin: [
        "http://localhost:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500"
    ],
    credentials: true
}));

// روت تستی
app.get("/", (req, res) => {
    res.json({ message: "TradeLog API is running" });
});

// Get all trades
app.get("/api/trades", async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM journal_entries ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('GET /api/trades error:', err);
        res.status(500).json({ error: 'internal error' });
    }
});

// Get 1 trade
app.get("/api/trades/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await pool.query('SELECT * FROM journal_entries WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Trade not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('GET /api/trades/:id error:', err);
        res.status(500).json({ error: 'internal error' });
    }
});

// ============================================
// START
// ============================================

const PORT = 5000;

app.listen(PORT, async () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📊 Trades: http://localhost:${PORT}/api/trades`);
    try {
        await pool.query('SELECT NOW()');
        console.log('✅ Connected to PostgreSQL');
    } catch (err) {
        console.error('❌ Failed to connect to PostgreSQL:', err.message);
    }
});