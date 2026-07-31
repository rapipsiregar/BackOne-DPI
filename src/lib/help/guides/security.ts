import { PageGuide } from "../types";

export const SECURITY_GUIDES: PageGuide[] = [
  {
    id: "intelligence",
    title: "Threat Intelligence",
    url: "/intelligence",
    icon: "🛡️",
    summary: "Overview of security intelligence feeds, anomalies, and active network risk indicators.",
    sections: [
      {
        heading: "Security Intelligence Feeds",
        content: "The Threat Intelligence dashboard provides a consolidated view of potential security issues, risky behavior, and unencrypted credentials detected on the network. These indicators help security teams perform proactive threat hunting.",
      },
      {
        heading: "Intelligence Categories",
        items: [
          { label: "Crypto Mining", description: "Identifies devices actively participating in cryptocurrency mining pools. Mining traffic uses specific protocols (e.g. Stratum) and ports that consume CPU/GPU and network resources." },
          { label: "Tor Detection", description: "Detects connections routing through the Onion Router (Tor) network, which is used for anonymous browsing and can indicate malware C2 channels or unauthorized employee activity." },
          { label: "VPN Detection", description: "Identifies active VPN connections. VPN tunnels bypass corporate network controls and obscure traffic inspection, posing security and compliance risks." },
          { label: "IP Reputation", description: "Flags connections to remote servers with known bad reputation history (malware distribution, phishing, spam sources) based on dynamic threat feeds." },
          { label: "Insecure Protocols", description: "Identifies legacy or plaintext protocols (HTTP, FTP, Telnet) in use that expose data to interception or spoofing." },
          { label: "Unencrypted Passwords", description: "Critical alert showing plaintext passwords captured in unencrypted transit (e.g., via HTTP Basic Auth or plaintext FTP logins)." },
          { label: "Encryption Audit", description: "Reviews the TLS/SSL versions and cipher strength of encrypted connections on the network to identify legacy ciphers (RC4, 3DES) or vulnerable TLS 1.0/1.1 protocols." },
          { label: "Device Discovery", description: "Tracks new or newly active devices communicating on the network to prevent rogue/unauthorized hardware from connecting." },
          { label: "Server Discovery", description: "Detects active local servers hosting services on corporate subnets, ensuring all local services are cataloged and authorized." }
        ]
      },
      {
        heading: "Action and Remediation",
        items: [
          { label: "Plaintext Passwords", description: "Investigate immediately. Identify the affected user, enforce a password reset, and configure the target application to use secure TLS/HTTPS." },
          { label: "Tor / VPN Tunnels", description: "Identify the device establishing the tunnel. Confirm if it is a business requirement or a violation of corporate network access policies." },
          { label: "IP Reputation Flags", description: "Cross-reference destination IPs. Block malicious destination IPs at the firewall and run a security scan on the internal source device." }
        ]
      }
    ]
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
          { label: "Critical (Red)", description: "Conditions requiring immediate action. Examples: 'Agent 1T-5Q-RC-AS offline for >24 hours', 'Database connection failed', 'Disk space critical (>95%)'. Ignoring Critical events may result in monitoring data loss." },
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
