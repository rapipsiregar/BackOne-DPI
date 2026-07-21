import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { sharedStyles } from "../ui/sharedPdfStyles";

interface SecurityAuditPdfDocumentProps {
  secDevices: any[];
  versionsData: any[];
  ciphersData: any[];
  sslSansData: any[];
  vulnerableCount: number;
  moderateCount: number;
  safeCount: number;
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

export default function SecurityAuditPdfDocument({
  secDevices,
  versionsData,
  ciphersData,
  sslSansData,
  vulnerableCount,
  moderateCount,
  safeCount,
  reportDateStr,
}: SecurityAuditPdfDocumentProps) {
  // Compliance check: show all data up to 50 threshold
  const vulnerableDevices = secDevices.filter((d) => d.risk_level === "Vulnerable").slice(0, 50);
  const otherDevices = secDevices.filter((d) => d.risk_level !== "Vulnerable").slice(0, 50);
  const sslSans = (sslSansData || []).slice(0, 50);
  const versions = (versionsData || []).slice(0, 50);
  const ciphers = (ciphersData || []).slice(0, 50);

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
            <Text style={sharedStyles.title}>Security & Encryption Audit</Text>
            <Text style={sharedStyles.subtitle}>Generated at: {reportDateStr}</Text>
          </View>
        </View>

        {/* Global Security Summary */}
        <Text style={sharedStyles.sectionTitle}>Compliance & Risk Summary</Text>
        <View style={sharedStyles.bandwidthGrid}>
          <View style={{ ...sharedStyles.bandwidthCardCyan, backgroundColor: "#fef2f2", borderColor: "#fecaca" }}>
            <Text style={{ ...sharedStyles.bandwidthLabel, color: "#b91c1c" }}>VULNERABLE DEVICES</Text>
            <Text style={{ ...sharedStyles.bandwidthValue, color: "#991b1b" }}>{vulnerableCount}</Text>
          </View>
          <View style={{ ...sharedStyles.bandwidthCardCyan, backgroundColor: "#fffbeb", borderColor: "#fef3c7" }}>
            <Text style={{ ...sharedStyles.bandwidthLabel, color: "#d97706" }}>MODERATE RISK DEVICES</Text>
            <Text style={{ ...sharedStyles.bandwidthValue, color: "#b45309" }}>{moderateCount}</Text>
          </View>
          <View style={sharedStyles.bandwidthCardGreen}>
            <Text style={{ ...sharedStyles.bandwidthLabel, color: "#16a34a" }}>SECURE DEVICES</Text>
            <Text style={{ ...sharedStyles.bandwidthValue, color: "#166534" }}>{safeCount}</Text>
          </View>
        </View>

        {/* TLS Versions */}
        <RenderPdfTable
          title="TLS Version Distribution"
          data={versions}
          columns={[
            { header: "Protocol Version", width: "40%", cell: (r) => r.version || "Unknown TLS" },
            { header: "Flow Count", width: "30%", align: "right", cell: (r) => r.count ?? 0 },
            { header: "Data Transmitted", width: "30%", align: "right", cell: (r) => formatBytes(r.bytes) },
          ]}
        />

        {/* Top Active Cipher Suites */}
        <RenderPdfTable
          title="Top Active Cipher Suites"
          data={ciphers}
          columns={[
            { header: "Cipher Suite", width: "50%", cell: (r) => r.cipher || "Unknown" },
            { header: "Version", width: "20%", cell: (r) => r.version || "—" },
            { header: "Usage Count", width: "30%", align: "right", cell: (r) => r.count ?? 0 },
          ]}
        />

        {/* SSL/TLS Subject Alternative Names */}
        <RenderPdfTable
          title="SSL/TLS Subject Alternative Names (SAN)"
          data={sslSans}
          columns={[
            { header: "Subject Alternative Name (SAN)", width: "40%", cell: (r) => r.alt_name || "—" },
            { header: "Flows", width: "15%", align: "center", cell: (r) => r.flow_count ?? 0 },
            { header: "Download", width: "15%", align: "right", cell: (r) => formatBytes(r.download) },
            { header: "Upload", width: "15%", align: "right", cell: (r) => formatBytes(r.upload) },
            { header: "Last Seen", width: "15%", cell: (r) => r.last_seen ? formatIndonesiaTime(r.last_seen) : "Never" },
          ]}
        />

        {/* Vulnerable Devices Table */}
        <RenderPdfTable
          title="Vulnerable Devices (Action Required)"
          data={vulnerableDevices}
          columns={[
            { header: "IP Address", width: "30%", cell: (r) => r.ip_address || "—" },
            { header: "Device Label / OS", width: "30%", cell: (r) => r.device_label || r.os_label || "Unknown" },
            { header: "Encrypted %", width: "20%", align: "right", cell: (r) => `${r.encrypted_pct ?? 0}%` },
            { header: "Risk Level", width: "20%", align: "center", cell: (r) => r.risk_level || "—" },
          ]}
        />

        {/* Other Devices Table */}
        <RenderPdfTable
          title="Other Monitored Devices"
          data={otherDevices}
          columns={[
            { header: "IP Address", width: "30%", cell: (r) => r.ip_address || "—" },
            { header: "Device Label / OS", width: "30%", cell: (r) => r.device_label || r.os_label || "Unknown" },
            { header: "Encrypted %", width: "20%", align: "right", cell: (r) => `${r.encrypted_pct ?? 0}%` },
            { header: "Risk Level", width: "20%", align: "center", cell: (r) => r.risk_level || "—" },
          ]}
        />
      </Page>
    </Document>
  );
}
