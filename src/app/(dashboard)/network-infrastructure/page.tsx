"use client";

import { useState, useEffect } from "react";
import { Tabs, Tab } from "@/components/ui/Tabs";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { 
  useRegions, useCities, useVlans, useInterfaces, 
  useIpVersions, useRemoteIps, useMacBandwidth, 
  useFlowTypes, useFlowOrigins 
} from "@/lib/api-advanced";
import { IpDetails } from "@/components/ui/IpDetails";
import { RemoteIpDetailModal } from "@/components/ui/RemoteIpDetailModal";
import { HelpTrigger } from "@/components/help/HelpTrigger";

export default function NetworkInfrastructurePage() {
  const [selectedRemoteIp, setSelectedRemoteIp] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Network Topology | BackOne - Deep Package Inspection";
  }, []);

  // Routing & Geography Tab
  const { data: regions, isLoading: loadingRegions } = useRegions();
  const { data: cities, isLoading: loadingCities } = useCities();

  // Interfaces & VLANs Tab
  const { data: interfaces, isLoading: loadingInterfaces } = useInterfaces();
  const { data: vlans, isLoading: loadingVlans } = useVlans();

  // IP & MAC Tab
  const { data: remoteIps, isLoading: loadingRemoteIps } = useRemoteIps();
  const { data: ipVersions, isLoading: loadingIpVersions } = useIpVersions();
  const { data: macBandwidth, isLoading: loadingMacBandwidth } = useMacBandwidth();

  // Flow Profiles Tab
  const { data: flowTypes, isLoading: loadingFlowTypes } = useFlowTypes();
  const { data: flowOrigins, isLoading: loadingFlowOrigins } = useFlowOrigins();

  const formatBytes = (bytes: number) => {
    if (bytes === 0 || !bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Network Topology</h1>
          <p className="text-slate-400 mt-2">Physical, logical, and geographic network topologies.</p>
        </div>
        <HelpTrigger pageId="network-infrastructure" />
      </div>

      <Tabs>
        <Tab label="Routing & Geography">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Regions</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={regions} 
                  isLoading={loadingRegions}
                  columns={[
                    { header: "Region", accessor: (row: any) => <span title={row.region_name}>{row.region_name}</span> },
                    { header: "Country", accessor: (row: any) => <span title={row.country_name}>{row.country_name}</span> },
                    { header: "Download", accessor: (row) => formatBytes(row.download) },
                  ]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Cities</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={cities} 
                  isLoading={loadingCities}
                  columns={[
                    { header: "City", accessor: (row: any) => <span title={row.city_name}>{row.city_name}</span> },
                    { header: "Region", accessor: (row: any) => <span title={row.region_name}>{row.region_name}</span> },
                    { header: "Country", accessor: (row: any) => <span title={row.country_name}>{row.country_name}</span> },
                    { header: "Download", accessor: (row) => formatBytes(row.download) },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
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
                    { header: "Download", accessor: (row) => formatBytes(row.download) },
                    { header: "Upload", accessor: (row) => formatBytes(row.upload) },
                    { header: "Total", accessor: (row) => formatBytes(row.total) },
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
                    { header: "Download", accessor: (row) => formatBytes(row.download) },
                    { header: "Upload", accessor: (row) => formatBytes(row.upload) },
                    { header: "Total", accessor: (row) => formatBytes(row.total) },
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
                      { header: "Download", accessor: (row) => formatBytes(row.download) },
                      { header: "Upload", accessor: (row) => formatBytes(row.upload) },
                      { header: "Total", accessor: (row) => formatBytes(row.total) },
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
                      { header: "Total Traffic", accessor: (row) => formatBytes(row.total) },
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
                      { header: "Total", accessor: (row) => formatBytes(row.total) },
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
                    { header: "Download", accessor: (row) => formatBytes(row.download) },
                    { header: "Upload", accessor: (row) => formatBytes(row.upload) },
                    { header: "Total", accessor: (row) => formatBytes(row.total) },
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
                    { header: "Download", accessor: (row) => formatBytes(row.download) },
                    { header: "Upload", accessor: (row) => formatBytes(row.upload) },
                    { header: "Total", accessor: (row) => formatBytes(row.total) },
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
