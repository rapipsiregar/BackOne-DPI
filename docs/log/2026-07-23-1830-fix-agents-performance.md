# Fix: Optimized getAgents DB Queries for Production Scale

**Trigger**: Solve agents page timeouts/errors on demoplace production server
**Date**: 2026-07-23 18:30 WIB
**Affected files**:
- `src/lib/actions/agents.ts`
- `src/app/(dashboard)/agents/columns.tsx`
- `backend/routes/dashboard/summary.js`
- `src/proxy.ts`

## Solution

1. **Diagnosed Root Cause**: 
   - The Agents Inventory page on the production domain (`https://demoplace.my.id/agents`) was failing with *"An unexpected response was received from the server."* (HTTP 500/504).
   - Remote backend logs showed no active errors, but database queries on `flows` timed out or hung.
   - Identified that `getAgents` server action performed collection-wide aggregations and `distinct` queries on the `flows` collection to calculate the last seen dates and active status.
   - On the production database, the `flows` collection holds over **11.9 million documents** and lacks a general index starting with `timestamp` for those queries. This resulted in full collection scans and sorts, triggering timeouts.

2. **Implemented Indexed Per-Agent Queries**:
   - Refactored `getAgents` to perform fast, individual queries per agent.
   - Utilized the existing composite index `{ agent_uuid: 1, timestamp: -1 }` on the `flows` collection.
   - Checked active status using `findOne({ agent_uuid, timestamp: { $gte: twentyFourHoursAgo } }, { projection: { _id: 1 } })`.
   - Found flow last seen date using `findOne({ agent_uuid }, { projection: { timestamp: 1 }, sort: { timestamp: -1 } })`.

3. **Data Size Formatting**:
   - Updated the `Data Size` column renderer in `src/app/(dashboard)/agents/columns.tsx` to format dynamically:
     - `sizeMB >= 1024 * 1024` formats as `TB`
     - `sizeMB >= 1024` formats as `GB`
     - Otherwise formats as `MB`.
   - Wrote unit tests in `test/test-data-size-format.js` and successfully verified them.

4. **Pruned Cumulative Database Telemetry**:
   - Diagnosed that the Overview Dashboard on demoplace displayed corrupted bandwidth totals (e.g. `16.27 TB`) compared to Netify Portal (`153 MB`) because the database contained a mixture of historical cumulative telemetry and newly ingested incremental 5-minute deltas.
   - Executed a migration script `scripts/prune-production-cumulative.js` on the production MongoDB to delete the older cumulative summary documents from before the PM2 reload (pre-`18:50` WIB), resolving the TB/MB discrepancy.

5. **Overview Flows Summation & Alignment**:
   - Resolved the issue where the Flows count KPI card displayed real-time concurrent flows (the latest 5-minute snapshot, e.g., `126`) instead of aggregating them over the selected time range (e.g., 24 hours).
   - Refactored `backend/routes/dashboard/summary.js` to count the actual number of documents in the `Flow` collection matching the filter.
   - This ensures that both the Overview Dashboard Flows card and the `/flows` list page display identical, consistent counts (e.g., `30,759` flows).

6. **Overview Threats Fallback & Alignment**:
   - Resolved the discrepancy where the threats page showed `1` threat, but the Overview Dashboard showed `0` threats.
   - Identified that the `/threats` API endpoint falls back to counting cybersecurity-related events from the `Event` collection when there are no real threats in the `Threat` collection.
   - Refactored `backend/routes/dashboard/summary.js` to implement the same fallback logic for the dashboard's "Threats" card count when the primary `Threat` count is `0`.
   - Both pages now consistently display `1` threat.

7. **Next.js 16 Middleware Verification**:
   - Verified that Next.js 16 deprecates the `middleware.ts` naming convention in favor of `proxy.ts` (exporting a `proxy` function).
   - Confirmed that `src/proxy.ts` is fully active and automatically redirects unauthenticated users to `/login` (while logged-in users with a valid token cookie are bypassed to the dashboard directly).

8. **Verification**:
   - Ran queries directly on the production database via SSH; response time dropped from **hanging (>30s)** to **192ms** total.
   - Executed local tests using `npx tsx test/test-actions-agents.js`, verifying logic correctness.
   - Compiled Next.js locally (`npm run build`) successfully with zero errors.
   - Deployed changes to production using `node scripts/deploy-sftp.js`.
   - Verified that the `https://demoplace.my.id/agents` dashboard loaded successfully, showing formatted Data Sizes (e.g. `7.48 GB`) and correct real-time aggregate bandwidth (e.g., `2.02 MB`).
   - Confirmed that Overview Dashboard displays matching flows (`30,797`) and threats (`1`) in full alignment with their respective list pages.



