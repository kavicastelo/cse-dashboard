import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Bell, AlertTriangle, Zap, CheckCircle } from 'lucide-react';

export const SignalHub: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Poll every minute
    
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await api.getAlerts();
      const newAlerts = res.data;
      
      // Check for new unread alerts to show notification
      const unread = newAlerts.filter((a: any) => a.is_read === 0);
      if (unread.length > unreadCount && Notification.permission === 'granted') {
        const latest = unread[0];
        new Notification('CSE Quant Signal', {
          body: latest.message,
          icon: '/favicon.ico'
        });
      }

      setAlerts(newAlerts);
      setUnreadCount(unread.length);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAlertsRead();
      fetchAlerts();
    } catch (err) {
      console.error('Failed to mark alerts as read', err);
    }
  };

  return (
    <div className="signal-hub">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={20} className={unreadCount > 0 ? 'pulse' : ''} style={{ color: unreadCount > 0 ? 'var(--accent-up)' : 'inherit' }} />
          Market Signals {unreadCount > 0 && <span className="badge critical">{unreadCount} NEW</span>}
        </h3>
        {unreadCount > 0 && (
          <button className="secondary" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }} onClick={markAllAsRead}>
            Mark all read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
        {alerts.map(alert => (
          <div 
            key={alert.id} 
            className={`glass-card alert-item ${alert.is_read === 0 ? 'unread' : ''}`}
            style={{ 
              padding: '1rem', 
              borderLeft: `4px solid ${alert.severity === 'CRITICAL' ? 'var(--accent-up)' : 'var(--accent-down)'}`,
              opacity: alert.is_read === 1 ? 0.7 : 1
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{alert.type}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{alert.message}</p>
          </div>
        ))}
        {alerts.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <p>No active signals. Market is quiet.</p>
          </div>
        )}
      </div>

      <style>{`
        .alert-item.unread {
          background: rgba(0, 242, 254, 0.05);
          border-color: rgba(0, 242, 254, 0.3);
        }
        .pulse {
          animation: pulse-red 2s infinite;
        }
        @keyframes pulse-red {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); color: var(--accent-up); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
