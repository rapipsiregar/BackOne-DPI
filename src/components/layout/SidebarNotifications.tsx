// src/components/layout/SidebarNotifications.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, AlertTriangle, Info, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useNotifications, AppNotification } from "./useNotifications";

interface SidebarNotificationsProps {
  placement?: "sidebar" | "topbar";
}

export default function SidebarNotifications({ placement = "sidebar" }: SidebarNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const { notifications, unreadCount, readIds, markAllAsRead, markAsRead } = useNotifications();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

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

  const getPopoverPositionClass = (): string => {
    if (placement === "topbar") {
      return "fixed top-14 right-3 sm:right-6 w-[calc(100vw-24px)] max-w-sm z-[99999]";
    }
    return "fixed bottom-16 left-4 sm:left-72 w-[calc(100vw-32px)] sm:w-96 max-w-sm z-[99999]";
  };

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          placement === "topbar"
            ? "relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-secondary/80 transition-colors flex items-center justify-center"
            : "relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        }
        aria-label="Notifications"
      >
        <Bell className={placement === "topbar" ? "w-4 h-4" : "h-5 w-5"} />
        {unreadCount > 0 && (
          <span
            className={
              placement === "topbar"
                ? "absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-md ring-2 ring-card"
                : "absolute right-1.5 top-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-md ring-2 ring-card"
            }
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && mounted && createPortal(
        <div
          ref={dropdownRef}
          className={`${getPopoverPositionClass()} rounded-2xl border border-border bg-card/95 backdrop-blur-xl p-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="flex items-center justify-between border-b border-border/50 pb-2.5 mb-2.5">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-secondary/80 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No new notifications</div>
            ) : (
              notifications.map((n) => {
                const isRead = readIds.includes(n.id);
                const styles = getSeverityStyles(n.severity);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${styles.bg} ${styles.border} ${!isRead ? 'ring-1 ring-primary/30 opacity-100' : 'opacity-60'}`}
                  >
                    {styles.icon}
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <span className={`text-xs font-bold ${styles.text} truncate`}>{n.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight">{n.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

