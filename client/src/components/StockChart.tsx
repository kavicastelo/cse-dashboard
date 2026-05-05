import { createChart, ColorType, CandlestickSeries, LineSeries } from 'lightweight-charts';
import type { ISeriesApi } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

interface ChartProps {
  data: any[];
  analysis?: any;
}

export const StockChart: React.FC<ChartProps> = ({ data, analysis }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (!data || data.length === 0) return;

    try {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#94a3b8',
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
      });

      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });

      const chartData = data
        .filter(item => item.date && item.close_price !== undefined)
        .map(item => ({
          time: item.date,
          open: item.open_price || item.close_price,
          high: item.high_price || item.close_price,
          low: item.low_price || item.close_price,
          close: item.close_price,
        }))
        .sort((a, b) => a.time.localeCompare(b.time));

      if (chartData.length === 0) {
        chart.remove();
        return;
      }

      candlestickSeries.setData(chartData);

      // Add SMAs if available
      if (analysis) {
        if (analysis.sma20) {
          const sma20Series = chart.addSeries(LineSeries, { color: '#4facfe', lineWidth: 1, title: 'SMA 20' });
          const sma20Data = analysis.sma20.map((val: number | null, idx: number) => ({
            time: chartData[idx]?.time,
            value: val
          })).filter((d: any) => d.value !== null && d.time !== undefined);
          if (sma20Data.length > 0) sma20Series.setData(sma20Data);
        }
        
        if (analysis.sma50) {
          const sma50Series = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, title: 'SMA 50' });
          const sma50Data = analysis.sma50.map((val: number | null, idx: number) => ({
            time: chartData[idx]?.time,
            value: val
          })).filter((d: any) => d.value !== null && d.time !== undefined);
          if (sma50Data.length > 0) sma50Series.setData(sma50Data);
        }
      }

      chartRef.current = chart;

      const handleResize = () => {
        chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    } catch (err) {
      console.error('Chart rendering error:', err);
    }
  }, [data, analysis]);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={chartContainerRef} style={{ width: '100%' }} />
      {(!data || data.length === 0) && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          No historical data available for this symbol.
        </div>
      )}
    </div>
  );
};
