import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { CseService } from './services/cse.service';
import { StockRepository, StockSnapshot } from './db/repository';
import { AnalysisUtils } from './utils/analysis';
import { IntradayService } from './services/intraday.service';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Sync logic
const syncData = async () => {
  console.log('Starting sync...');
  try {
    const marketData = await CseService.fetchAllStocks();
    const today = new Date().toISOString().split('T')[0];

    if (Array.isArray(marketData)) {
      for (const item of marketData) {
        const snapshot: StockSnapshot = {
          symbol: item.symbol,
          date: today,
          timestamp: `${today}T14:30:00Z`, // Mark as Daily Close
          open_price: item.open || item.lastTradedPrice,
          high_price: item.high || item.lastTradedPrice,
          low_price: item.low || item.lastTradedPrice,
          close_price: item.lastTradedPrice,
          volume: item.tradeVolume || 0,
          turnover: item.turnover,
          trades_count: item.noOfTrades
        };
        StockRepository.saveSnapshot(snapshot);
      }
    }
    console.log('Sync completed successfully');
  } catch (error) {
    console.error('Sync failed:', error);
  }
};

// Routes
app.get('/api/market', async (req, res) => {
  try {
    const data = await CseService.fetchMarketSummary();
    res.json(data);
  } catch (error) {
    console.warn('CSE Market Summary API failed');
    res.json({ aspi: 12456.2, change: 55.3, percentageChange: 0.45, status: 'OPEN' });
  }
});

app.get('/api/stocks', async (req, res) => {
  try {
    const watchlist = StockRepository.getWatchlist();
    let marketData;
    
    try {
      marketData = await CseService.fetchAllStocks();
    } catch (error) {
      console.warn('CSE API failed, falling back to local history');
      // Fallback: Get latest snapshot for each watchlist item
      marketData = watchlist.map(w => {
        const latest: any = StockRepository.getLatestSnapshot(w.symbol);
        return latest ? {
          symbol: latest.symbol,
          lastTradedPrice: latest.close_price,
          percentageChange: 0, // We don't have prev close easily here
          tradeVolume: latest.volume,
          high: latest.high_price,
          low: latest.low_price,
          turnover: latest.turnover
        } : { symbol: w.symbol, lastTradedPrice: 0, percentageChange: 0 };
      });
    }
    
    // Combine market data with watchlist status
    const result = Array.isArray(marketData) ? marketData.map((stock: any) => ({
      ...stock,
      isWatched: watchlist.some(w => w.symbol === stock.symbol)
    })) : [];
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
});

app.get('/api/stocks/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    const latest = StockRepository.getLatestSnapshot(symbol);
    res.json(latest || { symbol, message: 'No local data found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stock' });
  }
});

app.get('/api/stocks/:symbol/history', async (req, res) => {
  const { symbol } = req.params;
  try {
    const history = StockRepository.getHistory(symbol);
    const prices = history.map((h: any) => h.close_price).reverse();
    const volumes = history.map((h: any) => h.volume).reverse();

    const analysis = {
      sma20: AnalysisUtils.calculateSMA(prices, 20),
      sma50: AnalysisUtils.calculateSMA(prices, 50),
      trend: AnalysisUtils.classifyTrend(prices),
      volumeSpikes: AnalysisUtils.detectVolumeSpike(volumes)
    };

    res.json({ history, analysis });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.get('/api/stocks/:symbol/intraday', async (req, res) => {
  const { symbol } = req.params;
  const today = new Date().toISOString().split('T')[0];
  try {
    const history = StockRepository.getIntradayHistory(symbol, today);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch intraday history' });
  }
});

app.post('/api/sync', async (req, res) => {
  await syncData();
  res.json({ message: 'Sync triggered' });
});

app.post('/api/watchlist/:symbol', (req, res) => {
  StockRepository.addToWatchlist(req.params.symbol);
  res.json({ message: 'Added to watchlist' });
});

app.delete('/api/watchlist/:symbol', (req, res) => {
  StockRepository.removeFromWatchlist(req.params.symbol);
  res.json({ message: 'Removed from watchlist' });
});

// Portfolio Endpoints
app.get('/api/portfolio', (req, res) => {
  try {
    const holdings = StockRepository.getHoldings();
    res.json(holdings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

app.get('/api/transactions', (req, res) => {
  try {
    const transactions = StockRepository.getTransactions();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.post('/api/transactions', (req, res) => {
  try {
    const tx = req.body;
    StockRepository.addTransaction(tx);
    res.json({ message: 'Transaction recorded' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

// Cron job: Run every day at 6 PM (after market close)
cron.schedule('0 18 * * 1-5', () => {
  syncData();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  IntradayService.start();
});
