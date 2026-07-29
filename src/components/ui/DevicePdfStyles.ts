import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#334155",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1.5,
    borderBottomColor: "#3b82f6",
    paddingBottom: 12,
    marginBottom: 15,
  },
  logoText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e3a8a",
  },
  logoSubtext: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  titleContainer: {
    alignItems: "flex-end",
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e3a8a",
    backgroundColor: "#f8fafc",
    padding: "4 8",
    marginTop: 15,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#3b82f6",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  gridCol: {
    width: "25%",
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 7,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#0f172a",
  },
  bandwidthGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  bandwidthCardCyan: {
    width: "48%",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f0fdfa",
  },
  bandwidthCardGreen: {
    width: "48%",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f0fdf4",
  },
  bandwidthLabel: {
    fontSize: 7.5,
    fontWeight: "bold",
    marginBottom: 3,
  },
  bandwidthValue: {
    fontSize: 15,
    fontWeight: "bold",
  },
  table: {
    width: "100%",
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    padding: "4 6",
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#475569",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    padding: "4 6",
  },
  tableCell: {
    fontSize: 7.5,
    color: "#334155",
  },
  alertBox: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#991b1b",
    marginBottom: 2,
  },
  alertText: {
    fontSize: 7.5,
    color: "#7f1d1d",
  },
  emptyText: {
    fontSize: 8,
    color: "#64748b",
    fontStyle: "italic",
    padding: 6,
  },
});
