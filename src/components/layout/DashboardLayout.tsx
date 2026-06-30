"use client";

import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("—");

  useEffect(() => {
    setLastUpdate(new Date().toLocaleString('id-ID'));
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLastUpdate(new Date().toLocaleString('id-ID'));
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
