// src/components/security-audit/TlsVersionsChart.tsx
"use client";

import { TlsVersionStat } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { fmtBytes } from "@/lib/utils";

const VERSION_COLORS: Record<string, string> = {
  "TLS 1.3":       "#3fb950",
  "TLS 1.3 - Fizz":"#56d364",
  "TLS 1.2":       "#58a6ff",
  "TLS 1.1":       "#ffd700",
  "TLS 1.0":       "#ff8c00",
  "SSL 3.0":       "#f85149",
  "SSL 2.0":       "#ff4444",
};

const VERSION_FALLBACK = ["#58a6ff","#3fb950","#ff8c00","#ffd700","#f85149","#bc8cff","#79c0ff","#ffab70"];

function ColoredTick({ x, y, payload, index }: any) {
  const color = VERSION_COLORS[payload?.value] || VERSION_FALLBACK[index % VERSION_FALLBACK.length];
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0} y={0} dy={4}
        textAnchor="end"
        fill={color}
        fontSize={10}
        fontWeight={600}
        transform="rotate(-35)"
      >
        {payload?.value}
      </text>
    </g>
  );
}

function TlsVersionTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  const barColor = entry.fill || VERSION_COLORS[entry.payload?.tls_version] || "#c9d1d9";
  const version = entry.payload?.tls_version || "Unknown";
  const value = entry.value ?? 0;
  return (
    <div style={{
      backgroundColor: "#0d1117",
      border: `1px solid ${barColor}44`,
      borderRadius: "8px",
      padding: "10px 14px",
      boxShadow: `0 0 12px ${barColor}33`,
    }}>
      <p style={{ color: barColor, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{version}</p>
      <p style={{ color: "#c9d1d9", fontSize: 12, margin: 0 }}>
        {version} : <span style={{ color: barColor, fontWeight: 600 }}>{fmtBytes(value)}</span>
      </p>
    </div>
  );
}

interface Props {
  versionsData: TlsVersionStat[];
}

export default function TlsVersionsChart({ versionsData }: Props) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="text-white">TLS Versions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[290px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={versionsData} margin={{ top: 10, right: 20, left: 20, bottom: 55 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
              <XAxis
                dataKey="tls_version"
                tickLine={false}
                axisLine={false}
                interval={0}
                height={60}
                tick={<ColoredTick />}
              />
              <YAxis
                stroke="#8b949e"
                tick={{ fill: "#8b949e", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                scale="log"
                domain={[1, 'auto']}
                allowDataOverflow
                tickFormatter={(value) => {
                  if (value >= 1073741824) return `${(value / 1073741824).toFixed(0)}GB`;
                  if (value >= 1048576)    return `${(value / 1048576).toFixed(0)}MB`;
                  if (value >= 1024)       return `${(value / 1024).toFixed(0)}KB`;
                  return `${value}B`;
                }}
              />
              <RechartsTooltip content={<TlsVersionTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]} minPointSize={6}>
                {versionsData.map((entry: any, index: number) => {
                  const color = VERSION_COLORS[entry.tls_version] || VERSION_FALLBACK[index % VERSION_FALLBACK.length];
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
