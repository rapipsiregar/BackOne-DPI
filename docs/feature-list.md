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

## Agents Management

- **Ad-hoc** Optimized `getAgents` server action to perform fast, index-covered per-agent queries ($O(\log N)$) on the `flows` collection, completely eliminating the heavy collection-wide aggregations that caused HTTP 500/504 timeouts on the production server (demoplace). Fixed the "An unexpected response was received from the server" error, restoring the Agents Network Map, Agent List, and statistics cards to full functionality. — shipped 2026-07-23
- **Ad-hoc** Implemented dynamic unit formatting for the Data Size column on the Agents page, automatically converting values above 1024 MB to GB and values above 1024 GB to TB. — shipped 2026-07-23
- **Ad-hoc** Restored the Agents page link in the sidebar for TENANT_ADMIN role, matching the page-level permissions and letting tenant admins see and manage their own site's agents. — shipped 2026-07-24

## Sidebar & Brand Alignment

- **Ad-hoc** Swapped and aligned the site UUID mapping logic between SIAB (site `1959bb55_045b_47c7_bbdd_f33b7db197b9` with agent `23-TE-6L-I2`) and Office (site `6681452d_9cae_4ff4_8ae8_0d504774265e` with agent `8A-V3-PB-85`) in the frontend, backend, and central MongoDB database. This aligns the client dashboard display with the authoritative dataset from the BackOne API (`https://api0.dev.backone.cloud/api/v1`), resolving swapped coordinates and mismatching agent lists. — shipped 2026-08-04
- **Ad-hoc** Separated the "Learn This Page" guides for the Threat Intelligence and Detected Threats pages into separate, custom guides showing unique instructions for each, and split the guides file into `threats.ts` to respect the 256-line threshold. — shipped 2026-07-27
- **Ad-hoc** Removed the route/slug path pill (e.g. `/intelligence`) from the header of the "Learn This Page" contextual help modals globally across all pages. — shipped 2026-07-27
- **Ad-hoc** Replaced the custom document title descriptor in `Sidebar.tsx` with a standard React-native `MutationObserver` title sync, ensuring the browser tab title dynamically switches to "Nexus" or "BackOne" in real-time depending on the logged-in user's site context. — shipped 2026-07-27
- **Ad-hoc** Updated the SIAB branding configurations in seeding files and database migrations to rename the footer copyright from "PT. SIAB Indonesia" to "PT. Data Bisnis Solusi", and successfully redeployed the updated build and configuration to the demoplace production domain. — shipped 2026-07-27
- **Ad-hoc** Fixed multitenant branding bug in `getSiteBranding` to correctly prioritize explicit site UUID checks (e.g. SIAB site `'6681452d_9cae_4ff4_8ae8_0d504774265e'`) over hostname fallbacks, and updated SIAB site branding to return the BackOne logo and BackOne brand name. This replaces the incorrect Nexus logo with the BackOne logo for SIAB accounts and removes "Nexus" from the App Lookup browser tab title and description. — shipped 2026-07-24
- **Ad-hoc** Localhost sidebar menu, branding logo, status pill, dropdown selectors, and page document titles matched 100% with domain. Distinct Lucide icons added to Flows, Traffic Categories, DPI MetaData, Network Topology, and Geo Traffic. Dynamic browser tab titles implemented for all dashboard pages. — shipped 2026-07-22
- **Ad-hoc** Redesigned the Active Site and Time Filter selectors in the sidebar to match a premium double-row card design, featuring standalone naked line icons (Activity and Calendar) in blue, clean uppercase tracking labels, bold white sans-serif text values, and clean borders with dropdown indicators. — shipped 2026-07-22
- **Ad-hoc** Aligned the entire sidebar font style and font sizes with the demoplace production domain by applying a Times New Roman serif font stack to the entire sidebar container, menu links (`text-xs`), selector labels (`text-[10.5px]`), and values (`text-sm`). — shipped 2026-07-22
- **Ad-hoc** Restored the "Learn This Page" HelpTrigger button to all 14 dashboard pages (Overview, Agents, Apps, Devices, DNS, Events, Flows, Geography, Intelligence, Lookup, Network Infrastructure, Network Intelligence, Security Audit, Threats). Previously only dpi-analytics and threats had the button. TypeScript compilation verified: 0 errors. — shipped 2026-07-22
- **Ad-hoc** Implemented Agent Network Map on Agents page with: (1) interactive world map showing all agents as colored pins (green=online/pulse, red=offline) using react-simple-maps, (2) hover tooltips showing agent label, UUID, coordinates, and uptime %, (3) zoom/pan controls + reset to Indonesia center, (4) MapPin 📍 action button per agent row to open the coordinate input modal (AgentLocationModal), (5) status badge showing how many agents have locations configured vs. total. TypeScript: 0 errors. — shipped 2026-07-22

