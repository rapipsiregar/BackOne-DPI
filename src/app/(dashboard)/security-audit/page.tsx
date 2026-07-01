"use client";

import { useState, useEffect } from "react";
import {
  useTlsVersions,
  useTlsCiphers,
  useTlsSecurity,
  fetchSecurityDevices,
  SecurityDevice,
} from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DeviceDetailModal } from "@/components/ui/DeviceDetailModal";
import { Loader2, ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { fmtBytes } from "@/lib/utils";
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const COLORS = {
  Recommended: "#3fb950",
  Secure: "#58a6ff",
  Weak: "#f0883e",
  Insecure: "#f85149",
};

const RISK_CONFIG = {
  Rawan: { color: "text-red-400", bg: "bg-red-500/20 ring-red-500/40", icon: <ShieldX className="w-3.5 h-3.5" />, dot: "bg-red-500" },
  Sedang: { color: "text-orange-400", bg: "bg-orange-500/20 ring-orange-500/40", icon: <ShieldAlert className="w-3.5 h-3.5" />, dot: "bg-orange-500" },
  Aman: { color: "text-green-400", bg: "bg-green-500/20 ring-green-500/40", icon: <ShieldCheck className="w-3.5 h-3.5" />, dot: "bg-green-500" },
} as const;

export default function SecurityAuditPage() {
  const [mounted, setMounted] = useState(false);
  const versions = useTlsVersions(10);
  const ciphers = useTlsCiphers(20);
  const security = useTlsSecurity(10);

  const [secDevices, setSecDevices] = useState<SecurityDevice[]>([]);
  const [secDevicesLoading, setSecDevicesLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<SecurityDevice | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchSecurityDevices()
      .then(setSecDevices)
      .catch(() => setSecDevices([]))
      .finally(() => setSecDevicesLoading(false));
  }, []);

  if (!mounted) return null;

  const isLoading = versions.isLoading || ciphers.isLoading || security.isLoading;

  // Risk summary counts
  const rawan = secDevices.filter((d) => d.risk_level === "Rawan").length;
  const sedang = secDevices.filter((d) => d.risk_level === "Sedang").length;
  const aman = secDevices.filter((d) => d.risk_level === "Aman").length;

  const versionColumns: Column<typeof versions.data[0]>[] = [
    { header: "#", accessor: (row, i) => i + 1 },
    { header: "TLS Version", accessor: (row) => row.tls_version },
    { header: "Download", accessor: (row) => <span className="text-blue-400">{fmtBytes(row.download)}</span> },
    { header: "Upload", accessor: (row) => <span className="text-green-500">{fmtBytes(row.upload)}</span> },
    { header: "Total Volume", accessor: (row) => <span className="font-medium text-white">{fmtBytes(row.total)}</span> },
  ];

  const cipherColumns: Column<typeof ciphers.data[0]>[] = [
    { header: "#", accessor: (row, i) => i + 1 },
    { header: "Cipher Suite", accessor: (row) => <span className="text-purple-400">{row.tls_cipher}</span> },
    { header: "Download", accessor: (row) => <span className="text-blue-400">{fmtBytes(row.download)}</span> },
    { header: "Upload", accessor: (row) => <span className="text-green-500">{fmtBytes(row.upload)}</span> },
    { header: "Total Volume", accessor: (row) => <span className="font-medium text-white">{fmtBytes(row.total)}</span> },
  ];

  const secDeviceColumns: Column<SecurityDevice>[] = [
    { header: "#", accessor: (_, i) => i + 1 },
    {
      header: "IP Address",
      accessor: (row) => (
        <button
          onClick={() => setSelectedDevice(row)}
          className="font-mono text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 group"
        >
          {row.ip_address}
        </button>
      ),
    },
    {
      header: "Device",
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="text-sm text-white">{row.device_label || row.ip_address}</span>
          {row.device_type && <span className="text-xs text-slate-400">{row.device_type}</span>}
        </div>
      ),
    },
    {
      header: "OS / Manufacturer",
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="text-xs text-blue-400">{row.os_label || "-"}</span>
          <span className="text-xs text-slate-500">{row.manufacturer || ""}</span>
        </div>
      ),
    },
    {
      header: "Encrypted %",
      accessor: (row) => {
        const pct = row.encrypted_pct ?? 0;
        const color = pct >= 80 ? "text-green-400" : pct >= 50 ? "text-orange-400" : "text-red-400";
        const bar = pct >= 80 ? "from-green-500 to-emerald-400" : pct >= 50 ? "from-orange-500 to-yellow-400" : "from-red-500 to-pink-400";
        return (
          <div className="flex flex-col gap-1 min-w-[100px]">
            <span className={`text-sm font-semibold ${color}`}>{pct.toFixed(1)}%</span>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden w-24">
              <div className={`h-full bg-gradient-to-r ${bar} rounded-full`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      header: "Traffic",
      accessor: (row) => (
        <div className="text-xs text-slate-400">
          <span className="text-cyan-400">{fmtBytes(row.encrypted)}</span>
          <span className="text-slate-600"> / </span>
          <span className="text-red-400">{fmtBytes(row.unencrypted)}</span>
        </div>
      ),
    },
    {
      header: "Risk Level",
      accessor: (row) => {
        const cfg = RISK_CONFIG[row.risk_level] ?? RISK_CONFIG.Aman;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${cfg.bg} ${cfg.color}`}>
            {cfg.icon}
            {row.risk_level}
            {row.has_insecure && (
              <span title="Uses insecure protocol">
                <AlertTriangle className="w-3 h-3 text-yellow-400 ml-0.5" />
              </span>
            )}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Security Audit
            {(isLoading || secDevicesLoading) && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">TLS encryption analysis and device-level risk assessment.</p>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {security.data.map((item) => (
          <Card key={item.tls_security} className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.tls_security} Connections
              </CardTitle>
              {item.tls_security === "Recommended" && <ShieldCheck className="h-4 w-4 text-green-500" />}
              {item.tls_security === "Secure" && <ShieldCheck className="h-4 w-4 text-blue-500" />}
              {item.tls_security === "Weak" && <ShieldAlert className="h-4 w-4 text-orange-500" />}
              {item.tls_security === "Insecure" && <ShieldX className="h-4 w-4 text-red-500" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{fmtBytes(item.total)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Device Risk Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-red-950/20 border-red-500/20 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-300">Rawan (Vulnerable)</CardTitle>
            <ShieldX className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">{rawan}</div>
            <p className="text-xs text-red-300/60 mt-1">device{rawan !== 1 ? "s" : ""} at risk</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-950/20 border-orange-500/20 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-300">Sedang (Moderate)</CardTitle>
            <ShieldAlert className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-400">{sedang}</div>
            <p className="text-xs text-orange-300/60 mt-1">device{sedang !== 1 ? "s" : ""} moderate risk</p>
          </CardContent>
        </Card>
        <Card className="bg-green-950/20 border-green-500/20 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-300">Aman (Secure)</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{aman}</div>
            <p className="text-xs text-green-300/60 mt-1">device{aman !== 1 ? "s" : ""} secure</p>
          </CardContent>
        </Card>
      </div>

      {/* Device Risk Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            Device Risk Assessment
            {secDevicesLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            <span className="ml-auto text-xs text-slate-400 font-normal flex items-center gap-1">
              <Info className="w-3 h-3" />
              Based on encryption audit data. Click IP to inspect device.
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {secDevices.length === 0 && !secDevicesLoading ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No encryption audit data available yet. The scheduler will populate this table automatically.
            </div>
          ) : (
            <DataTable
              data={secDevices}
              columns={secDeviceColumns}
              searchPlaceholder="Search by IP, device type, OS..."
              searchFilter={(row, query) => {
                const q = query.toLowerCase();
                return (
                  (row.ip_address || "").toLowerCase().includes(q) ||
                  (row.device_label || "").toLowerCase().includes(q) ||
                  (row.device_type || "").toLowerCase().includes(q) ||
                  (row.os_label || "").toLowerCase().includes(q) ||
                  (row.risk_level || "").toLowerCase().includes(q)
                );
              }}
            />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* TLS Security Pie Chart */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-white">Security Level Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={security.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="total"
                    nameKey="tls_security"
                  >
                    {security.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.tls_security as keyof typeof COLORS] || "#8884d8"} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "#161b22", borderColor: "#30363d", color: "#c9d1d9" }}
                    formatter={(value: any) => [fmtBytes(value as number), "Volume"]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col justify-center ml-4 space-y-2">
                {security.data.map((entry, index) => (
                  <div key={`${entry.tls_security}-${index}`} className="flex items-center text-xs text-muted-foreground whitespace-nowrap">
                    <div
                      className="w-3 h-3 rounded-full mr-2 shrink-0"
                      style={{ backgroundColor: COLORS[entry.tls_security as keyof typeof COLORS] || "#8884d8" }}
                    />
                    <span>{entry.tls_security}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TLS Versions Bar Chart */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-white">TLS Versions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={versions.data} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                  <XAxis dataKey="tls_version" stroke="#8b949e" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#8b949e"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      const gb = value / 1073741824;
                      const mb = value / 1048576;
                      return gb >= 1 ? `${gb.toFixed(1)}GB` : `${mb.toFixed(0)}MB`;
                    }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "#21262d" }}
                    contentStyle={{ backgroundColor: "#161b22", borderColor: "#30363d", color: "#c9d1d9" }}
                    formatter={(value: any) => [fmtBytes(value as number), "Volume"]}
                  />
                  <Bar dataKey="total" fill="#bc8cff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* TLS Versions Table */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-white">TLS Versions Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={versions.data}
              columns={versionColumns}
              searchPlaceholder="Search versions..."
              searchFilter={(row, query) => (row.tls_version || "").toLowerCase().includes(query.toLowerCase())}
            />
          </CardContent>
        </Card>

        {/* TLS Ciphers Table */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-white">Top TLS Cipher Suites</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={ciphers.data}
              columns={cipherColumns}
              searchPlaceholder="Search ciphers..."
              searchFilter={(row, query) => (row.tls_cipher || "").toLowerCase().includes(query.toLowerCase())}
            />
          </CardContent>
        </Card>
      </div>

      {/* Device Detail Modal */}
      {selectedDevice && (
        <DeviceDetailModal
          ip={selectedDevice.ip_address}
          deviceLabel={selectedDevice.device_label}
          macAddress={selectedDevice.mac_address}
          onClose={() => setSelectedDevice(null)}
        />
      )}
    </div>
  );
}
