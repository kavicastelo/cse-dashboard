import { StockRepository, StockSnapshot } from './repository';

const symbols = ['JKH.N0000', 'COMB.N0000', 'SAMP.N0000', 'DIAL.N0000', 'LOLC.N0000'];
const days = 100;

const seed = () => {
  const today = new Date();
  
  symbols.forEach(symbol => {
    let basePrice = Math.random() * 200 + 50;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Skip weekends (optional for seed, but good for realism)
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const dateStr = date.toISOString().split('T')[0];
      
      const change = (Math.random() - 0.48) * 5; // Slight upward bias
      const open = basePrice;
      const close = basePrice + change;
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;
      const volume = Math.floor(Math.random() * 1000000) + 100000;

      const snapshot: StockSnapshot = {
        symbol,
        date: dateStr,
        open_price: open,
        high_price: high,
        low_price: low,
        close_price: close,
        volume,
        turnover: volume * close,
        trades_count: Math.floor(volume / 1000)
      };

      StockRepository.saveSnapshot(snapshot);
      basePrice = close; // Next day starts at previous close
    }
    
    // Add to watchlist
    StockRepository.addToWatchlist(symbol);
  });

  console.log('Seed completed with 60 days of history for 5 symbols.');
};

seed();
