import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { sharedStyles } from "@/components/ui/sharedPdfStyles";
import { DeviceLabelItem } from "@/app/(dashboard)/device-labeling/columns";

interface DeviceLabelingPdfDocumentProps {
  devices: DeviceLabelItem[];
  reportDateStr: string;
}

export default function DeviceLabelingPdfDocument({
  devices,
  reportDateStr,
}: DeviceLabelingPdfDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={sharedStyles.page}>
        {/* Header */}
        <View style={sharedStyles.header}>
          <View>
            <Text style={sharedStyles.logoText}>Deep Package Inspection</Text>
            <Text style={sharedStyles.logoSubtext}>Device Asset Directory & Owner Management Report</Text>
          </View>
          <View style={sharedStyles.titleContainer}>
            <Text style={sharedStyles.title}>Device Asset Directory</Text>
            <Text style={sharedStyles.subtitle}>Generated at: {reportDateStr}</Text>
          </View>
        </View>

        {/* Section Title */}
        <Text style={sharedStyles.sectionTitle}>
          Registered MAC Address Directory ({devices.length} Assets)
        </Text>

        {/* Table */}
        <View style={sharedStyles.table}>
          <View style={sharedStyles.tableHeader}>
            <View style={{ width: "5%" }}><Text style={sharedStyles.tableHeaderCell}>#</Text></View>
            <View style={{ width: "22%" }}><Text style={sharedStyles.tableHeaderCell}>MAC Address</Text></View>
            <View style={{ width: "22%" }}><Text style={sharedStyles.tableHeaderCell}>Owner / Custom Label</Text></View>
            <View style={{ width: "21%" }}><Text style={sharedStyles.tableHeaderCell}>System Label</Text></View>
            <View style={{ width: "16%" }}><Text style={sharedStyles.tableHeaderCell}>Manufacturer</Text></View>
            <View style={{ width: "14%" }}><Text style={sharedStyles.tableHeaderCell}>Agent</Text></View>
          </View>

          {devices.length === 0 ? (
            <View style={sharedStyles.tableRow}>
              <Text style={sharedStyles.emptyText}>No device assets recorded.</Text>
            </View>
          ) : (
            devices.map((device, idx) => (
              <View key={device.mac_address || idx} style={sharedStyles.tableRow} wrap={false}>
                <View style={{ width: "5%" }}>
                  <Text style={sharedStyles.tableCell}>{idx + 1}</Text>
                </View>
                <View style={{ width: "22%" }}>
                  <Text style={{ ...sharedStyles.tableCell, fontFamily: "Helvetica-Bold" }}>
                    {device.mac_address}
                  </Text>
                </View>
                <View style={{ width: "22%" }}>
                  <Text style={{ ...sharedStyles.tableCell, color: device.custom_label ? "#0284c7" : "#94a3b8" }}>
                    {device.custom_label || "— Unassigned —"}
                  </Text>
                </View>
                <View style={{ width: "21%" }}>
                  <Text style={sharedStyles.tableCell}>{device.default_label || "Unknown"}</Text>
                </View>
                <View style={{ width: "16%" }}>
                  <Text style={sharedStyles.tableCell}>{device.manufacturer || "Unknown"}</Text>
                </View>
                <View style={{ width: "14%" }}>
                  <Text style={{ ...sharedStyles.tableCell, color: "#7e22ce" }}>{device.agent_name || "—"}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </Page>
    </Document>
  );
}
