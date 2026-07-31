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
import { UniversalFilters, useUniversalFilterState, FilterConfig } from "@/components/ui/UniversalFilters";
import { HelpTrigger } from "@/components/help/HelpTrigger";

export default function SecurityAuditPage() {
  const [mounted, setMounted] = useState(false);
  const versions = useTlsVersions();
  const ciphers = useTlsCiphers();
  const security = useTlsSecurity();

  const [secDevices, setSecDevices] = useState<SecurityDevice[]>([]);
  const [secDevicesLoading, setSecDevicesLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchSecurityDevices()
      .then(setSecDevices)
      .catch(() => setSecDevices([]))
      .finally(() => setSecDevicesLoading(false));
  }, []);

  const { 
    filters,
    handleFilterChange,
    handleReset, activeCount 
  } = useUniversalFilterState();

  if (!mounted) return null;

  const filterConfigs: FilterConfig[] = [
    { id: "risk_level", label: "Risk Level", type: "select", value: filters.risk_level, options: ["Vulnerable", "Moderate", "Safe"] },
  ];

  const filteredDevices = secDevices.filter((d) => {
    if (filters.risk_level && filters.risk_level !== "All" && d.risk_level !== filters.risk_level) return false;
    return true;
  });

  // Risk summary counts
  const vulnerableCount = filteredDevices.filter((d) => d.risk_level === "Vulnerable").length;
  const moderateCount = filteredDevices.filter((d) => d.risk_level === "Moderate").length;
  const safeCount = filteredDevices.filter((d) => d.risk_level === "Safe").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-white">Security & Encryption Audit</h2>
          <div className="shrink-0">
            <HelpTrigger pageId="events" />
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Monitor TLS versions distribution, cipher suites, active certificate properties, and device risk profiles.
        </p>
      </div>

      <UniversalFilters
        filters={filterConfigs}
        onChange={handleFilterChange}
        showDateRange={false}
        activeFilterCount={activeCount}
        onReset={handleReset}
      />

      {/* Risk Summary Cards */}
      <RiskSummaryCards
        vulnerableCount={vulnerableCount}
        moderateCount={moderateCount}
        safeCount={safeCount}
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

      {/* Device Risk Table */}
      <DeviceRiskTable
        secDevices={filteredDevices}
        secDevicesLoading={secDevicesLoading}
      />
    </div>
  );
}
