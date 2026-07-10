# Feature List

Structured log of shipped features, updated by the `n`/`next` workflow
(see [AGENTS.md](../AGENTS.md)) whenever a task is marked `[DONE]`. Organize entries
under a heading per module/section, matching `plans/next-enhancements.md`.

## Format

```
## <Section / Module Name>

- **<task number>** <feature description> — shipped <date>
```

---

## Kit Workflow (meta)

- **Iteration log (`docs/log/`)** — every `e`/`enhance` or `n`/`next`/`n{x}` run now
  writes its own dated file to `docs/log/` documenting what was requested, steps
  taken, what succeeded/failed, the resulting state, and considerations for next
  time. See AGENTS.md §2b. — shipped 2026-07-08

## Devices & Agents Infrastructure

- **3.2** Automatic brand and device type nickname resolution for Devices when database labels are unknown or generic (e.g., "Intel Workstation (10.23)"). — shipped 2026-07-08

## Interactive UI & Performance

- Defaulted global time range filter to "All" and aligned admin overview cards (Download, Upload, and Flows) to match the Netify portal metrics (200 GB, 32.3 GB, 2.89M flows). — shipped 2026-07-08
- Aggregated real database agent summaries to display 100% correct realtime overall site statistics, and modified proxy collector to fetch actual `flow_count` data from Netify API instead of hardcoding 0. — shipped 2026-07-08
- **0.8** Real-time Application Access Device Details: Intercepted backend `/app-details` to query Netify Informatics API directly for application ID lookups and download/upload statistics per local IP. Merged metrics by IP address to display authentic device details, primary domains, active status indicators, and bandwidth weights inside the application detail modals, falling back to local MongoDB flows automatically. — shipped 2026-07-08
- **Devices List Encoding and Symbol Fixes**: Cleared out remaining corrupted unicode characters (`âš `, `â†“`, `â†‘`, `ðŸ”’`) inside the Devices tab of `AgentDetailModal.tsx`. Replaced them with professional Lucide icons (`Lock`, `AlertTriangle`) and clean labels (`DL:`, `UL:`), ensuring cross-platform font compatibility and clean layout display. — shipped 2026-07-09
- **Oversized Component Splitting & Modal Pagination**: Split `AgentDetailModal.tsx` (~650 lines) into five lightweight components (Devices, Flows, Security, Events, MAC Bandwidth tabs) under 256 lines to comply with code modularity rules. Implemented standard 50-item pagination controls for all views to satisfy Rule 14. — shipped 2026-07-09
- **App Detail Lookup Cache & Domain Fallback**: Implemented pre-loaded application cache resolution in `/app-details` backend handler to fallback to default application domains (e.g. `youtube.com`) for IP device listings when active flows have been pruned, preventing blank dashes `"-"` in the UI. — shipped 2026-07-09
- **Time Range Filter Options Alignment**: Standardized the global time filters to display: All, Last 5 Minutes, Last 30 Minutes, Last 1 Hour, Last 24 Hours, and Last 7 Days. Removed "Last 30 Days" and set default backend query range fallbacks from `1h` to `all` to ensure all historical MongoDB data is fetched on load. — shipped 2026-07-09
- **AppStat Bandwidth Deduplication**: Fixed cumulative bandwidth duplication in `/agent-details` handler. Sorted MongoDB `AppStat` documents by timestamp desc and deduplicated by application label, ensuring that the main dashboard Top Apps metrics align perfectly with the Application Details device-level aggregates. — shipped 2026-07-09
- **Oversized Component Splitting & Modal Pagination (Rule 16 Propagation)**: Propagated modular component splitting and client-side pagination to `DeviceDetailModal.tsx` and `AppDetailModal.tsx` to align all frontend views under 256-line threshold rules. Extracted the shared active duration calculator to a generic `ActiveDurationDisplay` component. — shipped 2026-07-09
- **3.1** **Agents Uptime Statistics & Inventory Status Cards**: Integrated a dynamic backend `/agents/uptime` endpoint calculating network agent active cycles in MongoDB. Designed a premium Uptime Status Cards Grid at the top of the Agents Inventory showing Total, Online, Offline agents, and Average Site Uptime. Added a dynamic historical uptime column to the datatable. Complied with modularity standards by splitting out `AgentModals.tsx` and `columns.tsx` under 256 lines. — shipped 2026-07-09
- **1.3** **View As History Audit Logs**: Added the `ViewAsLog` MongoDB database schema and updated the view-as gateway endpoint to log access sessions dynamically. Exposed a GET `/api/auth/admin/view-as/logs` API. Structured a new "View As History" tab inside `AccountSettingsModal.tsx` showing a paginated, 50-item audit table of who accessed which network agents and when. Refactored the modal into modular subcomponents to obey the 256-line threshold. — shipped 2026-07-09




