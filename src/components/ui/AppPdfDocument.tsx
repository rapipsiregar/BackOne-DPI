import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { sharedStyles } from "./sharedPdfStyles";

interface AppPdfDocumentProps {
  data: any;
  appLabel: string;
  category: string;
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

export default function AppPdfDocument({
  data,
  appLabel,
  category,
  reportDateStr,
}: AppPdfDocumentProps) {
  // Sort by total bandwidth (download + upload) descending for PDF export
  const sortByBandwidth = (arr: any[]) =>
    [...arr].sort((a, b) =>
      ((b.download ?? 0) + (b.upload ?? 0)) - ((a.download ?? 0) + (a.upload ?? 0))
    );

  const topIps = sortByBandwidth(data.top_ips        || []).slice(0, 50);
  const agents = sortByBandwidth(data.agent_scorecard || []).slice(0, 50);

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
            <Text style={sharedStyles.title}>Application Activity Report</Text>
            <Text style={sharedStyles.subtitle}>Generated at: {reportDateStr}</Text>
          </View>
        </View>

        {/* Application Details */}
        <Text style={sharedStyles.sectionTitle}>Application Summary</Text>
        <View style={sharedStyles.grid}>
          <View style={{ ...sharedStyles.gridCol, width: "50%" }}>
            <Text style={sharedStyles.gridLabel}>Application Name</Text>
            <Text style={sharedStyles.gridValue}>{appLabel}</Text>
          </View>
          <View style={{ ...sharedStyles.gridCol, width: "50%" }}>
            <Text style={sharedStyles.gridLabel}>Category</Text>
            <Text style={sharedStyles.gridValue}>{category || "General Web"}</Text>
          </View>
        </View>

        {/* Bandwidth Usage */}
        <Text style={sharedStyles.sectionTitle}>Traffic Metrics</Text>
        <View style={sharedStyles.bandwidthGrid}>
          <View style={sharedStyles.bandwidthCardCyan}>
            <Text style={{ ...sharedStyles.bandwidthLabel, color: "#0d9488" }}>TOTAL DOWNLOAD</Text>
            <Text style={{ ...sharedStyles.bandwidthValue, color: "#115e59" }}>{formatBytes(data.total_download)}</Text>
          </View>
          <View style={sharedStyles.bandwidthCardGreen}>
            <Text style={{ ...sharedStyles.bandwidthLabel, color: "#16a34a" }}>TOTAL UPLOAD</Text>
            <Text style={{ ...sharedStyles.bandwidthValue, color: "#166534" }}>{formatBytes(data.total_upload)}</Text>
          </View>
        </View>

        {/* Top Users */}
        <RenderPdfTable
          title="Top User Devices"
          data={topIps}
          columns={[
            { header: "IP Address", width: "30%", cell: (r) => r.ip_address || "—" },
            { header: "Download", width: "20%", align: "right", cell: (r) => formatBytes(r.download) },
            { header: "Upload", width: "20%", align: "right", cell: (r) => formatBytes(r.upload) },
            { header: "Flows", width: "10%", align: "center", cell: (r) => r.flow_count ?? 0 },
            { header: "Last Seen", width: "20%", cell: (r) => r.last_seen ? formatIndonesiaTime(r.last_seen) : "Never" },
          ]}
        />

        {/* Top Agents */}
        <RenderPdfTable
          title="Agent Telemetry Distribution"
          data={agents}
          columns={[
            { header: "Agent Node", width: "50%", cell: (r) => r.agent_label || "Unknown Agent" },
            { header: "Download", width: "20%", align: "right", cell: (r) => formatBytes(r.download) },
            { header: "Upload", width: "20%", align: "right", cell: (r) => formatBytes(r.upload) },
            { header: "Flows", width: "10%", align: "center", cell: (r) => r.flow_count ?? 0 },
          ]}
        />
      </Page>
    </Document>
  );
}
