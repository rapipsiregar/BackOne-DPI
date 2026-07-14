"use client";

import { useState, useCallback } from "react";
import { Tabs, Tab } from "@/components/ui/Tabs";
import { DataTable } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  useNetbios, useDiscoveryOs, useDhcpFingerprints,
  useHttpUserAgents, useSniHostnames, useSslServerCn,
  useQuicHostnames, useBittorrentHashes, useSshVersions,
  useMdnsHostnames
} from "@/lib/api-advanced";
import { MetadataDetailPanel } from "@/components/dpi/MetadataDetailPanel";
import { MetadataDetailType } from "@/lib/api-metadata-detail";
import { useTimeFilter } from "@/contexts/TimeFilterContext";
import { fmtBytes, getKnownDomainService } from "@/lib/utils";
import { HelpTrigger } from "@/components/help/HelpTrigger";

// Clickable hint badge shown in table column headers when rows are interactive
function ClickHint() {
  return (
    <span className="ml-2 text-[10px] font-normal text-blue-400/70 border border-blue-400/30 rounded px-1 py-0.5 align-middle">
      Click row for details
    </span>
  );
}

export default function DpiAnalyticsPage() {
  const { timeRange } = useTimeFilter();
  // Detail panel state
  const [detailType,  setDetailType]  = useState<MetadataDetailType | null>(null);
  const [detailValue, setDetailValue] = useState<string | null>(null);

  const openDetail = useCallback((type: MetadataDetailType, value: string) => {
    if (!value || value === "—") return;
    setDetailType(type);
    setDetailValue(value);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailType(null);
    setDetailValue(null);
  }, []);

  // Hostnames & Servers Tab
  const { data: sniHostnames,  isLoading: loadingSni }    = useSniHostnames(50);
  const { data: sslServerCn,   isLoading: loadingSslCn }  = useSslServerCn(50);
  const { data: quicHostnames, isLoading: loadingQuic }   = useQuicHostnames(50);
  const { data: netbios,       isLoading: loadingNetbios } = useNetbios(50);
  const { data: mdnsHostnames, isLoading: loadingMdns }   = useMdnsHostnames(50);

  // Client Fingerprints Tab
  const { data: discoveryOs,    isLoading: loadingOs }    = useDiscoveryOs(50);
  const { data: dhcpFingerprints, isLoading: loadingDhcp } = useDhcpFingerprints(50);
  const { data: httpUserAgents, isLoading: loadingHttpUa } = useHttpUserAgents(50);

  // Specific Protocols Tab
  const { data: sshVersions,    isLoading: loadingSsh }       = useSshVersions(50);
  const { data: bittorrentHashes, isLoading: loadingBittorrent } = useBittorrentHashes(50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">DPI MetaData</h1>
          <p className="text-slate-400 mt-2">
            Deep Packet Inspection metadata and fingerprinting.{" "}
            <span className="text-blue-400 text-sm">Click any row to view device-level detail.</span>
          </p>
        </div>
        <HelpTrigger pageId="dpi-analytics" />
      </div>

      <Tabs>
        {/* ── Hostnames & Servers ──────────────────────────────────────────── */}
        <Tab label="Hostnames & Servers">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            <Card>
              <CardHeader><CardTitle>SNI Hostnames (TLS)<ClickHint /></CardTitle></CardHeader>
              <CardContent>
                <DataTable
                  data={sniHostnames}
                  isLoading={loadingSni}
                  onRowClick={(row: any) => openDetail("sni_hostname", row.sni_hostname)}
                  columns={[
                    { 
                      header: "Hostname", 
                      accessor: (row: any) => {
                        const srv = getKnownDomainService(row.sni_hostname);
                        return (
                          <div className="flex flex-col items-center justify-center py-1 w-full overflow-hidden text-center">
                            <span className="truncate w-full block" title={row.sni_hostname}>{row.sni_hostname}</span>
                            {srv && <span className="text-[10px] font-medium text-indigo-400 mt-0.5 truncate w-full block" title={srv}>{srv}</span>}
                          </div>
                        );
                      }
                    },
                    { header: "Total",    accessor: (row: any) => fmtBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>SSL Server Common Names<ClickHint /></CardTitle></CardHeader>
              <CardContent>
                <DataTable
                  data={sslServerCn}
                  isLoading={loadingSslCn}
                  onRowClick={(row: any) => openDetail("ssl_server_cn", row.ssl_server_cn)}
                  columns={[
                    { 
                      header: "Common Name", 
                      accessor: (row: any) => {
                        const srv = getKnownDomainService(row.ssl_server_cn);
                        return (
                          <div className="flex flex-col items-center justify-center py-1 w-full overflow-hidden text-center">
                            <span className="truncate w-full block" title={row.ssl_server_cn}>{row.ssl_server_cn}</span>
                            {srv && <span className="text-[10px] font-medium text-indigo-400 mt-0.5 truncate w-full block" title={srv}>{srv}</span>}
                          </div>
                        );
                      }
                    },
                    { header: "Total",       accessor: (row: any) => fmtBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>QUIC Hostnames<ClickHint /></CardTitle></CardHeader>
              <CardContent>
                <DataTable
                  data={quicHostnames}
                  isLoading={loadingQuic}
                  onRowClick={(row: any) => openDetail("quic_hostname", row.quic_hostname)}
                  columns={[
                    { 
                      header: "Hostname", 
                      accessor: (row: any) => {
                        const srv = getKnownDomainService(row.quic_hostname);
                        return (
                          <div className="flex flex-col items-center justify-center py-1 w-full overflow-hidden text-center">
                            <span className="truncate w-full block" title={row.quic_hostname}>{row.quic_hostname}</span>
                            {srv && <span className="text-[10px] font-medium text-indigo-400 mt-0.5 truncate w-full block" title={srv}>{srv}</span>}
                          </div>
                        );
                      }
                    },
                    { header: "Total",    accessor: (row: any) => fmtBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>NetBIOS Hostnames<ClickHint /></CardTitle></CardHeader>
              <CardContent>
                <DataTable
                  data={netbios}
                  isLoading={loadingNetbios}
                  onRowClick={(row: any) => openDetail("netbios_hostname", row.hostname)}
                  columns={[
                    { header: "Hostname", accessor: (row: any) => row.hostname },
                    { header: "Total",    accessor: (row: any) => fmtBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader><CardTitle>mDNS Hostnames<ClickHint /></CardTitle></CardHeader>
              <CardContent>
                <DataTable
                  data={mdnsHostnames}
                  isLoading={loadingMdns}
                  onRowClick={(row: any) => openDetail("mdns_hostname", row.mdns_hostname)}
                  columns={[
                    { header: "Hostname", accessor: (row: any) => row.mdns_hostname },
                    { header: "Total",    accessor: (row: any) => fmtBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>

          </div>
        </Tab>

        {/* ── Client Fingerprints ──────────────────────────────────────────── */}
        <Tab label="Client Fingerprints">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            <Card className="xl:col-span-2">
              <CardHeader><CardTitle>Operating Systems Discovery<ClickHint /></CardTitle></CardHeader>
              <CardContent>
                <DataTable
                  data={discoveryOs}
                  isLoading={loadingOs}
                  onRowClick={(row: any) => openDetail("os_label", row.os_label)}
                  columns={[
                    { header: "Operating System", accessor: (row: any) => row.os_label },
                    { header: "Download",         accessor: (row: any) => fmtBytes(row.download) },
                    { header: "Upload",           accessor: (row: any) => fmtBytes(row.upload) },
                    { header: "Total",            accessor: (row: any) => fmtBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>DHCP Fingerprints<ClickHint /></CardTitle></CardHeader>
              <CardContent>
                <DataTable
                  data={dhcpFingerprints}
                  isLoading={loadingDhcp}
                  onRowClick={(row: any) => openDetail("dhcp_fingerprint", row.fingerprint)}
                  columns={[
                    { header: "Fingerprint", accessor: (row: any) => row.fingerprint },
                    { header: "Total",       accessor: (row: any) => fmtBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>HTTP User Agents<ClickHint /></CardTitle></CardHeader>
              <CardContent>
                <DataTable
                  data={httpUserAgents}
                  isLoading={loadingHttpUa}
                  onRowClick={(row: any) => openDetail("http_useragent", row.user_agent)}
                  columns={[
                    { header: "User Agent", accessor: (row: any) => row.user_agent },
                    { header: "Total",      accessor: (row: any) => fmtBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>

          </div>
        </Tab>

        {/* ── Specific Protocols ───────────────────────────────────────────── */}
        <Tab label="Specific Protocols">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            <Card>
              <CardHeader><CardTitle>SSH Versions<ClickHint /></CardTitle></CardHeader>
              <CardContent>
                <DataTable
                  data={sshVersions}
                  isLoading={loadingSsh}
                  onRowClick={(row: any) => openDetail("ssh_version", row.ssh_version)}
                  columns={[
                    { header: "SSH Version", accessor: (row: any) => row.ssh_version },
                    { header: "Total",       accessor: (row: any) => fmtBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>BitTorrent Hashes<ClickHint /></CardTitle></CardHeader>
              <CardContent>
                <DataTable
                  data={bittorrentHashes}
                  isLoading={loadingBittorrent}
                  onRowClick={(row: any) => openDetail("bittorrent_hash", row.info_hash)}
                  columns={[
                    { header: "Label",     accessor: (row: any) => row.label },
                    { header: "Info Hash", accessor: (row: any) => row.info_hash },
                    { header: "Total",     accessor: (row: any) => fmtBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>

          </div>
        </Tab>
      </Tabs>

      {/* ── Row Detail Slide-Out Panel ────────────────────────────────────── */}
      <MetadataDetailPanel
        type={detailType}
        value={detailValue}
        timeRange={timeRange}
        onClose={closeDetail}
      />
    </div>
  );
}
