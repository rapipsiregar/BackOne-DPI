import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { sharedStyles } from "../ui/sharedPdfStyles";

interface ThreatsSummaryPdfDocumentProps {
  threatsData: any[];
  reportDateStr: string;
}

interface TableColumn {
  header: string;
  width: string;
  align?: "center" | "right" | "left";
  cell: (row: any) => string | number;
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

export default function ThreatsSummaryPdfDocument({
  threatsData,
  reportDateStr,
}: ThreatsSummaryPdfDocumentProps) {
  const total = threatsData.length;
  const criticalHigh = threatsData.filter(
    (t) => {
      const s = (t.severity || "").toLowerCase();
      return s.includes("high") || s.includes("critical");
    }
  ).length;

  const medium = threatsData.filter(
    (t) => (t.severity || "").toLowerCase().includes("med")
  ).length;

  const lowInfo = total - criticalHigh - medium;

  // Group by threat type
  const typeCounts: { [key: string]: number } = {};
  threatsData.forEach((t) => {
    const key = t.threat_type || "Unknown Alert";
    typeCounts[key] = (typeCounts[key] || 0) + 1;
  });
  const topTypes = Object.entries(typeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Group by source IP
  const ipCounts: { [key: string]: number } = {};
  threatsData.forEach((t) => {
    const key = t.ip_address || "Unknown IP";
    ipCounts[key] = (ipCounts[key] || 0) + 1;
  });
  const topIps = Object.entries(ipCounts)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Sort incidents by severity (Critical > High > Medium > Low > Info) for PDF export
  const SEVERITY_RANK: Record<string, number> = {
    critical: 0, high: 1, medium: 2, med: 2, low: 3, info: 4,
  };
  const getSeverityRank = (sev: string): number => {
    const s = (sev || "").toLowerCase();
    const match = Object.entries(SEVERITY_RANK).find(([k]) => s.includes(k));
    return match ? match[1] : 5;
  };
  const incidents = [...threatsData]
    .sort((a, b) => getSeverityRank(a.severity) - getSeverityRank(b.severity))
    .slice(0, 50);

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
            <Text style={sharedStyles.title}>Threat Intelligence Summary</Text>
            <Text style={sharedStyles.subtitle}>Generated at: {reportDateStr}</Text>
          </View>
        </View>

        {/* Threat Counters */}
        <Text style={sharedStyles.sectionTitle}>Threat Metrics Summary</Text>
        <View style={sharedStyles.bandwidthGrid}>
          <View style={{ ...sharedStyles.bandwidthCardCyan, backgroundColor: "#fef2f2", borderColor: "#fecaca" }}>
            <Text style={{ ...sharedStyles.bandwidthLabel, color: "#b91c1c" }}>CRITICAL / HIGH THREATS</Text>
            <Text style={{ ...sharedStyles.bandwidthValue, color: "#991b1b" }}>{criticalHigh}</Text>
          </View>
          <View style={{ ...sharedStyles.bandwidthCardCyan, backgroundColor: "#fffbeb", borderColor: "#fef3c7" }}>
            <Text style={{ ...sharedStyles.bandwidthLabel, color: "#d97706" }}>MEDIUM THREATS</Text>
            <Text style={{ ...sharedStyles.bandwidthValue, color: "#b45309" }}>{medium}</Text>
          </View>
          <View style={sharedStyles.bandwidthCardGreen}>
            <Text style={{ ...sharedStyles.bandwidthLabel, color: "#16a34a" }}>LOW / INFO THREATS</Text>
            <Text style={{ ...sharedStyles.bandwidthValue, color: "#166534" }}>{lowInfo}</Text>
          </View>
        </View>

        {/* Threat Types & Targets */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
          <View style={{ width: "48%" }}>
            <RenderPdfTable
              title="Top Threat Types"
              data={topTypes}
              columns={[
                { header: "Threat Type", width: "70%", cell: (r) => r.type },
                { header: "Incidents", width: "30%", align: "right", cell: (r) => r.count },
              ]}
            />
          </View>

          <View style={{ width: "48%" }}>
            <RenderPdfTable
              title="Top Targeted Host IPs"
              data={topIps}
              columns={[
                { header: "Host IP Address", width: "70%", cell: (r) => r.ip },
                { header: "Incidents", width: "30%", align: "right", cell: (r) => r.count },
              ]}
            />
          </View>
        </View>

        {/* Detailed Incidents List */}
        <RenderPdfTable
          title="Detailed Threat Log (Latest 30)"
          data={incidents}
          columns={[
            { header: "Time", width: "25%", cell: (r) => r.detected_at ? formatIndonesiaTime(r.detected_at) : "N/A" },
            { header: "Threat Type", width: "25%", cell: (r) => r.threat_type || "Security Alert" },
            { header: "Severity", width: "15%", align: "center", cell: (r) => (r.severity || "Unknown").toUpperCase() },
            { header: "Host IP", width: "15%", cell: (r) => r.ip_address || "—" },
            { header: "Target Destination", width: "20%", cell: (r) => r.dst_ip || r.domain || "—" },
          ]}
        />
      </Page>
    </Document>
  );
}
