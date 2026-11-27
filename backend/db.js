import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = process.env.DATABASE_PATH ? path.resolve(process.env.DATABASE_PATH) : path.join(__dirname, "tradelog.db");

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trade_date TEXT DEFAULT CURRENT_TIMESTAMP,
    symbol TEXT, exchange TEXT, timeframe TEXT, side TEXT,
    entry_price REAL, margin REAL, leverage REAL, order_value REAL,
    order_type TEXT, entry_screenshot TEXT, mental TEXT, strategy TEXT,
    mistakes TEXT, checklist TEXT, notes TEXT, stop_loss REAL, take_profit REAL,
    exit_screenshot TEXT, position_pct REAL, pnl_amount REAL, pnl_currency TEXT, pnl_result TEXT
  );
`);

const columns = db.prepare("PRAGMA table_info(journal_entries)").all();
if (!columns.some((column) => column.name === "user_id")) {
  db.exec("ALTER TABLE journal_entries ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE");
}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id, id DESC);
  CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
`);

export default db;
