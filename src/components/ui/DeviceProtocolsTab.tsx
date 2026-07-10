"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { fmtBytes } from "@/lib/utils";
import { Pagination } from "./Pagination";

const PORT_ALIASES: Record<string, string> = {
  "20": "FTP Data", "21": "FTP Control", "22": "SSH", "23": "Telnet",
  "25": "SMTP", "53": "DNS", "67": "DHCP Server", "68": "DHCP Client",
  "80": "HTTP", "110": "POP3", "123": "NTP", "143": "IMAP", "161": "SNMP",
  "443": "HTTPS", "445": "SMB", "500": "IKE/IPsec", "1433": "MS SQL Server",
  "1521": "Oracle DB", "3306": "MySQL", "3389": "RDP", "5432": "PostgreSQL",
  "6379": "Redis", "8080": "HTTP Alternate", "8443": "HTTPS Alternate", "5222": "XMPP/Jabber"
};

function formatProtocolLabel(label: string) {
  if (label.startsWith("Port ")) {
    const portNum = label.split(" ")[1];
    if (PORT_ALIASES[portNum]) {
      return `Port ${portNum} (${PORT_ALIASES[portNum]})`;
    }
    const portInt = parseInt(portNum, 10);
    if (!isNaN(portInt)) {
      if (portInt >= 49152 && portInt <= 65535) {
        return `Port ${portNum} (Ephemeral/Dynamic)`;
      } else {
        return `Port ${portNum} (Unassigned/Other)`;
      }
    }
  }
  return label;
}

interface Props {
  protocols: any[];
  totalDownload: number;
  totalUpload: number;
}

export default function DeviceProtocolsTab({ protocols, totalDownload, totalUpload }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const totalPages = Math.ceil(protocols.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginated = protocols.slice(startIndex, startIndex + pageSize);

  const totalBytes = totalDownload + totalUpload;

  if (protocols.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50/50 dark:bg-white/[0.02] border border-border rounded-2xl">
        <Link2 className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
        <h4 className="text-card-foreground font-bold text-lg mb-1">No Protocol Data</h4>
        <p className="text-muted-foreground font-medium max-w-md mx-auto">
          No distinct protocols or ports have been classified for this IP yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.map((proto: any, i: number) => {
          const appBytes = proto.download + proto.upload;
          const pct = totalBytes > 0 ? ((appBytes / totalBytes) * 100).toFixed(1) : "0";
          return (
            <div key={i} className="bg-slate-50/50 dark:bg-white/[0.03] border border-border p-4 rounded-2xl hover:bg-slate-100/50 dark:hover:bg-white/[0.05] transition-colors group relative overflow-hidden text-xs">
              <div className="absolute top-0 left-0 h-1 bg-amber-500/30 transition-all duration-500" style={{ width: `${pct}%` }} />
              <h5 className="font-semibold text-card-foreground mb-3 text-sm flex justify-between items-center">
                {formatProtocolLabel(proto.app_label)}
                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full ring-1 ring-amber-500/20">{pct}%</span>
              </h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Download</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-mono font-medium">{fmtBytes(proto.download)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Upload</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">{fmtBytes(proto.upload)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalResults={protocols.length}
        startIndex={startIndex}
        endIndex={startIndex + pageSize}
      />
    </div>
  );
}