## App Database / Lookup

- **Ad-hoc** Fixed missing application logos, favicons, and full names in the App Lookup catalog database. Configured the proxy synchronizer (`proxy/netifyClientStats.js`) to parse and populate `logo`, `favicon`, `icon`, and `full_name` fields from Netify API payloads into MongoDB. — shipped 2026-07-22
- **Ad-hoc** Restored the Blacklist Configuration tab within the App Lookup page, implementing a tabbed layout (`App Catalog` and `Blacklist Configuration`) to enable admins/analysts (in Agent View mode) to manage domain and category blacklist rules. — shipped 2026-07-22
- **Ad-hoc** Transitioned telemetry ingestion pipeline to use 5-minute incremental deltas, refactoring backend aggregations (`/summary`, `/app-details`, `/device-details`) to sum deltas dynamically. This enables exact and coherent bandwidth stats across the entire dashboard based on timeRange filters (5m, 1h, 24h, 7d, 30d). — shipped 2026-07-22

## Visual & Typography

- **Ad-hoc** Fixed font readability issues on Agents page: reduced `font-bold`→`font-medium` on Historical Uptime column and `font-semibold`→`font-normal` on Data Size column. Added `text-xs tracking-wide` to numeric values for cleaner rendering. Updated `--font-mono` CSS variable to use Inter font first (matching demoplace: `--default-mono-font-family: var(--font-inter)`) so all monospace numeric values render with Inter's clean tabular numerals instead of heavy system monospace. — shipped 2026-07-22
- **Ad-hoc** Applied Georgia font stack globally (`Georgia, serif, var(--font-sans)`) to body and configured Tailwind `@theme` replacement to map `--font-sans` to Georgia. Split `globals.css` into modular `globals.css`, `theme.css`, and `variables.css` files to comply with the 256-line threshold. — shipped 2026-07-23
- **Ad-hoc** Redesigned Active Site and Time Filter selectors in the sidebar to be semi-transparent using `bg-white/[0.03]` with hover adjustments, `backdrop-blur-md` (frosted glass), and muted slate text/icons for harmonious integration. — shipped 2026-07-23
- **Ad-hoc** Resolved dynamic layout shifting on Overview KPI cards by optimizing card padding to `p-4`, applying `whitespace-nowrap` to prevent values from wrapping, adjusting value font sizes to `text-[22px]`, and rendering invisible layout alignment placeholders to ensure perfectly aligned heights and baselines across all time filters. — shipped 2026-07-23

## Security & Session Management

- **Ad-hoc** Implemented a hybrid Tab-Aware 1-hour session security inactivity timeout using Page Visibility API. The timer runs silently when the user switches tabs, prevents immediate logouts or alerts during short tab-away periods (3-5 minutes), and displays the premium "Session Security Alert" warning modal only during the final 2 minutes. Resets to 1-hour automatically upon user interactions (clicks, keyboard inputs, mouse movements) while the tab is active/visible. Verified with unit tests. — shipped 2026-07-23
- **Ad-hoc** Configured the auth token cookie as session-only (by removing the `maxAge` option). This ensures the cookie is cleared immediately when the user closes their browser, preventing direct dashboard access on browser restart. — shipped 2026-07-24
- **Ad-hoc** Restricted the View As History logs visible to a TENANT_ADMIN to only include logs for agents within their own site and exclude all logs performed by SUPER_ADMIN (username "admin"). — shipped 2026-07-24
- **Ad-hoc** Restored Next.js middleware file `src/middleware.ts` (with function `middleware`) from the deprecated and non-functional `src/proxy.ts` setup. This fixes the server-side authentication routing and page-load crashes on the production server by properly registering the middleware manifest. — shipped 2026-07-24
- **Ad-hoc** Replaced client-side `router.push` redirects with robust `window.location.href` full page reloads on login and logout flows. This completely prevents chunk load failures ("This page couldn't load" screen) caused by stale JavaScript compiler hashes in active client browser sessions. — shipped 2026-07-24
- **Ad-hoc** Fixed deployment upload omissions in `scripts/deploy-sftp.js` by adding the `.next/static` and `public` directories to the SFTP `UPLOAD_MANIFEST`. This guarantees all compilation chunk files are successfully uploaded, eliminating the 404 chunk load errors that broke the login redirects. — shipped 2026-07-24
- **Ad-hoc** Implemented dynamic branding detection and logo rendering on the Sidebar component. Integrated `document.title` setter interceptor to dynamically rewrite tab titles matching active site names (e.g. Nexus vs. BackOne). Fixed React hydration mismatch in the sidebar logo image src using a mounted state wrapper. — shipped 2026-07-24
- **Ad-hoc** Secured `getAgents` Next.js server action and `/api/dashboard/agents/*` backend Express routes by decoding JWT and enforcing strict tenant site-isolation filters for non-global user roles (`TENANT_ADMIN`, `AGENT_VIEWER`). — shipped 2026-07-24
- **Ad-hoc** Reverted the Login page layout to the original BackOne logo and title as requested, keeping login branding standard. — shipped 2026-07-24
- **Ad-hoc** Rebranded the App Lookup description dynamically to match active site context (Nexus's vs. BackOne's) and implemented a dynamic rebranding middleware in the backend dashboard router to rewrite Netify/BackOne database content to Nexus on the fly. — shipped 2026-07-24



