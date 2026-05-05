import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

export const api = {
  getMarket: () => axios.get(`${API_BASE}/market`),
  getStocks: () => axios.get(`${API_BASE}/stocks`),
  getStock: (symbol: string) => axios.get(`${API_BASE}/stocks/${symbol}`),
  getHistory: (symbol: string) => axios.get(`${API_BASE}/stocks/${symbol}/history`),
  sync: () => axios.post(`${API_BASE}/sync`),
  addToWatchlist: (symbol: string) => axios.post(`${API_BASE}/watchlist/${symbol}`),
  removeFromWatchlist: (symbol: string) => axios.delete(`${API_BASE}/watchlist/${symbol}`),
};
