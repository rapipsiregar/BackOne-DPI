"use client";

import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("—");
  const [intervalText, setIntervalText] = useState<string>("");

  const fetchDataIntervalRange = () => {
    fetch('/api/dashboard/data-interval')
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && res.data) {
          const { start, end } = res.data;
          if (start && end) {
            const sDate = new Date(start);
            const eDate = new Date(end);
            const options: Intl.DateTimeFormatOptions = {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            };
            // e.g. "1 Jul 2026 04:57 - 1 Jul 2026 08:42"
            setIntervalText(`${sDate.toLocaleString('id-ID', options)} - ${eDate.toLocaleString('id-ID', options)}`);
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    const updateTime = new Date().toLocaleString('id-ID');
    setLastUpdate(updateTime);
    fetchDataIntervalRange();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Poll updates on backend
    try {
      await fetch('/api/dashboard/refresh', { method: 'POST' });
    } catch {}
    const updateTime = new Date().toLocaleString('id-ID');
    setLastUpdate(updateTime);
    fetchDataIntervalRange();
    setIsRefreshing(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header 
          lastUpdate={lastUpdate} 
          isRefreshing={isRefreshing} 
          onRefresh={handleRefresh}
          intervalText={intervalText}
        />
        <main className="flex-1 overflow-y-auto bg-[#0d1117] p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