## Overview Dashboard & KPI Alignment

- **Ad-hoc** Implemented robust database fallback aggregation for Overview Dashboard KPIs (Download, Upload, Devices, Top Apps, Top Protocols) across all time filters. If pre-aggregated summary collections are empty (due to sensor data gap or offline status), the API dynamically calculates the metrics by fallback aggregation from raw `Flow` and `AppCategoryStat` logs. — shipped 2026-07-27
- **Ad-hoc** Aligned the **Flows** KPI count on the Overview Dashboard with the Flows list page count by querying the number of documents in the `Flow` collection directly, replacing the 5-minute stats delta sum. — shipped 2026-07-23
- **Ad-hoc** Aligned the **Threats** KPI count on the Overview Dashboard with the Detected Threats list page by implementing the same cybersecurity-events-to-threats fallback query when no primary threats exist. — shipped 2026-07-23

## Device Labeling & Flows Integration

- **Ad-hoc** Optimized `/api/dashboard/devices/labeling` backend query by replacing the heavy `Flow.aggregate` with an index-covered `Flow.distinct` scan followed by parallel `Flow.findOne` queries. This cut the API response duration from **7.7 seconds** to **91 milliseconds** (an 84x speedup) and resolved Next.js dev server memory depletion restarts. — shipped 2026-07-28
- **Ad-hoc** Enforced a strictly vertical-scroll-only layout by eliminating all horizontal scrollbars across the application. Converted rigid pixel-based column dimensions to percentage-based widths on the **Detected Threats**, **Network Flows**, **Recent Events**, and **Traffic Categories** tables, allowing them to shrink to fit smaller screens. Removed `whitespace-nowrap` from the `DataTable` headers to allow headers to wrap, locked container overflow to `overflow-hidden`, and refactored `DataTable.tsx` to extract pagination controls into a modular sub-component to stay under the 256-line threshold limit. — shipped 2026-07-28

## Viewport Auto-Scaling & Cross-Laptop Consistency

- **Ad-hoc** Implemented **Viewport Auto-Scaling** (`ViewportScaler.tsx`) using CSS `transform: scale(outerWidth / 1536)` with `transform-origin: top left`, mounted globally in `layout.tsx`. The entire dashboard now renders at the 1536px reference design width and is proportionally scaled down to fit any laptop screen size. Removed the `max-w-7xl` content container limit from `DashboardLayout.tsx` and added `html/body { overflow-x: hidden }` enforcement in `globals.css`. Also removed `whitespace-nowrap` from `DataTable` `<td>` cells and the "View Mitigation" action button in `threatColumns.tsx` to eliminate the last source of forced horizontal overflow. TypeScript: 0 errors. — shipped 2026-07-28

## User Accounts & Company Management

