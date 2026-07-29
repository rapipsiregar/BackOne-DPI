export function explainAppOrPort(appLabel: string | null, domain: string | null, port: number) {
  const label = appLabel || domain || "";
  const portStr = String(port);
  
  const matches: Record<string, string> = {
    "1433": "MSSQL Database Server",
    "1434": "MSSQL Monitor Server",
    "3306": "MySQL/MariaDB Database Server",
    "5432": "PostgreSQL Database Server",
    "1521": "Oracle Database Server",
    "27017": "Database Server",
    "6379": "Redis Key-Value Cache",
    "80": "Unencrypted Web Traffic (HTTP)",
    "443": "Encrypted Web Traffic (HTTPS/TLS)",
    "22": "SSH Remote Management / SFTP",
    "21": "FTP File Upload/Download (Unencrypted)",
    "23": "Telnet Command Shell (Insecure)",
    "25": "SMTP Mail Delivery",
    "587": "Secure SMTP Mail Delivery",
    "110": "POP3 Mail Storage Retrieval",
    "993": "Secure IMAP Mail Service",
    "53": "DNS Server Query (Domain Lookup)",
    "123": "NTP Network Clock Synchronizer",
    "161": "SNMP Network Device Monitoring",
    "3389": "RDP Remote Desktop Management",
    "445": "SMB Windows File Sharing",
    "137": "NetBIOS Name Service",
    "138": "NetBIOS Datagram Service",
    "139": "NetBIOS Session Service",
    "1812": "RADIUS Authentication Server",
    "1813": "RADIUS Accounting Server"
  };

  let mainLabel = label;
  let subLabel = matches[portStr] || (label.toLowerCase().includes("tls") || label.toLowerCase().includes("https") ? "Encrypted Connection (SSL/TLS)" : "");

  if (appLabel && appLabel.includes("(") && domain && domain.startsWith("Port ")) {
    mainLabel = appLabel;
    subLabel = domain;
  }

  return {
    main: mainLabel || `Port ${port}`,
    sub: subLabel
  };
}
