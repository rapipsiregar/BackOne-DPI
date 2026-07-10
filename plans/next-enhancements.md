# Next Enhancements

This file is the working backlog driven by the `e`/`enhance` and `n`/`next` triggers defined in [AGENTS.md](../AGENTS.md).

## 1. Multi-Tenant Authorization & RBAC

- **1.1** [DONE] Add user role verification checks to all backend dashboard API routes, throwing a 403 Forbidden for SOC_ANALYST or lower role users attempting sensitive write actions.
- **1.2** [DONE] Implement a session timeout warning dialog that prompts users 2 minutes before their authentication token expires, allowing single-click session renewal.
- **1.3** [DONE] Build a visual log history table of "View As" session entries in the Admin Settings modal to keep track of which administrators viewed which agents and when.
- **1.4** [DONE] Add user profile settings to allow changing account passwords directly from Settings with robust verification logic.
- **1.5** [DONE] Implement role-based row visibility in audit logs, preventing SOC_ANALYST from viewing SUPER_ADMIN view-as history.
  *Note: Allowed SOC_ANALYST to access the View As History tab, but filtered out any audit logs performed by SUPER_ADMIN in the backend `/admin/view-as/logs` route.*
- **1.6** [TODO] Add a tenant dashboard configuration schema in MongoDB, permitting custom dashboard layout definitions per site_uuid.
- **1.7** [TODO] Build an active session management table showing all active logged-in sessions for the tenant, with remote revocation capability.

## 2. DPI Telemetry & Deep Packet Inspection

- **2.1** [DONE] Integrate real-time Netify application category statistics (`/data/stats/top/application_category`) to replace the simulated app name groupings.
- **2.2** [DONE] Retrieve actual TLS versions, cipher suites, and security levels from Netify top stats endpoints in the proxy collector.
- **2.3** [DONE] Add DeviceAppStat collection & backend integration for precise app-bandwidth tracking per IP without data sample limits.
- **2.4** [DONE] Implement actual DPI metadata extraction for DHCP fingerprints, User Agents, and BitTorrent hashes via Netify's dedicated properties endpoints in the proxy collector.
- **2.5** [DONE] Build a visual timeline graph showing the peak flow rates and packet drops per agent over the selected time range.
- **2.6** [DONE] Integrate SSL/TLS certificate subject alternative name (SAN) parsing and query support for encryption auditing.
- **2.7** [TODO] Support application-specific signature configuration updates synchronized automatically across all tenant proxy collectors.

## 3. Devices & Agents Infrastructure

- **3.1** [DONE] Implement a real-time status card in the Agents Inventory list showing historical uptime percentage over the selected time range.
- **3.2** [DONE] Add automatic brand and device type nickname resolution for Devices.
- **3.3** [TODO] Extend the Network Topology graph to allow users to toggle connection paths based on either traffic volume or protocol type.
- **3.4** [TODO] Create an automated email report subscription option for Agent health alerts and offline detection warnings.
- **3.5** [DONE] Build an agent performance telemetry chart displaying memory, CPU usage, and queue depth historical trends.

## 4. Threat Intelligence & Audit

- **4.1** [DONE] Fetch and store real system events (`/event/events`) in the proxy collector, and update the `/events` backend route.
- **4.2** [DONE] Extract real security anomalies and threat alerts from Netify in the proxy collector.
- **4.3** [DONE] Implement a threat detail preview panel that displays recommendations and mitigation steps for each selected threat type.
- **4.4** [TODO] Add automated wazuh-agent payload query scanning for suspicious host events.
- **4.5** [TODO] Build an interactive rule editor for custom alert suppression in the Cyber Threats dashboard page.
- **4.6** [TODO] Add threat geographic visualization matching source IPs against maxmind geoip collections in the Threat Intelligence page.

## 5. Interactive UI & Performance

- **5.1** [DONE] Query and store real top destination countries (`/data/stats/top/country`) in the proxy collector.
- **5.2** [DONE] Add support for custom CSV exports on the Devices, Flows, and Threats lists.
- **5.3** [TODO] Implement responsive card grid alternatives for all tables on small mobile screen viewports.
- **5.4** [TODO] Build a customizable dashboard widget layout engine allowing users to drag, drop, and resize chart tiles.
- **5.5** [TODO] Optimize large table rendering performance using react-window virtualization for tables containing more than 500 rows.
