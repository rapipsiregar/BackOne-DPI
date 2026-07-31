"use client";

import { useState, useEffect } from "react";
import { useIntelligenceStats } from "@/lib/api-with-context";
import { 
  useIntelCryptoMining, useIntelTorDetection, useIntelVpnDetection, 
  useIntelIpReputation, useIntelInsecureProtocols, useIntelUnencryptedPasswords, 
  useIntelEncryptionAudit, useIntelDeviceDiscovery, useIntelServerDiscovery 
} from "@/lib/api-advanced";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2, Bitcoin, Shield, Server, Lock, AlertTriangle, Key, Globe, Network, ShieldAlert } from "lucide-react";
import { DeviceDetailModal } from "@/components/ui/DeviceDetailModal";
import { HelpTrigger } from "@/components/help/HelpTrigger";
import { IntelligenceTables } from "./IntelligenceTables";

export default function IntelligencePage() {
  const [mounted, setMounted] = useState(false);
  const { data: stats, isLoading: loadingStats } = useIntelligenceStats();
  const [activeTab, setActiveTab] = useState<string>("Crypto Mining");
  const [selectedDevice, setSelectedDevice] = useState<{ip: string, mac?: string} | null>(null);

  // Advanced data hooks (no hardcoded limits, default to 1,000,000)
  const { data: cryptoMining = [], isLoading: loadingCrypto } = useIntelCryptoMining();
  const { data: torDetection = [], isLoading: loadingTor } = useIntelTorDetection();
  const { data: vpnDetection = [], isLoading: loadingVpn } = useIntelVpnDetection();
  const { data: ipReputation = [], isLoading: loadingIpRep } = useIntelIpReputation();
  const { data: insecureProtocols = [], isLoading: loadingInsecure } = useIntelInsecureProtocols();
  const { data: unencryptedPasswords = [], isLoading: loadingPasswords } = useIntelUnencryptedPasswords();
  const { data: encryptionAudit = [], isLoading: loadingEncryption } = useIntelEncryptionAudit();
  const { data: deviceDiscovery = [], isLoading: loadingDevice } = useIntelDeviceDiscovery();
  const { data: serverDiscovery = [], isLoading: loadingServer } = useIntelServerDiscovery();

  useEffect(() => {
    setMounted(true);
    document.title = "Threat Intelligence | BackOne - Deep Package Inspection";
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Threat Intelligence
            {loadingStats && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          </h2>
          <div className="shrink-0">
            <HelpTrigger pageId="intelligence" />
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Threat feeds, domain reputation, and security intelligence indicators.
        </p>
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
          <IntelligenceTables
            activeTab={activeTab}
            cryptoMining={cryptoMining}
            loadingCrypto={loadingCrypto}
            torDetection={torDetection}
            loadingTor={loadingTor}
            vpnDetection={vpnDetection}
            loadingVpn={loadingVpn}
            ipReputation={ipReputation}
            loadingIpRep={loadingIpRep}
            insecureProtocols={insecureProtocols}
            loadingInsecure={loadingInsecure}
            unencryptedPasswords={unencryptedPasswords}
            loadingPasswords={loadingPasswords}
            encryptionAudit={encryptionAudit}
            loadingEncryption={loadingEncryption}
            deviceDiscovery={deviceDiscovery}
            loadingDevice={loadingDevice}
            serverDiscovery={serverDiscovery}
            loadingServer={loadingServer}
            setSelectedDevice={setSelectedDevice}
          />
        </CardContent>
      </Card>

      {selectedDevice && (
        <DeviceDetailModal
          ip={selectedDevice.ip}
          mac={selectedDevice.mac}
          onClose={() => setSelectedDevice(null)}
        />
      )}
    </div>
  );
}
