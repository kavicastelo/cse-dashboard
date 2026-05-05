/**
 * Market Clock Utility
 * Handles Sri Lankan Market Hours (9:30 AM - 2:30 PM SLT)
 * SLT is UTC+5:30
 */
export class MarketClock {
  private static MARKET_OPEN_HOUR = 9;
  private static MARKET_OPEN_MINUTE = 30;
  private static MARKET_CLOSE_HOUR = 14;
  private static MARKET_CLOSE_MINUTE = 30;

  /**
   * Returns current date/time in Sri Lanka Time
   */
  static getSLTTime(): Date {
    const now = new Date();
    // UTC time
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    // SLT is UTC + 5.5 hours
    return new Date(utc + (3600000 * 5.5));
  }

  /**
   * Checks if the market is currently open
   */
  static isMarketOpen(): boolean {
    const slt = this.getSLTTime();
    const day = slt.getDay();
    
    // Weekend check (0 = Sunday, 6 = Saturday)
    if (day === 0 || day === 6) return false;

    const hour = slt.getHours();
    const minute = slt.getMinutes();
    const currentTimeInMinutes = hour * 60 + minute;

    const openTimeInMinutes = this.MARKET_OPEN_HOUR * 60 + this.MARKET_OPEN_MINUTE;
    const closeTimeInMinutes = this.MARKET_CLOSE_HOUR * 60 + this.MARKET_CLOSE_MINUTE;

    return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes <= closeTimeInMinutes;
  }

  /**
   * Formats a date to ISO string but specifically for SLT context if needed
   */
  static toSLTISOString(date: Date): string {
     // For database consistency, we usually store UTC, 
     // but for "date" fields in CSE (YYYY-MM-DD), we should use SLT date.
     const slt = new Date(date.getTime() + (date.getTimezoneOffset() * 60000) + (3600000 * 5.5));
     return slt.toISOString();
  }
}