- **Ad-hoc** Implemented a Hierarchical Company-Based User Model and Multi-Agent delegation. Introduced 3 customer-tier roles (`COMPANY_ADMIN` [Tingkat 1], `COMPANY_OPERATOR` [Tingkat 2], and `COMPANY_VIEWER` [Tingkat 3]) to strictly isolate data queries per company. Created a dedicated **User Account** sidebar page grouping user lists into visual Cards per company, featuring an account quota tracker (Max 5 accounts per company) enforced at both backend API validations and frontend UI controls. Refactored the single-agent select dropdown on user registration modal into a checkbox checklist to assign multiple agents to operator accounts. — shipped 2026-07-28
- **Ad-hoc** Replaced the native browser role select dropdown in the external account registration modal with a custom DOM-based select element, ensuring the list options scale down proportionally with the page viewport. Removed parenthesized access suffixes from the "Executive" role, ordered roles from highest to lowest rank, and split the modal file to adhere to the 256-line threshold limit. — shipped 2026-07-28
- **Ad-hoc** Implemented a Device details pop-up modal and relational IP tracking history in the Device Labeling page, allowing administrators to click any MAC Address to view all unique associated IP addresses, activity dates, and traffic usage metrics resolved from Flow logs. Optimized the backend database query by indexing the `src_mac` field in FlowSchema and adding a compound index to support fast pagination scans. — shipped 2026-07-28
- **Ad-hoc** Fixed the critical "Unexpected end of form" error on the Create Technical Account form by creating dedicated Next.js API Routes for `/api/auth/admin/create-external-user` and `/api/auth/admin/update-agent-user` to proxy multipart/form-data requests reliably to the Express backend. — shipped 2026-08-04
- **Ad-hoc** Resolved the critical "Unexpected end of form" error globally across all proxy API routes by implementing transparent request stream forwarding (`req.body`) with direct `Content-Type` boundary preservation in the global Next.js gateway. This successfully restores profile picture uploads and account updates/resets to a 100% operational state. — shipped 2026-08-04
- **Ad-hoc** Expanded the **User Guide** (Learn This Page) for the `/user-accounts` page from 3 generic sections to 6 comprehensive sections: Company Tenant Cards overview, Account Table Column Reference (explaining each column: #, Account Name, Username, Role, Assigned Devices, Actions with color-coded role badges), Role Hierarchies with full permission descriptions, step-by-step guide to adding a new account (7 steps), step-by-step guide to editing or deleting an account (4 steps), and 5-Account Quota Limit explanation. — shipped 2026-07-28
- **Ad-hoc** Fixed critical `SyntaxError: Unexpected token '<', "<!DOCTYPE"` on `/user-accounts` page by correcting two bugs in `useExternalAccountForm.ts`: (1) wrong endpoint `/api/auth/users` → `/api/auth/admin/users`, (2) wrong response shape check `data.users` → `data.data` matching actual backend `{ok:true, data:[...]}`. Added `if (!res.ok) return null` safety guard. Fixed port conflict by moving backend to port 3002 and adding `NEXT_PUBLIC_API_URL=http://127.0.0.1:3002`. Fixed `ViewportScaler.tsx` to use `window.outerWidth` instead of `window.innerWidth` for correct split-screen scaling. — shipped 2026-07-28
- **Ad-hoc** Expanded the **User Guide** (Learn This Page) consistently across ALL major pages — `/user-accounts` (6 sections incl. column reference, add/edit/delete steps, quota) and `/agents` (8 sections incl. column reference, GPS setup steps, View As Agent workflow, Device Labeling MAC pop-up, monitoring tips). Split `agents.ts` guide into its own file to comply with the 256-line threshold; updated `helpContent.ts` to import from both `infrastructure.ts` and `agents.ts`. TypeScript: 0 errors. — shipped 2026-07-28

## Refactoring & Rebranding (Netify to BackOne)

- **Ad-hoc** Refactored name references from "Netify" to "BackOne" across environment variables, file names, import references, and parameters. Cleaned up over 5,500 lines of unused legacy backend files (`backone.js`, `scheduler.js`, `database.js`, `ingestionService.js`, `backoneDeviceFetcher.js`), satisfying the 256-line threshold compliance (Rule 3) and ensuring optimal workspace structure. Verified 100% success on Next.js build compile, arsitektur tests, and branding unit tests. — shipped 2026-08-03
- **Ad-hoc** Synchronized and fully integrated mobile responsive design including floating `MobileBottomBar`, `MobileTopBar`, drawer layouts for filters, and full compliance with Tailwind CSS. — shipped 2026-08-03
- **Ad-hoc** Integrated PDF print layout exports for both the Device Asset Listing directory and individual MAC Address details history modal. — shipped 2026-08-03
- **Ad-hoc** Implemented View-As impersonation mode for target operator/viewer accounts, with automated lockout recovery (Unlock action) in the user list and custom audit logging on impersonation startup. — shipped 2026-08-03
- **Ad-hoc** Fixed authentication loops in Next.js middleware by removing the automatic redirect from `/login` to `/` on invalid/stale session cookies. Configured the backend `requireAuth` and `requireAdmin` middleware to clear the `token` cookie immediately when verified as invalid. — shipped 2026-08-03
- **Ad-hoc** Positioned the profile account settings popover dynamically to open upwards (`bottom-full left-0 mb-2 w-full`) on mobile viewports to prevent layout clipping. Shipped a premium 0.5s slide-in/slide-out transition for the mobile drawer menu. — shipped 2026-08-03
- **Ad-hoc** Refactored the `DeviceDetailModal.tsx` component to make it fully mobile-friendly. Replaced vertical tab stacking with a horizontal scrolling tab navigation and introduced `DeviceKpiSection` to keep code under the 256-line threshold limit. — shipped 2026-08-03

## Flows & Time Filter

- **Ad-hoc** Fixed Flows page filter not working: filter values with `'All'` were still being sent to the backend as query params, causing the backend filter logic to be bypassed. Added `!== 'All'` guard for all filter params (`protocol`, `src_ip`, `dst_ip`, `dst_port`, `app`, `domain`, `sort_download`, `sort_upload`). — shipped 2026-08-07
- **Ad-hoc** Fixed `useCtxFetch` stale data issue: when endpoint changes due to filter change, old data was displayed until new data arrived. Now resets to `defaultValue` + shows loading on cache miss, preventing stale filter results from being shown. — shipped 2026-08-07

## Overview Dashboard / Summary

- **Ad-hoc** Fixed inflated Upload/Download values on Overview Dashboard Summary cards. Root cause: `summary.js` was summing ALL `Summary` documents within the 24h timeRange (288 snapshots × ~25MB = ~7GB incorrect). Fixed to use only the **latest single document per site** within the selected timeRange, which correctly represents current bandwidth. — shipped 2026-08-07
- **Ad-hoc** Fixed Summary bandwidth/flows cards to correctly respond to Time Filter changes from the sidebar. Previously the query ignored `timeRange` and always returned the globally latest document. Now `timeRange` is applied to `findOne` queries for both site-level and agent-level summaries, so changing the sidebar to "Last 5 Minutes", "Last 1 Hour", "Last 7 Days", etc. returns bandwidth data scoped to that period. — shipped 2026-08-07
- **Ad-hoc** Replaced the 3D rotating GlobeMap on the Overview Dashboard with an interactive, flat Leaflet-based world map (FlatWorldMap) using CartoDB Dark Matter tiles. Draws custom glowing markers (blue origin, severity-colored destinations) and animated flow dashed lines, showing real-time traffic connections with download/upload tooltips on hover. Commented out the GlobeMap code to preserve it as requested. — shipped 2026-08-20
- **Ad-hoc** Implemented smart, collision-avoiding marker tooltips on the FlatWorldMap, shifting the origin tooltip (JAKARTA SITE) above the marker and adjusting destination labels dynamically based on location names (e.g. left for Tangerang/Balaraja, right for Bandung, bottom for Internal Network) to prevent label overlap. — shipped 2026-08-20

- **Ad-hoc** Replaced the default `body` font family (which was Times New Roman / serif) in `globals.css` with a clean, modern sans-serif font stack (Inter, system-ui, etc.). This instantly updated all modal elements (download size badges, tab lists, network flows data table cells/headers, labels, and title texts) to use clean, modern, professional sans-serif typography. — shipped 2026-08-20
- **Ad-hoc** Removed light-mode grey background fallback classes (`bg-slate-50/50`, `bg-slate-50`, `hover:bg-slate-100/50`) and locked all device/IP details tab views (`DeviceAppsTab`, `DeviceDomainsTab`, `DeviceProtocolsTab`, `RemoteIpDetailModal`, `DeviceFlowsTab`, `RemoteIpLocalDevicesTab`) to dark theme transparent styles (`bg-white/[0.02]`, `bg-white/[0.03]`, `hover:bg-white/[0.05]`) permanently. — shipped 2026-08-20
- **Ad-hoc** Injected the `font-sans` class and softened outer modal card borders to `border-border/50` across all major detail modals (`DeviceDetailModal`, `RemoteIpDetailModal`, `AppDetailModal`, `AgentDetailModal`, `CategoryDetailPanel`, `TlsCipherDetailModal`, `MetadataDetailPanel`) to guarantee visual aesthetics remain clean, premium, and professional. — shipped 2026-08-20
