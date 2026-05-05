import { StockRepository } from '../db/repository';
import { AnalysisUtils } from '../utils/analysis';

export class AlertService {
  /**
   * Scans a symbol for technical signals
   */
  static async scanSymbol(symbol: string) {
    try {
      // 1. Fetch History (Daily) for SMA crossovers
      const history = StockRepository.getHistory(symbol, 60);
      if (history.length < 50) return;

      const prices = history.map((h: any) => h.close_price).reverse();
      const volumes = history.map((h: any) => h.volume).reverse();

      // Technical Indicators
      const sma20 = AnalysisUtils.calculateSMA(prices, 20);
      const sma50 = AnalysisUtils.calculateSMA(prices, 50);
      
      // A. Crossover Detection
      const crossover = AnalysisUtils.detectCrossover(sma20, sma50);
      if (crossover) {
        const type = crossover === 'golden_cross' ? 'GOLDEN CROSS' : 'DEATH CROSS';
        const severity = crossover === 'golden_cross' ? 'CRITICAL' : 'WARNING';
        
        // Ensure we don't spam duplicate alerts for the same day
        const existing = StockRepository.getAlerts().filter((a: any) => 
          a.symbol === symbol && a.type === 'CROSSOVER' && a.timestamp.startsWith(new Date().toISOString().split('T')[0])
        );

        if (existing.length === 0) {
          StockRepository.createAlert({
            symbol,
            type: 'CROSSOVER',
            message: `${symbol}: ${type} detected (SMA 20 crossed ${crossover === 'golden_cross' ? 'above' : 'below'} SMA 50)`,
            severity
          });
        }
      }

      // B. Statistical Anomaly Detection (Volume)
      const anomalies = AnalysisUtils.detectAnomalies(volumes);
      const latestAnomaly = anomalies.find(a => a.index === volumes.length - 1);
      
      if (latestAnomaly && latestAnomaly.zScore > 3) {
        const existing = StockRepository.getAlerts().filter((a: any) => 
          a.symbol === symbol && a.type === 'ANOMALY' && a.timestamp.startsWith(new Date().toISOString().split('T')[0])
        );

        if (existing.length === 0) {
          StockRepository.createAlert({
            symbol,
            type: 'ANOMALY',
            message: `${symbol}: Statistical Volume Anomaly Detected (Z-Score: ${latestAnomaly.zScore.toFixed(2)})`,
            severity: 'WARNING'
          });
        }
      }

    } catch (error) {
      console.error(`Error scanning ${symbol} for alerts:`, error);
    }
  }

  /**
   * Scans all symbols (usually called after a market-wide sync)
   */
  static async scanAll() {
    const watchlist = StockRepository.getWatchlist();
    console.log(`Scanning ${watchlist.length} watchlist symbols for signals...`);
    for (const item of watchlist) {
      await this.scanSymbol(item.symbol);
    }
  }
}
