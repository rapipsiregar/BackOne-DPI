"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { 
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, 
  Tooltip as RechartsTooltip, PieChart, Pie, Cell 
} from "recharts";
import { fmtBytes, formatAppLabel } from "@/lib/utils";

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
    <div className="col-span-1 lg:col-span-3 space-y-6 w-full min-w-0">
      <Card className="bg-card/80 backdrop-blur-xl border-border/50 flex-1 min-w-0">
        <CardHeader>
          <CardTitle className="text-lg text-white">Top Apps (Download)</CardTitle>
        </CardHeader>
        <CardContent className="w-full min-w-0">
          {(!topApps.data || topApps.data.length === 0) ? (
            <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
              No Data
            </div>
          ) : (
            <div className="h-[150px] w-full min-w-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topApps.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="app_label" 
                    stroke="#a1a1aa" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={5}
                    tickFormatter={(val) => {
                      const formatted = formatAppLabel(val);
                      return formatted.length > 12 ? `${formatted.substring(0, 10)}...` : formatted;
                    }}
                  />
                  <YAxis 
                    stroke="#a1a1aa" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => {
                      if (value === 0) return '0';
                      if (value >= 1073741824) return `${(value / 1073741824).toFixed(1)}GB`;
                      if (value >= 1048576)    return `${(value / 1048576).toFixed(1)}MB`;
                      if (value >= 1024)       return `${(value / 1024).toFixed(0)}KB`;
                      return `${value}B`;
                    }}
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

      <Card className="bg-card/80 backdrop-blur-xl border-border/50 flex-1 min-w-0">
        <CardHeader>
          <CardTitle className="text-lg text-white">Top Protocols</CardTitle>
        </CardHeader>
        <CardContent className="w-full min-w-0">
          {(!topProtocols.data || topProtocols.data.length === 0) ? (
            <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
              No Data
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center w-full min-w-0 relative gap-3 sm:gap-4">
              <div className="h-[150px] w-full sm:w-[50%] min-w-0">
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
              </div>
              {/* Custom Legend */}
              <div className="flex flex-row sm:flex-col items-center sm:items-start justify-center flex-wrap gap-x-3.5 gap-y-1.5 ml-0 sm:ml-2">
                {topProtocols.data.slice(0, 5).map((entry, index) => (
                  <div key={`${entry.protocol_label}-${index}`} className="flex items-center text-xs sm:text-sm text-muted-foreground whitespace-nowrap group cursor-default">
                    <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full mr-1.5 sm:mr-3 shrink-0 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="truncate max-w-[80px] sm:max-w-[100px] group-hover:text-white transition-colors">{entry.protocol_label}</span>
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
