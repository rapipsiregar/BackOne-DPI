"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { getViewAsHeaders } from "@/lib/admin-api";
import { useTimeFilter } from "@/contexts/TimeFilterContext";
import { Loader2, Tag } from "lucide-react";
import { getColumns, DeviceLabelItem } from "./columns";
import EditOwnerModal from "./EditOwnerModal";
import DeviceMacDetailsModal from "@/components/admin/DeviceMacDetailsModal";
import { HelpTrigger } from "@/components/help/HelpTrigger";

export default function DeviceLabelingPage() {
  const [mounted, setMounted] = useState(false);
  const [devices, setDevices] = useState<DeviceLabelItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  
  const { timeRange } = useTimeFilter();

  // Modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceLabelItem | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailedDevice, setDetailedDevice] = useState<DeviceLabelItem | null>(null);

  const fetchDevices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/devices/labeling?timeRange=${timeRange}`, {
        headers: getViewAsHeaders(),
      });
      const resData = await res.json();
      if (resData.ok) {
        setDevices(resData.data || []);
      } else {
        setError(resData.error || "Failed to load device listing.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching devices.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    document.title = "Device Labeling | BackOne - Deep Package Inspection";
    // Fetch current user role to conditionally show/hide edit controls
    fetch("/api/auth/me", { headers: getViewAsHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.role) setUserRole(data.user.role);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchDevices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, mounted]);

  const handleEditClick = (device: DeviceLabelItem) => {
    setEditingDevice(device);
    setIsEditOpen(true);
  };

  const handleMacClick = (device: DeviceLabelItem) => {
    setDetailedDevice(device);
    setIsDetailOpen(true);
  };

  const handleSaveSuccess = (mac: string, newLabel: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.mac_address === mac
          ? { ...d, custom_label: newLabel || null }
          : d
      )
    );
  };

  const searchFilter = (row: DeviceLabelItem, q: string) => {
    const queryStr = q.toLowerCase();
    return (
      row.mac_address.toLowerCase().includes(queryStr) ||
      row.ip_address.toLowerCase().includes(queryStr) ||
      row.default_label.toLowerCase().includes(queryStr) ||
      (row.custom_label || "").toLowerCase().includes(queryStr)
    );
  };

  if (!mounted) return null;

  const columns = getColumns({
    userRole,
    onEditClick: handleEditClick,
    onMacClick: handleMacClick,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    if (devices.length === 0) return;
    setIsExportingPdf(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { default: DeviceLabelingPdfDocument } = await import("@/components/admin/DeviceLabelingPdfDocument");
      const reportDateStr = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB";
      const doc = <DeviceLabelingPdfDocument devices={devices} reportDateStr={reportDateStr} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Device_Asset_Directory_Report.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export PDF:", err);
      alert("Failed to generate PDF report. Please try again.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Device Labeling
            <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
          </h2>
          <div className="shrink-0">
            <HelpTrigger pageId="devices" />
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Assign custom names to MAC addresses to identify device owners across all charts and flows.
        </p>
      </div>

      <Card className="border-white/5 bg-black/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-sm font-semibold tracking-wide uppercase text-slate-300">
            Device Asset Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && !isEditOpen && !isDetailOpen && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm">
              ⚠️ {error}
            </div>
          )}

          <DataTable
            data={devices}
            columns={columns}
            searchPlaceholder="Search MAC, IP, vendor, or custom label..."
            searchFilter={searchFilter}
            isLoading={isLoading}
            pdfExport={{
              onExport: handleExportPdf,
              isExporting: isExportingPdf,
            }}
          />
        </CardContent>
      </Card>

      {/* Edit Owner Modal */}
      <EditOwnerModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingDevice(null);
        }}
        device={editingDevice}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* Device Mac Details Modal */}
      {detailedDevice && (
        <DeviceMacDetailsModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setDetailedDevice(null);
          }}
          macAddress={detailedDevice.mac_address}
          customLabel={detailedDevice.custom_label}
          defaultLabel={detailedDevice.default_label}
          agentName={detailedDevice.agent_name}
          manufacturer={detailedDevice.manufacturer}
          deviceType={detailedDevice.device_type}
        />
      )}
    </div>
  );
}
