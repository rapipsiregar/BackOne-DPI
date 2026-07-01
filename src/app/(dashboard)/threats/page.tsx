"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useState, useEffect } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useThreats, ThreatStat } from "@/lib/api";
import { IpDetails } from "@/components/ui/IpDetails";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ThreatsContent() {
  const [mounted, setMounted] = useState(false);
  const threats = useThreats(100);
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const getSeverityBadge = (sev?: string | null) => {
    if (!sev) return <Badge variant="green">Unknown</Badge>;
    const s = sev.toLowerCase();
    if (s.includes('high') || s.includes('critical')) return <Badge variant="red">{sev}</Badge>;
    if (s.includes('med')) return <Badge variant="orange">{sev}</Badge>;
    if (s.includes('low')) return <Badge variant="yellow">{sev}</Badge>;
    return <Badge variant="blue">{sev}</Badge>;
  };

  const columns: Column<ThreatStat>[] = [
    { header: "#", accessor: (row, i) => i + 1 },
    { header: "Type", accessor: (row) => row.threat_type || 'Unknown' },
    { header: "Severity", accessor: (row) => getSeverityBadge(row.severity) },
    { header: "Source IP", accessor: (row) => <span className="font-medium text-blue-400">{row.ip_address || '-'}</span> },
    {
      header: "Dest IP",
      accessor: (row) => row.dst_ip ? (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs text-blue-400">{row.dst_ip}</span>
          <IpDetails ip={row.dst_ip} />
        </div>
      ) : '-'
    },
    { header: "MAC Address", accessor: (row) => row.mac_address ? <code className="text-xs bg-secondary/50 px-1 py-0.5 rounded text-muted-foreground">{row.mac_address}</code> : '-' },
    { header: "App", accessor: (row) => row.app_label || '-' },
    { header: "Domain", accessor: (row) => row.domain || '-' },
    { header: "Time", accessor: (row) => <span className="text-muted-foreground text-xs">{row.detected_at ? new Date(row.detected_at).toLocaleString() : '-'}</span> },
  ];

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

      <Card className="bg-card/80 backdrop-blur-xl border-border/50 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <CardHeader className="border-b border-border/50 pb-4 mb-4">
          <CardTitle className="text-lg text-white">Detected Threats {threats.data ? `(${threats.data.length})` : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={threats.data || []} 
            columns={columns} 
            searchPlaceholder="Search threats by IP, domain, type..."
            searchFilter={(row, query) => {
              const q = query.toLowerCase();
              return (row.ip_address || "").toLowerCase().includes(q) || 
                     (row.domain || "").toLowerCase().includes(q) ||
                     (row.threat_type || "").toLowerCase().includes(q) ||
                     (row.app_label || "").toLowerCase().includes(q);
            }}
            getRowClassName={(row) => {
              return highlightId && row.id.toString() === highlightId
                ? "bg-red-500/15 border-l-2 border-red-500 animate-pulse font-semibold"
                : "";
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ThreatsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <ThreatsContent />
    </Suspense>
  );
}
