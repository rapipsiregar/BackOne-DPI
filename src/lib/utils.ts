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
      "27017": "Database Server",
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

export function formatOSLabel(os: string | null | undefined): string {
  if (!os || os === "-" || os === "Unknown") return "Unknown";
  const label = os.toLowerCase();
  
  if (label.includes("windows")) return "Windows";
  if (label.includes("mac") || label.includes("darwin") || label.includes("osx")) return "Mac";
  if (label.includes("android")) return "Android";
  if (label.includes("ios") || label.includes("iphone") || label.includes("ipad")) return "Apple iOS";
  if (label.includes("linux") || label.includes("ubuntu") || label.includes("debian") || label.includes("centos")) return "Linux";
  if (label.includes("tizen")) return "Tizen OS";
  if (label.includes("embedded") || label.includes("rtos")) return "Embedded OS";
  
  return "Other";
}

export function formatDeviceTypeLabel(type: string | null | undefined): string {
  if (!type || type === "-" || type === "Unknown" || type === "Generic Client") return "Unknown";
  const label = type.toLowerCase();
  
  if (label.includes("workstation") || label.includes("computer") || label.includes("laptop") || label.includes("desktop") || label.includes("pc")) return "Computer";
  if (label.includes("mobile") || label.includes("phone")) return "Mobile Phone";
  if (label.includes("tablet") || label.includes("pad")) return "Tablet";
  if (label.includes("router") || label.includes("gateway") || label.includes("switch") || label.includes("node") || label.includes("ap") || label.includes("network")) return "Networking";
  if (label.includes("firewall") || label.includes("security")) return "Firewall/Security";
  if (label.includes("printer") || label.includes("scanner")) return "Printer/Scanner";
  if (label.includes("tv") || label.includes("audio") || label.includes("video") || label.includes("dvr") || label.includes("camera") || label.includes("media")) return "TV/DVR/Audio";
  if (label.includes("database") || label.includes("server")) return "Server";
  
  return "Other";
}

export function formatTimestampWIB(ts: string | Date | null | undefined): string {
  if (!ts) return "-";
  try {
    return new Date(ts).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(/\./g, ':');
  } catch {
    return String(ts);
  }
}

export function calculateDuration(start: string | Date | null | undefined, end: string | Date | null | undefined): string {
  if (!start || !end) return "-";
  try {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const diff = Math.max(0, e - s);

    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ');
  } catch (e) {
    return "-";
  }
}

export function getKnownDomainService(domain: string | null | undefined): string | null {
  if (!domain) return null;
  const d = domain.toLowerCase();

  // CDN & Cloud Infrastructure
  if (d.includes("googlevideo.com")) return "YouTube (Google CDN)";
  if (d.includes("fbcdn.net")) return "Facebook CDN";
  if (d.includes("akamaihd.net") || d.includes("akamaized.net") || d.includes("akamai.net")) return "Akamai CDN";
  if (d.includes("cloudfront.net")) return "Amazon CloudFront";
  if (d.includes("amazonaws.com")) return "Amazon Web Services";
  if (d.includes("cloudflare.com") || d.includes("cloudflare.net")) return "Cloudflare";
  if (d.includes("fastly.net")) return "Fastly CDN";
  if (d.includes("cdn77.org") || d.includes("cdn77.net")) return "CDN77";

  // Tech Giants
  if (d.includes("apple.com") || d.includes("mzstatic.com")) return "Apple Services";
  if (d.includes("icloud.com") || d.includes("apple-cloudkit.com")) return "Apple iCloud";
  if (d.includes("microsoft.com") || d.includes("live.com") || d.includes("office.com")) return "Microsoft Services";
  if (d.includes("windowsupdate.com")) return "Windows Update";
  if (d.includes("google.com") || d.includes("googleapis.com") || d.includes("gstatic.com")) return "Google Services";

  // Social & Media
  if (d.includes("whatsapp.net") || d.includes("whatsapp.com")) return "WhatsApp";
  if (d.includes("instagram.com")) return "Instagram";
  if (d.includes("tiktokv.com") || d.includes("tiktokcdn.com") || d.includes("byteoversea.com") || d.includes("tiktok.com")) return "TikTok";
  if (d.includes("netflix.com") || d.includes("netflix.net") || d.includes("nflxvideo.net") || d.includes("nflxext.com")) return "Netflix";
  if (d.includes("spotify.com") || d.includes("spotifycdn.com") || d.includes("scdn.co")) return "Spotify";
  if (d.includes("twitter.com") || d.includes("twimg.com") || d.includes("x.com")) return "X (Twitter)";
  if (d.includes("zoom.us")) return "Zoom Video";
  if (d.includes("discord.gg") || d.includes("discord.com") || d.includes("discordapp.net") || d.includes("discordapp.com")) return "Discord";
  if (d.includes("hystreamer.com") || d.includes("bigolive.tv")) return "Bigo Live";
  if (d.includes("xnxx-cdn.com") || d.includes("pornhub.com")) return "Adult Content (18+)";
  if (d.includes("kompas.com") || d.includes("kompas.id")) return "Kompas (Media)";
  if (d.includes("sfx.ms") || d.includes("onedrive.com") || d.includes("sharepoint.com")) return "Microsoft OneDrive";
  if (d.includes("symantecliveupdate.com") || d.includes("norton.com")) return "Symantec/Norton Antivirus";
  
  // E-Commerce & Local (Indonesia)
  if (d.includes("shopeemobile.com") || d.includes("shopee.co.id")) return "Shopee";
  if (d.includes("tokopedia.com") || d.includes("tokopedia.net")) return "Tokopedia";
  if (d.includes("gojek.com") || d.includes("go-jek.com")) return "Gojek";
  if (d.includes("grab.com")) return "Grab";
  
  // Gaming
  if (d.includes("steampowered.com") || d.includes("steamcontent.com")) return "Steam (Gaming)";
  if (d.includes("epicgames.com")) return "Epic Games";
  if (d.includes("roblox.com")) return "Roblox";
  if (d.includes("garena.com")) return "Garena";
  if (d.includes("hoyoverse.com") || d.includes("mihoyo.com")) return "HoYoverse (Genshin)";
  if (d.includes("riotgames.com") || d.includes("valorant")) return "Riot Games";
  if (d.includes("summonerswar") || d.includes("qpyou.cn")) return "Summoners War";
  // Dynamic Fallback Heuristic
  const parts = d.split('.');
  if (parts.length > 1) {
    let target = parts[parts.length - 2];
    // Handle double TLDs like .co.id, .com.sg, .ac.uk
    if (['co', 'com', 'ac', 'go', 'or', 'net', 'edu'].includes(target) && parts.length > 2) {
      target = parts[parts.length - 3];
    }
    // Remove dashes for aesthetic purposes
    target = target.replace(/-/g, ' ').trim();
    if (target && target.length > 2) {
      // Capitalize first letter of each word
      return target.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }

  return null;
}

export function getActiveStatus(lastSeen: string | Date | null | undefined, thresholdMinutes: number = 5): boolean {
  if (!lastSeen) return false;
  try {
    const last = new Date(lastSeen).getTime();
    const now = Date.now();
    // Default: active if seen within the last `thresholdMinutes` minutes
    return (now - last) <= thresholdMinutes * 60 * 1000;
  } catch {
    return false;
  }
}
