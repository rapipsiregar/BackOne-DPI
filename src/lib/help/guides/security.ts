import { PageGuide } from "../types";

export const SECURITY_GUIDES: PageGuide[] = [
  {
    id: "intelligence",
    title: "Threat Intelligence",
    url: "/intelligence",
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
  {
    id: "events",
    title: "System Events",
    url: "/events",
    icon: "📋",
    summary: "Audit log of system activity and operational notifications from all platform components.",
    sections: [
      {
        heading: "What Are System Events?",
        content: "System Events is a non-malicious audit log recording all operational platform activities: agent connection/disconnection, database retention cycles, configuration updates, system capacity warnings, and administrator actions. Unlike Threat Intelligence (which focuses on external security threats), Events focuses on the internal health and operational state of the platform itself.",
      },
      {
        heading: "Event Severity Levels",
        items: [
          { label: "Info (Blue)", description: "Normal activity requiring no action. Examples: 'Agent F6-2V-DT-8A connected', 'Database retention cycle completed: 1,234 records deleted', 'Summary data updated for site SIAB'. These logs support audit trails and retrospective troubleshooting." },
          { label: "Warning (Yellow)", description: "Situations that need attention but are not yet critical. Examples: 'Agent YW-6I-61-LL missing GPS coordinates', 'Database collection approaching size threshold', 'API rate limit warning'. Should be addressed before they escalate into serious problems." },
          { label: "Critical (Red)", description: "Conditions requiring immediate action. Examples: 'Agent 1T-5Q-RC-AS offline for >24 hours', 'MongoDB connection failed', 'Disk space critical (>95%)'. Ignoring Critical events may result in monitoring data loss." },
        ],
      },
      {
        heading: "Table: Event Log",
        columns: [
          { column: "Timestamp", description: "Date and time the event occurred in Indonesia timezone (WIB/WITA/WIT). Click the header to sort newest or oldest first." },
          { column: "Severity", description: "Impact level of the event — see the Event Severity Levels section above for the meaning of each level." },
          { column: "Agent", description: "The DPI probe that reported this event. Displayed as 'System' if the event was generated by the central system (scheduler, database, or API) rather than by a hardware probe." },
          { column: "Description", description: "A plain-language description of what occurred, understandable without deep technical knowledge." },
          { column: "Details", description: "Click the icon (📄) to open a side panel containing the complete raw JSON payload of this event — includes technical metadata, stack traces for errors, and specific parameters involved. Useful for deep troubleshooting." },
        ],
      },
      {
        heading: "Exporting the Event Log",
        items: [
          { label: "Export CSV", description: "Exports the filtered event log as a .csv with columns: Timestamp, Severity, Agent, Description. Ideal for audit trails, compliance reporting, or operational incident analysis." },
          { label: "Export PDF", description: "Generates a formatted event log report as a .pdf with a severity-based breakdown and timeline. Suitable for periodic operational reports to management or the IT team." },
        ],
      },
      {
        heading: "Event Log Usage Tips",
        items: [
          { label: "Troubleshoot agent connectivity", description: "If an agent suddenly goes offline, check Events to find the disconnection log and understand the context (network error, reboot, configuration change) that preceded it." },
          { label: "Review Critical events daily", description: "Make it a habit to check Critical severity events every morning to detect system issues that may have occurred outside of working hours." },
          { label: "Use Date Range for incident investigation", description: "When investigating a past incident, filter Events by the specific time range of the incident to reconstruct the exact sequence of events." },
        ],
      },
    ],
  },
  {
    id: "security-audit",
    title: "Encryption Audit (TLS)",
    url: "/security-audit",
    icon: "🔐",
    summary: "Security audit of TLS encryption versions and cipher suites used across the network.",
    sections: [
      {
        heading: "Why TLS Auditing Matters",
        content: "TLS (Transport Layer Security) is the encryption protocol protecting data in transit. Outdated TLS versions and weak cipher suites have known security vulnerabilities that can be exploited to decrypt traffic that should be private:",
        steps: [
          "TLS 1.0 and TLS 1.1 are vulnerable to POODLE, BEAST, and DROWN attacks — they have been officially deprecated since 2020.",
          "CBC mode cipher suites are vulnerable to the LUCKY13 and padding oracle attacks under certain conditions.",
          "RC4 cipher has been cryptographically broken since 2015 and must not be used in any context.",
          "3DES (Triple DES) has been deprecated due to the SWEET32 birthday attack vulnerability.",
        ],
      },
      {
        heading: "Table: TLS Versions",
        columns: [
          { column: "Version", description: "TLS version detected from ClientHello/ServerHello handshake analysis — see the TLS Version Risk Levels section below." },
          { column: "Count", description: "Total number of connection sessions using this TLS version within the active time filter." },
          { column: "Risk", description: "Risk rating for this TLS version — see the TLS Version Risk Levels section below." },
        ],
      },
      {
        heading: "TLS Version Risk Levels",
        items: [
          { label: "SSL 2.0 / SSL 3.0", description: "CRITICAL EMERGENCY — these protocols are completely broken and must never be in use. Shutdown affected servers immediately." },
          { label: "TLS 1.0", description: "High Risk — deprecated in 2020. Vulnerable to POODLE, BEAST, and DROWN attacks. Upgrade all clients and servers immediately." },
          { label: "TLS 1.1", description: "High Risk — deprecated in 2020. Vulnerable to BEAST and LUCKY13 attacks. Upgrade all clients and servers immediately." },
          { label: "TLS 1.2", description: "Medium Risk — still acceptable when paired only with AES-GCM or ChaCha20 ciphers. Disable CBC cipher suites on servers." },
          { label: "TLS 1.3", description: "Secure — the recommended standard. Perfect Forward Secrecy is mandatory, all legacy ciphers are removed by design." },
        ],
      },
      {
        heading: "Table: TLS Ciphers",
        columns: [
          { column: "Cipher Suite", description: "Full name of the encryption algorithm negotiated between client and server. Long names are truncated — hover to see the full suite name." },
          { column: "Strength", description: "Cipher strength rating — see the Cipher Strength Ratings section below." },
          { column: "Count", description: "Frequency of this cipher suite usage within the active time filter. Insecure ciphers with a high count represent the highest remediation priority." },
        ],
      },
      {
        heading: "Cipher Strength Ratings",
        items: [
          { label: "Strong", description: "AES-GCM or ChaCha20-Poly1305 with ECDHE (Elliptic Curve Diffie-Hellman Ephemeral) key exchange. Provides Perfect Forward Secrecy — compromise of the server key does not expose past sessions." },
          { label: "Weak", description: "CBC (Cipher Block Chaining) mode ciphers, or RSA key exchange without PFS. Vulnerable to padding oracle attacks (LUCKY13). Migrate to AES-GCM as soon as possible." },
          { label: "Insecure", description: "RC4 (cryptographically broken since 2015), 3DES (vulnerable to SWEET32 birthday attack), MD5 authentication, or NULL cipher (completely unencrypted traffic). These must be disabled immediately on all servers." },
        ],
      },
      {
        heading: "Remediation Steps",
        items: [
          { label: "TLS 1.0 / TLS 1.1 detected", description: "Identify devices and applications still using these versions (check DPI Metadata → HTTP User Agents for outdated browsers or software). Update browsers to the latest version and upgrade applications using outdated TLS libraries." },
          { label: "RC4 or 3DES ciphers detected", description: "This is a security emergency. Identify servers still advertising these ciphers (check SNI in DPI Metadata) and update their TLS configuration to explicitly disable weak ciphers in the server's SSL settings." },
          { label: "CBC cipher suites dominating", description: "Prioritize migration to GCM (Galois/Counter Mode) — an AEAD (Authenticated Encryption with Associated Data) cipher that is immune to padding oracle attacks. Configure servers to prefer ECDHE-AESGCM cipher suites." },
          { label: "Low TLS 1.3 adoption", description: "TLS 1.3 offers faster handshakes (1 round-trip vs. 2 for TLS 1.2) and stronger security by default. Push for infrastructure upgrades on both servers and clients to support TLS 1.3 natively." },
        ],
      },
      {
        heading: "Exporting the Audit Report",
        items: [
          { label: "Export CSV", description: "Exports TLS version and cipher suite data as a .csv for further analysis or input into a vulnerability management or compliance platform." },
          { label: "Export PDF", description: "Generates a formatted TLS audit report directly suitable for compliance reporting (PCI-DSS, ISO 27001, NIST CSF) or for management presentations about the organization's encryption security posture." },
        ],
      },
    ],
  },
];
