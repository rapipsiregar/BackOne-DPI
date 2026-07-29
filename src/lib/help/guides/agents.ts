import { PageGuide } from "../types";

export const AGENTS_GUIDES: PageGuide[] = [
  {
    id: "agents",
    title: "Agents Inventory",
    url: "/agents",
    icon: "📡",
    summary: "Full management of all registered DPI Network Agent probes at your site.",
    sections: [
      {
        heading: "Statistic Cards — Quick Status Overview",
        content: "Four summary cards at the top of the page give an instant health snapshot of all registered DPI probes:",
        columns: [
          { column: "Total Agents", description: "Total number of DPI probe devices registered in the system database for this site. Each agent is a physical or virtual network sensor deployed at a specific location." },
          { column: "Online Agents", description: "Agents that successfully transmitted telemetry within the last 24 hours. Marked with a pulsing green dot and 'Last seen: HH:MM WIB'. An online agent is actively monitoring and sending data." },
          { column: "Offline Agents", description: "Agents that have not sent any data for more than 24 hours. Marked with a grey dot and 'No Flows Detected'. Check whether the device is still powered on, connected to the network, and that the DPI service is running." },
          { column: "Avg. Uptime", description: "Average availability percentage across all agents calculated from the last 30 days. Ideal value is >99%. Below 90% indicates persistent connectivity or hardware stability issues that require urgent on-site investigation." },
        ],
      },
      {
        heading: "Agent Location Map — Interactive Network Overview",
        content: "An interactive tile map displaying the geographic position of each agent based on GPS coordinates set by the administrator. Zoom in to street-level detail (zoom level 15+). Online agents show a pulsing green beacon; offline agents show a grey beacon.",
        items: [
          { label: "Flow lines", description: "Animated arcs drawn ONLY between agents that have active inter-agent traffic flowing between them — not all agents are connected by default." },
          { label: "Hover on agent marker", description: "Shows the agent's friendly name (label), online/offline status, and uptime percentage in a tooltip." },
          { label: "Hover on flow arc", description: "Shows a tooltip with the top active sub-flows, bandwidth volume, and total connection count between the two agents." },
          { label: "Blue panel (No GPS set)", description: "Lists agents that have no GPS coordinates configured. Click the '📍 Set Location' button inside the panel or the 📍 pin icon in the table to open the coordinate input modal." },
        ],
      },
      {
        heading: "Table: Provisioned Network Agents — Column Reference",
        content: "Each row represents one registered DPI probe. The columns are:",
        columns: [
          { column: "#", description: "Sequential row index. Used to quickly reference a specific agent row during review or support calls." },
          { column: "Agent Name", description: "The friendly display name of the agent — set by the administrator in the Edit Label modal. This name appears across all dashboard pages (Flows, Apps, Devices, etc.) to identify the data source. If not set, a short identifier is used as fallback." },
          { column: "Label / Location Tag", description: "User-assigned descriptive tag indicating physical location (e.g., 'Server Room Floor 3', 'Branch Office Cibubur'). Used across all dashboard tables and charts to identify which sensor detected the traffic." },
          { column: "Provisioned", description: "Whether the agent is registered in the central management system. Green 'Yes' = registered and data will be processed. Red 'No' = not yet registered — data from this agent will be silently discarded." },
          { column: "Activated", description: "Whether the agent has ever successfully connected and transmitted telemetry at least once. An unactivated agent will not appear on the map or in any traffic table even if provisioned." },
          { column: "Traffic Status", description: "Real-time heartbeat indicator. Pulsing green dot + 'Last seen: HH:MM WIB' = active, sending data within the last 24 hours. Grey dot + 'No Flows Detected' = no data for over 24 hours — the agent may be offline or misconfigured." },
          { column: "Avg Uptime", description: "Historical availability percentage specific to this agent over the last 30 days. Values below 90% require investigation — common causes include unstable ISP connections, power interruptions, or hardware issues." },
          { column: "Data Size", description: "Total size of telemetry data currently stored in the database for this agent. Data is automatically purged after 30 days per the retention policy to maintain system efficiency." },
          { column: "Actions", description: "Up to 5 action buttons available per agent row — see the Agent Row Actions section below for details on each button." },
        ],
      },
      {
        heading: "Agent Row Actions — What Each Button Does",
        items: [
          { label: "Detail ( › ) Icon", description: "Opens the Agent Detail Modal with comprehensive information: firmware version, operating system type, CPU and memory utilization percentages, network interface configurations, and full connection history log." },
          { label: "User ( 👤 ) Icon", description: "Opens the Agent Viewer Accounts panel — manage user accounts that are granted access to view ONLY this specific agent's traffic data. Useful for provisioning Company Viewer accounts locked to this single probe." },
          { label: "Pin ( 📍 ) Icon", description: "Opens the GPS Coordinate Modal to set or update this agent's geographic location. Enter the latitude and longitude values (e.g., -6.2088, 106.8456 for Jakarta). The agent marker will appear on the map immediately after saving." },
          { label: "Eye ( 👁️ ) Icon — View As Agent", description: "Locks the entire dashboard scope to this specific agent only. ALL pages (Flows, Apps, Devices, DNS, Events, etc.) will show only data from this single agent. A blue 'Viewing as: [Agent Name]' banner appears in the sidebar. Click 'Exit View As' in the sidebar to return to the global multi-agent view." },
          { label: "Trash ( 🗑️ ) Icon — Delete Agent", description: "Permanently removes the agent registration from the database. All associated telemetry data collected by this agent is also deleted. This action is irreversible — use with caution." },
        ],
      },
      {
        heading: "Setting Agent GPS Location (Step-by-Step)",
        content: "To place an agent on the interactive map:",
        steps: [
          "Click the 📍 pin icon in the Actions column of the target agent row.",
          "The GPS Coordinate Modal will open. Enter the Latitude value (e.g., -6.2088 for South Jakarta). Negative values = South hemisphere.",
          "Enter the Longitude value (e.g., 106.8456 for East Jakarta). Positive values = East hemisphere.",
          "Click 'Save Location'. The agent marker will appear on the map immediately.",
          "If the agent was in the 'No GPS Set' blue panel, it will automatically disappear from that panel and appear on the map at the saved coordinates.",
          "To update coordinates, simply click the pin icon again and enter new values.",
        ],
      },
      {
        heading: "Using View As Agent — Scoped Monitoring",
        content: "The View As Agent feature lets you temporarily lock the entire dashboard to a single agent's perspective:",
        steps: [
          "Click the 👁️ Eye icon in the Actions column of the target agent.",
          "A blue confirmation banner appears in the sidebar showing 'Viewing as: [Agent Name]'.",
          "All dashboard pages (Flows, Apps, Devices, DNS, Geography, Threats, etc.) now show ONLY data from this agent.",
          "Navigate to any page — the agent scope filter is applied globally and automatically.",
          "To return to the full multi-agent view, click 'Exit View As' in the sidebar banner, or navigate to the Agents page and click the exit button.",
        ],
      },
      {
        heading: "Device Labeling — MAC Address Detail Pop-up",
        content: "From the Device Labeling page, click on any MAC address to open a detail pop-up showing all information known about that physical device:",
        items: [
          { label: "All Associated IPs", description: "Every IP address ever assigned to or used by this MAC address, resolved from historical flow logs. DHCP environments may show many IPs over time as the device reconnects to the network." },
          { label: "Activity Dates", description: "First Seen and Last Seen timestamps for each IP-MAC pairing, helping you track when a device was active at a specific IP address over time." },
          { label: "Traffic Usage per IP", description: "Total download and upload bandwidth attributed to each IP address used by this MAC, aggregated from historical flow records in the database." },
          { label: "Vendor / OUI Identification", description: "The hardware manufacturer identified from the first 3 octets of the MAC address using the IEEE OUI database (e.g., 'Apple Inc.', 'Intel Corporate', 'Samsung Electronics', 'Cisco Systems')." },
        ],
      },
      {
        heading: "Monitoring Tips",
        items: [
          { label: "Check Avg Uptime weekly", description: "Any agent consistently below 95% uptime needs on-site inspection. Common fixes: check power supply, verify network cable connectivity, and confirm the DPI service is configured to auto-start on system reboot." },
          { label: "Set GPS coordinates first", description: "Configure GPS coordinates for all agents before using the map view. Agents without GPS appear in the blue 'No GPS' panel and are excluded from the geographic visualization." },
          { label: "Use View As for branch support", description: "When troubleshooting a specific branch, use 'View As Agent' to scope the entire dashboard to only that branch's sensor — eliminates noise from other agents during the investigation." },
          { label: "Monitor Data Size column", description: "If an agent's Data Size grows abnormally fast, it may indicate a traffic spike or security event generating unusually high flow counts. Investigate via the Flows page using 'View As' on that specific agent." },
        ],
      },
    ],
  },
];
