import { PageGuide } from "../types";

// Guide for the Device Labeling page
export const LABELING_GUIDES: PageGuide[] = [
  {
    id: "device-labeling",
    title: "Device Labeling",
    url: "/device-labeling",
    icon: "🏷️",
    summary: "Assign custom names to MAC addresses to identify device owners across all charts, tables, and flow records.",
    sections: [
      {
        heading: "What is Device Labeling?",
        content: "The Device Labeling page allows administrators to assign meaningful, human-readable custom names (labels) to devices detected on the network — identified by their unique MAC address. Without labeling, devices appear only as raw MAC or IP addresses in flows and traffic tables. With a label, every chart and flow record across the entire dashboard will display the friendly name instead.",
      },
      {
        heading: "Device Asset Directory Table — Column Reference",
        columns: [
          { column: "#", description: "Sequential row index number for easy reference." },
          { column: "MAC Address", description: "The hardware MAC address of the device, e.g. 'bc:45:5b:ca:d5:be'. Click the MAC address to open the full Device MAC Details modal with comprehensive traffic history." },
          { column: "IP Address", description: "The last known IPv4 address assigned to this device. IP addresses can change (DHCP), so MAC is the primary identifier." },
          { column: "Vendor / Manufacturer", description: "Network card manufacturer identified from the MAC address OUI prefix (e.g. 'Apple, Inc.', 'Samsung Electronics'). Helps identify unknown devices." },
          { column: "Device Type", description: "Automatically inferred device category based on IP address range and traffic patterns (e.g. 'Core Network Node', 'End Device', 'IoT Device')." },
          { column: "Agent", description: "The DPI probe that captured this device's traffic. Useful in multi-site deployments to know which sensor segment the device belongs to." },
          { column: "Default Label", description: "System-generated auto-label derived from MAC vendor + device type + IP. This is the fallback label displayed if no custom label has been set." },
          { column: "Custom Label", description: "The human-readable label set by the administrator. Once set, this name overrides the default label on all dashboard pages — flows, apps, devices, threats, etc. Leave blank to use the default label." },
          { column: "Owner", description: "Optional owner name or department associated with this device (e.g. 'IT Team', 'John Doe - Finance'). Useful for asset management and troubleshooting." },
          { column: "Actions", description: "Edit icon (✏️) — opens the Edit Label & Owner modal to set or update the custom label and owner for this MAC address." },
        ],
      },
      {
        heading: "How to Assign a Custom Label",
        steps: [
          "Find the device you want to label using the Search box (search by MAC, IP, vendor, or existing label).",
          "Click the ✏️ Edit icon in the Actions column for that device row.",
          "In the Edit Label & Owner modal, type the desired Custom Label (e.g., 'Reception Desk PC') and optionally an Owner name.",
          "Click Save. The new label is immediately saved to the database and will appear across all dashboard pages.",
          "To clear a label and revert to the default, open the edit modal, clear the Custom Label field, and save.",
        ],
      },
      {
        heading: "Device MAC Details Modal",
        content: "Click on any MAC address in the table to open the full Device MAC Details modal. This modal shows:",
        items: [
          { label: "Device Identity", description: "MAC address, vendor, detected device type, and any custom label or owner that has been assigned." },
          { label: "Traffic Summary", description: "Total download and upload volume, total flows, and last active timestamp for this device." },
          { label: "Top Applications", description: "The most-used applications detected for this device (e.g., YouTube, WhatsApp, Office 365)." },
          { label: "Recent Flows", description: "A paginated list of the most recent network connections from this device — destination IP, port, protocol, and bandwidth." },
          { label: "Security Alerts", description: "Any threat signatures detected from or to this device, if applicable." },
        ],
      },
      {
        heading: "Tips & Best Practices",
        items: [
          { label: "Use descriptive labels", description: "Include location and purpose in the label, e.g. 'F1-Lobby-TV' or 'Server-Room-NAS-01'. This makes flows and alerts self-explanatory." },
          { label: "Label your gateway", description: "The router/gateway device (usually the lowest IP, e.g. 10.0.0.1) generates the most traffic. Label it clearly so it is easily distinguishable from client devices." },
          { label: "Labels persist across sessions", description: "Custom labels are stored in the database — they persist permanently until manually changed or deleted, even after system restarts." },
          { label: "Time filter applies to traffic stats", description: "The time filter (Last 24 Hours, Last 7 Days, etc.) in the sidebar affects traffic-based stats shown in the Detail modal, but device labels are always current." },
        ],
      },
    ],
  },
];
