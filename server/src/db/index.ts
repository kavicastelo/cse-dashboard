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
    open_price REAL,
    high_price REAL,
    low_price REAL,
    close_price REAL,
    volume INTEGER,
    turnover REAL,
    trades_count INTEGER,
    UNIQUE(symbol, date)
  );

  CREATE TABLE IF NOT EXISTS watchlist (
    symbol TEXT PRIMARY KEY
  );
`);

export default db;
