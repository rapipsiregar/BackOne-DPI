import { Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { TimestampCell } from "@/components/ui/TimestampCell";
import { ThreatStat } from "@/lib/api";
import { formatAppLabel } from "@/lib/utils";

export const getSeverityBadge = (sev?: string | null) => {
  if (!sev) return <Badge variant="green">Unknown</Badge>;
  const s = sev.toLowerCase();
  if (s.includes("high") || s.includes("critical")) return <Badge variant="red">{sev}</Badge>;
  if (s.includes("med")) return <Badge variant="orange">{sev}</Badge>;
  if (s.includes("low")) return <Badge variant="yellow">{sev}</Badge>;
  return <Badge variant="blue">{sev}</Badge>;
};

export function getThreatColumns(
  setSelectedIp: (ip: string) => void,
  setSelectedMac: (mac: string) => void,
  setSelectedThreat: (threat: ThreatStat) => void,
  highlightId: string | null
): Column<ThreatStat>[] {
  return [
    {
      header: "Timestamp",
      className: "w-[14%] text-center",
      accessor: (row) => <TimestampCell timestamp={row.detected_at} showActiveStatus={false} />,
    },
    { header: "#", className: "w-[4%] text-center", accessor: (_row, i) => i + 1 },
    {
      header: "Type",
      className: "w-[16%] text-center",
      accessor: (row) => (
        <div
          title={row.description || row.threat_type || "Unknown"}
          className="truncate w-full block cursor-help text-xs leading-tight"
        >
          {row.threat_type || "Unknown"}
        </div>
      ),
    },
    {
      header: "Severity",
      className: "w-[8%] text-center",
      accessor: (row) => getSeverityBadge(row.severity),
    },
    {
      header: "Source IP",
      className: "w-[12%] text-center",
      accessor: (row) =>
        row.ip_address ? (
          <button
            onClick={() => setSelectedIp(row.ip_address || "")}
            className="font-medium text-blue-400 hover:text-blue-300 hover:underline font-mono text-xs focus:outline-none w-full text-center truncate"
          >
            {row.ip_address}
          </button>
        ) : (
          <span className="text-muted-foreground text-xs" title="Source IP is not available from security event data (only MAC Address was captured)">–</span>
        ),
    },
    {
      header: "Dest IP",
      className: "w-[12%] text-center",
      accessor: (row) =>
        row.dst_ip ? (
          <button
            onClick={() => setSelectedIp(row.dst_ip || "")}
            className="font-mono text-xs text-blue-400 hover:text-blue-300 hover:underline focus:outline-none w-full text-center truncate"
          >
            {row.dst_ip}
          </button>
        ) : (
          <span className="text-muted-foreground text-xs" title="Dest IP is not available from this event data">–</span>
        ),
    },
    {
      header: "MAC Addr",
      className: "w-[13%] text-center",
      accessor: (row) =>
        row.mac_address ? (
          <button
            onClick={() => setSelectedMac(row.mac_address || "")}
            className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded text-muted-foreground hover:text-white hover:bg-secondary transition-colors font-mono focus:outline-none w-full text-center truncate"
            title={row.mac_address}
          >
            {row.mac_address}
          </button>
        ) : "–",
    },
    {
      header: "App",
      className: "w-[9%] text-center",
      accessor: (row) => {
        const formatted = formatAppLabel(row.app_label);
        return formatted ? (
          <div title={formatted} className="truncate w-full block text-center cursor-help text-xs">
            {formatted}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs" title="App is not available from this event">–</span>
        );
      },
    },
    {
      header: "Domain",
      className: "w-[12%] text-center",
      accessor: (row) => row.domain ? (
        <div title={row.domain} className="truncate w-full text-center text-xs cursor-help">
          {row.domain}
        </div>
      ) : (
        <span className="text-muted-foreground text-xs" title="Domain is not available from this event">–</span>
      ),
    },
    {
      header: "Action",
      className: "w-[10%] text-center",
      accessor: (row) => (
        <button
          onClick={() => setSelectedThreat(row)}
          className="px-2 py-1 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:text-white rounded-lg transition-all shadow-sm cursor-pointer focus:outline-none leading-tight"
        >
          View Mitigation
        </button>
      ),
    },
  ];
}
