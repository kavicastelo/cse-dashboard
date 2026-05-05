export interface PricePoint {
  date: string;
  close_price: number;
  volume: number;
}

export class AnalysisUtils {
  static calculateSMA(data: number[], window: number): (number | null)[] {
    const sma: (number | null)[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) {
        sma.push(null);
      } else {
        const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / window);
      }
    }
    return sma;
  }

  static detectVolumeSpike(volumes: number[], threshold = 2): boolean[] {
    // A spike is defined as volume > threshold * average volume of last 10 days
    const spikes: boolean[] = [];
    const window = 10;
    
    for (let i = 0; i < volumes.length; i++) {
      if (i < window) {
        spikes.push(false);
      } else {
        const avgVolume = volumes.slice(i - window, i).reduce((a, b) => a + b, 0) / window;
        spikes.push(volumes[i] > avgVolume * threshold);
      }
    }
    return spikes;
  }

  static classifyTrend(prices: number[]): 'uptrend' | 'downtrend' | 'sideways' {
    if (prices.length < 20) return 'sideways';
    
    const shortSMA = this.calculateSMA(prices, 5).slice(-1)[0];
    const longSMA = this.calculateSMA(prices, 20).slice(-1)[0];

    if (!shortSMA || !longSMA) return 'sideways';

    const diff = (shortSMA - longSMA) / longSMA;
    
    if (diff > 0.02) return 'uptrend';
    if (diff < -0.02) return 'downtrend';
    return 'sideways';
  }

  static detectCrossover(shortSma: (number | null)[], longSma: (number | null)[]): 'golden_cross' | 'death_cross' | null {
    if (shortSma.length < 2 || longSma.length < 2) return null;

    const currentShort = shortSma[shortSma.length - 1];
    const prevShort = shortSma[shortSma.length - 2];
    const currentLong = longSma[longSma.length - 1];
    const prevLong = longSma[longSma.length - 2];

    if (!currentShort || !prevShort || !currentLong || !prevLong) return null;

    // Golden Cross: Short crosses above Long
    if (prevShort <= prevLong && currentShort > currentLong) {
      return 'golden_cross';
    }

    // Death Cross: Short crosses below Long
    if (prevShort >= prevLong && currentShort < currentLong) {
      return 'death_cross';
    }

    return null;
  }

  static detectAnomalies(values: number[]): { index: number, zScore: number }[] {
    if (values.length < 10) return [];

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / values.length);
    
    if (stdDev === 0) return [];

    return values.map((val, idx) => ({
      index: idx,
      zScore: (val - mean) / stdDev
    })).filter(a => Math.abs(a.zScore) > 3); // 3-sigma rule
  }
}
