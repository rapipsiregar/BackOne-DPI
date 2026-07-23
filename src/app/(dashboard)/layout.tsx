"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TimeFilterProvider } from "@/contexts/TimeFilterContext";
import { TenantConfigProvider } from "@/contexts/TenantConfigContext";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TenantConfigProvider>
      <TimeFilterProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </TimeFilterProvider>
    </TenantConfigProvider>
  );
}
