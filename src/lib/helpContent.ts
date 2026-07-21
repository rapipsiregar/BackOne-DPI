// src/lib/helpContent.ts
// ─────────────────────────────────────────────────────────────────────────────
// Centralized content for the User Guide & Help Center.
// Used by both HelpCenterFAB (quick FAQs) and the /help page (full guide).
// ─────────────────────────────────────────────────────────────────────────────

export interface FAQItem {
  question: string;
  answer: string;
}

export interface TableColumn {
  column: string;
  description: string;
}

export interface PageGuide {
  id: string;
  title: string;
  url: string;
  icon: string;
  summary: string;
  sections: {
    heading: string;
    content?: string;
    columns?: TableColumn[];
    items?: { label: string; description: string }[];
  }[];
}

// ── FAQ (used in HelpCenterFAB quick panel) ──────────────────────────────────
export const FAQS: FAQItem[] = [
  {
    question: "Why is the Threats data empty (0)?",
    answer:
      "If the Threats indicator shows 0, it means your network is secure within the selected time range. The system did not detect any data packets matching known attack profiles.",
  },
  {
    question: "What is the difference between Events and Threats?",
    answer:
      "Events are all standard connection activity logs recorded on the network (including secure ones). Threats are a subset of specific Events that have been filtered and classified as malicious activity by the Deep Packet Inspection (DPI) engine.",
  },
  {
    question: "How do I read the Geo Traffic Heatmap?",
    answer:
      "Light blue indicates low traffic, while deep/dark blue indicates a very high traffic volume (download/upload) to or from that country.",
  },
  {
    question: "What do the Online/Offline indicators mean for agents?",
    answer:
      "An agent is marked Online if it has successfully transmitted data within the last 12 hours. An Offline agent means no data packets have been received beyond that threshold.",
  },
  {
    question: "Why is Download larger than Upload?",
    answer:
      "This is normal behavior. Network users generally download (streaming, web browsing) significantly more than they upload. If Upload is larger, it could indicate data exfiltration and should be investigated.",
  },
  {
    question: "How is threat severity (Critical, High, Medium, Low) determined?",
    answer:
      "Severity is determined based on standard threat signatures. For example, botnet Command and Control (C2) or malware connections are classified as Critical or High, while protocol policy violations (like using plaintext HTTP or Telnet) are classified as Medium or Low.",
  },
  {
    question: "Why do some devices show \"Unknown\" for operating system or hostname?",
    answer:
      "Hostnames are resolved via local DNS queries, and operating systems are identified passively using HTTP User-Agent and DHCP Fingerprints. If a device has not sent standard HTTP traffic or has recently connected without requesting a new IP, the system will display 'Unknown'.",
  },
  {
    question: "How does the \"View As Agent\" mode affect the dashboard data?",
    answer:
      "When 'View As Agent' mode is enabled, the entire data scope on the dashboard is locked to that specific agent. You will only see active devices, DNS logs, traffic flows, and threats detected specifically by that agent, rather than the aggregate data of the entire site.",
  },
  {
    question: "What should I do if the Encryption Audit flags a connection as \"High Risk\"?",
    answer:
      "A 'High Risk' status is typically triggered by the use of legacy encryption versions such as TLS 1.0 or TLS 1.1, which are vulnerable to eavesdropping. It is recommended to update the destination server configuration or client systems to use at least TLS 1.2 or TLS 1.3.",
  },
  {
    question: "Why does the dashboard only display data up to the last 7 days?",
    answer:
      "According to the Deep Package Inspection data retention policy to maintain database capacity and query performance, network telemetry data older than 7 days is automatically deleted on a regular basis.",
  },
];

