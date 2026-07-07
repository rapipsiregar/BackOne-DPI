"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-transparent transition-colors duration-500 relative">
      <Sidebar />
      
      <div className="flex flex-1 flex-col overflow-hidden w-full min-w-0 relative transition-all duration-500 ease-in-out">
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-transparent p-4 md:p-6 transition-all duration-500 ease-in-out w-full relative">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
