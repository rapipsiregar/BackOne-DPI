import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TimeFilterProvider } from "@/contexts/TimeFilterContext";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TimeFilterProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </TimeFilterProvider>
  );
}
