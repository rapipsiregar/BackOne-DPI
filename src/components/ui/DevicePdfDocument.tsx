import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles } from "./DevicePdfStyles";

interface DevicePdfDocumentProps {
  data: any;
  ip: string;
  mac: string;
  deviceData: any;
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
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          {columns.map((col, idx) => (
            <View key={idx} style={{ width: col.width, paddingRight: 6 }}>
              <Text style={{ ...styles.tableHeaderCell, textAlign: col.align || "left" }}>
                {col.header}
              </Text>
            </View>
          ))}
        </View>
        {data.length === 0 ? (
          <View style={styles.tableRow}>
            <Text style={styles.emptyText}>No Data</Text>
          </View>
        ) : (
          data.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.tableRow} wrap={false}>
              {columns.map((col, colIdx) => (
                <View key={colIdx} style={{ width: col.width, paddingRight: 6 }}>
                  <Text style={{ ...styles.tableCell, textAlign: col.align || "left" }}>
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

export default function DevicePdfDocument({
  data,
  ip,
  mac,
  deviceData,
  reportDateStr,
}: DevicePdfDocumentProps) {
  // Sort by total bandwidth (download + upload) descending for PDF export
  const sortByBandwidth = (arr: any[]) =>
    [...arr].sort((a, b) =>
      ((b.download ?? b.bytes_download ?? 0) + (b.upload ?? b.bytes_upload ?? 0)) -
      ((a.download ?? a.bytes_download ?? 0) + (a.upload ?? a.bytes_upload ?? 0))
    );

  const topApps        = sortByBandwidth(data.apps      || []).slice(0, 50);
  const topProtocols   = sortByBandwidth(data.protocols || []).slice(0, 50);
  const topDomains     = sortByBandwidth(data.domains   || []).slice(0, 50);
  // Threats: sorted by detected_at descending (newest first), not by bandwidth
  const detectedThreats = [...(data.threats || [])]
    .sort((a, b) => new Date(b.detected_at || 0).getTime() - new Date(a.detected_at || 0).getTime())
    .slice(0, 50);
  const flows          = sortByBandwidth(data.flows     || []).slice(0, 50);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>Deep Package Inspection</Text>
            <Text style={styles.logoSubtext}>Security & Traffic Analytics Dashboard</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Device Analysis Report</Text>
            <Text style={styles.subtitle}>Generated at: {reportDateStr}</Text>
          </View>
        </View>

        {/* Device Information */}
        <Text style={styles.sectionTitle}>Device Identification</Text>
        <View style={styles.grid}>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>IP Address</Text>
            <Text style={styles.gridValue}>{ip || "N/A"}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>MAC Address</Text>
            <Text style={styles.gridValue}>{mac || "N/A"}</Text>
          </View>
          <View style={{ ...styles.gridCol, width: "50%" }}>
            <Text style={styles.gridLabel}>Device OS</Text>
            <Text style={styles.gridValue}>{data.os_label || deviceData?.os_label || "Unknown"}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>Manufacturer</Text>
            <Text style={styles.gridValue}>{data.manufacturer || deviceData?.manufacturer || "Unknown"}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>Source Agent</Text>
            <Text style={styles.gridValue}>{data.agent_label || "N/A"}</Text>
          </View>
          <View style={{ ...styles.gridCol, width: "50%" }}>
            <Text style={styles.gridLabel}>Last Seen</Text>
            <Text style={styles.gridValue}>
              {data.last_seen || deviceData?.last_seen
                ? formatIndonesiaTime(data.last_seen || deviceData?.last_seen)
                : "Never"}
            </Text>
          </View>
        </View>

        {/* Bandwidth Usage */}
        <Text style={styles.sectionTitle}>Bandwidth Metrics</Text>
        <View style={styles.bandwidthGrid}>
          <View style={styles.bandwidthCardCyan}>
            <Text style={{ ...styles.bandwidthLabel, color: "#0d9488" }}>TOTAL DOWNLOAD</Text>
            <Text style={{ ...styles.bandwidthValue, color: "#115e59" }}>{formatBytes(data.total_download)}</Text>
          </View>
          <View style={styles.bandwidthCardGreen}>
            <Text style={{ ...styles.bandwidthLabel, color: "#16a34a" }}>TOTAL UPLOAD</Text>
            <Text style={{ ...styles.bandwidthValue, color: "#166534" }}>{formatBytes(data.total_upload)}</Text>
          </View>
        </View>

        {/* Security Threats Table */}
        <RenderPdfTable
          title={`Security Threats (${detectedThreats.length})`}
          data={detectedThreats}
          columns={[
            { header: "Time", width: "25%", cell: (r) => r.detected_at ? formatIndonesiaTime(r.detected_at) : "N/A" },
            { header: "Threat Type / Description", width: "35%", cell: (r) => r.threat_type || "Security Alert" },
            { header: "Severity", width: "15%", align: "center", cell: (r) => (r.severity || "UNKNOWN").toUpperCase() },
            { header: "Target IP", width: "25%", cell: (r) => r.dst_ip || r.ip_address || "—" },
          ]}
        />

        {/* Top Applications */}
        <RenderPdfTable
          title="Top Applications (By Traffic)"
          data={topApps}
          columns={[
            { header: "Application", width: "50%", cell: (r) => r.app_label || "Unknown" },
            { header: "Download", width: "25%", align: "right", cell: (r) => formatBytes(r.download) },
            { header: "Upload", width: "25%", align: "right", cell: (r) => formatBytes(r.upload) },
          ]}
        />

        {/* Top Network Protocols */}
        <RenderPdfTable
          title="Top Protocols"
          data={topProtocols}
          columns={[
            { header: "Protocol / Port", width: "50%", cell: (r) => r.protocol || "—" },
            { header: "Download", width: "25%", align: "right", cell: (r) => formatBytes(r.download) },
            { header: "Upload", width: "25%", align: "right", cell: (r) => formatBytes(r.upload) },
          ]}
        />

        {/* Top Visited Domains */}
        <RenderPdfTable
          title="Top Domains"
          data={topDomains}
          columns={[
            { header: "Domain", width: "50%", cell: (r) => r.domain || "—" },
            { header: "Download", width: "25%", align: "right", cell: (r) => formatBytes(r.download) },
            { header: "Upload", width: "25%", align: "right", cell: (r) => formatBytes(r.upload) },
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
      </Page>
    </Document>
  );
}
