import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { sharedStyles } from "@/components/ui/sharedPdfStyles";

interface IpHistoryItem {
  ip_address: string;
  first_seen: string;
  last_seen: string;
  download: number;
  upload: number;
  flows: number;
}

interface DeviceMacPdfDocumentProps {
  macAddress: string;
  customLabel: string | null;
  defaultLabel: string;
  agentName: string;
  manufacturer: string;
  deviceType: string;
  ips: IpHistoryItem[];
  reportDateStr: string;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1000;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatIndonesiaTime(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB";
  } catch {
    return String(dateStr);
  }
}

export default function DeviceMacPdfDocument({
  macAddress,
  customLabel,
  defaultLabel,
  agentName,
  manufacturer,
  deviceType,
  ips,
  reportDateStr,
}: DeviceMacPdfDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={sharedStyles.page}>
        {/* Header */}
        <View style={sharedStyles.header}>
          <View>
            <Text style={sharedStyles.logoText}>Deep Package Inspection</Text>
            <Text style={sharedStyles.logoSubtext}>MAC Address Network Intelligence Report</Text>
          </View>
          <View style={sharedStyles.titleContainer}>
            <Text style={sharedStyles.title}>Device Network Details Report</Text>
            <Text style={sharedStyles.subtitle}>Generated at: {reportDateStr}</Text>
          </View>
        </View>

        {/* Profile Card */}
        <Text style={sharedStyles.sectionTitle}>Device Identification Profile</Text>
        <View style={sharedStyles.grid}>
          <View style={{ ...sharedStyles.gridCol, width: "33%" }}>
            <Text style={sharedStyles.gridLabel}>MAC Address</Text>
            <Text style={sharedStyles.gridValue}>{macAddress || "N/A"}</Text>
          </View>
          <View style={{ ...sharedStyles.gridCol, width: "33%" }}>
            <Text style={sharedStyles.gridLabel}>Owner / Custom Label</Text>
            <Text style={{ ...sharedStyles.gridValue, color: customLabel ? "#0284c7" : "#64748b" }}>
              {customLabel || "— Unassigned —"}
            </Text>
          </View>
          <View style={{ ...sharedStyles.gridCol, width: "34%" }}>
            <Text style={sharedStyles.gridLabel}>System Label</Text>
            <Text style={sharedStyles.gridValue}>{defaultLabel || "Unknown"}</Text>
          </View>
          <View style={{ ...sharedStyles.gridCol, width: "33%" }}>
            <Text style={sharedStyles.gridLabel}>Manufacturer</Text>
            <Text style={sharedStyles.gridValue}>{manufacturer || "Unknown"}</Text>
          </View>
          <View style={{ ...sharedStyles.gridCol, width: "33%" }}>
            <Text style={sharedStyles.gridLabel}>Device Type</Text>
            <Text style={sharedStyles.gridValue}>{deviceType || "Unknown"}</Text>
          </View>
          <View style={{ ...sharedStyles.gridCol, width: "34%" }}>
            <Text style={sharedStyles.gridLabel}>Network Agent</Text>
            <Text style={{ ...sharedStyles.gridValue, color: "#7e22ce" }}>{agentName || "N/A"}</Text>
          </View>
        </View>

        {/* Associated IPs Section */}
        <Text style={sharedStyles.sectionTitle}>
          Associated IP Address History ({ips.length} Records)
        </Text>

        <View style={sharedStyles.table}>
          <View style={sharedStyles.tableHeader}>
            <View style={{ width: "25%" }}><Text style={sharedStyles.tableHeaderCell}>IP Address</Text></View>
            <View style={{ width: "22%" }}><Text style={sharedStyles.tableHeaderCell}>First Seen</Text></View>
            <View style={{ width: "22%" }}><Text style={sharedStyles.tableHeaderCell}>Last Seen</Text></View>
            <View style={{ width: "18%", textAlign: "right" }}><Text style={{ ...sharedStyles.tableHeaderCell, textAlign: "right" }}>Traffic (Down/Up)</Text></View>
            <View style={{ width: "13%", textAlign: "right" }}><Text style={{ ...sharedStyles.tableHeaderCell, textAlign: "right" }}>Flows</Text></View>
          </View>

          {ips.length === 0 ? (
            <View style={sharedStyles.tableRow}>
              <Text style={sharedStyles.emptyText}>No IP history recorded for this MAC address.</Text>
            </View>
          ) : (
            ips.map((ip, idx) => (
              <View key={ip.ip_address || idx} style={sharedStyles.tableRow} wrap={false}>
                <View style={{ width: "25%" }}>
                  <Text style={{ ...sharedStyles.tableCell, fontFamily: "Helvetica-Bold", color: "#0f172a" }}>
                    {ip.ip_address}
                  </Text>
                </View>
                <View style={{ width: "22%" }}>
                  <Text style={sharedStyles.tableCell}>{formatIndonesiaTime(ip.first_seen)}</Text>
                </View>
                <View style={{ width: "22%" }}>
                  <Text style={sharedStyles.tableCell}>{formatIndonesiaTime(ip.last_seen)}</Text>
                </View>
                <View style={{ width: "18%" }}>
                  <Text style={{ ...sharedStyles.tableCell, textAlign: "right" }}>
                    {formatBytes(ip.download)} / {formatBytes(ip.upload)}
                  </Text>
                </View>
                <View style={{ width: "13%" }}>
                  <Text style={{ ...sharedStyles.tableCell, textAlign: "right", color: "#0284c7" }}>
                    {ip.flows?.toLocaleString() ?? 0}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </Page>
    </Document>
  );
}
