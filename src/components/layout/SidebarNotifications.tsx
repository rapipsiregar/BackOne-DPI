// src/components/layout/SidebarNotifications.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, AlertTriangle, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotifications, AppNotification } from "./useNotifications";

export default function SidebarNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { notifications, unreadCount, readIds, markAllAsRead, markAsRead } = useNotifications();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (n: AppNotification) => {
    markAsRead(n.id);
    setIsOpen(false);
    router.push(n.type === 'threat' ? `/threats?highlight=${n.dbId}` : `/events?highlight=${n.dbId}`);
  };

  const getSeverityStyles = (severity: string) => {
    const s = severity.toLowerCase();
    if (s.includes('critical') || s.includes('high')) {
      return { bg: 'bg-red-500/10 hover:bg-red-500/15', border: 'border-red-500/20', text: 'text-red-400', icon: <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" /> };
    }
    if (s.includes('med') || s.includes('warning')) {
      return { bg: 'bg-yellow-500/10 hover:bg-yellow-500/15', border: 'border-yellow-500/20', text: 'text-yellow-400', icon: <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" /> };
    }
    return { bg: 'bg-blue-500/10 hover:bg-blue-500/15', border: 'border-blue-500/20', text: 'text-blue-400', icon: <Info className="w-4 h-4 text-blue-500 shrink-0" /> };
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-[#ffffff] shadow-lg ring-2 ring-transparent">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute bottom-0 left-full ml-4 w-96 rounded-2xl border border-border bg-card/95 backdrop-blur-xl p-3 shadow-2xl z-50 animate-fade-in">
          <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-2">
            <span className="text-sm font-semibold text-foreground">Notifikasi</span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-primary hover:text-primary/80">Tandai dibaca</button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">Tidak ada notifikasi</div>
            ) : (
              notifications.map((n) => {
                const isRead = readIds.includes(n.id);
                const styles = getSeverityStyles(n.severity);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex gap-2 p-2 rounded-lg border transition-all cursor-pointer ${styles.bg} ${styles.border} ${!isRead ? 'ring-1 ring-primary/25 opacity-100' : 'opacity-60'}`}
                  >
                    {styles.icon}
                    <div className="flex-1 space-y-0.5">
                      <div className="flex justify-between items-start">
                        <span className={`text-xs font-semibold ${styles.text} line-clamp-1`}>{n.title}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{n.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
