import React, { useEffect, useState } from 'react';
import { api } from './services/api';
import { StockChart } from './components/StockChart';
import { PortfolioView } from './components/PortfolioView';
import { SignalHub } from './components/SignalHub';
import { TrendingUp, TrendingDown, Activity, Search, RefreshCw, Star, Trash2, PieChart, LayoutDashboard, Brain } from 'lucide-react';

export default function App() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [marketSummary, setMarketSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [timeframe, setTimeframe] = useState<'1D' | 'History'>('History');
  const [activeTab, setActiveTab] = useState<'market' | 'portfolio'>('market');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedSymbol) {
      if (timeframe === 'History') {
        fetchHistory(selectedSymbol);
      } else {
        fetchIntraday(selectedSymbol);
      }
    }
  }, [selectedSymbol, timeframe]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.getMarket(),
        api.getStocks()
      ]);
      
      if (results[0].status === 'fulfilled') {
        setMarketSummary(results[0].value.data);
      }
      
      if (results[1].status === 'fulfilled') {
        const stocksData = results[1].value.data;
        setStocks(stocksData);
        if (stocksData.length > 0 && !selectedSymbol) {
          setSelectedSymbol(stocksData[0].symbol);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (symbol: string) => {
    try {
      const res = await api.getHistory(symbol);
      setHistoryData(res.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const fetchIntraday = async (symbol: string) => {
    try {
      const res = await api.getIntraday(symbol);
      setHistoryData({ history: res.data, analysis: null });
    } catch (error) {
      console.error('Error fetching intraday:', error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.sync();
      await fetchInitialData();
    } finally {
      setSyncing(false);
    }
  };

  const toggleWatchlist = async (symbol: string, isWatched: boolean) => {
    try {
      if (isWatched) {
        await api.removeFromWatchlist(symbol);
      } else {
        await api.addToWatchlist(symbol);
      }
      fetchInitialData();
    } catch (error) {
      console.error('Watchlist toggle failed:', error);
    }
  };

  const selectedStock = stocks.find(s => s.symbol === selectedSymbol);

  return (
    <div className="dashboard">
      <header className="header">
        <div className="title-group">
          <h1 className="title">CSE QUANT DASHBOARD</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Market Intelligence & Historical Trends</p>
        </div>
        
        <div className="market-stats glass-card" style={{ gap: '1rem' }}>
          <nav className="tabs" style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '1rem' }}>
            <button className={activeTab === 'market' ? 'primary' : 'secondary'} onClick={() => setActiveTab('market')}>
              <LayoutDashboard size={16} /> Market
            </button>
            <button className={activeTab === 'portfolio' ? 'primary' : 'secondary'} onClick={() => setActiveTab('portfolio')}>
              <PieChart size={16} /> Portfolio
            </button>
          </nav>
          <div className="stat-item">
            <span className="stat-label">ASPI Index</span>
            <span className="stat-value">12,456.20 <span className="price-change up">+0.45%</span></span>
          </div>
          <button className={`secondary ${syncing ? 'loading' : ''}`} onClick={handleSync} disabled={syncing}>
            <RefreshCw size={16} className={syncing ? 'spin' : ''} /> {syncing ? 'Sync' : 'Sync'}
          </button>
        </div>
      </header>

      <aside className="glass-card watchlist" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <SignalHub />
        
        <div className="search-section">
          <div className="search-box" style={{ marginBottom: '1rem', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search Symbols..." 
              className="glass-card" 
              style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', background: 'rgba(255,255,255,0.05)' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '70vh' }}>
          {stocks.slice(0, 20).map(stock => (
            <div 
              key={stock.symbol} 
              className={`stock-item ${selectedSymbol === stock.symbol ? 'active' : ''}`}
              onClick={() => setSelectedSymbol(stock.symbol)}
            >
              <div className="stock-info">
                <span className="stock-symbol">{stock.symbol}</span>
                <span className={`price-change ${stock.percentageChange >= 0 ? 'up' : 'down'}`}>
                  {stock.percentageChange >= 0 ? '+' : ''}{stock.percentageChange?.toFixed(2)}%
                </span>
              </div>
              <div className="stock-price-group" style={{ textAlign: 'right' }}>
                <div className="stock-price">Rs. {stock.lastTradedPrice?.toFixed(2)}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Vol: {stock.tradeVolume?.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="glass-card main-view">
        {activeTab === 'portfolio' ? (
          <PortfolioView />
        ) : selectedStock ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{selectedStock.symbol}</h2>
                <div className="analysis-badges">
                  {historyData?.analysis?.trend && (
                    <span className={`badge ${historyData.analysis.trend}`}>
                      {historyData.analysis.trend.toUpperCase()} TREND
                    </span>
                  )}
                  <span className="badge sideways">VOLATILITY: MEDIUM</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>Rs. {selectedStock.lastTradedPrice?.toFixed(2)}</div>
                <div className={`price-change ${selectedStock.percentageChange >= 0 ? 'up' : 'down'}`} style={{ fontSize: '1.1rem' }}>
                  {selectedStock.percentageChange >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  {selectedStock.percentageChange?.toFixed(2)}% Today
                </div>
              </div>
            </div>

            <div className="chart-controls" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button 
                className={timeframe === '1D' ? 'primary' : 'secondary'} 
                onClick={() => setTimeframe('1D')}
                style={{ padding: '0.4rem 1rem' }}
              >
                1D (Intraday)
              </button>
              <button 
                className={timeframe === 'History' ? 'primary' : 'secondary'} 
                onClick={() => setTimeframe('History')}
                style={{ padding: '0.4rem 1rem' }}
              >
                History (Daily)
              </button>
            </div>

            <div className="chart-container glass-card">
              {historyData ? (
                <StockChart data={historyData.history} analysis={historyData.analysis} />
              ) : (
                <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Loading Chart Data...
                </div>
              )}
            </div>

            <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              <div className="glass-card stat-item">
                <span className="stat-label">Day High</span>
                <span className="stat-value">Rs. {selectedStock.high?.toFixed(2)}</span>
              </div>
              <div className="glass-card stat-item">
                <span className="stat-label">Day Low</span>
                <span className="stat-value">Rs. {selectedStock.low?.toFixed(2)}</span>
              </div>
              <div className="glass-card stat-item">
                <span className="stat-label">Turnover</span>
                <span className="stat-value">Rs. {(selectedStock.turnover / 1000000).toFixed(2)}M</span>
              </div>
            </div>
          </>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Select a stock to view detailed analysis
          </div>
        )}
      </main>

      <style>{`
        .stock-item.active {
          border-color: var(--primary);
          background: rgba(0, 242, 254, 0.1);
        }
        .loading {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .main-view {
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
}
