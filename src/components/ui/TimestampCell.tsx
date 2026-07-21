import { formatTimestampWIB, calculateDuration, getActiveStatus } from "@/lib/utils";

interface TimestampCellProps {
  timestamp: string | Date | null | undefined;
  firstSeen?: string | Date | null | undefined;
  showActiveStatus?: boolean;
}

export function TimestampCell({ timestamp, firstSeen, showActiveStatus = true }: TimestampCellProps) {
  if (!timestamp) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  const formattedTime = formatTimestampWIB(timestamp);
  const splitTime = formattedTime.split(' '); // toLocaleString('id-ID') separates date and time with a space usually
  const dateStr = splitTime[0] || formattedTime;
  const timeStr = splitTime[1] || "";

  const isActive = showActiveStatus ? getActiveStatus(timestamp) : false;
  const duration = firstSeen ? calculateDuration(firstSeen, timestamp) : null;

  return (
    <div className="flex flex-col items-center justify-center gap-0.5 whitespace-nowrap">
      <span className="text-sm font-medium">{dateStr}</span>
      <span className="text-[10px] text-muted-foreground">{timeStr}</span>
      
      {showActiveStatus && (
        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-0.5 ${isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"}`}>
          {isActive ? "Active" : "Inactive"}
        </span>
      )}
      
      {duration && duration !== "-" && (
        <span className="text-[10px] font-mono text-blue-400/80 mt-0.5" title={`Duration: ${duration}`}>
          ⏱ {duration}
        </span>
      )}
    </div>
  );
}
