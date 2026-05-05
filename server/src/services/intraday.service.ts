import { CseService, TradeSummary } from './cse.service';
import { StockRepository, StockSnapshot } from '../db/repository';
import { MarketClock } from '../utils/market-clock';
import { AlertService } from './alert.service';
import nodeCron from 'node-cron';

export class IntradayService {
  private static isRunning = false;

  /**
   * Starts the intraday polling task
   * Polls every 15 minutes during market hours
   */
  static start() {
    console.log('Intraday Pulse Tracker initialized.');

    // Poll every 15 minutes
    nodeCron.schedule('*/15 * * * *', async () => {
      await this.performSnapshot();
    });

    // Immediate run for testing/startup if market is open
    this.performSnapshot();
  }

  static async performSnapshot() {
    if (!MarketClock.isMarketOpen()) {
      console.log(`[${new Date().toISOString()}] Market is closed. Skipping intraday snapshot.`);
      return;
    }

    if (this.isRunning) return;
    this.isRunning = true;

    try {
      console.log(`[${new Date().toISOString()}] Capturing intraday market snapshot...`);
      const stocks: TradeSummary[] = await CseService.fetchAllStocks();
      const sltNow = MarketClock.getSLTTime();
      const dateStr = sltNow.toISOString().split('T')[0];
      const timestampStr = sltNow.toISOString();

      let savedCount = 0;
      for (const stock of stocks) {
        if (!stock.symbol || stock.lastTradedPrice === undefined) continue;

        const snapshot: StockSnapshot = {
          symbol: stock.symbol,
          date: dateStr,
          timestamp: timestampStr,
          open_price: stock.open || 0,
          high_price: stock.high || 0,
          low_price: stock.low || 0,
          close_price: stock.lastTradedPrice,
          volume: stock.tradeVolume || 0,
          turnover: stock.turnover || 0,
          trades_count: 0 // Not provided in tradeSummary usually
        };

        StockRepository.saveSnapshot(snapshot);
        savedCount++;
      }
      console.log(`Successfully saved ${savedCount} intraday snapshots.`);
      
      // Trigger Alert Scanning
      await AlertService.scanAll();
      
    } catch (error) {
      console.error('Error during intraday snapshot:', error);
    } finally {
      this.isRunning = false;
    }
  }
}
