"use client";

import { useState, useEffect } from "react";
import { Tabs, Tab } from "@/components/ui/Tabs";
import { DataTable } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { 
  useVlans, useInterfaces, 
  useIpVersions, useRemoteIps, useMacBandwidth, 
  useFlowTypes, useFlowOrigins 
} from "@/lib/api-advanced";
import { IpDetails } from "@/components/ui/IpDetails";
import { RemoteIpDetailModal } from "@/components/ui/RemoteIpDetailModal";
import { HelpTrigger } from "@/components/help/HelpTrigger";
import { RoutingGeoTab } from "@/components/network/RoutingGeoTab";
import { fmtBytes } from "@/lib/utils";

export default function NetworkInfrastructurePage() {
  const [selectedRemoteIp, setSelectedRemoteIp] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Network Topology | BackOne - Deep Package Inspection";
  }, []);

  const { data: interfaces, isLoading: loadingInterfaces } = useInterfaces();
  const { data: vlans, isLoading: loadingVlans } = useVlans();

  const { data: remoteIps, isLoading: loadingRemoteIps } = useRemoteIps();
  const { data: ipVersions, isLoading: loadingIpVersions } = useIpVersions();
  const { data: macBandwidth, isLoading: loadingMacBandwidth } = useMacBandwidth();

  const { data: flowTypes, isLoading: loadingFlowTypes } = useFlowTypes();
  const { data: flowOrigins, isLoading: loadingFlowOrigins } = useFlowOrigins();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-4 w-full">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight truncate">Network Topology</h1>
            <div className="flex items-center gap-1.5 flex-shrink-0 sm:hidden">
              <HelpTrigger pageId="network-infrastructure" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-normal sm:leading-relaxed">Physical, logical, and geographic network topologies.</p>
        </div>

        <div className="hidden sm:flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <HelpTrigger pageId="network-infrastructure" />
        </div>
      </div>

      <Tabs>
        <Tab label="Routing & Geography">
          <RoutingGeoTab />
        </Tab>

        <Tab label="Interfaces & VLANs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Network Interfaces</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={interfaces} 
                  isLoading={loadingInterfaces}
                  columns={[
                    { header: "Interface", accessor: (row: any) => row.iface_name },
                    { header: "Role", accessor: (row: any) => row.iface_role },
                    { header: "Download", accessor: (row) => fmtBytes(row.download) },
                    { header: "Upload", accessor: (row) => fmtBytes(row.upload) },
                    { header: "Total", accessor: (row) => fmtBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>VLANs</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={vlans} 
                  isLoading={loadingVlans}
                  columns={[
                    { header: "VLAN ID", accessor: (row: any) => row.vlan_id },
                    { header: "Label", accessor: (row: any) => row.vlan_label },
                    { header: "Download", accessor: (row) => fmtBytes(row.download) },
                    { header: "Upload", accessor: (row) => fmtBytes(row.upload) },
                    { header: "Total", accessor: (row) => fmtBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </Tab>

        <Tab label="IP & MAC Properties">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top Remote IPs</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable 
                    data={remoteIps} 
                    isLoading={loadingRemoteIps}
                    onRowClick={(row) => setSelectedRemoteIp(row.remote_ip)}
                    columns={[
                      {
                        header: "IP Address",
                        accessor: (row: any) => row.remote_ip ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-xs text-blue-400">{row.remote_ip}</span>
                            <IpDetails ip={row.remote_ip} />
                          </div>
                        ) : "—"
                      },
                      { header: "IP Version", accessor: (row) => `IPv${row.ip_version}` },
                      { header: "Download", accessor: (row) => fmtBytes(row.download) },
                      { header: "Upload", accessor: (row) => fmtBytes(row.upload) },
                      { header: "Total", accessor: (row) => fmtBytes(row.total) },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>IP Versions</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable 
                    data={ipVersions} 
                    isLoading={loadingIpVersions}
                    columns={[
                      { header: "Version", accessor: (row: any) => row.ip_version_label },
                      { header: "Total Traffic", accessor: (row) => fmtBytes(row.total) },
                    ]}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>MAC Bandwidth</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable 
                    data={macBandwidth} 
                    isLoading={loadingMacBandwidth}
                    columns={[
                      { header: "MAC Address", accessor: (row: any) => <span title={row.mac_address}>{row.mac_address}</span> },
                      { header: "Manufacturer", accessor: (row: any) => <span title={row.manufacturer}>{row.manufacturer}</span> },
                      { header: "Total", accessor: (row) => fmtBytes(row.total) },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </Tab>

        <Tab label="Flow Profiles">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Flow Types</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={flowTypes} 
                  isLoading={loadingFlowTypes}
                  columns={[
                    { header: "Flow Type", accessor: (row: any) => row.flow_type_label },
                    { header: "Download", accessor: (row) => fmtBytes(row.download) },
                    { header: "Upload", accessor: (row) => fmtBytes(row.upload) },
                    { header: "Total", accessor: (row) => fmtBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Flow Origins</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={flowOrigins} 
                  isLoading={loadingFlowOrigins}
                  columns={[
                    { header: "Origin", accessor: (row: any) => row.flow_origin_label },
                    { header: "Download", accessor: (row) => fmtBytes(row.download) },
                    { header: "Upload", accessor: (row) => fmtBytes(row.upload) },
                    { header: "Total", accessor: (row) => fmtBytes(row.total) },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </Tab>
      </Tabs>
      
      {selectedRemoteIp && (
        <RemoteIpDetailModal 
          ip={selectedRemoteIp} 
          onClose={() => setSelectedRemoteIp(null)} 
        />
      )}
    </div>
  );
}
