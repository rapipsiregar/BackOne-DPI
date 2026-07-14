"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useDashboardSummary, useTimeline, useTopApps, useTopProtocols, useCountries } from "@/lib/api-with-context";
import { GlobeMap } from "@/components/ui/GlobeMap";
import { getOriginLocation, getDestinationLocation } from "@/lib/geoUtils";
import { KPICards } from "@/components/dashboard/KPICards";
import { TopWidgets } from "@/components/dashboard/TopWidgets";
import { HelpTrigger } from "@/components/help/HelpTrigger";

export default function SummaryPage() {
  const [mounted, setMounted] = useState(false);
  const summary = useDashboardSummary();
  const timeline = useTimeline(24);
  const rawTopApps = useTopApps(7);
  const rawTopProtocols = useTopProtocols();
  const countries = useCountries(0); // Load all countries for complete globemap (Requirement 16)

  const { topProtocols, topApps } = useMemo(() => {
    const rawProtos = rawTopProtocols.data || [];
    let appsData = rawTopApps.data || [];

    const standardProtocols = [
      'QUIC', 'HTTPS', 'HTTP', 'STUN', 'TCP', 'UDP', 'TLS', 'DNS', 'ICMP', 
      'SSH', 'FTP', 'SMTP', 'POP3', 'IMAP', 'NTP', 'DHCP', 'BGP', 'OSPF', 'IPSEC', 'OPENVPN'
    ];

    const actualProtocols = rawProtos.filter(p => standardProtocols.includes(p.protocol_label?.toUpperCase()));
    const appProtocols = rawProtos.filter(p => !standardProtocols.includes(p.protocol_label?.toUpperCase()));

    const convertedApps = appProtocols.map(p => ({
      app_label: p.protocol_label,
      download: p.download || 0,
      upload: p.upload || 0
    }));

    let mergedApps = [...appsData.filter(a => a.app_label !== 'Unknown'), ...convertedApps];
    mergedApps.sort((a, b) => (b.download || 0) - (a.download || 0));
    mergedApps = mergedApps.slice(0, 7);

    return {
      topProtocols: { ...rawTopProtocols, data: actualProtocols },
      topApps: { ...rawTopApps, data: mergedApps.length > 0 ? mergedApps : appsData }
    };
  }, [rawTopProtocols.data, rawTopApps.data, rawTopProtocols.isLoading, rawTopApps.isLoading]);

  const mapData = useMemo(() => {
    if (!countries.data) return [];
    
    const origin = getOriginLocation();

    return countries.data.reduce((acc: any[], row) => {
      // Skip local-to-local if origin is Indonesia and destination is Indonesia
      if (row.country_code === "ID" && origin.label.includes("Indonesia")) return acc;
      
      const dest = getDestinationLocation(row.country_code, row.country_name);
      if (dest) {
        acc.push({
          startLat: origin.lat,
          startLng: origin.lng,
          endLat: dest.lat,
          endLng: dest.lng,
          fromLabel: origin.label,
          toLabel: dest.label,
          value: row.download + row.upload,
          download: row.download,
          upload: row.upload,
          countryCode: row.country_code
        });
      }
      return acc;
    }, []);
  }, [countries.data]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isLoading = summary.isLoading || timeline.isLoading || topApps.isLoading || topProtocols.isLoading;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Summary Overview
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
          </h2>
          <p className="text-muted-foreground mt-1">Real-time network traffic and intelligence summary.</p>
        </div>
        <HelpTrigger pageId="overview" />
      </div>

      {/* KPI Cards */}
      <KPICards summary={summary.data} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 animate-slide-up" style={{ animationDelay: '300ms' }}>
        {/* Global Connections Map */}
        <div className="col-span-4 relative flex items-center justify-center">
          <GlobeMap data={mapData} />
        </div>

        {/* Top Widgets (Apps & Protocols) */}
        <TopWidgets topApps={topApps} topProtocols={topProtocols} />
      </div>
    </div>
  );
}
