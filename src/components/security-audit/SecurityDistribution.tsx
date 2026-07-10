// src/components/security-audit/SecurityDistribution.tsx
"use client";

import { TlsSecurityStat } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { fmtBytes } from "@/lib/utils";

const COLORS = {
  Recommended: "#3fb950",
  Secure: "#58a6ff",
  Weak: "#f0883e",
  Insecure: "#f85149",
};

interface Props {
  securityData: TlsSecurityStat[];
}

export default function SecurityDistribution({ securityData }: Props) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="text-white">Security Level Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={securityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="total"
                nameKey="tls_security"
              >
                {securityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.tls_security as keyof typeof COLORS] || "#8884d8"} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{ backgroundColor: "#161b22", borderColor: "#30363d", color: "#c9d1d9" }}
                formatter={(value: any) => [fmtBytes(value as number), "Volume"]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col justify-center ml-4 space-y-3">
            {securityData.map((entry, index) => {
              const TLS_VER: Record<string, string> = {
                Recommended: "TLS 1.3",
                Secure: "TLS 1.2",
                Weak: "TLS 1.0 / 1.1",
                Insecure: "SSL 2.0 / 3.0",
              };
              const dotColor = COLORS[entry.tls_security as keyof typeof COLORS] || "#8884d8";
              return (
                <div key={`${entry.tls_security}-${index}`} className="flex items-start gap-2 whitespace-nowrap">
                  <div className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: dotColor }} />
                  <div className="flex flex-col">
                    <span className="text-xs text-white font-medium">{entry.tls_security}</span>
                    <span className="text-[10px] font-mono" style={{ color: dotColor }}>{TLS_VER[entry.tls_security] || ""}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
