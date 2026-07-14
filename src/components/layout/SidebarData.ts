import {
  LayoutDashboard, Server, Activity, Globe, Radio, Zap,
  ShieldAlert, Shield, Lock, AppWindow, Search, Router
} from "lucide-react";

export const NAVIGATION_GROUPS = [
  {
    title: "OVERVIEW",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
    ]
  },
  {
    title: "INFRASTRUCTURE",
    items: [
      { name: "Topology", href: "/network-infrastructure", icon: Globe },
      { name: "Agents", href: "/agents", icon: Server },
      { name: "Devices", href: "/devices", icon: Router },
    ]
  },
  {
    title: "TRAFFIC & ANALYTICS",
    items: [
      { name: "Flows", href: "/flows", icon: Activity },
      { name: "Apps", href: "/apps", icon: AppWindow },
      { name: "Traffic Categories", href: "/network-intelligence", icon: Activity },
      { name: "DNS", href: "/dns", icon: Radio },
      { name: "Geo Traffic", href: "/geography", icon: Globe },
      { name: "DPI MetaData", href: "/dpi-analytics", icon: Activity },
    ]
  },
  {
    title: "SECURITY & ALERTS",
    items: [
      { name: "Threat Intelligence Feeds", href: "/intelligence", icon: Shield },
      { name: "Threats", href: "/threats", icon: ShieldAlert },
      { name: "Events", href: "/events", icon: Zap },
      { name: "Encryption Audit (TLS)", href: "/security-audit", icon: Lock },
    ]
  },
  {
    title: "TOOLS & MANAGEMENT",
    items: [
      { name: "Lookup", href: "/lookup", icon: Search },
    ]
  }
];

export const TIME_OPTIONS = [
  { value: "5m", label: "Last 5 Minutes" },
  { value: "30m", label: "Last 30 Minutes" },
  { value: "1h", label: "Last 1 Hour" },
  { value: "1d", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
] as const;
