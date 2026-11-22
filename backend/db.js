import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const dbPath = path.join(__dirname, 'tradelog.db');

const db = new Database(dbPath);


db.exec(`
  CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trade_date TEXT DEFAULT CURRENT_TIMESTAMP,
    symbol TEXT,
    exchange TEXT,
    timeframe TEXT,
    side TEXT,
    entry_price REAL,
    margin REAL,
    leverage REAL,
    order_value REAL,
    order_type TEXT,
    entry_screenshot TEXT,
    mental TEXT,
    strategy TEXT,
    mistakes TEXT,
    checklist TEXT,
    notes TEXT,
    stop_loss REAL,
    take_profit REAL,
    exit_screenshot TEXT,
    position_pct REAL,
    pnl_amount REAL,
    pnl_currency TEXT,
    pnl_result TEXT
  )
`);

export const pool = {
  query: async (text, params = []) => {
    
    const sqliteQuery = text.replace(/\$\d+/g, '?');

    try {
      const stmt = db.prepare(sqliteQuery);
      
      
      if (sqliteQuery.trim().toUpperCase().startsWith("SELECT")) {
        const rows = stmt.all(...params);
        return { rows };
      } 
      
      else {
        const info = stmt.run(...params);
        
        
        if (sqliteQuery.toUpperCase().includes("RETURNING *")) {
          const lastId = info.lastInsertRowid;
          const row = db.prepare("SELECT * FROM journal_entries WHERE id = ?").get(lastId);
          return { rows: [row] };
        }
        
        return { rows: [], info };
      }
    } catch (err) {
      console.error("SQLite Error:", err);
      throw err;
    }
  }
};