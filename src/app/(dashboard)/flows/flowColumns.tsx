import React from "react";
import { Column } from "@/components/ui/DataTable";
import { TimestampCell } from "@/components/ui/TimestampCell";
import { fmtBytes } from "@/lib/utils";
import { IpDetails } from "@/components/ui/IpDetails";
import { explainAppOrPort } from "./explainFlow";

export function getFlowColumns(onSelectIp: (ip: string) => void): Column<any>[] {
  return [
    { 
      header: "Last Seen", 
      accessor: (row) => (
        <TimestampCell 
          timestamp={row.last_seen} 
          firstSeen={row.first_seen} 
          showActiveStatus={true} 
        />
      ),
      className: "w-[14%] text-center",
      tooltip: (row) => new Date(row.last_seen).toLocaleString()
    },
    { 
      header: "#", 
      accessor: (row, i) => i + 1,
      className: "w-[4%] text-center"
    },
    { 
      header: "Flow ID", 
      accessor: (row) => row.flow_id,
      className: "w-[11%] text-center font-mono text-xs truncate"
    },
    { 
      header: "Src IP", 
      accessor: (row) => (
        <div className="flex flex-col items-center justify-center text-center">
          <button
            onClick={() => onSelectIp(row.src_ip)}
            className="text-blue-400 hover:text-blue-300 hover:underline font-mono text-center focus:outline-none truncate w-full"
          >
            {row.src_ip}
          </button>
          {row.src_label && (
            <span className="text-[10px] text-cyan-400 font-semibold tracking-wide mt-0.5 truncate w-full block">
              {row.src_label}
            </span>
          )}
        </div>
      ),
      className: "w-[11%] text-center",
      tooltip: (row) => row.src_label ? `${row.src_ip} (${row.src_label})` : row.src_ip
    },
    { 
      header: "Dst IP", 
      accessor: (row) => (
        <div className="flex flex-col items-center justify-center">
          <button
            onClick={() => onSelectIp(row.dst_ip)}
            className="text-blue-400 hover:text-blue-300 hover:underline font-mono text-center focus:outline-none truncate w-full"
          >
            {row.dst_ip}
          </button>
          <IpDetails ip={row.dst_ip} />
        </div>
      ),
      className: "w-[13%] text-center",
      tooltip: (row) => row.dst_ip
    },
    { 
      header: "Dst Port", 
      accessor: (row) => row.dst_port,
      className: "w-[7%] text-center font-mono text-xs"
    },
    { 
      header: "Protocol", 
      accessor: (row) => row.protocol,
      className: "w-[7%] text-center text-xs"
    },
    { 
      header: "App / Domain", 
      accessor: (row) => {
        const exp = explainAppOrPort(row.app_label, row.domain, row.dst_port);
        return (
          <div className="flex flex-col items-center justify-center">
            <span className="font-semibold text-white truncate max-w-[200px] text-center" title={exp.main}>
              {exp.main}
            </span>
            {exp.sub && (
              <span className="text-[10px] text-slate-400 italic text-center truncate max-w-[200px]">
                {exp.sub}
              </span>
            )}
          </div>
        );
      },
      className: "w-[18%] text-center",
      tooltip: (row) => {
        const exp = explainAppOrPort(row.app_label, row.domain, row.dst_port);
        return exp.sub ? `${exp.main} (${exp.sub})` : exp.main;
      }
    },
    { 
      header: "Download", 
      accessor: (row) => <span className="text-blue-400">{fmtBytes(row.bytes_download)}</span>,
      className: "w-[8%] text-center",
      tooltip: (row) => `${fmtBytes(row.bytes_download)} (${(row.bytes_download || 0).toLocaleString()} bytes)`
    },
    { 
      header: "Upload", 
      accessor: (row) => <span className="text-green-500">{fmtBytes(row.bytes_upload)}</span>,
      className: "w-[7%] text-center",
      tooltip: (row) => `${fmtBytes(row.bytes_upload)} (${(row.bytes_upload || 0).toLocaleString()} bytes)`
    }
  ];
}
