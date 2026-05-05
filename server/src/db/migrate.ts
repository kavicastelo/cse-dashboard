import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../data/stocks.db');
const db = new Database(dbPath);

console.log('Starting migration...');

try {
  // 1. Check if we need to migrate
  const tableInfo = db.prepare("PRAGMA table_info(stocks_history)").all();
  const hasTimestamp = tableInfo.some((col: any) => col.name === 'timestamp');

  if (!hasTimestamp) {
    console.log('Adding timestamp column and updating unique constraint...');
    
    db.transaction(() => {
      // Create new table
      db.exec(`
        CREATE TABLE stocks_history_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          symbol TEXT NOT NULL,
          date TEXT NOT NULL,
          timestamp TEXT,
          open_price REAL,
          high_price REAL,
          low_price REAL,
          close_price REAL,
          volume INTEGER,
          turnover REAL,
          trades_count INTEGER
        )
      `);

      // Copy data and backfill timestamp
      db.exec(`
        INSERT INTO stocks_history_new (
          symbol, date, timestamp, open_price, high_price, low_price, close_price, volume, turnover, trades_count
        )
        SELECT 
          symbol, date, date || 'T14:30:00Z', open_price, high_price, low_price, close_price, volume, turnover, trades_count
        FROM stocks_history
      `);

      // Drop old and rename
      db.exec("DROP TABLE stocks_history");
      db.exec("ALTER TABLE stocks_history_new RENAME TO stocks_history");
      
      // Create unique index for intraday
      db.exec("CREATE UNIQUE INDEX idx_symbol_timestamp ON stocks_history(symbol, timestamp)");
    })();
    
    console.log('Migration successful: Intraday support added.');
  } else {
    console.log('Timestamp column already exists. Skipping migration.');
  }
  
  // Ensure portfolio tables exist
  db.exec(`
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
  console.log('Portfolio tables ensured.');

} catch (err) {
  console.error('Migration failed:', err);
} finally {
  db.close();
}
