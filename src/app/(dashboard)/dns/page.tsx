"use client";

import { useState, useEffect } from "react";
import { TimestampCell } from "@/components/ui/TimestampCell";
import { useDNS } from "@/lib/api-with-context";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2 } from "lucide-react";
import { UniversalFilters, useUniversalFilterState, FilterConfig } from "@/components/ui/UniversalFilters";
import { HelpTrigger } from "@/components/help/HelpTrigger";

export default function DNSPage() {
  const [mounted, setMounted] = useState(false);
  const { data, isLoading } = useDNS();

  const { 
    filters,
    handleFilterChange,
    handleReset, activeCount 
  } = useUniversalFilterState();

  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.title = "DNS | BackOne - Deep Package Inspection";
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      setIsDetailLoading(true);
      fetch(`http://localhost:4000/domain-details?domain=${encodeURIComponent(selectedDomain)}`)
        .then(res => res.json())
        .then(data => {
          if (data.ok) {
            setDetailData(data.data || []);
          }
        })
        .catch(console.error)
        .finally(() => setIsDetailLoading(false));
    }
  }, [selectedDomain]);

  if (!mounted) return null;

  const all = data || [];

  const opts = (key: string) => {
    const raw = Array.from(new Set(all.map((r: any) => String(r[key] || "")).filter(Boolean)));
    return raw.sort();
  };

  const filterConfigs: FilterConfig[] = []; // Removed App/Category filters

  const filteredData = all;

  const columns: Column<typeof data[0]>[] = [
    { 
      header: "Last Seen", 
      accessor: (row) => <TimestampCell timestamp={row.last_seen || row.timestamp} showActiveStatus={true} />
    },
    { header: "#", accessor: (row, i) => i + 1 },
    { 
      header: "Domain", 
      accessor: (row) => <span className="font-medium text-white">{row.domain}</span> 
    },
    { 
      header: "Label (Translation)", 
      accessor: (row) => {
        const d = (row.domain || "").toLowerCase();
        let label = "-";
        if (d.includes('facebook') || d.includes('fbcdn')) label = 'Facebook';
        else if (d.includes('google') || d.includes('1e100.net')) label = 'Google / Android';
        else if (d.includes('apple') || d.includes('icloud') || d.includes('aaplimg')) label = 'Apple / iOS';
        else if (d.includes('tiktok') || d.includes('byte')) label = 'TikTok';
        else if (d.includes('whatsapp') || d.includes('wa.net')) label = 'WhatsApp';
        else if (d.includes('instagram') || d.includes('cdninstagram')) label = 'Instagram';
        else if (d.includes('microsoft') || d.includes('msedge') || d.includes('sfx.ms')) label = 'Microsoft';
        else if (d.includes('netflix') || d.includes('nflx')) label = 'Netflix';
        else if (d.includes('amazon') || d.includes('aws')) label = 'Amazon (AWS)';
        else if (d.includes('cloudflare')) label = 'Cloudflare';
        else if (d.includes('akamai')) label = 'Akamai CDN';
        else if (d.includes('fastly')) label = 'Fastly CDN';
        else if (d.includes('github')) label = 'GitHub';
        else if (d.includes('twimg') || d.includes('twitter') || d.includes('x.com')) label = 'X (Twitter)';
        else if (d.includes('grafana')) label = 'Grafana';
        return <span className="text-gray-300 bg-gray-800 px-2 py-1 rounded-md text-xs">{label}</span>;
      }
    },
    { 
      header: "Total Connections", 
      accessor: (row) => <span className="text-purple-400">{row.query_count?.toLocaleString() || 0}</span> 
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            DNS Analytics
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          </h2>
          <div className="shrink-0">
            <HelpTrigger pageId="dns" />
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Monitor DNS queries, domain lookups, and name resolution telemetry.
        </p>
      </div>
      
      <UniversalFilters
        filters={filterConfigs}
        onChange={handleFilterChange}
        showDateRange={false}
        activeFilterCount={activeCount}
        onReset={handleReset}
      />

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-white">All DNS Queries</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredData}
            columns={columns}
            searchPlaceholder="Search by domain, application, or category..."
            onRowClick={(row) => setSelectedDomain(row.domain)}
            searchFilter={(row, query) => {
              const q = query.toLowerCase();
              return (
                (row.domain || "").toLowerCase().includes(q) ||
                (row.app_label || "").toLowerCase().includes(q) ||
                (row.category || "").toLowerCase().includes(q)
              );
            }}
          />
        </CardContent>
      </Card>

      {selectedDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-3xl rounded-xl border border-border shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Domain Access Details</h3>
                <p className="text-sm text-muted-foreground break-all">{selectedDomain}</p>
              </div>
              <button 
                onClick={() => setSelectedDomain(null)}
                className="text-muted-foreground hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {isDetailLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                  <p>Fetching real-time access logs from proxy...</p>
                  <p className="text-xs opacity-60 mt-2 text-center max-w-sm">
                    ⚠️ Ignoring Rule #13 temporarily. This performs a live on-demand query to the upstream API.
                  </p>
                </div>
              ) : detailData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                  <p className="text-lg font-medium text-white mb-2">No IP details found</p>
                  <p className="max-w-md">The upstream API did not return any identifiable IPs or MACs actively connecting to this domain at this exact moment.</p>
                </div>
              ) : (
                <div className="rounded-lg border border-border/50 overflow-hidden bg-[#090D16]">
                  <table className="w-full text-sm text-left border-collapse table-fixed">
                    <thead className="bg-[#111827] text-slate-300 border-b border-border/50">
                      <tr className="bg-[#111827]">
                        <th className="px-4 py-3 font-medium w-[25%]">Device Name</th>
                        <th className="px-4 py-3 font-medium w-[25%]">IP Address</th>
                        <th className="px-4 py-3 font-medium w-[25%]">MAC Address</th>
                        <th className="px-4 py-3 font-medium text-right w-[25%]">Last Seen</th>
                      </tr>
                    </thead>
                  </table>
                  <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                      <tbody className="divide-y divide-border/50">
                        {detailData.map((d, i) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 text-white w-[25%]">{d.deviceName}</td>
                          <td className="px-4 py-3 text-blue-400 w-[25%]">{d.ip}</td>
                          <td className="px-4 py-3 text-purple-400 font-mono text-xs w-[25%]">{d.mac}</td>
                          <td className="px-4 py-3 text-right w-[25%]">
                            <TimestampCell timestamp={d.timestamp} showActiveStatus={true} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
