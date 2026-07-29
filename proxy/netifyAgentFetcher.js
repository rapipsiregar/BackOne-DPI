// proxy/netifyAgentFetcher.js
// ─────────────────────────────────────────────────────────────────────────────
// Fetches active agents from Netify Informatics API.
// Uses a two-strategy approach to handle endpoints that may timeout (Source 2).
// ─────────────────────────────────────────────────────────────────────────────

const { netifyFetch, agentMap } = require('./netifyClientCore');

// Strategy 1 timeout: 15s (agent/download can be slow on small deployments)
const PRIMARY_TIMEOUT_MS = 15000;

async function fetchAgents(siteUuid = null) {
  // Strategy 1: Use /data/stats/top/agent/download (standard Netify endpoint)
  // filter_interval reduced to 31 days to lessen query load vs. old 365-day value.
  const primaryPromise = (async () => {
    try {
      const data = await netifyFetch('/data/stats/top/agent/download', {
        filter_interval: 44640, // 31 days
        settings_limit: 1000000,
      }, null, siteUuid);
      if (data && Array.isArray(data) && data.length > 0) return data;
      return null;
    } catch (e) {
      return null;
    }
  })();

  const timeoutPromise = new Promise(resolve =>
    setTimeout(() => resolve(null), PRIMARY_TIMEOUT_MS)
  );

  const primaryData = await Promise.race([primaryPromise, timeoutPromise]);

  if (primaryData && Array.isArray(primaryData) && primaryData.length > 0) {
    const list = primaryData.map(r => ({
      id:           r.agent?.id,
      uuid:         r.agent?.uuid || r.agent?.serial,
      serial:       r.agent?.serial,
      label:        r.agent?.label || r.agent?.serial,
      provisioned:  true,
      activated:    true,
      last_seen_at: r.agent?.last_seen_at ?? null,
    })).filter(a => a.uuid);

    // Populate agentMap (uuid → id) for downstream filter_agents usage
    for (const a of list) {
      if (a.uuid && a.id) agentMap[a.uuid] = a.id;
    }
    return list;
  }

  // Strategy 2: Fallback — discover agents from /data/flows
  // Useful for Source 2 where /data/stats/top/agent/download consistently times out.
  console.log('[fetchAgents] Primary endpoint timeout/empty. Using flows-based agent discovery...');
  try {
    const flowData = await netifyFetch('/data/flows', {
      settings_limit: 100,
    }, null, siteUuid);

    if (!flowData || !Array.isArray(flowData)) return [];

    // Extract unique agent_uuids from flow records
    const seen = new Set();
    const agentList = [];
    for (const flow of flowData) {
      const uuid = flow.agent_uuid;
      if (uuid && !seen.has(uuid)) {
        seen.add(uuid);
        agentList.push({
          id:           null,
          uuid:         uuid,
          serial:       uuid,
          label:        uuid,
          provisioned:  true,
          activated:    true,
          last_seen_at: flow.last_seen_at ?? null,
        });
      }
    }

    console.log(`[fetchAgents] Fallback discovered ${agentList.length} agent(s) from flows.`);
    return agentList;
  } catch (e) {
    console.error('[fetchAgents] Fallback also failed:', e.message);
    return [];
  }
}

module.exports = { fetchAgents };
