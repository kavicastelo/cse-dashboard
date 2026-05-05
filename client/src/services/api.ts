import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

export const api = {
  getMarket: () => axios.get(`${API_BASE}/market`),
  getStocks: () => axios.get(`${API_BASE}/stocks`),
  getStock: (symbol: string) => axios.get(`${API_BASE}/stocks/${symbol}`),
  getHistory: (symbol: string) => axios.get(`${API_BASE}/stocks/${symbol}/history`),
  getIntraday: (symbol: string) => axios.get(`${API_BASE}/stocks/${symbol}/intraday`),
  sync: () => axios.post(`${API_BASE}/sync`),
  addToWatchlist: (symbol: string) => axios.post(`${API_BASE}/watchlist/${symbol}`),
  removeFromWatchlist: (symbol: string) => axios.delete(`${API_BASE}/watchlist/${symbol}`),
  getPortfolio: () => axios.get(`${API_BASE}/portfolio`),
  getTransactions: () => axios.get(`${API_BASE}/transactions`),
  addTransaction: (tx: any) => axios.post(`${API_BASE}/transactions`, tx),
  getAlerts: (unread?: boolean) => axios.get(`${API_BASE}/alerts${unread ? '?unread=true' : ''}`),
  markAlertsRead: (id?: number) => axios.post(`${API_BASE}/alerts/read`, { id }),
};
