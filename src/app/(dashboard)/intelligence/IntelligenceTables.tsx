"use client";

import React from "react";
import { DataTable } from "@/components/ui/DataTable";
import { IpDetails } from "@/components/ui/IpDetails";
import { EncryptionAuditTable } from "./EncryptionAuditTable";
import { DeviceDiscoveryTable } from "./DeviceDiscoveryTable";
import { ServerDiscoveryTable } from "./ServerDiscoveryTable";

interface IntelligenceTablesProps {
  activeTab: string;
  cryptoMining: any[];
  loadingCrypto: boolean;
  torDetection: any[];
  loadingTor: boolean;
  vpnDetection: any[];
  loadingVpn: boolean;
  ipReputation: any[];
  loadingIpRep: boolean;
  insecureProtocols: any[];
  loadingInsecure: boolean;
  unencryptedPasswords: any[];
  loadingPasswords: boolean;
  encryptionAudit: any[];
  loadingEncryption: boolean;
  deviceDiscovery: any[];
  loadingDevice: boolean;
  serverDiscovery: any[];
  loadingServer: boolean;
  setSelectedDevice: (device: { ip: string; mac?: string } | null) => void;
}

export function IntelligenceTables({
  activeTab,
  cryptoMining, loadingCrypto,
  torDetection, loadingTor,
  vpnDetection, loadingVpn,
  ipReputation, loadingIpRep,
  insecureProtocols, loadingInsecure,
  unencryptedPasswords, loadingPasswords,
  encryptionAudit, loadingEncryption,
  deviceDiscovery, loadingDevice,
  serverDiscovery, loadingServer,
  setSelectedDevice
}: IntelligenceTablesProps) {
  switch (activeTab) {
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
        <EncryptionAuditTable 
          data={encryptionAudit} isLoading={loadingEncryption} 
          setSelectedDevice={setSelectedDevice} 
        />
      );
    case "Device Discovery":
      return (
        <DeviceDiscoveryTable 
          data={deviceDiscovery} isLoading={loadingDevice} 
          setSelectedDevice={setSelectedDevice} 
        />
      );
    case "Server Discovery":
      return (
        <ServerDiscoveryTable 
          data={serverDiscovery} isLoading={loadingServer} 
          setSelectedDevice={setSelectedDevice} 
        />
      );
    default:
      return null;
  }
}
