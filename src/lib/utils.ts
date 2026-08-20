import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export { formatAppLabel, getAppFavicon, getKnownDomainService } from "./domainUtils";

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

export function getActiveStatus(lastSeen: string | Date | null | undefined, thresholdMinutes: number = 5): boolean {
  if (!lastSeen) return false;
  try {
    const last = new Date(lastSeen).getTime();
    const now = Date.now();
    return (now - last) <= thresholdMinutes * 60 * 1000;
  } catch {
    return false;
  }
}