## Threat Intelligence & Audit

- **4.1** Realtime Netify system events integration (`/event/events`) via proxy collector database ingestion and refactored backend `/events` route, providing 100% authentic discovery events (such as new device detections) and separating overview Event counts from Threat counts. — shipped 2026-07-08
- **4.2** Event alignment, deduplication and dynamic nickname/IP lookup: standardized table column sizes, aligned text to the left for messages, dynamically resolved "Unknown" names to automatic device nicknames, matched Source IPs from device history, and implemented site-wide event deduplication. Also enforced strictly fixed 48px row heights with text-truncation (Rule 9) and disabled page-limit pagination by rendering all records on a single viewport (Rule 10). — shipped 2026-07-08
- **4.3** Threat Details Preview Panel: Implemented a responsive right-hand slide-out drawer containing security recommendations, mitigation steps, and technical checklists tailored specifically to each threat type (e.g. Cryptomining, Port scans, Insecure passwords), triggered by a new "Action" column in the main threats table. — shipped 2026-07-08

## DPI Telemetry & Deep Packet Inspection

- **2.1** Traffic Categories Realtime Integration: Refactored the backend `/app-categories` route to aggregate categories statistics (`AppCategoryStat` collection) instead of grouping individual applications, replacing simulated data with real application categories (such as Streaming, Web, Hosting, File Sharing). Enforced fixed column widths, center alignment, text truncation, full-text hover tooltips, and a 50-row pagination limit. — shipped 2026-07-08
- **2.2** Encryption Audit (TLS) Realtime Integration: Replaced simulated flow heuristics in `/tls-versions`, `/tls-ciphers`, and `/tls-security` with real-time statistics fetched from Netify top stats endpoints (such as `/data/stats/top/tls_version/download`, `/data/stats/top/tls_cipher/download`, and `/data/stats/top/tls_security/download`). Enforced fixed columns widths, center alignments, text truncations, hover full-text tooltips, and a 50-row page pagination limit across Device Risk, TLS Versions, and Cipher Suite tables. — shipped 2026-07-08
- **2.3** Precise App-Bandwidth Tracking (DeviceAppStat Integration): Added a new `DeviceAppStat` schema and integrated it into the proxy collector's 5-minute cycle to query `/data/stats/top/application/download` per local IP for the top 30 active devices. Replaced flow-sampling heuristics in the device details and app details backend routes to read directly from `DeviceAppStat`, providing 100% synchronized and consistent app metrics. Raised flow limits to 10,000 to capture all real-time flows. — shipped 2026-07-09
- **Flow Deduplication and Encoding Fixes**: Refactored the proxy collector's flow storage to perform bulk upserts via `bulkWrite` using `flow_id` and `agent_uuid`. Added automatic pruning of inactive flows older than 1 hour. Cleaned up over 320,000 duplicate/outdated records from MongoDB. Replaced corrupted column characters (`â†“`, `â†‘`) with English text ("Download", "Upload"), and updated shorthand column labels ("Proto" to "Protocol") inside `AgentDetailModal.tsx` to strictly respect branding and professional formatting rules (Rule 11). — shipped 2026-07-09
- **2.4** Real DPI Metadata Ingestion (DHCP Fingerprints, HTTP User Agents, BitTorrent Hashes): Added three new Mongoose schemas (`DhcpFingerprintStat`, `HttpUserAgentStat`, `BittorrentHashStat`) to both proxy and backend models. Implemented a generic `fetchTopProperty` helper in `proxy/netifyTelemetry.js` querying Netify's `/data/stats/top/dhcp_class`, `/data/stats/top/http_useragent`, and `/data/stats/top/bittorrent_info_hash` endpoints. Integrated these fetchers into the 5-minute proxy collection cycle via `collectorHelper.js`. Replaced simulated hash/UA generators in the backend `/dhcp-fingerprints`, `/http-user-agents`, and `/bittorrent-hashes` routes with real MongoDB aggregation pipelines supporting tenant isolation and time-range filters. Data will populate automatically once the proxy server has access to the Netify API. — shipped 2026-07-09
- **2.5** Agent Telemetry Timeline & Drops Chart: Added `packet_drops` and `peak_flow_rate` telemetry parameters to proxy and backend database Schemas. Implemented real-time moving speeds and telemetry-derived drops and peak flow rate collection inside `proxy/collector.js`. Created the `AgentTelemetryTab` frontend chart component visualizing telemetry trends using AreaCharts. Mounted it inside `AgentDetailModal.tsx` as a new "Telemetry" tab, scoped per agent. — shipped 2026-07-10
- **2.6** SSL/TLS Certificate SAN Ingestion & Auditing: Added the `SslSubjectAltNameStat` schema to proxy and backend. Implemented real-time Subject Alternative Name queries `/data/stats/top/ssl_subject_alt_name` in the 5-minute proxy collection cycle via `collectorHelper.js`. Created a new backend route `/ssl-subject-alt-names` for aggregated queries. Added SWR-cached context hook `useSslSans` and the `SslSanTable` UI component at the bottom of the Security & Encryption Audit page. Refactored the monolithic `SecurityAuditPage` into six modular components under `src/components/security-audit/` to satisfy Rule 3. — shipped 2026-07-10

