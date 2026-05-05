import { CseService } from './cse.service';
import { StockRepository } from '../db/repository';
import nodeCron from 'node-cron';

export class DisclosureService {
  /**
   * Starts the disclosure scanner
   */
  static start() {
    console.log('Disclosure Scanner initialized.');

    // Poll every 30 minutes
    nodeCron.schedule('*/30 * * * *', async () => {
      await this.scanAnnouncements();
    });

    // Immediate run
    this.scanAnnouncements();
  }

  static async scanAnnouncements() {
    console.log(`[${new Date().toISOString()}] Scanning for corporate disclosures...`);
    
    const today = new Date().toISOString().split('T')[0];
    const announcements = await CseService.fetchAnnouncements(today, today);
    
    if (!Array.isArray(announcements)) return;

    const watchlist = StockRepository.getWatchlist().map(w => w.symbol);
    
    for (const item of announcements) {
      // Use the keys identified from the CSE API response
      const symbol = item.symbol || item.ticker || item.stockSymbol || this.extractSymbol(item.company || item.name);
      const title = item.title || item.fileText || item.remarks || 'No Title';
      const id = item.announcementId || item.id;
      const type = item.announcementCategory || item.dType || item.type || 'General';
      
      if (symbol && watchlist.includes(symbol)) {
        // Create an alert if this disclosure is new
        const existing = StockRepository.getAlerts().filter((a: any) => 
          a.symbol === symbol && a.message.includes(String(id || title))
        );

        if (existing.length === 0) {
          StockRepository.createAlert({
            symbol,
            type: 'DISCLOSURE',
            message: `[${type}] ${title} (ID: ${id})`,
            severity: 'INFO'
          });
          console.log(`New disclosure detected for ${symbol}: ${title}`);
        }
      }
    }
  }

  private static extractSymbol(companyName: string): string | null {
    // Basic heuristic: match against known stocks if ticker is missing
    // In production, we'd have a mapping table
    return null; 
  }
}
