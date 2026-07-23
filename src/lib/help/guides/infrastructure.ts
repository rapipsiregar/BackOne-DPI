import { PageGuide } from "../types";

export const INFRASTRUCTURE_GUIDES: PageGuide[] = [
  {
    id: "overview",
    title: "Overview Dashboard",
    url: "/",
    icon: "🏠",
    summary: "Real-time network health summary across all monitored agents and sites.",
    sections: [
      {
        heading: "KPI Cards (Key Performance Indicators)",
        content: "Five cards at the top of the page display core network metrics in real-time. All values refresh automatically when the sidebar time filter changes (e.g., Last 24 Hours, Last 7 Days). A sudden spike or drop in any card value may indicate a traffic anomaly that requires investigation.",
        columns: [
          { column: "Download", description: "Total volume of incoming data received by all local devices within the active time range. Displayed in KB, MB, or GB. The 'Speed' sub-label shows the average bit rate (total bytes ÷ total seconds in the filter range)." },
          { column: "Upload", description: "Total volume of outgoing data sent from the site to external networks. Upload significantly exceeding download may indicate unauthorized data exfiltration or a misconfigured backup job." },
          { column: "Devices", description: "Count of unique devices (identified by hardware MAC address) that were actively communicating during the active time filter. Unrecognized new devices should be investigated via the Devices tab." },
          { column: "Flows", description: "Total number of network connection sessions (TCP/UDP) monitored by the DPI probe. The sub-label shows flow rate per hour. A sudden spike may indicate a port scan or DDoS attack." },
          { column: "Threats", description: "Total active security threats detected (botnet, malware, crypto mining, phishing). A red number means active threats exist — click it to jump directly to the Threat Intelligence page." },
        ],
      },
      {
        heading: "Globe Map (3D Interactive)",
        content: "A WebGL 3D Globe displaying routing paths from your site to destination countries worldwide. Each glowing arc represents an active connection. Arc thickness and brightness correspond to bandwidth intensity — thicker and brighter arcs carry more data.",
        items: [
          { label: "Rotate", description: "Drag with your mouse to rotate the globe and explore all active destinations." },
          { label: "Zoom", description: "Scroll the mouse wheel to zoom in or out for more detail." },
          { label: "Hover on arc", description: "Hover over any arc to see a tooltip with country name, total download/upload volume, and flow count." },
          { label: "Anomaly signal", description: "Unusually bright arcs to unfamiliar countries warrant investigation via the Geo Traffic page." },
        ],
      },
      {
        heading: "Top Applications Chart",
        content: "A bar chart displaying the top 7 applications by bandwidth consumed. Each bar shows the application name (as identified by DPI — e.g., YouTube, WhatsApp, Google Drive, Zoom) and total bandwidth in MB/GB. Applications that could not be specifically identified are labeled 'Unclassified'. Click any application name to jump to the Apps page with that application pre-filtered.",
      },
      {
        heading: "Top Protocols Chart",
        content: "A donut chart showing the transport layer protocol distribution (TCP, UDP, QUIC, ICMP) as percentages.",
        items: [
          { label: "TCP dominance", description: "Normal for web and enterprise applications — connection-oriented and reliable." },
          { label: "High UDP", description: "Indicates heavy streaming, VoIP, or gaming traffic. Investigate if not expected." },
          { label: "ICMP spike", description: "A sudden ICMP surge may indicate ping sweep activity or network reconnaissance." },
        ],
      },
      {
        heading: "How to Read the Dashboard Effectively",
        steps: [
          "Check KPI Cards first — look for any value that deviates from your usual baseline (e.g., upload suddenly 10× higher than normal).",
          "Inspect the Globe — connections to unexpected countries warrant further investigation in Geo Traffic and Threat Intelligence.",
          "Use the Time Filter — compare different ranges (Last Hour vs Last 24 Hours) to distinguish momentary spikes from sustained anomalies.",
          "Prioritize the Threats card — if it shows a number greater than 0, investigate before reviewing any other metric.",
        ],
      },
    ],
  },
  {
    id: "agents",
    title: "Agents Inventory",
    url: "/agents",
    icon: "📡",
    summary: "Full management of all registered DPI Network Agent probes at your site.",
    sections: [
      {
        heading: "Statistic Cards",
        columns: [
          { column: "Total Agents", description: "Total number of DPI probe devices registered in the system database for this site." },
          { column: "Online Agents", description: "Agents that successfully transmitted telemetry within the last 24 hours. Marked with a pulsing green dot and 'Last seen: HH:MM WIB'." },
          { column: "Offline Agents", description: "Agents that have not sent any data for more than 24 hours. Marked with a grey dot and 'No Flows Detected'. Check whether the device is still powered on." },
          { column: "Avg. Uptime", description: "Average availability percentage across all agents, calculated from the last 30 days of historical data. Ideal value is >99%. Below 90% indicates persistent connectivity or hardware stability issues." },
        ],
      },
      {
        heading: "Agent Location Map",
        content: "An interactive map of Indonesia displaying the geographic position of each agent based on configured GPS coordinates. Online agents show a pulsing green beacon; offline agents show a grey/red beacon.",
        items: [
          { label: "Flow lines", description: "Drawn dynamically ONLY between agents that have active traffic flowing between them — not all agents are connected by default." },
          { label: "Hover on agent", description: "Shows the agent name/label, UUID, online status, and uptime percentage." },
          { label: "Hover on flow line", description: "Shows a tooltip with top active sub-flows, bandwidth volume, and connection count." },
          { label: "Blue panel (no GPS)", description: "Lists agents with no GPS coordinates set — click the pin icon (📍) in the table to configure their location." },
        ],
      },
      {
        heading: "Table: Provisioned Network Agents",
        columns: [
          { column: "UUID / Serial", description: "Unique hardware identifier of the DPI probe. Click to open the Agent Detail Modal containing firmware version, OS, CPU/memory utilization, and connection history." },
          { column: "Label", description: "User-assigned friendly name, typically indicating physical location (e.g., 'Server Room Floor 3'). Used as the identifier across the entire dashboard." },
          { column: "Provisioned", description: "Whether the agent is registered in the central system. Green 'Yes' = registered. Red 'No' = not registered and data will not be processed." },
          { column: "Activated", description: "Whether the agent has ever successfully connected and transmitted telemetry at least once. An unactivated agent will not appear on the map or in traffic tables." },
          { column: "Traffic Status", description: "Real-time indicator: pulsing green dot + 'Last seen: HH:MM WIB' means actively sending data within the last 24 hours. Grey dot + 'No Flows Detected' means no data for over 24 hours." },
          { column: "Avg Uptime", description: "Historical availability percentage specific to this agent over the last 30 days. Below 90% requires attention." },
          { column: "Data Size", description: "Total size of telemetry data currently stored in MongoDB for this agent. Data is automatically purged after 30 days per the retention policy." },
          { column: "Actions", description: "Five action buttons are available per agent row — see the section below for details." },
        ],
      },
      {
        heading: "Agent Row Actions",
        items: [
          { label: "Detail Modal ( > )", description: "Opens the Agent Detail Modal showing firmware version, OS type, CPU/memory utilization, and full connection history." },
          { label: "User Icon", description: "Manage viewer accounts that are granted access to view this specific agent's data only." },
          { label: "Pin Icon 📍", description: "Set or update GPS coordinates for this agent so it appears in the correct position on the location map." },
          { label: "Eye Icon", description: "View As Agent: locks the entire dashboard scope to this agent only. All pages (Flows, Apps, Devices, etc.) will show only data from this agent. Click 'Exit View As' in the sidebar to return to the global view." },
          { label: "Delete Icon", description: "Permanently removes the agent from the registry. This action cannot be undone." },
        ],
      },
      {
        heading: "Feature: View As Agent",
        content: "The eye icon in the Actions column locks the entire dashboard scope to a single specific agent — all pages (Flows, Apps, Devices, etc.) will show only data from that agent. To return to the global view, click 'Exit View As' at the top of the sidebar.",
      },
    ],
  },
  {
    id: "network-infrastructure",
    title: "Network Topology",
    url: "/network-infrastructure",
    icon: "🌐",
    summary: "Physical, logical, and geographical network infrastructure topology details.",
    sections: [
      {
        heading: "Tab: Routing & Geography",
        content: "Displays Top Regions (continents) and Top Cities (specific cities) where external traffic is routed. Geographic coordinates are resolved from destination IP addresses using MaxMind GeoLite2 databases. Useful for identifying which data centers or countries your organization's data flows to.",
      },
      {
        heading: "Tab: Interfaces & VLANs",
        content: "Displays statistics for monitored hardware network interfaces (eth0, eth1, wlan0, etc.) including traffic volume per interface. Also shows active VLAN IDs (802.1Q tags) detected in packet headers — helping detect unexpected inter-VLAN traffic.",
      },
      {
        heading: "Tab: IP & MAC",
        items: [
          { label: "Top External Server IPs", description: "Highest-traffic destination IPs — clickable for WHOIS and geolocation details." },
          { label: "IP Protocol Distribution", description: "IPv4 vs IPv6 volume comparison as percentages. High IPv6 adoption may reflect modern cloud connectivity." },
          { label: "MAC Address Bandwidth", description: "Maps hardware MAC addresses to total bandwidth consumed. Useful for identifying devices without hostnames that are consuming excessive bandwidth." },
        ],
      },
      {
        heading: "Tab: Flow Profiles",
        items: [
          { label: "Local flows", description: "Traffic between devices within the LAN only — no external routing involved." },
          { label: "Inbound flows", description: "Traffic entering from outside the network to local devices. A high inbound ratio may indicate the network is receiving unexpected external connections." },
          { label: "Outbound flows", description: "Traffic leaving local devices to the internet. The most common type for regular internet usage." },
        ],
      },
    ],
  },
  {
    id: "lookup",
    title: "Application Lookup",
    url: "/lookup",
    icon: "🔍",
    summary: "Reference catalog of all applications recognizable by the DPI engine.",
    sections: [
      {
        heading: "Application Catalog & Search",
        content: "Contains 2,500+ application signatures stored in the DPI engine's database. Use the search bar to find a specific application, or use the category dropdown to filter by functional group (Streaming Video, Social Media, File Transfer, Gaming, Cloud Services, etc.). Each card displays the name, icon, category, and default risk rating.",
      },
      {
        heading: "Application Detail Modal",
        content: "Click any application card to open a detail modal. The modal contains:",
        items: [
          { label: "Description", description: "Full explanation of the application's function and typical use cases." },
          { label: "Transport Protocols", description: "Whether the application uses TCP, UDP, or both." },
          { label: "Default Ports", description: "Common port numbers used (e.g., HTTPS = 443, HTTP = 80, DNS = 53, FTP = 21, SSH = 22, RDP = 3389)." },
          { label: "Risk Rating", description: "Default security risk level: Low, Medium, or High, based on potential for misuse." },
        ],
      },
      {
        heading: "Blacklist Configuration",
        content: "The Blacklist tab lets administrators define prohibited applications. When matching traffic is detected, the system will:",
        steps: [
          "Record the event as a policy violation in the Security Logs.",
          "Trigger an alert notification in the Threat Intelligence dashboard.",
        ],
      },
      {
        heading: "Usage Tips",
        items: [
          { label: "Identify unknown apps", description: "If you see an unfamiliar application in Apps or Flows, search for it here to understand its function and risk profile before taking action." },
          { label: "Verify default ports", description: "If a firewall is blocking an application, verify its default ports here and coordinate with the network team." },
          { label: "Add blacklist entries gradually", description: "Add one application at a time and monitor the impact in Threat Intelligence to avoid excessive false positives." },
        ],
      },
    ],
  },
];
