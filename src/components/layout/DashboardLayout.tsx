"use client";

import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { usePathname } from "next/navigation";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("—");
  const [intervalText, setIntervalText] = useState<string>("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const pathname = usePathname();

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
    try {
      await fetch('/api/dashboard/refresh', { method: 'POST' });
    } catch {}
    const updateTime = new Date().toLocaleString('id-ID');
    setLastUpdate(updateTime);
    fetchDataIntervalRange();
    setIsRefreshing(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-transparent transition-colors duration-500 relative">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      
      <div className="flex flex-1 flex-col overflow-hidden w-full min-w-0 relative transition-all duration-500 ease-in-out">
        <Header 
          lastUpdate={lastUpdate} 
          isRefreshing={isRefreshing} 
          onRefresh={handleRefresh}
          intervalText={intervalText}
          onMenuClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-transparent p-4 md:p-6 transition-all duration-500 ease-in-out w-full relative">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
