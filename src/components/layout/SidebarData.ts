import {
  LayoutDashboard, Server, Activity, Globe, Radio,
  ShieldAlert, Shield, AppWindow, Search, Router,
  PieChart, Database, Network, Zap
} from "lucide-react";

export const NAVIGATION_GROUPS = [
  {
    title: "OVERVIEW",
    items: [
      { name: "Overview Dashboard", href: "/", icon: LayoutDashboard },
    ]
  },
  {
    title: "INFRASTRUCTURE",
    items: [
      { name: "Network Topology", href: "/network-infrastructure", icon: Network },
      { name: "Agents", href: "/agents", icon: Server },
      { name: "Devices", href: "/devices", icon: Router },
    ]
  },
  {
    title: "TRAFFIC & ANALYTICS",
    items: [
      { name: "Flows", href: "/flows", icon: Activity },
      { name: "Apps", href: "/apps", icon: AppWindow },
      { name: "Traffic Categories", href: "/network-intelligence", icon: PieChart },
      { name: "DNS", href: "/dns", icon: Radio },
      { name: "Geo Traffic", href: "/geography", icon: Globe },
      { name: "DPI MetaData", href: "/dpi-analytics", icon: Database },
      { name: "App Lookup", href: "/lookup", icon: Search },
    ]
  },
  {
    title: "SECURITY & ALERTS",
    items: [
      { name: "Threat Intelligence", href: "/intelligence", icon: Shield },
      { name: "Detected Threats", href: "/threats", icon: ShieldAlert },
      { name: "Network Events", href: "/events", icon: Zap },
    ]
  }
];

export const TIME_OPTIONS = [
  { value: "5m", label: "Last 5 Minutes" },
  { value: "30m", label: "Last 30 Minutes" },
  { value: "1h", label: "Last 1 Hour" },
  { value: "1d", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
] as const;
