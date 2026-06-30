"use client";

import { useState, useEffect } from "react";
import { useTlsVersions, useTlsCiphers, useTlsSecurity } from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { fmtBytes } from "@/lib/utils";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = {
  Recommended: "#3fb950",
  Secure: "#58a6ff",
  Weak: "#f0883e",
  Insecure: "#f85149"
};

export default function SecurityAuditPage() {
  const [mounted, setMounted] = useState(false);
  const versions = useTlsVersions(10);
  const ciphers = useTlsCiphers(20);
  const security = useTlsSecurity(10);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isLoading = versions.isLoading || ciphers.isLoading || security.isLoading;

  const versionColumns: Column<typeof versions.data[0]>[] = [
    { header: "#", accessor: (row, i) => i + 1 },
    { header: "TLS Version", accessor: (row) => row.tls_version },
    { header: "Download", accessor: (row) => <span className="text-blue-400">{fmtBytes(row.download)}</span> },
    { header: "Upload", accessor: (row) => <span className="text-green-500">{fmtBytes(row.upload)}</span> },
    { header: "Total Volume", accessor: (row) => <span className="font-medium text-white">{fmtBytes(row.total)}</span> }
  ];

  const cipherColumns: Column<typeof ciphers.data[0]>[] = [
    { header: "#", accessor: (row, i) => i + 1 },
    { header: "Cipher Suite", accessor: (row) => <span className="text-purple-400">{row.tls_cipher}</span> },
    { header: "Download", accessor: (row) => <span className="text-blue-400">{fmtBytes(row.download)}</span> },
    { header: "Upload", accessor: (row) => <span className="text-green-500">{fmtBytes(row.upload)}</span> },
    { header: "Total Volume", accessor: (row) => <span className="font-medium text-white">{fmtBytes(row.total)}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          Security Audit (TLS)
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
        </h2>
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
              <div className="text-2xl font-bold text-white">
                {fmtBytes(item.total)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
                    contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9' }}
                    formatter={(value: any) => [fmtBytes(value as number), 'Volume']}
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
                    cursor={{fill: '#21262d'}}
                    contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9' }}
                    formatter={(value: any) => [fmtBytes(value as number), 'Volume']}
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
    </div>
  );
}
