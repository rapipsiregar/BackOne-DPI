"use client";

import { useState, useEffect } from "react";
import { useIntelligenceStats } from "@/lib/api-with-context";
import { 
  useIntelCryptoMining, useIntelTorDetection, useIntelVpnDetection, 
  useIntelIpReputation, useIntelInsecureProtocols, useIntelUnencryptedPasswords, 
  useIntelEncryptionAudit, useIntelDeviceDiscovery, useIntelServerDiscovery 
} from "@/lib/api-advanced";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, Column } from "@/components/ui/DataTable";
import { IpDetails } from "@/components/ui/IpDetails";
import { Loader2, Bitcoin, Shield, Server, Lock, AlertTriangle, Key, Globe, Network, ShieldAlert } from "lucide-react";

export default function IntelligencePage() {
  const [mounted, setMounted] = useState(false);
  const { data: stats, isLoading: loadingStats } = useIntelligenceStats();
  const [activeTab, setActiveTab] = useState<string>("Crypto Mining");

  // Advanced data hooks
  const { data: cryptoMining, isLoading: loadingCrypto } = useIntelCryptoMining(20);
  const { data: torDetection, isLoading: loadingTor } = useIntelTorDetection(20);
  const { data: vpnDetection, isLoading: loadingVpn } = useIntelVpnDetection(20);
  const { data: ipReputation, isLoading: loadingIpRep } = useIntelIpReputation(20);
  const { data: insecureProtocols, isLoading: loadingInsecure } = useIntelInsecureProtocols(20);
  const { data: unencryptedPasswords, isLoading: loadingPasswords } = useIntelUnencryptedPasswords(20);
  const { data: encryptionAudit, isLoading: loadingEncryption } = useIntelEncryptionAudit(20);
  const { data: deviceDiscovery, isLoading: loadingDevice } = useIntelDeviceDiscovery(20);
  const { data: serverDiscovery, isLoading: loadingServer } = useIntelServerDiscovery(20);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const intelItems = [
    {
      title: "Crypto Mining",
      value: stats?.intel_crypto_mining || 0,
      icon: <Bitcoin className="h-5 w-5 text-yellow-500" />,
      description: "Devices actively mining cryptocurrency"
    },
    {
      title: "Tor Detection",
      value: stats?.intel_tor_detection || 0,
      icon: <Globe className="h-5 w-5 text-purple-500" />,
      description: "Connections using the Tor network"
    },
    {
      title: "VPN Detection",
      value: stats?.intel_vpn_detection || 0,
      icon: <Shield className="h-5 w-5 text-blue-500" />,
      description: "Active Virtual Private Network tunnels"
    },
    {
      title: "IP Reputation",
      value: stats?.intel_ip_reputation || 0,
      icon: <ShieldAlert className="h-5 w-5 text-red-500" />,
      description: "Connections to malicious IP addresses"
    },
    {
      title: "Insecure Protocols",
      value: stats?.intel_insecure_protocols || 0,
      icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
      description: "Legacy clear-text protocols"
    },
    {
      title: "Unencrypted Passwords",
      value: stats?.intel_unencrypted_passwords || 0,
      icon: <Key className="h-5 w-5 text-red-400" />,
      description: "Credentials transmitted in plain text"
    },
    {
      title: "Encryption Audit",
      value: stats?.intel_encryption_audit || 0,
      icon: <Lock className="h-5 w-5 text-green-500" />,
      description: "Encrypted connections audited"
    },
    {
      title: "Device Discovery",
      value: stats?.intel_device_discovery || 0,
      icon: <Network className="h-5 w-5 text-cyan-500" />,
      description: "Unique client devices identified"
    },
    {
      title: "Server Discovery",
      value: stats?.intel_server_discovery || 0,
      icon: <Server className="h-5 w-5 text-gray-400" />,
      description: "Local servers running services"
    }
  ];

  const renderActiveTable = () => {
    switch(activeTab) {
      case "Crypto Mining":
        return (
          <DataTable 
            data={cryptoMining} isLoading={loadingCrypto}
            columns={[
              { header: "IP Address", accessor: (row: any) => row.ip_address },
              { header: "MAC Address", accessor: (row: any) => row.mac_address },
              { header: "Pool Host", accessor: (row: any) => row.pool_host },
              { header: "App", accessor: (row: any) => row.app_label },
              { header: "Confidence", accessor: (row: any) => row.confidence },
            ]}
          />
        );
      case "Tor Detection":
        return (
          <DataTable 
            data={torDetection} isLoading={loadingTor}
            columns={[
              { header: "IP Address", accessor: (row: any) => row.ip_address },
              { header: "Exit Node", accessor: (row: any) => row.exit_node },
              { header: "Country", accessor: (row: any) => row.country },
            ]}
          />
        );
      case "VPN Detection":
        return (
          <DataTable 
            data={vpnDetection} isLoading={loadingVpn}
            columns={[
              { header: "IP Address", accessor: (row: any) => row.ip_address },
              { header: "VPN Type", accessor: (row: any) => row.vpn_type },
              {
                header: "Remote IP",
                accessor: (row: any) => row.remote_ip ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs text-blue-400">{row.remote_ip}</span>
                    <IpDetails ip={row.remote_ip} />
                  </div>
                ) : "—"
              },
              { header: "Country", accessor: (row: any) => row.country },
            ]}
          />
        );
      case "IP Reputation":
        return (
          <DataTable 
            data={ipReputation} isLoading={loadingIpRep}
            columns={[
              {
                header: "IP Address",
                accessor: (row: any) => row.ip_address ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs text-blue-400">{row.ip_address}</span>
                    <IpDetails ip={row.ip_address} />
                  </div>
                ) : "—"
              },
              { header: "Reputation", accessor: (row: any) => row.reputation },
              { header: "App", accessor: (row: any) => row.app_label },
              { header: "Country", accessor: (row: any) => row.country },
            ]}
          />
        );
      case "Insecure Protocols":
        return (
          <DataTable 
            data={insecureProtocols} isLoading={loadingInsecure}
            columns={[
              { header: "Protocol", accessor: (row: any) => row.protocol },
              { header: "IP Address", accessor: (row: any) => row.ip_address },
              { header: "Risk", accessor: (row: any) => row.risk },
            ]}
          />
        );
      case "Unencrypted Passwords":
        return (
          <DataTable 
            data={unencryptedPasswords} isLoading={loadingPasswords}
            columns={[
              { header: "Protocol", accessor: (row: any) => row.protocol },
              { header: "IP Address", accessor: (row: any) => row.ip_address },
              { header: "Severity", accessor: (row: any) => row.severity },
            ]}
          />
        );
      case "Encryption Audit":
        return (
          <DataTable 
            data={encryptionAudit} isLoading={loadingEncryption}
            columns={[
              { header: "IP Address", accessor: (row: any) => row.ip_address },
              { header: "Encrypted %", accessor: (row) => `${row.encrypted_pct}%` },
              { header: "Risk Level", accessor: (row: any) => row.risk_level },
            ]}
          />
        );
      case "Device Discovery":
        return (
          <DataTable 
            data={deviceDiscovery} isLoading={loadingDevice}
            columns={[
              { header: "IP Address", accessor: (row: any) => row.ip_address },
              { header: "Device Type", accessor: (row: any) => row.device_type },
              { header: "OS", accessor: (row: any) => row.os_label },
              { header: "Manufacturer", accessor: (row: any) => row.manufacturer },
            ]}
          />
        );
      case "Server Discovery":
        return (
          <DataTable 
            data={serverDiscovery} isLoading={loadingServer}
            columns={[
              {
                header: "IP Address",
                accessor: (row: any) => row.ip_address ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs text-blue-400">{row.ip_address}</span>
                    <IpDetails ip={row.ip_address} />
                  </div>
                ) : "—"
              },
              { header: "Server Type", accessor: (row: any) => row.server_type },
              { header: "Port", accessor: (row: any) => row.port },
              { header: "OS", accessor: (row: any) => row.os_label },
            ]}
          />
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
<div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Threat Intelligence Feeds
            {loadingStats && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          </h2>
      </div>
      

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {intelItems.map((item, idx) => {
          const isActive = activeTab === item.title;
          return (
            <Card 
              key={idx} 
              onClick={() => setActiveTab(item.title)}
              className={`
                bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all cursor-pointer
                ${isActive ? 'ring-2 ring-primary border-transparent' : ''}
              `}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">{item.title}</CardTitle>
                {item.icon}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">
                  {item.value.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Report: {activeTab}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderActiveTable()}
        </CardContent>
      </Card>
    </div>
  );
}
