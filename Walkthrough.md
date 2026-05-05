# 🚀 CSE Stock Analysis Dashboard

A personal quantitative analysis tool for the Sri Lankan stock market (CSE). Built with Node.js, React, and SQLite.

## ✨ Features

- **Daily Observation**: Automated daily snapshots of selected stocks.
- **Historical Analysis**: Time-series visualization with price candlesticks and volume.
- **Quant Tools**: Moving Average (SMA 20/50) overlays and Trend classification (Uptrend/Downtrend/Sideways).
- **Premium UI**: Modern dark-mode dashboard with glassmorphism aesthetics.
- **Resilient Sync**: Integrated fallback logic to ensure the dashboard works even when external APIs are unavailable.

## 🏗️ Architecture

### Backend (`/server`)
- **Engine**: Node.js + Express + TypeScript.
- **Database**: SQLite (via `better-sqlite3`) for local data persistence.
- **Data Sync**: Scheduled via `node-cron` and manual triggers.
- **Analysis**: Logic layer for calculating technical indicators.

### Frontend (`/client`)
- **Framework**: React + Vite + TypeScript.
- **Visuals**: Vanilla CSS (Custom Design System).
- **Charts**: TradingView's `Lightweight Charts` for high-performance visualization.

---

## 🛠️ Setup & Running

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Backend Setup
```bash
cd server
npm install
npm run seed  # Populates 60 days of historical data for testing
npm run dev   # Starts server at http://localhost:3001
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev   # Starts dashboard at http://localhost:5173
```

---

## 📊 How to Use

1. **Dashboard**: On launch, you'll see the market overview and a watchlist of seeded stocks (JKH, COMB, SAMP, etc.).
2. **Analysis**: Click any stock in the sidebar to load its historical chart.
3. **Indicators**: Use the chart to see Price action vs. Moving Averages.
4. **Sync**: Click "Sync Market Data" to fetch the latest prices from the CSE.

## 🧪 Data Source
The system uses unofficial CSE endpoints. If the external API is unreachable, the system automatically falls back to your local historical dataset to maintain functionality.
