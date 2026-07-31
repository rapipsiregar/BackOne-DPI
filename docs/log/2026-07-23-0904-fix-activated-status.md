# Fix: Corrected 'Activated' Status Logic for Agents

**Trigger**: Clarification on 'Activated' vs 'Status' logic
**Date**: 2026-07-23 09:04 WIB
**Affected files**:
- `proxy/netifyClientStats.js`
- `src/lib/actions/agents.ts`

## Solution

1. Identified that the Informatics/API integration endpoint /data/stats/top/agent/download does not provide the active/activated status flag of the agent directly, leading the proxy client configuration to default it to `false`.
2. Changed the default `activated` mapping inside `proxy/netifyClientStats.js` to `true`, since any agent fetched from the platform's active collector/bandwidth list is indeed activated in Netify.
3. Updated the fallback aggregation mapper inside `src/lib/actions/agents.ts` to also default `activated` status to `true`.
4. Verified that `Status` (Online/Offline) correctly manages the real-time presence (active flows in the last 12 hours) while `Activated` correctly represents whether the agent has been activated on the platform, separating the concern of the two columns logically.
