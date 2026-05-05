import db from '../db';

export interface StockSnapshot {
  symbol: string;
  date: string; // ISO format or YYYY-MM-DD
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume: number;
  turnover?: number;
  trades_count?: number;
}

export class StockRepository {
  static saveSnapshot(snapshot: StockSnapshot) {
    const stmt = db.prepare(`
      INSERT INTO stocks_history (
        symbol, date, open_price, high_price, low_price, close_price, volume, turnover, trades_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(symbol, date) DO UPDATE SET
        open_price=excluded.open_price,
        high_price=excluded.high_price,
        low_price=excluded.low_price,
        close_price=excluded.close_price,
        volume=excluded.volume,
        turnover=excluded.turnover,
        trades_count=excluded.trades_count
    `);

    return stmt.run(
      snapshot.symbol,
      snapshot.date,
      snapshot.open_price,
      snapshot.high_price,
      snapshot.low_price,
      snapshot.close_price,
      snapshot.volume,
      snapshot.turnover || null,
      snapshot.trades_count || null
    );
  }

  static getHistory(symbol: string, limit = 100) {
    const stmt = db.prepare(`
      SELECT * FROM stocks_history 
      WHERE symbol = ? 
      ORDER BY date DESC 
      LIMIT ?
    `);
    return stmt.all(symbol, limit);
  }

  static getLatestSnapshot(symbol: string) {
    const stmt = db.prepare(`
      SELECT * FROM stocks_history 
      WHERE symbol = ? 
      ORDER BY date DESC 
      LIMIT 1
    `);
    return stmt.get(symbol);
  }

  static getWatchlist() {
    return db.prepare('SELECT symbol FROM watchlist').all() as { symbol: string }[];
  }

  static addToWatchlist(symbol: string) {
    return db.prepare('INSERT OR IGNORE INTO watchlist (symbol) VALUES (?)').run(symbol);
  }

  static removeFromWatchlist(symbol: string) {
    return db.prepare('DELETE FROM watchlist WHERE symbol = ?').run(symbol);
  }
}
