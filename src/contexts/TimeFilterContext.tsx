"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type TimeRange = '5m' | '30m' | '1h' | '1d' | '7d';

interface TimeFilterContextType {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
}

const TimeFilterContext = createContext<TimeFilterContextType | undefined>(undefined);

export function TimeFilterProvider({ children }: { children: ReactNode }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1d');

  return (
    <TimeFilterContext.Provider value={{ timeRange, setTimeRange }}>
      {children}
    </TimeFilterContext.Provider>
  );
}

export function useTimeFilter() {
  const context = useContext(TimeFilterContext);
  if (context === undefined) {
    throw new Error('useTimeFilter must be used within a TimeFilterProvider');
  }
  return context;
}
