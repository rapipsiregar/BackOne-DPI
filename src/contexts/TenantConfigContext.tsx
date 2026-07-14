"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getViewAsHeaders } from '@/lib/admin-api';

interface TenantConfig {
  brandName: string;
  brandLogo: string;
  footerCopyright: string;
  primaryColor: string;
}

interface TenantConfigContextType {
  tenantConfig: TenantConfig | null;
  isLoading: boolean;
  refetchConfig: () => void;
}

const TenantConfigContext = createContext<TenantConfigContextType | undefined>(undefined);

export function TenantConfigProvider({ children }: { children: ReactNode }) {
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = () => {
    setIsLoading(true);
    fetch('/api/dashboard/tenant-config', { headers: getViewAsHeaders() })
      .then(res => res.json())
      .then(json => {
        if (json.ok && json.data) {
          setTenantConfig({
            brandName: json.data.brand_name,
            brandLogo: json.data.brand_logo,
            footerCopyright: json.data.footer_copyright,
            primaryColor: json.data.primary_color || '#E11D48',
          });
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <TenantConfigContext.Provider value={{ tenantConfig, isLoading, refetchConfig: fetchConfig }}>
      {children}
    </TenantConfigContext.Provider>
  );
}

export function useTenantConfig() {
  const context = useContext(TenantConfigContext);
  if (context === undefined) {
    throw new Error('useTenantConfig must be used within a TenantConfigProvider');
  }
  return context;
}
