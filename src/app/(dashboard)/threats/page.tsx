"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useState, useEffect, useMemo, Suspense } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { ThreatStat } from "@/lib/api";
import { useThreats } from "@/lib/api-with-context";
import { DeviceDetailModal } from "@/components/ui/DeviceDetailModal";
import { ThreatFilters } from "@/components/threats/ThreatFilters";
import { ThreatRecommendationsDrawer } from "@/components/threats/ThreatRecommendationsDrawer";
import { useSearchParams } from "next/navigation";
import { formatAppLabel } from "@/lib/utils";

// ─── ThreatsContent ───────────────────────────────────────────────────────────
function ThreatsContent() {
  const [mounted, setMounted] = useState(false);
  const [selectedIp, setSelectedIp] = useState<string | null>(null);
  const [selectedMac, setSelectedMac] = useState<string | null>(null);
  const [selectedThreat, setSelectedThreat] = useState<ThreatStat | null>(null);
  
  const threats = useThreats();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  // Column dropdown filters state
  const [fType, setFType] = useState("All");
  const [fSev, setFSev] = useState("All");
  const [fSrcIp, setFSrcIp] = useState("All");
  const [fDstIp, setFDstIp] = useState("All");
  const [fMac, setFMac] = useState("All");
  const [fApp, setFApp] = useState("All");
  const [fDomain, setFDomain] = useState("All");

  // Date range filter state
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const all = threats.data || [];

  // Apply all filters
  const filtered = useMemo(() => {
    return all.filter((row) => {
      if (fType !== "All" && (row.threat_type || "") !== fType) return false;
      if (fSev !== "All" && (row.severity || "") !== fSev) return false;
      if (fSrcIp !== "All" && (row.ip_address || "") !== fSrcIp) return false;
      if (fDstIp !== "All" && (row.dst_ip || "") !== fDstIp) return false;
      if (fMac !== "All" && (row.mac_address || "") !== fMac) return false;
      if (fApp !== "All" && (row.app_label || "") !== fApp) return false;
      if (fDomain !== "All" && (row.domain || "") !== fDomain) return false;
      if (dateFrom || dateTo) {
        const d = row.detected_at
          ? new Date(row.detected_at).toISOString().slice(0, 10)
          : "";
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
      }
      return true;
    });
  }, [all, fType, fSev, fSrcIp, fDstIp, fMac, fApp, fDomain, dateFrom, dateTo]);

  // Automatically select a threat if highlightId is passed
  useEffect(() => {
    if (highlightId && all.length > 0) {
      const match = all.find(r => r.id.toString() === highlightId);
      if (match) {
        setSelectedThreat(match);
      }
    }
  }, [highlightId, all]);

  if (!mounted) return null;

  const getSeverityBadge = (sev?: string | null) => {
    if (!sev) return <Badge variant="green">Unknown</Badge>;
    const s = sev.toLowerCase();
    if (s.includes("high") || s.includes("critical")) return <Badge variant="red">{sev}</Badge>;
    if (s.includes("med")) return <Badge variant="orange">{sev}</Badge>;
    if (s.includes("low")) return <Badge variant="yellow">{sev}</Badge>;
    return <Badge variant="blue">{sev}</Badge>;
  };

  const columns: Column<ThreatStat>[] = [
    {
      header: "Timestamp",
      className: "w-[155px] min-w-[155px] max-w-[155px] text-center",
      accessor: (row) =>
        row.detected_at ? new Date(row.detected_at).toLocaleString("id-ID", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit"
        }) : "-",
    },
    { header: "#", className: "w-[40px] min-w-[40px] max-w-[40px] text-center", accessor: (_row, i) => i + 1 },
    {
      header: "Type",
      className: "w-[170px] min-w-[170px] max-w-[170px]",
      accessor: (row) => (
        <div
          title={row.description || row.threat_type || "Unknown"}
          className="truncate w-full block cursor-help text-xs leading-tight"
        >
          {row.threat_type || "Unknown"}
        </div>
      ),
    },
    {
      header: "Severity",
      className: "w-[90px] min-w-[90px] max-w-[90px] text-center",
      accessor: (row) => getSeverityBadge(row.severity),
    },
    {
      header: "Source IP",
      className: "w-[120px] min-w-[120px] max-w-[120px] text-center",
      accessor: (row) =>
        row.ip_address ? (
          <button
            onClick={() => setSelectedIp(row.ip_address)}
            className="font-medium text-blue-400 hover:text-blue-300 hover:underline font-mono text-xs focus:outline-none w-full text-center"
          >
            {row.ip_address}
          </button>
        ) : (
          <span className="text-muted-foreground text-xs" title="Source IP tidak tersedia dari data event keamanan (hanya MAC Address yang ter-capture)">–</span>
        ),
    },
    {
      header: "Dest IP",
      className: "w-[120px] min-w-[120px] max-w-[120px] text-center",
      accessor: (row) =>
        row.dst_ip ? (
          <button
            onClick={() => setSelectedIp(row.dst_ip)}
            className="font-mono text-xs text-blue-400 hover:text-blue-300 hover:underline focus:outline-none w-full text-center"
          >
            {row.dst_ip}
          </button>
        ) : (
          <span className="text-muted-foreground text-xs" title="Dest IP tidak tersedia dari data event ini">–</span>
        ),
    },
    {
      header: "MAC Addr",
      className: "w-[140px] min-w-[140px] max-w-[140px] text-center",
      accessor: (row) =>
        row.mac_address ? (
          <button
            onClick={() => setSelectedMac(row.mac_address)}
            className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded text-muted-foreground hover:text-white hover:bg-secondary transition-colors font-mono focus:outline-none w-full text-center truncate"
            title={row.mac_address}
          >
            {row.mac_address}
          </button>
        ) : "–",
    },
    {
      header: "App",
      className: "w-[110px] min-w-[110px] max-w-[110px] text-center",
      accessor: (row) => {
        const formatted = formatAppLabel(row.app_label);
        return formatted ? (
          <div title={formatted} className="truncate w-full block text-center cursor-help text-xs">
            {formatted}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs" title="App tidak tersedia dari event ini">–</span>
        );
      },
    },
    {
      header: "Domain",
      className: "w-[160px] min-w-[160px] max-w-[160px] text-center",
      accessor: (row) => row.domain ? (
        <div title={row.domain} className="truncate w-full text-center text-xs cursor-help">
          {row.domain}
        </div>
      ) : (
        <span className="text-muted-foreground text-xs" title="Domain tidak tersedia dari event ini">–</span>
      ),
    },
    {
      header: "Action",
      className: "w-[130px] min-w-[130px] max-w-[130px] text-center",
      accessor: (row) => (
        <button
          onClick={() => setSelectedThreat(row)}
          className="px-2 py-1 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:text-white rounded-lg transition-all shadow-sm cursor-pointer whitespace-nowrap focus:outline-none"
        >
          View Mitigation
        </button>
      ),
    },
  ];


  const activeFilterCount =
    [fType, fSev, fSrcIp, fDstIp, fMac, fApp, fDomain].filter((v) => v !== "All").length +
    (dateFrom || dateTo ? 1 : 0);

  const resetFilters = () => {
    setFType("All");
    setFSev("All");
    setFSrcIp("All");
    setFDstIp("All");
    setFMac("All");
    setFApp("All");
    setFDomain("All");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Threat Intelligence
            {threats.isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
          </h2>
          <p className="text-muted-foreground mt-1">Monitor and respond to network security threats.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <ShieldCheck className="h-4 w-4" />
          <span>Active Monitoring</span>
        </div>
      </div>

      {/* Filters above the table */}
      <ThreatFilters
        all={all}
        fType={fType}
        setFType={setFType}
        fSev={fSev}
        setFSev={setFSev}
        fSrcIp={fSrcIp}
        setFSrcIp={setFSrcIp}
        fDstIp={fDstIp}
        setFDstIp={setFDstIp}
        fMac={fMac}
        setFMac={setFMac}
        fApp={fApp}
        setFApp={setFApp}
        fDomain={fDomain}
        setFDomain={setFDomain}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        activeFilterCount={activeFilterCount}
        onReset={resetFilters}
      />

      {/* Threats Table - Full Width */}
      <Card
        className="bg-card/80 backdrop-blur-xl border-border/50 animate-slide-up relative z-10 overflow-visible"
        style={{ animationDelay: "100ms" }}
      >
        <CardHeader className="border-b border-border/50 pb-4 mb-4">
          <CardTitle className="text-lg text-white">
            Detected Threats
            <span className="ml-2 text-muted-foreground font-normal">
              ({filtered.length}
              {filtered.length !== all.length ? ` of ${all.length}` : ""})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filtered}
            columns={columns}
            searchPlaceholder="Search threats by IP, domain, type..."
            searchFilter={(row, query) => {
              const q = query.toLowerCase();
              return (
                (row.ip_address || "").toLowerCase().includes(q) ||
                (row.domain || "").toLowerCase().includes(q) ||
                (row.threat_type || "").toLowerCase().includes(q) ||
                (row.app_label || "").toLowerCase().includes(q)
              );
            }}
            getRowClassName={(row) =>
              highlightId && row.id.toString() === highlightId
                ? "bg-red-500/15 border-l-2 border-red-500 animate-pulse font-semibold"
                : ""
            }
            csvExport={{
              filename: `threats-${new Date().toISOString().slice(0, 10)}.csv`,
              headers: ["Timestamp", "Type", "Severity", "Source IP", "Dest IP", "MAC Address", "App", "Domain"],
              rowSerializer: (row) => [
                row.detected_at ? new Date(row.detected_at).toISOString() : "",
                row.threat_type || "",
                row.severity || "",
                row.ip_address || "",
                row.dst_ip || "",
                row.mac_address || "",
                row.app_label || "",
                row.domain || "",
              ],
            }}
          />
        </CardContent>
      </Card>

      {selectedIp && <DeviceDetailModal ip={selectedIp} onClose={() => setSelectedIp(null)} />}
      {selectedMac && <DeviceDetailModal ip="" mac={selectedMac} onClose={() => setSelectedMac(null)} />}
      
      {/* Mitigation recommendations drawer panel */}
      <ThreatRecommendationsDrawer
        threat={selectedThreat}
        onClose={() => setSelectedThreat(null)}
      />
    </div>
  );
}

export default function ThreatsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ThreatsContent />
    </Suspense>
  );
}
