import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Plus, History } from 'lucide-react';

export const PortfolioView: React.FC = () => {
  const [holdings, setHoldings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTx, setShowAddTx] = useState(false);
  const [newTx, setNewTx] = useState({ symbol: '', type: 'BUY', price: '', quantity: '', date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const res = await api.getPortfolio();
      setHoldings(res.data);
    } catch (err) {
      console.error('Failed to fetch portfolio', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addTransaction({
        ...newTx,
        price: parseFloat(newTx.price),
        quantity: parseInt(newTx.quantity)
      });
      setShowAddTx(false);
      fetchPortfolio();
    } catch (err) {
      alert('Failed to add transaction. Check holdings.');
    }
  };

  const totalInvestment = holdings.reduce((sum, h) => sum + (h.quantity * h.avg_price), 0);
  const currentValue = holdings.reduce((sum, h) => sum + (h.quantity * (h.current_price || h.avg_price)), 0);
  const totalPnL = currentValue - totalInvestment;
  const pnlPercent = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;

  if (loading) return <div>Loading Portfolio...</div>;

  return (
    <div className="portfolio-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem' }}>Your Portfolio</h2>
        <button className="primary" onClick={() => setShowAddTx(true)}>
          <Plus size={18} /> Add Transaction
        </button>
      </div>

      <div style={{ gridTemplateColumns: 'repeat(3, 1fr)', display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card stat-item">
          <span className="stat-label">Total Value</span>
          <span className="stat-value">Rs. {currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="glass-card stat-item">
          <span className="stat-label">Total Investment</span>
          <span className="stat-value">Rs. {totalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="glass-card stat-item">
          <span className="stat-label">Total PnL</span>
          <span className={`stat-value ${totalPnL >= 0 ? 'up' : 'down'}`}>
            Rs. {totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
            <span style={{ fontSize: '0.9rem', marginLeft: '0.5rem' }}>({pnlPercent.toFixed(2)}%)</span>
          </span>
        </div>
      </div>

      {showAddTx && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Record Transaction</h3>
          <form onSubmit={handleAddTransaction} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
            <input placeholder="Symbol (e.g. JKH.N0000)" value={newTx.symbol} onChange={e => setNewTx({...newTx, symbol: e.target.value.toUpperCase()})} required />
            <select value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value})} className="glass-card">
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
            <input type="number" step="0.01" placeholder="Price" value={newTx.price} onChange={e => setNewTx({...newTx, price: e.target.value})} required />
            <input type="number" placeholder="Quantity" value={newTx.quantity} onChange={e => setNewTx({...newTx, quantity: e.target.value})} required />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="primary">Save</button>
              <button type="button" className="secondary" onClick={() => setShowAddTx(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Symbol</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Quantity</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Avg Price</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Market Price</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Value</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>PnL</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map(h => {
              const val = h.quantity * (h.current_price || h.avg_price);
              const pnl = val - (h.quantity * h.avg_price);
              const pnlPct = (pnl / (h.quantity * h.avg_price)) * 100;
              return (
                <tr key={h.symbol} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{h.symbol}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>{h.quantity}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>Rs. {h.avg_price.toFixed(2)}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>Rs. {h.current_price?.toFixed(2) || 'N/A'}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>Rs. {val.toLocaleString()}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }} className={pnl >= 0 ? 'up' : 'down'}>
                    {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} ({pnlPct.toFixed(2)}%)
                  </td>
                </tr>
              );
            })}
            {holdings.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No holdings found. Add your first transaction to start tracking.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
