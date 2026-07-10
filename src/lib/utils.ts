import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtBytes(bytes?: number | null) {
  if (bytes == null || bytes === 0 || isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
  const i = Math.min(Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024)), units.length - 1);
  if (i < 0) return '0 B';
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

export function formatAppLabel(appLabel: string | null | undefined): string {
  if (!appLabel) return "-";
  const trimLabel = appLabel.trim();
  
  // Match "Port XXX" or just "XXX"
  const portMatch = trimLabel.match(/^(?:Port\s+)?(\d+)$/i);
  if (portMatch) {
    const port = portMatch[1];
    const portNum = parseInt(port, 10);
    const PORT_DESCRIPTIONS: Record<string, string> = {
      "20": "FTP-Data",
      "21": "FTP Control (File Transfer)",
      "22": "SSH (Secure Shell / SFTP)",
      "23": "Telnet (Unencrypted Terminal)",
      "25": "SMTP (Mail Transfer)",
      "53": "DNS (Domain Name Lookup)",
      "67": "DHCP Server",
      "68": "DHCP Client",
      "69": "TFTP (Trivial FTP)",
      "80": "HTTP (Unencrypted Web Traffic)",
      "88": "Kerberos Authentication",
      "110": "POP3 (Email Retrieval)",
      "123": "NTP (Network Clock Sync)",
      "137": "NetBIOS Name Service",
      "138": "NetBIOS Datagram Service",
      "139": "NetBIOS Session Service",
      "143": "IMAP (Email Access)",
      "161": "SNMP (Network Management)",
      "162": "SNMP Trap",
      "389": "LDAP (Directory Access)",
      "443": "HTTPS (Encrypted Web Traffic)",
      "445": "SMB (Windows File Sharing)",
      "465": "SMTPS (Secure Mail)",
      "500": "ISAKMP/IPSec (VPN Exchange)",
      "514": "Syslog (System Logging)",
      "587": "Submission (Secure Mail)",
      "636": "LDAPS (Secure LDAP)",
      "993": "IMAPS (Secure IMAP)",
      "995": "POP3S (Secure POP3)",
      "1433": "MSSQL Database",
      "1434": "MSSQL Monitor",
      "1521": "Oracle DB",
      "1812": "RADIUS Auth",
      "1813": "RADIUS Acct",
      "1900": "SSDP (UPnP Device Discovery)",
      "3306": "MySQL/MariaDB DB",
      "3389": "RDP (Remote Desktop)",
      "5060": "SIP (VoIP Session)",
      "5061": "SIPS (Secure VoIP)",
      "5353": "mDNS (Multicast DNS)",
      "5432": "PostgreSQL DB",
      "5900": "VNC Remote Access",
      "6379": "Redis In-Memory DB",
      "8000": "Alt HTTP (Web Proxy/Dev)",
      "8080": "Alt HTTP (Web Proxy/Dev)",
      "8443": "Alt HTTPS (Web Interface)",
      "9200": "Elasticsearch",
      "27017": "MongoDB DB",
    };
    
    if (PORT_DESCRIPTIONS[port]) {
      return `Port ${port} (${PORT_DESCRIPTIONS[port]})`;
    }
    
    // Fallback classification for unknown ports
    return portNum >= 1024 
      ? `Port ${port} (Custom/Ephemeral)`
      : `Port ${port} (System Port)`;
  }
  
  return trimLabel;
}

export function getAppFavicon(appLabel: string): string | null {
  if (!appLabel) return null;
  const label = appLabel.toLowerCase();
  
  // Mapping of common app labels to domains
  const domainMap: Record<string, string> = {
    facebook: 'facebook.com',
    youtube: 'youtube.com',
    google: 'google.com',
    zoom: 'zoom.us',
    cloudflare: 'cloudflare.com',
    ruijie: 'ruijie.com.cn',
    box: 'box.com',
    github: 'github.com',
    microsoft: 'microsoft.com',
    netflix: 'netflix.com',
    spotify: 'spotify.com',
    apple: 'apple.com',
    amazon: 'amazon.com',
    twitter: 'twitter.com',
    instagram: 'instagram.com',
    whatsapp: 'whatsapp.com',
    telegram: 'telegram.org',
    discord: 'discord.com',
    slack: 'slack.com',
    teams: 'teams.microsoft.com',
  };

  for (const [key, domain] of Object.entries(domainMap)) {
    if (label.includes(key)) {
      return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
    }
  }

  // Fallback to a domain-like resolution if it contains dots, or return null
  if (appLabel.includes('.')) {
    return `https://www.google.com/s2/favicons?sz=64&domain=${appLabel}`;
  }

  return null;
}

