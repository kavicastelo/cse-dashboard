import axios from 'axios';
import { z } from 'zod';

const TradeSummarySchema = z.object({
  symbol: z.string(),
  lastTradedPrice: z.number().optional(),
  change: z.number().optional(),
  percentageChange: z.number().optional(),
  tradeVolume: z.number().optional(),
  turnover: z.number().optional(),
  high: z.number().optional(),
  low: z.number().optional(),
  open: z.number().optional(),
});

export type TradeSummary = z.infer<typeof TradeSummarySchema>;

export class CseService {
  private static BASE_URL = 'https://www.cse.lk/api';

  static async fetchMarketSummary() {
    try {
      const response = await axios.get(`${this.BASE_URL}/tradeSummary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching market summary:', error);
      throw error;
    }
  }

  static async fetchStockDetails(symbol: string) {
    try {
      // Note: In a real scenario, CSE might have specific endpoints for history.
      // For this demo, we'll assume we fetch current info and store it as a snapshot.
      const response = await axios.get(`${this.BASE_URL}/companyInfoSummery?symbol=${symbol}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching stock details for ${symbol}:`, error);
      throw error;
    }
  }

  static async fetchAllStocks() {
     try {
      // This endpoint usually returns a list of all stocks with their current day summary
      const response = await axios.get(`${this.BASE_URL}/tradeSummary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all stocks:', error);
      throw error;
    }
  }
}
