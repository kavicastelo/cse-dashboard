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
      const response = await axios.get(`${this.BASE_URL}/tradeSummary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all stocks:', error);
      throw error;
    }
  }

  static async fetchAnnouncements(startDate: string, endDate: string) {
    try {
      const formData = new URLSearchParams();
      formData.append('fromDate', startDate);
      formData.append('toDate', endDate);

      const response = await axios.post(`${this.BASE_URL}/approvedAnnouncement`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://www.cse.lk/general-announcements',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      return response.data?.approvedAnnouncements || [];
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
  }
}
