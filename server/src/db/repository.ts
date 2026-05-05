import db from '../db';

export interface StockSnapshot {
  symbol: string;
  date: string; // YYYY-MM-DD
  timestamp?: string; // ISO8601 for intraday
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
    const timestamp = snapshot.timestamp || `${snapshot.date}T14:30:00Z`;
    
    const stmt = db.prepare(`
      INSERT INTO stocks_history (
        symbol, date, timestamp, open_price, high_price, low_price, close_price, volume, turnover, trades_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(symbol, timestamp) DO UPDATE SET
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
      timestamp,
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
      AND timestamp LIKE '%T14:30:00Z' -- Fetch only daily closes for history
      ORDER BY date DESC 
      LIMIT ?
    `);
    return stmt.all(symbol, limit);
  }

  static getIntradayHistory(symbol: string, date: string) {
    const stmt = db.prepare(`
      SELECT * FROM stocks_history
      WHERE symbol = ? AND date = ?
      ORDER BY timestamp ASC
    `);
    return stmt.all(symbol, date);
  }

  static getLatestSnapshot(symbol: string) {
    const stmt = db.prepare(`
      SELECT * FROM stocks_history 
      WHERE symbol = ? 
      ORDER BY timestamp DESC 
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

  // Portfolio Methods
  static addTransaction(tx: { symbol: string, type: 'BUY' | 'SELL', price: number, quantity: number, date: string, fees?: number }) {
    const transaction = db.transaction(() => {
      // 1. Insert transaction
      db.prepare(`
        INSERT INTO transactions (symbol, type, price, quantity, date, fees)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(tx.symbol, tx.type, tx.price, tx.quantity, tx.date, tx.fees || 0);

      // 2. Update holdings
      const currentHolding: any = db.prepare('SELECT * FROM holdings WHERE symbol = ?').get(tx.symbol);
      
      let newQty = currentHolding ? currentHolding.quantity : 0;
      let newAvgPrice = currentHolding ? currentHolding.avg_price : 0;

      if (tx.type === 'BUY') {
        const totalCost = (newQty * newAvgPrice) + (tx.quantity * tx.price) + (tx.fees || 0);
        newQty += tx.quantity;
        newAvgPrice = totalCost / newQty;
      } else {
        newQty -= tx.quantity;
        if (newQty < 0) throw new Error('Insufficient holdings for sell');
        // Average price remains the same on sell, or we could track realized PnL elsewhere
      }

      if (newQty === 0) {
        db.prepare('DELETE FROM holdings WHERE symbol = ?').run(tx.symbol);
      } else {
        db.prepare(`
          INSERT INTO holdings (symbol, quantity, avg_price, last_updated)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(symbol) DO UPDATE SET
            quantity=excluded.quantity,
            avg_price=excluded.avg_price,
            last_updated=excluded.last_updated
        `).run(tx.symbol, newQty, newAvgPrice, new Date().toISOString());
      }
    });

    return transaction();
  }

  static getHoldings() {
    return db.prepare(`
      SELECT h.*, s.close_price as current_price
      FROM holdings h
      LEFT JOIN (
        SELECT symbol, close_price, MAX(timestamp) 
        FROM stocks_history 
        GROUP BY symbol
      ) s ON h.symbol = s.symbol
    `).all();
  }

  static getTransactions() {
    return db.prepare('SELECT * FROM transactions ORDER BY date DESC').all();
  }
}
