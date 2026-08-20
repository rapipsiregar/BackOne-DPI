"use client";

import { useState, useCallback, useEffect } from "react";
import {
  useNetbios, useDiscoveryOs, useDhcpFingerprints,
  useHttpUserAgents, useSniHostnames, useSslServerCn,
  useQuicHostnames, useBittorrentHashes, useSshVersions,
  useMdnsHostnames
} from "@/lib/api-advanced";
import { MetadataDetailPanel } from "@/components/dpi/MetadataDetailPanel";
import { MetadataDetailType } from "@/lib/api-metadata-detail";
import { useTimeFilter } from "@/contexts/TimeFilterContext";
import { HelpTrigger } from "@/components/help/HelpTrigger";
import DpiAnalyticsTabs from "./DpiAnalyticsTabs";

export default function DpiAnalyticsPage() {
  const { timeRange } = useTimeFilter();
  const [detailType, setDetailType] = useState<MetadataDetailType | null>(null);
  const [detailValue, setDetailValue] = useState<string | null>(null);

  useEffect(() => {
    document.title = "DPI MetaData | BackOne - Deep Package Inspection";
  }, []);

  const openDetail = useCallback((type: MetadataDetailType, value: string) => {
    if (!value || value === "—") return;
    setDetailType(type);
    setDetailValue(value);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailType(null);
    setDetailValue(null);
  }, []);

  // Data Fetch Hooks
  const { data: sniHostnames, isLoading: loadingSni } = useSniHostnames();
  const { data: sslServerCn, isLoading: loadingSslCn } = useSslServerCn();
  const { data: quicHostnames, isLoading: loadingQuic } = useQuicHostnames();
  const { data: netbios, isLoading: loadingNetbios } = useNetbios();
  const { data: mdnsHostnames, isLoading: loadingMdns } = useMdnsHostnames();
  const { data: discoveryOs, isLoading: loadingOs } = useDiscoveryOs();
  const { data: dhcpFingerprints, isLoading: loadingDhcp } = useDhcpFingerprints();
  const { data: httpUserAgents, isLoading: loadingHttpUa } = useHttpUserAgents();
  const { data: sshVersions, isLoading: loadingSsh } = useSshVersions();
  const { data: bittorrentHashes, isLoading: loadingBittorrent } = useBittorrentHashes();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-4 w-full">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight truncate">
              DPI MetaData
            </h1>
            {/* Mobile Actions: Inline next to Title */}
            <div className="flex items-center gap-1.5 flex-shrink-0 sm:hidden">
              <HelpTrigger pageId="dpi-analytics" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-normal sm:leading-relaxed">
            Deep Packet Inspection metadata and fingerprinting.{" "}
            <span className="text-blue-400 text-[10px] sm:text-xs block sm:inline mt-0.5 sm:mt-0">Click any row to view device-level detail.</span>
          </p>
        </div>

        {/* Laptop/Tablet Actions: Floats on the right */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <HelpTrigger pageId="dpi-analytics" />
        </div>
      </div>

      <DpiAnalyticsTabs
        sniHostnames={sniHostnames || []}
        loadingSni={loadingSni}
        sslServerCn={sslServerCn || []}
        loadingSslCn={loadingSslCn}
        quicHostnames={quicHostnames || []}
        loadingQuic={loadingQuic}
        netbios={netbios || []}
        loadingNetbios={loadingNetbios}
        mdnsHostnames={mdnsHostnames || []}
        loadingMdns={loadingMdns}
        discoveryOs={discoveryOs || []}
        loadingOs={loadingOs}
        dhcpFingerprints={dhcpFingerprints || []}
        loadingDhcp={loadingDhcp}
        httpUserAgents={httpUserAgents || []}
        loadingHttpUa={loadingHttpUa}
        sshVersions={sshVersions || []}
        loadingSsh={loadingSsh}
        bittorrentHashes={bittorrentHashes || []}
        loadingBittorrent={loadingBittorrent}
        openDetail={openDetail}
      />

      <MetadataDetailPanel
        type={detailType}
        value={detailValue}
        timeRange={timeRange}
        onClose={closeDetail}
      />
    </div>
  );
}