// ── Full Page Guides (used in /help page) ────────────────────────────────────
export const PAGE_GUIDES: PageGuide[] = [
  {
    id: "overview",
    title: "Overview",
    url: "/",
    icon: "🏠",
    summary: "Overall network condition summary in a single view.",
    sections: [
      {
        heading: "KPI Cards (Header)",
        columns: [
          { column: "Total Flows", description: "Number of network connection sessions monitored within the active time range." },
          { column: "Total Download", description: "Accumulated data received by all devices on the active site." },
          { column: "Total Upload", description: "Accumulated data sent out from the active site." },
          { column: "Active Devices", description: "Number of unique devices detected active within the active time range." },
        ],
      },
      {
        heading: "Globe Map",
        content:
          "Interactive global map. Glowing lines represent the flow of traffic from your site to the destination country. Line colors indicate traffic intensity. Hover over a line to see the country name and data volume. Click and drag to rotate the globe.",
      },
      {
        heading: "Top Applications & Top Protocols",
        content:
          "Widgets below the globe display the top 7 applications and protocols with the highest traffic volume. The horizontal bars represent relative volume comparisons between entries.",
      },
    ],
  },
  {
    id: "agents",
    title: "Agents Inventory",
    url: "/agents",
    icon: "📡",
    summary: "List and status of all Network Agents registered at your site.",
    sections: [
      {
        heading: "Statistic Cards",
        columns: [
          { column: "Total Agents", description: "Total number of Network Agents registered on the active site." },
          { column: "Online Agents", description: "Agents that successfully sent data within the last 12 hours." },
          { column: "Offline Agents", description: "Agents not detected active." },
          { column: "Avg. Historical Uptime", description: "Average uptime percentage of all agents over the 7 days of stored data." },
        ],
      },
      {
        heading: "Agent Location & Topology Map",
        content:
          "Interactive map of Indonesia. Green dots represent Online agents, red dots represent Offline agents. Blue lines show detected traffic flows between agents. Hover over a dot to view agent details. Hover over a line to view flow details (source agent, destination agent, data volume). The blue panel below the map shows agents lacking GPS coordinates — click the agent chip to manually add coordinates.",
      },
      {
        heading: "Table: Provisioned Network Agents",
        columns: [
          { column: "UUID / Serial", description: "Unique identifier of the hardware agent device." },
          { column: "Label", description: "Location name or description provided for this agent." },
          { column: "Provisioned", description: "Whether the agent has been activated and registered in the system." },
          { column: "Activated", description: "Whether the agent has connected and ever transmitted data." },
          { column: "Status", description: "Online (green) or Offline (red) along with the last seen timestamp." },
          { column: "Historical Uptime", description: "Uptime percentage during the 7 days of stored data." },
          { column: "Data Size", description: "Total size of data collected by this agent in the system database." },
          { column: "Actions", description: "Action buttons: Details, GPS Coordinates, Visibility, Delete." },
        ],
      },
    ],
  },
  {
    id: "flows",
    title: "Flows",
    url: "/flows",
    icon: "🔀",
    summary: "List of all active network connection sessions detected by the DPI.",
    sections: [
      {
        heading: "Filter Bar",
        content:
          "Filters at the top of the table: Source IP, Destination IP, Protocol, and App / Domain. Combine multiple filters to narrow search results.",
      },
      {
        heading: "Table: Active Flows",
        columns: [
          { column: "#", description: "Row sequence number on the current page." },
          { column: "Last Seen", description: "Last time a packet from this session was received (Indonesia timezone)." },
          { column: "Flow ID", description: "Unique identifier of the connection session created by the DPI." },
          { column: "Src IP", description: "Source IP address — the device or server initiating the connection." },
          { column: "Dst IP", description: "Destination IP address. Hover to see the device name if known." },
          { column: "Dst Port", description: "Destination port. Hover to view the service name (443=HTTPS, 53=DNS, etc.)." },
          { column: "Protocol", description: "Network protocol used in this session (TCP, UDP, QUIC, etc.)." },
          { column: "App / Domain", description: "Application or domain name identified by the DPI engine." },
          { column: "Download", description: "Volume of data received from destination to source (in KB/MB)." },
          { column: "Upload", description: "Volume of data sent from source to destination." },
        ],
      },
    ],
  },
  {
    id: "apps",
    title: "Apps",
    url: "/apps",
    icon: "📦",
    summary: "List of all applications identified by the DPI along with their traffic volume.",
    sections: [
      {
        heading: "Table: Top Applications",
        columns: [
          { column: "Application", description: "Name of the identified application (YouTube, Zoom, WhatsApp, etc.)." },
          { column: "Download", description: "Total data downloaded through this application within the active time range." },
          { column: "Upload", description: "Total data uploaded through this application." },
          { column: "Total Traffic", description: "Combined download + upload for this application." },
          { column: "Devices", description: "Number of unique devices using this application." },
          { column: "Flows", description: "Number of active connection sessions for this application." },
        ],
      },
    ],
  },
  {
    id: "devices",
    title: "Devices",
    url: "/devices",
    icon: "💻",
    summary: "Inventory of all devices detected active on the network.",
    sections: [
      {
        heading: "Table: Device Inventory",
        columns: [
          { column: "IP Address", description: "IP address of the device on the local network." },
          { column: "MAC Address", description: "Physical identity of the device's network card (hardware address)." },
          { column: "Hostname", description: "Device name if available from the local DNS resolver." },
          { column: "Agent", description: "Network Agent detecting and monitoring this device." },
          { column: "Last Seen", description: "When the device was last active sending or receiving traffic." },
          { column: "Download / Upload", description: "Total traffic volume to and from this device." },
        ],
      },
    ],
  },
  {
    id: "dns",
    title: "DNS",
    url: "/dns",
    icon: "🌐",
    summary: "DNS query log detected on the network.",
    sections: [
      {
        heading: "Table: DNS Queries",
        columns: [
          { column: "Domain", description: "Domain name queried by devices on the network." },
          { column: "Query Type", description: "Type of DNS query: A (IPv4), AAAA (IPv6), MX (mail), CNAME (alias), etc." },
          { column: "Client IP", description: "IP address of the device making this DNS query." },
          { column: "Response", description: "IP address returned by the DNS server as the answer." },
          { column: "Count", description: "Frequency of queries for this domain within the active time range." },
          { column: "Last Seen", description: "Timestamp when this domain query last occurred." },
        ],
      },
    ],
  },
  {
    id: "network-intelligence",
    title: "Traffic Categories",
    url: "/network-intelligence",
    icon: "📊",
    summary: "Traffic classification based on application categories from DPI analysis.",
    sections: [
      {
        heading: "Main Categories",
        content:
          "Displays traffic distribution charts for major categories such as Streaming, Social Media, Web, Email, Cloud, File Transfer, etc., and visualizes traffic proportions using a Pie Chart.",
      },
      {
        heading: "Application Categories Table",
        columns: [
          { column: "Category", description: "Name of the identified network application category." },
          { column: "Download", description: "Volume of data downloaded in this category." },
          { column: "Upload", description: "Volume of data uploaded in this category." },
          { column: "Total Traffic", description: "Combined download and upload volume." },
          { column: "Devices", description: "Number of unique devices using this category." },
        ],
      },
    ],
  },
  {
    id: "dpi-analytics",
    title: "DPI MetaData",
    url: "/dpi-analytics",
    icon: "🔌",
    summary: "Raw metadata analysis from Deep Packet Inspection (DPI) and device fingerprinting.",
    sections: [
      {
        heading: "Tab: Hostnames & Servers",
        content: "Logs external domains, server IPs, ports, and detecting agents. Helps identify device connection destinations.",
      },
      {
        heading: "Tab: Client Fingerprints",
        content: "Displays operating system fingerprint data (Discovery OS), dhcpFingerprints, and HTTP User Agent to identify active device types.",
      },
      {
        heading: "Tab: Specific Protocols",
        content: "Logs specific protocol metadata such as the SSH server version used and BitTorrent Hashes to audit torrenting.",
      },
      {
        heading: "Metadata Detail Table",
        columns: [
          { column: "Value / OS / Domain", description: "Metadata value, domain name, User Agent, or operating system name." },
          { column: "Details / Version", description: "Additional detailed information (such as SSH version or OS details)." },
          { column: "Count", description: "Frequency of this metadata appearing on the network." },
          { column: "Last Seen", description: "Last time this metadata was detected in the database." },
        ],
      },
    ],
  },
  {
    id: "geography",
    title: "Geo Traffic",
    url: "/geography",
    icon: "🗺️",
    summary: "Traffic distribution based on the connection's destination country.",
    sections: [
      {
        heading: "Table: Traffic by Country",
        columns: [
          { column: "Country", description: "Connection destination country detected by the geolocation engine." },
          { column: "Flag", description: "Country flag for visual identification." },
          { column: "Download / Upload", description: "Traffic volume sent to or received from that country." },
          { column: "Flows", description: "Number of active connection sessions heading to that country." },
        ],
      },
    ],
  },
  {
    id: "intelligence",
    title: "Threat Intelligence",
    url: "/intelligence",
    icon: "🛡️",
    summary: "Automatic detection of network security threats by the DPI system.",
    sections: [
      {
        heading: "Threat Categories (Left Sidebar)",
        items: [
          { label: "Crypto Mining", description: "Devices detected mining cryptocurrency without authorization." },
          { label: "Botnet Command & Control", description: "Connections to known malicious Command and Control servers." },
          { label: "Malware", description: "Traffic matching registered malware signatures." },
          { label: "Phishing", description: "Access to domains identified as phishing sites." },
        ],
      },
      {
        heading: "Threat Detail Table",
        columns: [
          { column: "Threat Level", description: "Severity level: Critical, High, Medium, or Low." },
          { column: "Source IP", description: "IP address of the involved device on your network." },
          { column: "Destination", description: "Destination IP or domain identified as malicious." },
          { column: "First Seen", description: "When this threat was first detected in the database." },
          { column: "Last Seen", description: "When this suspicious activity was last observed." },
          { column: "Evidence", description: "Technical details forming the basis for the system classifying this as a threat." },
        ],
      },
    ],
  },
  {
    id: "events",
    title: "Events",
    url: "/events",
    icon: "📋",
    summary: "Log of all key events recorded by the system.",
    sections: [
      {
        heading: "Table: Event Log",
        columns: [
          { column: "Timestamp", description: "Time the event occurred in Indonesia timezone." },
          { column: "Severity", description: "Severity level: Info, Warning, or Critical." },
          { column: "Agent", description: "Network Agent that detected and recorded this event." },
          { column: "Description", description: "Brief description of the event that occurred." },
          { column: "Details", description: "Click to open the full event details panel." },
        ],
      },
    ],
  },
  {
    id: "security-audit",
    title: "Encryption Audit (TLS)",
    url: "/security-audit",
    icon: "🔐",
    summary: "Security audit of TLS encryption across the monitored network.",
    sections: [
      {
        heading: "Table: TLS Versions",
        columns: [
          { column: "Version", description: "TLS version used (TLS 1.0, 1.1, 1.2, 1.3)." },
          { column: "Count", description: "Number of connections using this version within the active time range." },
          { column: "Risk", description: "TLS 1.0/1.1 = High Risk. TLS 1.2 = Medium Risk. TLS 1.3 = Secure." },
        ],
      },
      {
        heading: "Table: TLS Ciphers",
        columns: [
          { column: "Cipher Suite", description: "Name of the encryption algorithm suite used on the TLS connection." },
          { column: "Strength", description: "Encryption strength: Strong, Weak, or Insecure." },
          { column: "Count", description: "Frequency of this cipher suite's usage within the active time range." },
        ],
      },
    ],
  },
  {
    id: "network-infrastructure",
    title: "Topology (Infrastructure)",
    url: "/network-infrastructure",
    icon: "🌐",
    summary: "Visualization and details of the physical, logical, and geographical network infrastructure topology.",
    sections: [
      {
        heading: "Tab: Routing & Geography",
        content: "View statistics for regional areas (Top Regions) and cities (Top Cities) source/destination of network traffic.",
      },
      {
        heading: "Tab: Interfaces & VLANs",
        content: "List of physical network interfaces (Interfaces) and VLAN tags (VLAN Tags) actively transmitting data.",
      },
      {
        heading: "Tab: IP & MAC",
        content: "List of most active remote IP addresses, IP protocol version statistics (IPv4 vs IPv6), and bandwidth usage by local MAC Address.",
      },
      {
        heading: "Tab: Flow Profiles",
        content: "Logs data flow characteristics based on flow type (Flow Types) and flow source (Flow Origins) such as Local, Inbound, Outbound.",
      },
    ],
  },
  {
    id: "lookup",
    title: "Application Database (Lookup)",
    url: "/lookup",
    icon: "🔍",
    summary: "Global reference catalog database of applications recognizable by the DPI system.",
    sections: [
      {
        heading: "Catalog & Search",
        content: "Use the search bar at the top to find specific applications by name, or use the category dropdown filter to filter the list of applications.",
      },
      {
        heading: "Application Detail (Modal)",
        content: "Click on an application card to open a detailed information modal detailing the application's description, security risk level (Risk Level), default port (Default Port), and transport protocol used.",
      },
    ],
  },
];

// ── Global UI Conventions ─────────────────────────────────────────────────────
export const UI_CONVENTIONS = [
  { symbol: "● (green)", meaning: "Active / Online status / Secure condition" },
  { symbol: "● (red)", meaning: "Inactive / Offline status / At risk" },
  { symbol: "● (yellow/amber)", meaning: "Requires attention / Warning" },
  { symbol: "Truncated text (...)", meaning: "Hover over the text to view full value" },
  { symbol: "KB / MB / GB", meaning: "Data size units (1 MB = 1,000 KB)" },
  { symbol: "Time format WIB/WITA/WIT", meaning: "All timestamps displayed in Indonesia local time zone" },
  { symbol: "Pagination < 1/N >", meaning: "Page navigation — each page displays up to 50 rows of data" },
];