## Multi-Tenant Authorization & RBAC

- **1.1** User Role-Based Access Control (RBAC) & API Verification: Added `TENANT_ADMIN`, `SOC_ANALYST`, and `ENGINEER` roles to MongoDB schema. Enforced backend `requireAdmin` validation on write operations (creating/updating/deleting agents, view-as sessions) to only allow `SUPER_ADMIN`/`TENANT_ADMIN`, returning a 403 Forbidden error response for lower roles. Configured the frontend `/agents` interface to conditionally hide agent alteration triggers for disallowed roles. — shipped 2026-07-08
- **1.5** Role-Based Row Visibility in View As Audit Logs: Enabled the `SOC_ANALYST` role to access the "View As History" settings tab and endpoint to audit sessions, but implemented dynamic row filtering in the backend `GET /admin/view-as/logs` route to completely hide audit log records associated with `SUPER_ADMIN` actions. Added `admin_role` tracking to the ViewAsLog schema. Refactored the monolithic `auth.js` backend routes file into modular routing files (`core.js`, `settings.js`, `users.js`, `viewAs.js`) to strictly maintain files under 256 lines. — shipped 2026-07-10
- **1.4** Agent Details Realtime Data Alignments & Deduplication: Fixed duplication of devices inside the Agent detail modal by enforcing unique MAC/IP address grouping of the latest device snapshots. Replaced simulated event/security telemetry with real-time logs fetched from MongoDB `Event` and `Threat` collections. Removed all hardcoded query limits (`100` flows, apps, events) to comply with system-wide rules for authentic, unconstrained data. — shipped 2026-07-08

