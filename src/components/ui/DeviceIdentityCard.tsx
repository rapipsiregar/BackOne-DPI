"use client";

import React from "react";
import { Server, Cpu, Monitor, HardDrive, Clock } from "lucide-react";

interface DeviceIdentityCardProps {
  osLabel: string;
  deviceType: string;
  manufacturer: string;
  lastSeen: string;
}

export default function DeviceIdentityCard({
  osLabel,
  deviceType,
  manufacturer,
  lastSeen,
}: DeviceIdentityCardProps) {
  return (
    <div className="bg-slate-50/50 dark:bg-white/[0.02] border border-border rounded-2xl p-6 text-xs">
      <h4 className="text-sm font-bold text-card-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
        <Server className="w-4 h-4 text-blue-500" /> Identity & Metadata
      </h4>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
            <Cpu className="w-3.5 h-3.5" /> OS
          </p>
          <p className="text-card-foreground font-medium text-sm">{osLabel || "Unknown"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
            <Monitor className="w-3.5 h-3.5" /> Type
          </p>
          <p className="text-card-foreground font-medium text-sm">{deviceType || "Unknown"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
            <HardDrive className="w-3.5 h-3.5" /> Manufacturer
          </p>
          <p className="text-card-foreground font-medium text-sm">{manufacturer || "Unknown"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
            <Clock className="w-3.5 h-3.5" /> Last Seen
          </p>
          <p className="text-card-foreground font-medium text-sm">
            {lastSeen ? new Date(lastSeen).toLocaleString() : "Never"}
          </p>
        </div>
      </div>
    </div>
  );
}
