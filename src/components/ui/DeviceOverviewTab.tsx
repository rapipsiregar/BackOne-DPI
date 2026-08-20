"use client";

import React from "react";
import { DeviceDetails, DeviceStat } from "@/lib/api";
import { fmtBytes } from "@/lib/utils";
import { Server, Cpu, Monitor, HardDrive, Clock, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import ActiveDurationDisplay from "./ActiveDurationDisplay";

interface DeviceOverviewTabProps {
  data: DeviceDetails;
  deviceData?: DeviceStat;
}

export default function DeviceOverviewTab({ data, deviceData }: DeviceOverviewTabProps) {
  return (
    <div className="space-y-6 animate-fade-in text-xs">
      <ActiveDurationDisplay firstSeen={data.first_seen || undefined} lastSeen={data.last_seen || undefined} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowDownToLine className="w-16 h-16 text-cyan-400" />
          </div>
          <p className="text-sm font-medium text-cyan-400/80 mb-2 flex items-center gap-2">
            <ArrowDownToLine className="w-4 h-4" /> Total Download
          </p>
          <p className="text-4xl font-black text-card-foreground tracking-tight">{fmtBytes(data.total_download)}</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowUpFromLine className="w-16 h-16 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-emerald-400/80 mb-2 flex items-center gap-2">
            <ArrowUpFromLine className="w-4 h-4" /> Total Upload
          </p>
          <p className="text-4xl font-black text-card-foreground tracking-tight">{fmtBytes(data.total_upload)}</p>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-border/50 rounded-2xl p-6">
        <h4 className="text-sm font-bold text-card-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-500" /> Identity & Metadata
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5"><Cpu className="w-3.5 h-3.5" /> OS</p>
            <p className="text-card-foreground font-medium text-sm">{data.os_label || deviceData?.os_label || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5"><Monitor className="w-3.5 h-3.5" /> Type</p>
            <p className="text-card-foreground font-medium text-sm">{data.device_type || deviceData?.device_type || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5"><HardDrive className="w-3.5 h-3.5" /> Manufacturer</p>
            <p className="text-card-foreground font-medium text-sm">{data.manufacturer || deviceData?.manufacturer || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5"><Clock className="w-3.5 h-3.5" /> Last Seen</p>
            <p className="text-card-foreground font-medium text-sm">{data.last_seen || deviceData?.last_seen ? new Date(data.last_seen || deviceData?.last_seen || '').toLocaleString() : 'Never'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