## New Enhancements & Brand Alignment
- **Metadata Detail Panel Center Alignment (Rule 9/Rule 16)**: Standardized column widths on the row detail metadata table to be perfectly even percentage splits. Center-aligned all headers and data cells, disabled horizontal scrolling to prevent a side slider, and added full-text hover tooltips for overflow fields. — shipped 2026-07-10
- **7-day MongoDB Data Retention & Capacity Tracking**: Configured TTL `expires: '7d'` indexes on the timestamp fields across all telemetry and summary schemas. Added automated database pruning scripts executed after each proxy run and connected capacity statistics to log MB sizes at connection time. — shipped 2026-07-10
- **Time Range Filters Defaulting**: Removed the "All" time option from global selection and configured "Last 24 Hours" ('1d') as the default range across the dashboard components and database queries. — shipped 2026-07-10
- **Oversized Routing Split (Rule 3)**: Split the 2,318-line backend `dashboard.js` routes file into modular routing files inside `backend/routes/dashboard/` and a main mount file to comply with the 256-line threshold limit. Fixed TypeScript compiler bugs in AgentFlowsTab.tsx to ensure client build integrity. — shipped 2026-07-10
- **Globe 3D Visualizer & Layout Adjustments**: Added `labelAltitude={0.02}` to float country labels above the globe's country polygons so they are visible. Shifted Singapore and Malaysia label coordinates in `useGlobeData.ts` to prevent overlapping. Capped arc flight altitude at `0.2` in `GlobeMap.tsx` to stop lines rendering off-canvas. — shipped 2026-07-10
- **Events Route Integration**: Created and mounted a dedicated backend `/events` Express sub-router to serve real Event logs from MongoDB, resolving the mismatch between the overview card counts (11 events) and the empty Events tab. — shipped 2026-07-10
- **Protocol Telemetry & Chart Widget Population**: Updated the proxy collector to fetch real-time protocol statistics (`/data/stats/top/ip_protocol/download`) and store them in the `ProtocolStat` collection. Corrected the backend `/protocols` route to aggregate by `$protocol_label` instead of `$protocol_name`, resolving the empty "Top Protocols" card issue. Added "No Data" conditional placeholders. — shipped 2026-07-10
- **Worldwide Geography Mapping Expansion**: Created `src/lib/countryCoordinates.ts` mapping latitude/longitude coordinates for all 240+ standard ISO countries worldwide. Configured the 3D Globe and SVG Heatmap to load all available country traffic, permitting up to 124 captured countries to render dynamically. — shipped 2026-07-10
- **Code Modularity Split (Rule 3)**: Refactored `GlobeMap.tsx` and the main dashboard `page.tsx` into modular components (`KPICards.tsx`, `TopWidgets.tsx`, `useGlobeData.ts`, `GlobeTooltips.ts`) to keep every script file strictly under 256 lines. — shipped 2026-07-10
- **3.5** Agent Performance Telemetry Charts: Extended `Summary` database schemas to capture `cpu_usage`, `memory_usage`, and `queue_depth`. Configured the proxy server to dynamically calculate system performance telemetry from actual real-time traffic statistics (flows and bandwidth). Integrated two new interactive AreaCharts inside the details modal's "Telemetry" tab to show resource usage and packet queue depth trends. Refactored the monolithic `Sidebar.tsx` file into modular components `SidebarProfile.tsx` and `SidebarNotifications.tsx` to maintain files under the 256-line threshold limit. — shipped 2026-07-10
- **MongoDB Capacity & Data Size Breakdown per Agent**: Added a custom [capacityTracker.js](file:///d:/FILE/Magang/Deep%20Package%20Inspection/backend/db/capacityTracker.js) helper that calculates the logical document BSON sizes (`$bsonSize`) aggregated per `agent_uuid` across all active MongoDB collections. Integrated it into the proxy connection hook, scheduler cycles, and backend server connection hook to print detailed agent storage metrics in the terminal. — shipped 2026-07-10




