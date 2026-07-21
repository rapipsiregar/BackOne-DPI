"use client";

import { Server, CheckCircle2, XCircle, Activity } from "lucide-react";

interface UptimeStatsCardsProps {
  totalAgents: number;
  onlineAgents: number;
  offlineAgents: number;
  avgUptime: number;
}

export default function UptimeStatsCards({
  totalAgents,
  onlineAgents,
  offlineAgents,
  avgUptime,
}: UptimeStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold">
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/80 p-5 rounded-2xl flex flex-col relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Server className="w-12 h-12 text-blue-400" />
        </div>
        <span className="text-slate-400 uppercase tracking-wider mb-1">Total Agents</span>
        <span className="text-2xl font-black text-white tracking-tight">{totalAgents}</span>
      </div>
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/80 p-5 rounded-2xl flex flex-col relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
        </div>
        <span className="text-slate-400 uppercase tracking-wider mb-1">Online Agents</span>
        <span className="text-2xl font-black text-emerald-400 tracking-tight">{onlineAgents}</span>
      </div>
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/80 p-5 rounded-2xl flex flex-col relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <XCircle className="w-12 h-12 text-red-400" />
        </div>
        <span className="text-slate-400 uppercase tracking-wider mb-1">Offline Agents</span>
        <span className="text-2xl font-black text-red-400 tracking-tight">{offlineAgents}</span>
      </div>
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/80 p-5 rounded-2xl flex flex-col relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Activity className="w-12 h-12 text-cyan-400" />
        </div>
        <span className="text-slate-400 uppercase tracking-wider mb-1">Avg. Historical Uptime</span>
        <span className="text-2xl font-black text-cyan-400 tracking-tight">{avgUptime.toFixed(2)}%</span>
      </div>
    </div>
  );
}
