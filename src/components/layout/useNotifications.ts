import { useState, useEffect, useMemo } from 'react';
import { useThreats, useEvents } from '@/lib/api';

export interface AppNotification {
  id: string;
  dbId: number;
  title: string;
  message: string;
  severity: string;
  timestamp: string;
  type: 'threat' | 'event';
}

export function useNotifications() {
  const { data: threats } = useThreats(30);
  const { data: events } = useEvents(30);
  const [readIds, setReadIds] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('read_notifications');
    if (stored) {
      try {
        setReadIds(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse read notifications', e);
      }
    }
  }, []);

  const notifications = useMemo<AppNotification[]>(() => {
    const list: AppNotification[] = [];
    if (threats) {
      for (const t of threats) {
        list.push({
          id: `threat-${t.id || t.detected_at}`,
          dbId: t.id,
          title: "Threat Detected!",
          message: `${t.threat_type || "Malicious traffic"} from IP ${t.ip_address || "unknown"}`,
          severity: t.severity || "high",
          timestamp: t.detected_at || "",
          type: "threat"
        });
      }
    }
    if (events) {
      for (const e of events) {
        const severity = (e.severity || "info").toLowerCase();
        if (["critical", "high", "medium", "warning"].includes(severity)) {
          const eventTypeLabel = (e.event_type || 'Sistem')
            .replace('new.device', 'New Device Discovered')
            .replace('update.device', 'Device Updated')
            .replace('server.discovery', 'Server Discovered')
            .replace('encryption.audit', 'Encryption Alert')
            .replace(/\./g, ' ');

          list.push({
            id: `event-${e.id || e.timestamp}`,
            dbId: e.id,
            title: `Event: ${eventTypeLabel}`,
            message: e.message || "",
            severity: e.severity || "warning",
            timestamp: e.timestamp || "",
            type: "event"
          });
        }
      }
    }
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list;
  }, [threats, events]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !readIds.includes(n.id)).length;
  }, [notifications, readIds]);

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    localStorage.setItem('read_notifications', JSON.stringify(allIds));
  };

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      localStorage.setItem('read_notifications', JSON.stringify(updated));
    }
  };

  return {
    notifications,
    unreadCount,
    readIds,
    markAllAsRead,
    markAsRead
  };
}
