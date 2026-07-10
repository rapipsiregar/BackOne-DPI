// src/components/ui/AgentTelemetryTab.tsx
"use client";

import { useTimeline } from "@/lib/api-with-context";
import { Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

interface Props {
  agentUuid: string;
}

export default function AgentTelemetryTab({ agentUuid }: Props) {
  const { data, isLoading } = useTimeline(60, agentUuid);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground text-sm">
        No telemetry data recorded for this agent in the last 24 hours.
      </div>
    );
  }

  // Format time labels for XAxis
  const chartData = data.map(pt => {
    const date = new Date(pt.fetched_at);
    const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const xAxisLabel = `${dateStr} ${timeStr}`;

    const rawFullLabel = date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const fullLabel = rawFullLabel.replace(' at ', ', ') + ' WIB';

    return {
      ...pt,
      xAxisLabel,
      fullLabel,
      flows: pt.total_flows ?? 0,
      peak: pt.peak_flow_rate ?? 0,
      drops: pt.packet_drops ?? 0,
      cpu: pt.cpu_usage ?? 0,
      memory: pt.memory_usage ?? 0,
      queue: pt.queue_depth ?? 0
    };
  });

  return (
    <div className="space-y-8 p-4">
      {/* Flow Rates Chart */}
      <div className="bg-slate-950/40 border border-slate-900/60 p-5 rounded-2xl">
        <h4 className="text-sm font-bold text-white mb-4 tracking-wide uppercase text-blue-400">Flow Rates & Telemetry Peak</h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="flowsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="xAxisLabel" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                labelFormatter={(value) => {
                  const matched = chartData.find(item => item.xAxisLabel === value);
                  return matched ? matched.fullLabel : value;
                }}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Area type="monotone" dataKey="flows" name="Active Flows" stroke="#3b82f6" fillOpacity={1} fill="url(#flowsGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="peak" name="Peak Flow Rate" stroke="#8b5cf6" fillOpacity={1} fill="url(#peakGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Packet Drops Chart */}
      <div className="bg-slate-950/40 border border-slate-900/60 p-5 rounded-2xl">
        <h4 className="text-sm font-bold text-white mb-4 tracking-wide uppercase text-rose-400">Packet Drop Rate Trend</h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="dropsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="xAxisLabel" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                labelFormatter={(value) => {
                  const matched = chartData.find(item => item.xAxisLabel === value);
                  return matched ? matched.fullLabel : value;
                }}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Area type="monotone" dataKey="drops" name="Packet Drops (pkts/sec)" stroke="#f43f5e" fillOpacity={1} fill="url(#dropsGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agent Resource Telemetry (CPU & Memory) */}
      <div className="bg-slate-950/40 border border-slate-900/60 p-5 rounded-2xl">
        <h4 className="text-sm font-bold text-white mb-4 tracking-wide uppercase text-emerald-400">Agent Resource Telemetry (CPU & RAM)</h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="xAxisLabel" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} unit="%" />
              <Tooltip
                labelFormatter={(value) => {
                  const matched = chartData.find(item => item.xAxisLabel === value);
                  return matched ? matched.fullLabel : value;
                }}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Area type="monotone" dataKey="cpu" name="CPU Usage (%)" stroke="#10b981" fillOpacity={1} fill="url(#cpuGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="memory" name="Memory Usage (%)" stroke="#f59e0b" fillOpacity={1} fill="url(#memGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Network Queue Depth */}
      <div className="bg-slate-950/40 border border-slate-900/60 p-5 rounded-2xl">
        <h4 className="text-sm font-bold text-white mb-4 tracking-wide uppercase text-cyan-400">Network Packet Queue Depth Trend</h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="queueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="xAxisLabel" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                labelFormatter={(value) => {
                  const matched = chartData.find(item => item.xAxisLabel === value);
                  return matched ? matched.fullLabel : value;
                }}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Area type="monotone" dataKey="queue" name="Queue Depth (packets)" stroke="#06b6d4" fillOpacity={1} fill="url(#queueGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
