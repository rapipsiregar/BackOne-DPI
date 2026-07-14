"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { 
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, 
  Tooltip as RechartsTooltip, PieChart, Pie, Cell 
} from "recharts";
import { fmtBytes } from "@/lib/utils";

interface TopWidgetsProps {
  topApps: {
    data: { app_label: string; download: number }[];
  };
  topProtocols: {
    data: { protocol_label: string; download: number }[];
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];

export function TopWidgets({ topApps, topProtocols }: TopWidgetsProps) {
  return (
    <div className="col-span-3 space-y-6">
      <Card className="bg-card/80 backdrop-blur-xl border-border/50 flex-1">
        <CardHeader>
          <CardTitle className="text-lg text-white">Top Apps (Download)</CardTitle>
        </CardHeader>
        <CardContent>
          {(!topApps.data || topApps.data.length === 0) ? (
            <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
              No Data
            </div>
          ) : (
            <div className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topApps.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="app_label" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} tickMargin={5} />
                  <YAxis 
                    stroke="#a1a1aa" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => fmtBytes(value)}
                  />
                  <RechartsTooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ 
                      backgroundColor: 'rgba(24, 24, 27, 0.9)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      borderRadius: '8px',
                      color: '#fafafa',
                    }}
                    itemStyle={{ color: '#fafafa', fontSize: '13px', fontWeight: 500 }}
                    formatter={(value: any) => [fmtBytes(value as number), 'Download']}
                  />
                  <Bar dataKey="download" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-xl border-border/50 flex-1">
        <CardHeader>
          <CardTitle className="text-lg text-white">Top Protocols</CardTitle>
        </CardHeader>
        <CardContent>
          {(!topProtocols.data || topProtocols.data.length === 0) ? (
            <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
              No Data
            </div>
          ) : (
            <div className="h-[150px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProtocols.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="download"
                    nameKey="protocol_label"
                    stroke="none"
                  >
                    {topProtocols.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(24, 24, 27, 0.9)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      borderRadius: '8px',
                      color: '#fafafa'
                    }}
                    itemStyle={{ color: '#fafafa', fontSize: '13px', fontWeight: 500 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Custom Legend */}
              <div className="flex flex-col justify-center ml-2 space-y-3">
                {topProtocols.data.slice(0, 5).map((entry, index) => (
                  <div key={`${entry.protocol_label}-${index}`} className="flex items-center text-sm text-muted-foreground whitespace-nowrap group cursor-default">
                    <div className="w-3.5 h-3.5 rounded-full mr-3 shrink-0 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="truncate max-w-[100px] group-hover:text-white transition-colors">{entry.protocol_label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
