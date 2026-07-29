import { PageGuide } from "../types";

// NOTE: Agents guide has been moved to guides/agents.ts
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
  {
    id: "user-accounts",
    title: "User Accounts Directory",
    url: "/user-accounts",
    icon: "👥",
    summary: "Manage company tenant accounts, role scopes, and multi-agent assignments.",
    sections: [
      {
        heading: "Company Tenant Cards — What You See on This Page",
        content: "The page is organized into cards, one per client company. Each card displays the company name and a user count badge (e.g. 'Accounts: 2 / 5'). Inside every company card, there is a table listing all accounts that belong to that company. Use the search box inside each card to quickly filter by account name, username, or role.",
      },
      {
        heading: "Account Table — Column Reference",
        content: "Each row in the company card's table represents one registered user account. The columns are:",
        columns: [
          { column: "#", description: "Sequential row index within the current company card. Resets to 1 for each company. Helps you quickly count and reference a specific row during review." },
          { column: "Account Name", description: "The full human-readable display name of the account holder (e.g. 'John Doe' or 'IT Team - Cibubur Branch'). This name is set during account creation and can be updated via the Edit User action. If no account name was set, the username is shown as a fallback." },
          { column: "Username", description: "The unique login credential (username) used by this account to sign in to the dashboard. Displayed in monospace font. Usernames cannot be changed after creation — to rename, delete the account and re-create." },
          { column: "Role", description: "The permission level of this account within the system. Displayed as a color-coded badge: purple = Company Admin, amber = Company Operator, blue = Company Viewer. Each role controls which pages, agents, and actions the user can access." },
          { column: "Assigned Devices", description: "Shows how many network agents (DPI probes) are assigned to this account. Company Admins typically see all agents. Company Operators may be restricted to specific agents. Company Viewers are usually locked to exactly one agent. A value of 'No device assigned' means the account has no agent scope configured — the user will see an empty dashboard after login." },
          { column: "Actions", description: "The '⚙️ Edit User' button opens the account management modal where you can update the account name, change the role, reassign agents, or delete the account. This button is disabled (greyed out) for Executive-role viewers, who have read-only access." },
        ],
      },
      {
        heading: "Role Hierarchies — Access Level Reference",
        content: "There are three customer-tier roles, each with different permissions and agent scopes:",
        items: [
          { label: "Company Admin", description: "Full administrator access for the client company. Can view all network agents assigned to their company, edit device labels, view all traffic pages, and manage sub-accounts (Company Operators and Company Viewers) under their organization. Cannot add other Company Admins (only Super Admin can)." },
          { label: "Company Operator", description: "Designed for regional IT leads or branch managers. Assigned a custom subset of network agents (e.g., 2 out of 5 agents for their branch). Can monitor traffic, view metrics, and edit device labels only for their assigned agents. Cannot manage user accounts." },
          { label: "Company Viewer", description: "Designed for on-site technicians or monitoring staff. Locked to a single specific network agent. The entire dashboard view is automatically filtered to show only that agent's traffic. Has read-only access — cannot edit device labels or manage user accounts." },
        ],
      },
      {
        heading: "Adding a New Account",
        content: "To provision a new account for a company:",
        steps: [
          "Click the '+ Add User for [Company]' button on the top-right of the target company card, or click '+ Add New Company Admin' at the bottom of the page.",
          "Fill in the Account Name field with the user's full name or team identifier.",
          "Enter a Username — this will be the login credential. Use a consistent naming convention (e.g. firstname.lastname or dept.city).",
          "Set a secure Password. Inform the user to change it on first login via Settings.",
          "Select the Role (Company Admin, Company Operator, or Company Viewer) based on the user's responsibilities.",
          "In the Agent Assignment checklist, select which network agents (DPI probes) this account should be able to see. For Company Viewers, select exactly one agent.",
          "Click 'Create Account'. The new account will appear in the company card immediately.",
        ],
      },
      {
        heading: "Editing or Deleting an Account",
        content: "To modify an existing account:",
        steps: [
          "Click '⚙️ Edit User' in the Actions column of the target account row.",
          "In the modal, you can update the Account Name, change the Role, or reassign the Agent Assignment (check/uncheck agents in the checklist).",
          "Click 'Save Changes' to apply. Changes take effect immediately on the user's next page load.",
          "To permanently delete an account, scroll down in the edit modal and click the red 'Delete Account' button. This action is irreversible — the user will be immediately logged out and unable to sign in.",
        ],
      },
      {
        heading: "5-Account Quota Limit per Company",
        content: "To maintain system efficiency, each client company is limited to a maximum of 5 active user accounts. The badge on each company card shows the current count (e.g. 'Accounts: 3 / 5'). When the limit is reached, the badge turns red and the '+ Add User' button is disabled. The backend also enforces this limit — any API request exceeding the quota is rejected with an error.",
      },
    ],
  },
];
