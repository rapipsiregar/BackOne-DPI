import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { sharedStyles } from "./sharedPdfStyles";

interface AgentPdfDocumentProps {
  data: any;
  agentLabel: string;
  agentUuid: string;
  reportDateStr: string;
}

interface TableColumn {
  header: string;
  width: string;
  align?: "center" | "right" | "left";
  cell: (row: any) => string | number;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1000;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatIndonesiaTime(dateStr: string | Date): string {
  if (!dateStr) return "Never";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) + " WIB";
  } catch (e) {
    return String(dateStr);
  }
}

function RenderPdfTable({ title, columns, data }: { title: string; columns: TableColumn[]; data: any[] }) {
  return (
    <View style={{ marginBottom: 15 }}>
      <Text style={sharedStyles.sectionTitle}>{title}</Text>
      <View style={sharedStyles.table}>
        <View style={sharedStyles.tableHeader}>
          {columns.map((col, idx) => (
            <View key={idx} style={{ width: col.width, paddingRight: 6 }}>
              <Text style={{ ...sharedStyles.tableHeaderCell, textAlign: col.align || "left" }}>
                {col.header}
              </Text>
            </View>
          ))}
        </View>
        {data.length === 0 ? (
          <View style={sharedStyles.tableRow}>
            <Text style={sharedStyles.emptyText}>No Data</Text>
          </View>
        ) : (
          data.map((row, rowIdx) => (
            <View key={rowIdx} style={sharedStyles.tableRow} wrap={false}>
              {columns.map((col, colIdx) => (
                <View key={colIdx} style={{ width: col.width, paddingRight: 6 }}>
                  <Text style={{ ...sharedStyles.tableCell, textAlign: col.align || "left" }}>
                    {col.cell(row)}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

export default function AgentPdfDocument({
  data,
  agentLabel,
  agentUuid,
  reportDateStr,
}: AgentPdfDocumentProps) {
  const summary = data.summary || {};
  
  // Sort by total bandwidth (download + upload) descending for PDF export
  const sortByBandwidth = (arr: any[]) =>
    [...arr].sort((a, b) =>
      ((b.download ?? b.bytes_download ?? 0) + (b.upload ?? b.bytes_upload ?? 0)) -
      ((a.download ?? a.bytes_download ?? 0) + (a.upload ?? a.bytes_upload ?? 0))
    );

  const devices    = sortByBandwidth(data.devices     || []).slice(0, 50);
  const flows      = sortByBandwidth(data.flows       || []).slice(0, 50);
  const topApps    = sortByBandwidth(data.top_apps    || []).slice(0, 50);
  const macBw      = sortByBandwidth(data.mac_bandwidth || []).slice(0, 50);
  // Security alerts: not sorted by bandwidth — keep original order
  const insecure   = (data.security?.insecure_protocols || []).slice(0, 50);
  const reputation = (data.security?.ip_reputation      || []).slice(0, 50);
  const events     = (data.events || []).slice(0, 50);

  return (
    <Document>
      <Page size="A4" style={sharedStyles.page}>
        {/* Header */}
        <View style={sharedStyles.header}>
          <View>
            <Text style={sharedStyles.logoText}>Deep Package Inspection</Text>
            <Text style={sharedStyles.logoSubtext}>Security & Traffic Analytics Dashboard</Text>
          </View>
          <View style={sharedStyles.titleContainer}>
            <Text style={sharedStyles.title}>Network Agent Report</Text>
            <Text style={sharedStyles.subtitle}>Generated at: {reportDateStr}</Text>
          </View>
        </View>

        {/* Agent Info */}
        <Text style={sharedStyles.sectionTitle}>Agent Identification</Text>
        <View style={sharedStyles.grid}>
          <View style={{ ...sharedStyles.gridCol, width: "35%" }}>
            <Text style={sharedStyles.gridLabel}>Agent Name</Text>
            <Text style={sharedStyles.gridValue}>{agentLabel || "N/A"}</Text>
          </View>
          <View style={{ ...sharedStyles.gridCol, width: "65%" }}>
            <Text style={sharedStyles.gridLabel}>Agent UUID</Text>
            <Text style={sharedStyles.gridValue}>{agentUuid || "N/A"}</Text>
          </View>
          <View style={sharedStyles.gridCol}>
            <Text style={sharedStyles.gridLabel}>Active Devices</Text>
            <Text style={sharedStyles.gridValue}>{summary.total_devices ?? 0}</Text>
          </View>
          <View style={sharedStyles.gridCol}>
            <Text style={sharedStyles.gridLabel}>Active Flows</Text>
            <Text style={sharedStyles.gridValue}>{summary.active_flows ?? 0}</Text>
          </View>
        </View>

        {/* Bandwidth Usage */}
        <Text style={sharedStyles.sectionTitle}>Bandwidth Metrics</Text>
        <View style={sharedStyles.bandwidthGrid}>
          <View style={sharedStyles.bandwidthCardCyan}>
            <Text style={{ ...sharedStyles.bandwidthLabel, color: "#0d9488" }}>TOTAL DOWNLOAD</Text>
            <Text style={{ ...sharedStyles.bandwidthValue, color: "#115e59" }}>{formatBytes(summary.bandwidth_down)}</Text>
          </View>
          <View style={sharedStyles.bandwidthCardGreen}>
            <Text style={{ ...sharedStyles.bandwidthLabel, color: "#16a34a" }}>TOTAL UPLOAD</Text>
            <Text style={{ ...sharedStyles.bandwidthValue, color: "#166534" }}>{formatBytes(summary.bandwidth_up)}</Text>
          </View>
        </View>

        {/* Top Apps */}
        <RenderPdfTable
          title="Top Applications"
          data={topApps}
          columns={[
            { header: "Application", width: "40%", cell: (r) => r.app_label || "Unknown" },
            { header: "Category", width: "20%", cell: (r) => r.category || "—" },
            { header: "Download", width: "20%", align: "right", cell: (r) => formatBytes(r.download) },
            { header: "Upload", width: "20%", align: "right", cell: (r) => formatBytes(r.upload) },
          ]}
        />

        {/* Monitored Devices */}
        <RenderPdfTable
          title="Monitored Devices"
          data={devices}
          columns={[
            { header: "IP Address", width: "22%", cell: (r) => r.ip_address || "N/A" },
            { header: "OS / Manufacturer", width: "28%", cell: (r) => r.os_label || r.manufacturer || "Unknown" },
            { header: "Download", width: "15%", align: "right", cell: (r) => formatBytes(r.download) },
            { header: "Upload", width: "15%", align: "right", cell: (r) => formatBytes(r.upload) },
            { header: "Last Seen", width: "20%", cell: (r) => r.last_seen ? formatIndonesiaTime(r.last_seen) : "Never" },
          ]}
        />

        {/* Recent Network Flows */}
        <RenderPdfTable
          title="Recent Network Flows"
          data={flows}
          columns={[
            { header: "Source IP", width: "20%", cell: (r) => r.src_ip || "—" },
            { header: "Destination IP", width: "20%", cell: (r) => r.dst_ip || "—" },
            { header: "Port", width: "10%", align: "center", cell: (r) => r.dst_port || "—" },
            { header: "App / Protocol", width: "20%", cell: (r) => r.app_label || r.protocol || "Unknown" },
            { header: "Download", width: "15%", align: "right", cell: (r) => formatBytes(r.download) },
            { header: "Upload", width: "15%", align: "right", cell: (r) => formatBytes(r.upload) },
          ]}
        />

        {/* Insecure Protocols */}
        <RenderPdfTable
          title="Insecure Protocols"
          data={insecure}
          columns={[
            { header: "Host IP", width: "25%", cell: (r) => r.ip_address || "—" },
            { header: "Protocol", width: "15%", cell: (r) => r.protocol || "—" },
            { header: "Risk Level", width: "15%", cell: (r) => r.risk || "—" },
            { header: "Destination", width: "25%", cell: (r) => r.dst_ip ? `${r.dst_ip}:${r.dst_port ?? ""}` : "—" },
            { header: "Bytes Traced", width: "20%", align: "right", cell: (r) => formatBytes((r.download ?? 0) + (r.upload ?? 0)) },
          ]}
        />

        {/* IP Reputation Log */}
        <RenderPdfTable
          title="IP Reputation Log"
          data={reputation}
          columns={[
            { header: "Remote IP", width: "30%", cell: (r) => r.ip_address || "—" },
            { header: "Local IP", width: "30%", cell: (r) => r.local_ip || "—" },
            { header: "Reputation", width: "20%", cell: (r) => r.reputation || "—" },
            { header: "Risk Score", width: "20%", align: "right", cell: (r) => r.score ?? "—" },
          ]}
        />

        {/* Security Events */}
        <RenderPdfTable
          title="Security Events Log"
          data={events}
          columns={[
            { header: "Event Type", width: "20%", cell: (r) => r.event_type || "—" },
            { header: "Severity", width: "15%", align: "center", cell: (r) => r.severity || "—" },
            { header: "IP Address", width: "20%", cell: (r) => r.ip_address || "—" },
            { header: "Description", width: "25%", cell: (r) => r.description || "—" },
            { header: "Event Time", width: "20%", cell: (r) => r.event_at ? formatIndonesiaTime(r.event_at) : "—" },
          ]}
        />

        {/* MAC Bandwidth */}
        <RenderPdfTable
          title="MAC Bandwidth Distribution"
          data={macBw}
          columns={[
            { header: "MAC Address", width: "30%", cell: (r) => r.mac_address || "—" },
            { header: "Manufacturer", width: "30%", cell: (r) => r.manufacturer || "Unknown" },
            { header: "Download", width: "20%", align: "right", cell: (r) => formatBytes(r.download) },
            { header: "Upload", width: "20%", align: "right", cell: (r) => formatBytes(r.upload) },
          ]}
        />
      </Page>
    </Document>
  );
}
