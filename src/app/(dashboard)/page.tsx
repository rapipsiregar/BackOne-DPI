"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useDashboardSummary, useTimeline, useTopApps, useTopProtocols, useCities, useAgentLocations } from "@/lib/api-with-context";
// import { GlobeMap } from "@/components/ui/GlobeMap";
import { FlatWorldMap } from "@/components/ui/FlatWorldMap";
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
  const cities = useCities(); // Load all cities for complete map
  const locations = useAgentLocations(); // Load all agent locations for site

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

    const appMap = new Map();

    // 1. Group appsData, filtering out 'Unknown'
    appsData.forEach(app => {
      const label = app.app_label;
      if (label && label !== 'Unknown') {
        appMap.set(label, {
          app_label: label,
          download: app.download || 0,
          upload: app.upload || 0
        });
      }
    });

    // 2. Group convertedApps (non-standard protocols), summing values to avoid duplication
    convertedApps.forEach(app => {
      const label = app.app_label;
      if (label && label !== 'Unknown') {
        if (appMap.has(label)) {
          const existing = appMap.get(label);
          existing.download += app.download || 0;
          existing.upload += app.upload || 0;
        } else {
          appMap.set(label, {
            app_label: label,
            download: app.download || 0,
            upload: app.upload || 0
          });
        }
      }
    });

    let mergedApps = Array.from(appMap.values());
    mergedApps.sort((a, b) => (b.download || 0) - (a.download || 0));
    mergedApps = mergedApps.slice(0, 7);

    // If mergedApps is empty but appsData is not, fallback to appsData
    const finalAppsData = mergedApps.length > 0 ? mergedApps : appsData;

    return {
      topProtocols: { ...rawTopProtocols, data: actualProtocols },
      topApps: { ...rawTopApps, data: finalAppsData }
    };
  }, [rawTopProtocols.data, rawTopApps.data, rawTopProtocols.isLoading, rawTopApps.isLoading]);

  const mapData = useMemo(() => {
    if (!cities.data) return [];
    
    // Find active agent location (serial 8A-V3-PB-85 for site SIAB) dynamically from DB
    const activeLocation = locations.data?.find((loc: any) => 
      loc.site_uuid === "6681452d_9cae_4ff4_8ae8_0d504774265e" && loc.agent_uuid === "8A-V3-PB-85"
    ) || locations.data?.[0];

    const origin = {
      lat: activeLocation?.latitude || -6.2253265,
      lng: activeLocation?.longitude || 106.8061484,
      label: activeLocation?.label || "IFG LT.18 Agent HQ"
    };

    const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
      "Jakarta": { lat: -6.2088, lng: 106.8456 },
      "Jakarta (BackOne Intranet)": { lat: -6.2150, lng: 106.8150 }, // Local LAN is physically in Jakarta, offset by 2km to draw local flow lines
      "Bandung": { lat: -6.9147, lng: 107.6098 },
      "Surabaya": { lat: -7.2504, lng: 112.7688 },
      "Semarang": { lat: -6.9667, lng: 110.4167 },
      "Tangerang (CPI Balaraja)": { lat: -6.1915, lng: 106.4526 },
      "Singapore": { lat: 1.3521, lng: 103.8198 },
      "Mountain View": { lat: 37.3861, lng: -122.0839 },
      "Richmond": { lat: 37.5407, lng: -77.4360 },
      "Chiyoda": { lat: 35.6940, lng: 139.7537 },
      "Sydney": { lat: -33.8688, lng: 151.2093 }
    };

    return cities.data.reduce((acc: any[], row) => {
      const cityName = row.city_name || "Unknown City";
      const coord = CITY_COORDS[cityName] || CITY_COORDS[row.country_name];

      let dest = null;
      if (coord) {
        dest = {
          lat: coord.lat,
          lng: coord.lng,
          label: cityName
        };
      } else {
        const fallbackDest = getDestinationLocation(row.country_code || '', row.country_name);
        if (fallbackDest) {
          dest = fallbackDest;
        }
      }

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
  }, [cities.data, locations.data]);

  useEffect(() => {
    setMounted(true);
    document.title = "Overview Dashboard | BackOne - Deep Package Inspection";
  }, []);

  if (!mounted) return null;

  const isLoading = summary.isLoading || timeline.isLoading || topApps.isLoading || topProtocols.isLoading;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-4 w-full">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2 sm:gap-3 truncate">
              <span>Overview Dashboard</span>
              {isLoading && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-primary flex-shrink-0" />}
            </h2>
            {/* Mobile Actions: Inline next to Title */}
            <div className="flex items-center gap-1.5 flex-shrink-0 sm:hidden">
              <HelpTrigger pageId="overview" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-normal sm:leading-relaxed">Real-time network traffic and intelligence summary.</p>
        </div>

        {/* Laptop/Tablet Actions: Floats on the right */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <HelpTrigger pageId="overview" />
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards summary={summary.data} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 animate-slide-up" style={{ animationDelay: '300ms' }}>
        {/* Global Connections Map */}
        <div className="col-span-1 lg:col-span-4 relative flex items-center justify-center w-full min-w-0">
          {/* <GlobeMap data={mapData} /> */}
          <FlatWorldMap data={mapData} />
        </div>

        {/* Top Widgets (Apps & Protocols) */}
        <TopWidgets topApps={topApps} topProtocols={topProtocols} />
      </div>
    </div>
  );
}
