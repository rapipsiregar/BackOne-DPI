import { PageGuide } from "../types";

export const THREATS_GUIDES: PageGuide[] = [
  {
    id: "threats",
    title: "Detected Threats",
    url: "/threats",
    icon: "🛡️",
    summary: "Detection and analysis of active network security threats identified by the DPI engine.",
    sections: [
      {
        heading: "How Threats Are Detected",
        content: "The system uses multiple analysis layers to detect threats:",
        steps: [
          "Signature-based detection — matching traffic patterns against a database of 10,000+ known threat signatures, updated regularly.",
          "Behavioral analysis — detecting abnormal patterns such as one device connecting to hundreds of IPs in a short time (port scanning).",
          "Domain/IP reputation — matching connection destinations against blacklists of known malicious IPs and domains.",
          "Protocol anomaly — detecting abnormal protocol usage, such as the Stratum mining protocol appearing on non-standard ports.",
        ],
      },
      {
        heading: "Threat Categories",
        items: [
          { label: "Crypto Mining (Illicit)", description: "Traffic matching the Stratum mining protocol — used for communication between mining software and pool servers. Key indicators: connections to domains like 'pool.minexmr.com' or common mining ports (3333, 4444, 5555, 14444). This activity consumes CPU/GPU resources and bandwidth without authorization." },
          { label: "Botnet Command & Control", description: "Infected devices often make regular heartbeat connections to a C2 server to receive attacker commands. Key indicators: periodic connections to blacklisted botnet IPs/domains, encrypted traffic to non-standard ports, or DNS queries to domains with DGA-like random patterns." },
          { label: "Malware", description: "Traffic signatures matching known malware communication patterns — Trojans (remote access), Ransomware (file encryption + C2), Spyware (keystroke or screenshot exfiltration), or Worms (self-propagating scanning). Refer to the 'Evidence' column for the specific technical details that triggered the detection." },
          { label: "Phishing", description: "Connections to domains known to impersonate legitimate services (banking, email, social media) to steal credentials. Domains are matched against a phishing database updated hourly. A detection means a user device accessed a malicious URL." },
        ],
      },
      {
        heading: "Available Threat Filters",
        content: "The filter panel above the table allows searching by any combination of the following fields simultaneously:",
        items: [
          { label: "Date Range", description: "Filter by specific date and time of occurrence." },
          { label: "Type", description: "Filter by threat category: Crypto Mining, Botnet C2, Malware, or Phishing." },
          { label: "Severity", description: "Filter by impact level: Critical, High, Medium, or Low." },
          { label: "Source IP", description: "Filter by the local infected or suspicious device's IP address." },
          { label: "Dest IP", description: "Filter by the malicious remote server IP address." },
          { label: "MAC Address", description: "Filter by hardware identifier of the local device — useful when the IP changes dynamically." },
          { label: "App", description: "Filter by the application associated with the threat (e.g., 'Stratum', 'BitTorrent')." },
          { label: "Domain", description: "Filter by the specific malicious domain that was accessed." },
        ],
      },
      {
        heading: "Table: Detected Threats",
        columns: [
          { column: "Timestamp", description: "Date and time the threat was first detected, in Indonesia timezone (WIB). Click the header to sort newest or oldest first." },
          { column: "#", description: "Sequential row number, continuous across pages (server-side pagination at 50 rows per page)." },
          { column: "Type", description: "The detected threat category: Crypto Mining, Botnet C2, Malware, Phishing, or another type from the signature database." },
          { column: "Severity", description: "Impact level — see the Severity Levels section below for response guidance per level." },
          { column: "Source IP", description: "The local device IP that is the source or victim of the threat. Click to open the Device Detail Modal and view all activity from this device." },
          { column: "Dest IP", description: "The malicious remote server IP. Hover to see geolocation and ISP information for that server." },
          { column: "MAC Addr", description: "Hardware MAC address of the local device — useful for physically identifying a device even when its IP changes due to dynamic DHCP." },
          { column: "App", description: "The application or protocol used in the malicious connection (e.g., 'BitTorrent', 'Stratum', or a specific identified application)." },
          { column: "Domain", description: "The malicious domain that was accessed. Truncated — hover to see the full domain. This domain has been verified as malicious in the reputation database." },
          { column: "Action", description: "Click the recommendation icon (💡) to open the Threat Recommendation Drawer — a panel with specific mitigation guidance, incident response steps, and relevant CVE references for this threat type." },
        ],
      },
      {
        heading: "Severity Levels",
        items: [
          { label: "Critical", description: "Active threat with direct and immediate impact. Response required within 1 hour. Isolate the device immediately." },
          { label: "High", description: "Serious threat confirmed. Investigate and take action within 24 hours before the situation escalates." },
          { label: "Medium", description: "Suspicious activity detected. Needs further analysis and monitoring. Escalate to High if the pattern repeats." },
          { label: "Low", description: "Potentially suspicious activity — may be a false positive from a legitimate application. Log and review periodically." },
        ],
      },
      {
        heading: "Malware Sub-Types",
        items: [
          { label: "Trojan", description: "Remote access malware disguised as a legitimate file. Allows attackers to control the infected device silently." },
          { label: "Ransomware", description: "Encrypts local files and establishes a C2 connection to demand payment. Immediate isolation is critical." },
          { label: "Spyware", description: "Silently records keystrokes, screenshots, or clipboard content and exfiltrates them to an attacker's server." },
          { label: "Worm", description: "Self-propagating malware that scans the network for other vulnerable devices to infect automatically." },
        ],
      },
      {
        heading: "Threat Recommendation Drawer",
        content: "Click the action icon on any threat row to open the recommendation panel. The drawer contains:",
        items: [
          { label: "Technical explanation", description: "A detailed explanation of why this specific activity was classified as a threat, including the matching signatures and evidence." },
          { label: "Mitigation steps", description: "Step-by-step instructions for IT/security teams to contain and remediate this specific threat type." },
          { label: "CVE references", description: "Relevant CVE (Common Vulnerabilities and Exposures) IDs where applicable, linking to known vulnerability databases." },
          { label: "Incident response", description: "Recommended device isolation procedures and incident response workflow." },
        ],
      },
      {
        heading: "Exporting Threat Data",
        content: "Click the 'Export ▾' button at the top-right of the table to open the format dropdown. Always apply your desired filters first — both formats only export data matching the active filter.",
        items: [
          { label: "Export CSV", description: "Downloads a .csv file with raw threat data columns: Timestamp, Type, Severity, Source IP, Dest IP, MAC Address, App, Domain. Compatible with Excel, Google Sheets, or import into SIEM platforms (Splunk, IBM QRadar, Elastic)." },
          { label: "Export PDF", description: "Generates a professionally formatted threat summary report as a .pdf with severity breakdown statistics. The button displays 'Generating...' during PDF rendering — wait for the file to download automatically without clicking again." },
        ],
      },
      {
        heading: "Response Priority Guidelines",
        items: [
          { label: "Critical — Respond immediately (<1 hour)", description: "Isolate the device from the network (disconnect cable or block at switch/access point). Document all flow details and take screenshots. Report to the security team or management immediately." },
          { label: "High — Investigate within 24 hours", description: "Open the Device Detail Modal for the affected device. Review all applications and domains accessed. Determine whether this is a false positive or a genuine threat." },
          { label: "Medium — Monitor and analyze", description: "Flag for monitoring. Check whether the same pattern recurs over the following days. If it does, escalate to High severity." },
          { label: "Low — Log and review periodically", description: "Record in the incident log. Review weekly to check for any severity escalation. May be a false positive from a legitimate application." },
        ],
      },
    ],
  },
];
