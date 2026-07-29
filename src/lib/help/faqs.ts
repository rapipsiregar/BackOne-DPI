import { FAQItem } from "./types";

export const FAQS: FAQItem[] = [
  {
    question: "Why is the Threats data empty (0)?",
    answer:
      "If the Threats indicator shows 0, it means your network is secure within the selected time range. The system did not detect any data packets matching known attack profiles.",
  },
  {
    question: "What is the difference between Events and Threats?",
    answer:
      "Events are all standard connection activity logs recorded on the network (including secure ones). Threats are a subset of specific Events that have been filtered and classified as malicious activity by the Deep Packet Inspection (DPI) engine.",
  },
  {
    question: "How do I read the Geo Traffic Heatmap?",
    answer:
      "Light blue indicates low traffic, while deep/dark blue indicates a very high traffic volume (download/upload) to or from that country.",
  },
  {
    question: "How is an Agent's Online or Offline status determined?",
    answer:
      "An agent's status is determined in real-time based on active flows. If the agent has successfully transmitted network traffic within the last 24 hours, its Traffic Status column displays a green pulsing beacon with the exact timestamp 'Last seen: HH:MM WIB'. If no traffic has been received beyond that 24-hour window, it is displayed as 'No Flows Detected' with a grey indicator.",
  },
  {
    question: "Why do flow lines on the Agent map only appear between certain agents?",
    answer:
      "To avoid visual clutter and represent real-time routing accurately, flow lines are drawn ONLY between agents that have active data transactions. Sibling agents without current traffic flows between them will not show a line. Hovering over an active line opens a detailed tooltip listing the top active sub-flows, data volume, and connection counts.",
  },
  {
    question: "What is the data retention limit for telemetry and flows?",
    answer:
      "To maintain system database efficiency and high query performance, all network telemetry, flows, and summary documents older than 30 days are automatically deleted by the database scheduler.",
  },
  {
    question: "Is there a limit on the number of records displayed or analyzed?",
    answer:
      "No arbitrary limits are imposed. The database query limits and collection size limits are configured to support the platform's maximum capacity of 1,000,000 (1 million) records.",
  },
  {
    question: "How does server-side pagination work on tables like Flows?",
    answer:
      "Large data tables utilize server-side pagination with a fixed page size of 50 items. The sequential index (# column) continues seamlessly across pages (e.g. Page 2 starts at index 51) to maintain structural consistency.",
  },
  {
    question: "How does the \"View As Agent\" mode affect the dashboard data?",
    answer:
      "When 'View As Agent' mode is enabled, the entire data scope on the dashboard is locked to that specific agent. You will only see active devices, DNS logs, traffic flows, and threats detected specifically by that agent, rather than the aggregate data of the entire site.",
  },
  {
    question: "Why do some devices show \"Unknown\" for operating system or hostname?",
    answer:
      "Hostnames are resolved via local DNS queries, and operating systems are identified passively using HTTP User-Agent and DHCP Fingerprints. If a device has not sent standard HTTP traffic or has recently connected without requesting a new IP, the system will display 'Unknown'.",
  },
  {
    question: "What should I do if the Encryption Audit flags a connection as \"High Risk\"?",
    answer:
      "A 'High Risk' status is typically triggered by the use of legacy encryption versions such as TLS 1.0 or TLS 1.1, which are vulnerable to eavesdropping. It is recommended to update the destination server configuration or client systems to use at least TLS 1.2 or TLS 1.3.",
  }
];
