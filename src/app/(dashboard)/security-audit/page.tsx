// src/app/(dashboard)/security-audit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { fetchSecurityDevices, SecurityDevice } from "@/lib/api";
import { useTlsVersions, useTlsCiphers, useTlsSecurity } from "@/lib/api-with-context";
import RiskSummaryCards from "@/components/security-audit/RiskSummaryCards";
import DeviceRiskTable from "@/components/security-audit/DeviceRiskTable";
import SecurityDistribution from "@/components/security-audit/SecurityDistribution";
import TlsVersionsChart from "@/components/security-audit/TlsVersionsChart";
import TlsTables from "@/components/security-audit/TlsTables";
import SslSanTable from "@/components/security-audit/SslSanTable";

export default function SecurityAuditPage() {
  const [mounted, setMounted] = useState(false);
  const versions = useTlsVersions(10);
  const ciphers = useTlsCiphers(20);
  const security = useTlsSecurity(10);

  const [secDevices, setSecDevices] = useState<SecurityDevice[]>([]);
  const [secDevicesLoading, setSecDevicesLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchSecurityDevices()
      .then(setSecDevices)
      .catch(() => setSecDevices([]))
      .finally(() => setSecDevicesLoading(false));
  }, []);

  if (!mounted) return null;

  // Risk summary counts
  const vulnerableCount = secDevices.filter((d) => d.risk_level === "Vulnerable").length;
  const moderateCount = secDevices.filter((d) => d.risk_level === "Moderate").length;
  const safeCount = secDevices.filter((d) => d.risk_level === "Safe").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Security & Encryption Audit</h2>
        <p className="text-sm text-slate-400 mt-1">
          Monitor TLS versions distribution, cipher suites, active certificate properties, and device risk profiles.
        </p>
      </div>

      {/* Risk Summary Cards */}
      <RiskSummaryCards
        vulnerableCount={vulnerableCount}
        moderateCount={moderateCount}
        safeCount={safeCount}
      />

      {/* Device Risk Table */}
      <DeviceRiskTable
        secDevices={secDevices}
        secDevicesLoading={secDevicesLoading}
      />

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <SecurityDistribution securityData={security.data} />
        <TlsVersionsChart versionsData={versions.data} />
      </div>

      {/* TLS Versions and Ciphers Overview tables */}
      <TlsTables
        versionsData={versions.data}
        ciphersData={ciphers.data}
      />

      {/* SSL/TLS Subject Alternative Names Table */}
      <SslSanTable />
    </div>
  );
}
