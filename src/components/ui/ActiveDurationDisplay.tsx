"use client";

import { Clock } from "lucide-react";

interface Props {
  firstSeen?: string;
  lastSeen?: string;
  className?: string;
}

export function formatActiveDuration(firstSeen?: string, lastSeen?: string) {
  if (!firstSeen || !lastSeen) return null;
  const start = new Date(firstSeen).getTime();
  const end = new Date(lastSeen).getTime();
  const now = Date.now();
  
  const dateObj = new Date(lastSeen);
  const fullTimestamp = dateObj.toLocaleString("en-US", {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  let diffSec = Math.floor((end - start) / 1000);
  if (diffSec < 0) diffSec = 0;
  
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;
  
  let durationText = "Just now";
  if (h > 0) durationText = `${h}h ${m}m ${s}s`;
  else if (m > 0) durationText = `${m}m ${s}s`;
  else if (s > 0) durationText = `${s}s`;

  const timeSinceLastSeen = Math.floor((now - end) / 1000);
  const isActive = timeSinceLastSeen <= 300;
  
  let lastSeenText = "";
  if (!isActive) {
    const agoH = Math.floor(timeSinceLastSeen / 3600);
    const agoM = Math.floor((timeSinceLastSeen % 3600) / 60);
    if (agoH > 24) {
      const agoD = Math.floor(agoH / 24);
      lastSeenText = `${agoD}d ago`;
    } else if (agoH > 0) {
      lastSeenText = `${agoH}h ago`;
    } else if (agoM > 0) {
      lastSeenText = `${agoM}m ago`;
    } else {
      lastSeenText = "a few seconds ago";
    }
  }

  return { isActive, durationText, fullTimestamp, lastSeenText };
}

export default function ActiveDurationDisplay({ firstSeen, lastSeen, className = "" }: Props) {
  if (!firstSeen || !lastSeen) return null;
  const dur = formatActiveDuration(firstSeen, lastSeen);
  if (!dur) return null;

  return (
    <div className={`flex flex-col gap-1.5 bg-secondary/30 dark:bg-black/20 p-2.5 rounded-lg border border-border text-xs ${className}`}>
      <div className="flex justify-between items-center">
        <span className={`flex items-center gap-1.5 ${dur.isActive ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
          <Clock className="w-3.5 h-3.5" /> {dur.isActive ? "Active" : "Last seen"}
        </span>
        <span className="text-card-foreground font-medium">
          {dur.isActive ? dur.durationText : dur.lastSeenText}
        </span>
      </div>
      <div className="text-[10px] text-muted-foreground/60 text-right">
        {dur.fullTimestamp}
      </div>
    </div>
  );
}
