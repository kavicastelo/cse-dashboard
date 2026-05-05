import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../data/stocks.db');
const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS stocks_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    date TEXT NOT NULL,
    timestamp TEXT, -- ISO8601 for intraday
    open_price REAL,
    high_price REAL,
    low_price REAL,
    close_price REAL,
    volume INTEGER,
    turnover REAL,
    trades_count INTEGER
  );

  -- Migration: Add timestamp if it doesn't exist and backfill
  -- Note: We can't easily drop UNIQUE constraints in SQLite without recreating.
  -- For this personal dashboard, we'll ensure the unique index exists for (symbol, timestamp).
  CREATE UNIQUE INDEX IF NOT EXISTS idx_symbol_timestamp ON stocks_history(symbol, timestamp);

  CREATE TABLE IF NOT EXISTS watchlist (
    symbol TEXT PRIMARY KEY
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    type TEXT CHECK(type IN ('BUY', 'SELL')) NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    date TEXT NOT NULL,
    fees REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS holdings (
    symbol TEXT PRIMARY KEY,
    quantity INTEGER NOT NULL,
    avg_price REAL NOT NULL,
    last_updated TEXT NOT NULL
  );
`);

export default db;
