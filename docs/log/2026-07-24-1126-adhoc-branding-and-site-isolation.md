# Iteration Log - 2026-07-24-1126-adhoc-branding-and-site-isolation

## Request
Address branding leaks (BackOne logos and titles showing up on the Nexus site) and eliminate cross-tenant data leakage (SIAB agents and data appearing on the Nexus site). Ensure that data isolation is strict, so that non-global admins can only query data belonging to their respective sites.

## Steps Taken

1. **Created Branding Detection System**:
   - Added [branding.ts](file:///c:/Users/demo/Downloads/Deep%20Package%20Inspection/src/lib/branding.ts) to detect whether the user is on the "Nexus", "SIAB", or "BackOne" site based on URL hostname, localStorage, and query arguments.
2. **Branded Login Page**:
   - Updated [login/page.tsx](file:///c:/Users/demo/Downloads/Deep%20Package%20Inspection/src/app/login/page.tsx) to dynamically choose the correct logo and text headings matching the host domain.
3. **Reactive Sidebar Branding & Title Replacement**:
   - Refactored [Sidebar.tsx](file:///c:/Users/demo/Downloads/Deep%20Package%20Inspection/src/components/layout/Sidebar.tsx) to auto-lock the selected site state based on the logged-in user's site UUID if they are a `TENANT_ADMIN` or `AGENT_VIEWER`.
   - Intercepted `document.title` on the client side using `Object.defineProperty` to dynamically rewrite tab titles (e.g. replacing "BackOne" with "Nexus" when on the Nexus tenant site).
4. **Site-Isolated Server Action**:
   - Secured `getAgents` in [agents.ts](file:///c:/Users/demo/Downloads/Deep%20Package%20Inspection/src/lib/actions/agents.ts) by verifying the session cookie inside Next.js Server Actions using a new helper `getAuthUser()`. Restricts the queried site UUID to the tenant admin's site UUID.
5. **Site-Isolated Backend REST Endpoints**:
   - Updated `/api/dashboard/agents/uptime` and `/api/dashboard/agents/storage` to enforce strict site filtering. In particular, the storage stats endpoint now filters out any agent IDs that do not belong to the active site.
6. **Automated Site Isolation Testing**:
   - Created [test-site-isolation.js](file:///c:/Users/demo/Downloads/Deep%20Package%20Inspection/test/test-site-isolation.js) to assert that logging in as Nexus Admin only exposes Nexus agents, with zero SIAB data leakages.

## Outcome
- **TDD Integration Verification**: `node test/test-site-isolation.js` passed successfully. Uptime and storage keys returned strictly contain Nexus agents (`2N-ID-VQ-AL`, `1T-5Q-RC-AS`), with 0 leaks from SIAB.
- **Dynamic Branding**: The login page and dashboard sidebar correctly switch logos and page tab titles dynamically when navigating under the Nexus site.
- **Production Build and Deployment**: The Next.js production build succeeded locally. The remote deployment was fully uploaded to PM2 server, and reloads completed without errors.

## Considerations for Next Time
- Whenever adding new dashboards or sub-routers in `backend/routes/dashboard/`, always use `getBaseFilter(req)` or verify that JWT/role site overrides are applied correctly so that site-scoped admins are restricted.
