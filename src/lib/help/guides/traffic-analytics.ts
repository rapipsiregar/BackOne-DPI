import { PageGuide } from "../types";

export const TRAFFIC_ANALYTICS_GUIDES: PageGuide[] = [
  {
    id: "network-intelligence",
    title: "Traffic Categories",
    url: "/network-intelligence",
    icon: "📊",
    summary: "Traffic distribution grouped by functional application categories.",
    sections: [
      {
        heading: "Application Categorization",
        content: "This page groups all identified applications into high-level functional categories, providing a broad view of network usage without inspecting each application individually. Categorization is performed automatically based on the DPI signature database. The pie chart visualizes bandwidth proportion per category at a glance.",
      },
      {
        heading: "Traffic Category Reference",
        items: [
          { label: "Streaming / Video", description: "Traffic to YouTube, Netflix, TikTok, Twitch, Vimeo, etc. Typically dominates total bandwidth. High volume is expected, but may become a concern if it overwhelms business-critical connections." },
          { label: "Social Network", description: "Facebook, Instagram, Twitter/X, LinkedIn, WhatsApp, Telegram, etc. Separated from streaming because the bandwidth profile differs (more short video/photo upload activity)." },
          { label: "Cloud Services", description: "Google Drive, Dropbox, OneDrive, AWS S3, Azure Blob Storage. High upload to this category is normal for automatic backup jobs." },
          { label: "File Transfer", description: "FTP, SFTP, BitTorrent, and other P2P clients. BitTorrent presence in a corporate environment is a red flag requiring investigation." },
          { label: "Web Browsing", description: "General HTTP/HTTPS traffic not matched to a specific application. Catch-all category for generic web browsing." },
          { label: "DNS / System", description: "DNS resolver traffic, NTP time sync, and OS updates (Windows Update, apt, yum). High volume in this category is typically normal." },
          { label: "Security / VPN", description: "VPN client traffic, antivirus updates, firewall management traffic. Identify unauthorized VPN usage here." },
          { label: "Unclassified", description: "Traffic that could not be matched to any known signature. A high percentage warrants investigation on the Flows page." },
        ],
      },
      {
        heading: "Table: Category Breakdown",
        columns: [
          { column: "Category", description: "Name of the functional application group." },
          { column: "Download", description: "Total incoming bandwidth for all applications within this category." },
          { column: "Upload", description: "Total outgoing bandwidth from all applications within this category." },
          { column: "Devices", description: "Number of unique devices accessing applications in this category." },
          { column: "Percentage", description: "This category's share of total network bandwidth. Useful for bandwidth allocation policy reviews." },
        ],
      },
    ],
  },
  {
    id: "dpi-analytics",
    title: "DPI Metadata",
    url: "/dpi-analytics",
    icon: "🔌",
    summary: "Raw technical metadata extracted by Deep Packet Inspection: hostnames, client fingerprints, and protocol-specific identifiers.",
    sections: [
      {
        heading: "What is DPI Metadata?",
        content: "DPI Metadata is low-level technical data extracted directly from network packet headers and payloads. This data is more granular than standard flow records — it includes software identity, browser versions, OS types, TLS cipher suites, and protocol-specific identifiers. This page is intended for security teams and network engineers who require deep visibility.",
      },
      {
        heading: "Tab: Hostnames & Servers",
        items: [
          { label: "SNI Hostnames", description: "Server names extracted from TLS ClientHello handshakes. This is the most accurate method for identifying target servers, even within encrypted HTTPS traffic." },
          { label: "SSL Server Common Names", description: "Names listed in the SSL certificate sent by the server. May differ from the SNI if a multi-domain (SAN) certificate is in use." },
          { label: "QUIC SNIs", description: "SNI values extracted from QUIC (HTTP/3) connections — Google's modern transport protocol that is replacing HTTPS over TCP in many applications." },
        ],
      },
      {
        heading: "Tab: Client Fingerprints",
        items: [
          { label: "Discovered OS", description: "Operating systems passively detected from TCP TTL values and default window sizes. Common signatures: Windows = TTL 128, Linux/Android = TTL 64, macOS/iOS = TTL 64." },
          { label: "HTTP User Agents", description: "Browser and application version strings from HTTP headers (e.g., 'Mozilla/5.0 Chrome/115'). Useful for detecting outdated software or bots using fake User Agents." },
          { label: "DHCP Fingerprints", description: "DHCP request patterns that identify device type and OS — useful for classifying devices that do not expose hostnames or User-Agent strings." },
        ],
      },
      {
        heading: "Tab: Specific Protocols",
        items: [
          { label: "SSH Versions", description: "SSH client and server software versions identified from the banner exchange (e.g., 'OpenSSH_8.9', 'PuTTY_Release_0.77'). Outdated SSH versions with known vulnerabilities should be patched immediately." },
          { label: "BitTorrent Info-Hashes", description: "SHA1 unique identifiers for each active torrent on the network. Info-hashes can be looked up on public torrent sites to identify what content is being downloaded or shared — a policy violation in most corporate environments." },
        ],
      },
      {
        heading: "Using DPI Metadata for Security",
        items: [
          { label: "Detect Outdated Software", description: "Check HTTP User Agents to find browsers or applications with old versions containing known security vulnerabilities (CVEs). Examples: Internet Explorer, or Chrome versions more than 2 years old." },
          { label: "Identify Unauthorized BYOD Devices", description: "Combine OS fingerprints with MAC OUI lookups to detect personal devices (smartphones, laptops) that are not authorized to connect to the corporate network." },
          { label: "Detect BitTorrent Activity", description: "The presence of BitTorrent Info-Hashes in a corporate network is a policy violation. Record the info-hash and use it to identify the responsible device and user." },
          { label: "Audit SSH Server Versions", description: "Verify that all SSH server versions are current and secure (OpenSSH 8.x+). Outdated SSH versions are vulnerable to man-in-the-middle attacks." },
        ],
      },
    ],
  },
  {
    id: "geography",
    title: "Geo Traffic",
    url: "/geography",
    icon: "🗺️",
    summary: "Bandwidth analysis and traffic distribution by destination country worldwide.",
    sections: [
      {
        heading: "IP Geographic Resolution",
        content: "The system resolves destination IP addresses to geographic locations using the MaxMind GeoLite2 database. Resolution accuracy: very high for country (>99%), good for city (>80%). IPs belonging to CDNs (e.g., Cloudflare, Akamai) may resolve to their Point of Presence (PoP) location rather than the actual origin server.",
      },
      {
        heading: "Table: Traffic by Country",
        columns: [
          { column: "Country", description: "Destination country name with national flag for quick visual identification." },
          { column: "Download", description: "Total data volume received from servers in this country. Large volumes to CDN countries (USA, Singapore, Netherlands) are entirely normal." },
          { column: "Upload", description: "Total data sent to servers in this country. Large upload volumes to countries unrelated to your business operations should be investigated." },
          { column: "Flows", description: "Number of connection sessions directed to servers in this country. A high flow count to a single unfamiliar foreign country indicates intensive communication that warrants review." },
        ],
      },
      {
        heading: "Normal Traffic Destinations",
        items: [
          { label: "USA, Singapore, Netherlands, Japan", description: "Host the major global CDN infrastructure (Cloudflare, AWS, Google, Fastly, Akamai). Traffic to these destinations is typically the result of normal internet usage." },
          { label: "Indonesia", description: "Traffic to local Indonesian servers (ASN Telkom, Biznet, IDC data centers) for local services and CDN edge nodes." },
        ],
      },
      {
        heading: "Suspicious Traffic Patterns",
        items: [
          { label: "Russia or China (without business context)", description: "If there is no established business relationship with entities in these countries, traffic to them — especially upload — should be investigated as potential C2 communication or data exfiltration." },
          { label: "Large upload to unknown countries", description: "High upload volume to countries irrelevant to business operations is a classic indicator of data exfiltration. Cross-check immediately with the Threat Intelligence page." },
          { label: "Traffic changes with time filter", description: "Geographic traffic fluctuates based on user activity. Compare daily vs. weekly patterns to distinguish a consistent anomaly from an incidental spike." },
        ],
      },
    ],
  },
];
