import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TimeFilterProvider } from "@/contexts/TimeFilterContext";
import { TenantConfigProvider } from "@/contexts/TenantConfigContext";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TimeFilterProvider>
      <TenantConfigProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </TenantConfigProvider>
    </TimeFilterProvider>
  );
}
