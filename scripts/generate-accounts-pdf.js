const React = require("react");
const ReactPDF = require("@react-pdf/renderer");
const path = require("path");

const { Document, Page, Text, View, StyleSheet } = ReactPDF;
const h = React.createElement;

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#0F172A",
    color: "#F8FAFC",
    fontFamily: "Helvetica",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#38BDF8",
    paddingBottom: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#38BDF8",
    letterSpacing: 0.5,
  },
  subTitle: {
    fontSize: 9,
    color: "#94A3B8",
    marginTop: 3,
  },
  badge: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 8,
    color: "#38BDF8",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#F1F5F9",
    marginTop: 12,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#38BDF8",
    paddingLeft: 6,
  },
  table: {
    width: "100%",
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  th: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  td: {
    fontSize: 8.5,
    color: "#E2E8F0",
  },
  tdUsername: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#38BDF8",
  },
  colRole: { width: "25%" },
  colUser: { width: "20%" },
  colPass: { width: "20%" },
  colScope: { width: "35%" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#64748B",
  },
});

const accountGroups = [
  {
    title: "1. Operational Accounts (Global System)",
    accounts: [
      { role: "superadmin", username: "admin", pass: "admin", scope: "BackOne System Administrator" },
      { role: "global soc analyst", username: "sulist", pass: "sulist", scope: "Global Security Incident Analyst" },
    ],
  },
  {
    title: "2. Network Agent Accounts (Agent Viewers)",
    accounts: [
      { role: "agent viewer", username: "cibubur", pass: "cibubur", scope: "Agent 2F-TF-1D-GK (JRP Cibubur)" },
      { role: "agent viewer", username: "ifg", pass: "ifg", scope: "Agent 8A-V3-PB-85 (IFG LT.18)" },
      { role: "agent viewer", username: "balaraja", pass: "balaraja", scope: "Agent F6-2V-DT-8A (CPI Balaraja)" },
      { role: "agent viewer", username: "007", pass: "007", scope: "Agent YW-6I-61-LL (Gateway 007)" },
      { role: "agent viewer", username: "bsd", pass: "bsd", scope: "Agent 1T-5Q-RC-AS (Fazza BSD)" },
      { role: "agent viewer", username: "jkt", pass: "jkt", scope: "Agent 2N-ID-VQ-AL (Fazza JKT)" },
    ],
  },
  {
    title: "3. User Accounts (Company & Tenant Administrations)",
    accounts: [
      { role: "tenant admin", username: "siab", pass: "siab", scope: "Tenant Administrator (SIAB)" },
      { role: "tenant soc analyst", username: "silis", pass: "silis", scope: "SOC Security Analyst (SIAB)" },
      { role: "tenant engineer", username: "siner", pass: "siner", scope: "Network Engineer (SIAB)" },
      { role: "tenant admin", username: "nexus", pass: "nexus", scope: "Tenant Administrator (Nexus)" },
      { role: "tenant soc analyst", username: "nelis", pass: "nelis", scope: "SOC Security Analyst (Nexus)" },
      { role: "tenant engineer", username: "nener", pass: "nener", scope: "Network Engineer (Nexus)" },
      { role: "company admin", username: "faza", pass: "faza", scope: "Company Admin (PT. Fazza)" },
      { role: "company operator", username: "faze", pass: "faze", scope: "Company Operator (PT. Fazza)" },
      { role: "company viewer", username: "fazu", pass: "fazu", scope: "Company Viewer (PT. Fazza)" },
    ],
  },
];

function MyDocument() {
  return h(
    Document,
    { title: "All Account BackOne demoplace", author: "BackOne DPI System" },
    h(
      Page,
      { size: "A4", style: styles.page },
      // Header
      h(
        View,
        { style: styles.header },
        h(
          View,
          null,
          h(Text, { style: styles.brandTitle }, "BackOne Deep Package Inspection"),
          h(Text, { style: styles.subTitle }, "All Registered Accounts Report • Domain: https://demoplace.my.id")
        ),
        h(View, { style: styles.badge }, h(Text, { style: styles.badgeText }, "CONFIDENTIAL REPORT"))
      ),

      // Account Groups
      accountGroups.map((group, gIdx) =>
        h(
          View,
          { key: gIdx },
          h(Text, { style: styles.sectionTitle }, group.title),
          h(
            View,
            { style: styles.table },
            // Table Header
            h(
              View,
              { style: styles.tableHeader },
              h(Text, { style: [styles.th, styles.colRole] }, "Role"),
              h(Text, { style: [styles.th, styles.colUser] }, "Username"),
              h(Text, { style: [styles.th, styles.colPass] }, "Password"),
              h(Text, { style: [styles.th, styles.colScope] }, "Scope / Description")
            ),
            // Table Rows
            group.accounts.map((acc, aIdx) =>
              h(
                View,
                { key: aIdx, style: styles.tableRow },
                h(Text, { style: [styles.td, styles.colRole] }, acc.role),
                h(Text, { style: [styles.tdUsername, styles.colUser] }, acc.username),
                h(Text, { style: [styles.td, styles.colPass] }, acc.pass),
                h(Text, { style: [styles.td, styles.colScope] }, acc.scope)
              )
            )
          )
        )
      ),

      // Footer
      h(
        View,
        { style: styles.footer },
        h(
          Text,
          { style: styles.footerText },
          `Generated on ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })} • PT. Data Bisnis Solusi`
        ),
        h(Text, { style: styles.footerText }, "Page 1 of 1")
      )
    )
  );
}

async function generatePDF() {
  const outputFileName = "All Account BackOne demoplace.pdf";
  const outputPath = path.join(__dirname, "..", outputFileName);

  console.log(`Generating PDF report to: ${outputPath}...`);
  await ReactPDF.renderToFile(h(MyDocument), outputPath);
  console.log(`✅ PDF Report successfully generated: ${outputPath}`);
}

generatePDF().catch((err) => {
  console.error("PDF generation failed:", err);
  process.exit(1);
});
