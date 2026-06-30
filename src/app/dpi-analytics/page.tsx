"use client";

import { useState } from "react";
import { Tabs, Tab } from "@/components/ui/Tabs";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { 
  useNetbios, useDiscoveryOs, useDhcpFingerprints, 
  useHttpUserAgents, useSniHostnames, useSslServerCn, 
  useQuicHostnames, useBittorrentHashes, useSshVersions, 
  useMdnsHostnames 
} from "@/lib/api-advanced";

export default function DpiAnalyticsPage() {
  // Hostnames & Servers Tab
  const { data: sniHostnames, isLoading: loadingSni } = useSniHostnames(20);
  const { data: sslServerCn, isLoading: loadingSslCn } = useSslServerCn(20);
  const { data: quicHostnames, isLoading: loadingQuic } = useQuicHostnames(20);
  const { data: netbios, isLoading: loadingNetbios } = useNetbios(20);
  const { data: mdnsHostnames, isLoading: loadingMdns } = useMdnsHostnames(20);

  // Client Fingerprints Tab
  const { data: discoveryOs, isLoading: loadingOs } = useDiscoveryOs(20);
  const { data: dhcpFingerprints, isLoading: loadingDhcp } = useDhcpFingerprints(20);
  const { data: httpUserAgents, isLoading: loadingHttpUa } = useHttpUserAgents(20);

  // Specific Protocols Tab
  const { data: sshVersions, isLoading: loadingSsh } = useSshVersions(20);
  const { data: bittorrentHashes, isLoading: loadingBittorrent } = useBittorrentHashes(20);

  const formatBytes = (bytes: number) => {
    if (bytes === 0 || !bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">DPI Analytics</h1>
        <p className="text-slate-400 mt-2">Deep Packet Inspection metadata and fingerprinting.</p>
      </div>

      <Tabs>
        <Tab label="Hostnames & Servers">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>SNI Hostnames (TLS)</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={sniHostnames} 
                  isLoading={loadingSni}
                  columns={[
                    { header: "Hostname", accessor: (row: any) => row.sni_hostname },
                    { header: "Total", accessor: (row) => formatBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>SSL Server Common Names</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={sslServerCn} 
                  isLoading={loadingSslCn}
                  columns={[
                    { header: "Common Name", accessor: (row: any) => row.ssl_server_cn },
                    { header: "Total", accessor: (row) => formatBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>QUIC Hostnames</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={quicHostnames} 
                  isLoading={loadingQuic}
                  columns={[
                    { header: "Hostname", accessor: (row: any) => row.quic_hostname },
                    { header: "Total", accessor: (row) => formatBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>NetBIOS Hostnames</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={netbios} 
                  isLoading={loadingNetbios}
                  columns={[
                    { header: "Hostname", accessor: (row: any) => row.hostname },
                    { header: "Total", accessor: (row) => formatBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>mDNS Hostnames</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={mdnsHostnames} 
                  isLoading={loadingMdns}
                  columns={[
                    { header: "Hostname", accessor: (row: any) => row.mdns_hostname },
                    { header: "Total", accessor: (row) => formatBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </Tab>

        <Tab label="Client Fingerprints">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Operating Systems Discovery</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={discoveryOs} 
                  isLoading={loadingOs}
                  columns={[
                    { header: "Operating System", accessor: (row: any) => row.os_label },
                    { header: "Download", accessor: (row) => formatBytes(row.download) },
                    { header: "Upload", accessor: (row) => formatBytes(row.upload) },
                    { header: "Total", accessor: (row) => formatBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>DHCP Fingerprints</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={dhcpFingerprints} 
                  isLoading={loadingDhcp}
                  columns={[
                    { header: "Fingerprint", accessor: (row: any) => row.fingerprint },
                    { header: "Total", accessor: (row) => formatBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>HTTP User Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={httpUserAgents} 
                  isLoading={loadingHttpUa}
                  columns={[
                    { header: "User Agent", accessor: (row: any) => row.user_agent },
                    { header: "Total", accessor: (row) => formatBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </Tab>

        <Tab label="Specific Protocols">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>SSH Versions</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={sshVersions} 
                  isLoading={loadingSsh}
                  columns={[
                    { header: "SSH Version", accessor: (row: any) => row.ssh_version },
                    { header: "Total", accessor: (row) => formatBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>BitTorrent Hashes</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={bittorrentHashes} 
                  isLoading={loadingBittorrent}
                  columns={[
                    { header: "Label", accessor: (row: any) => row.label },
                    { header: "Info Hash", accessor: (row: any) => row.info_hash },
                    { header: "Total", accessor: (row) => formatBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
