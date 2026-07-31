import type { Agent } from "./agentsCore";

export async function fetchAgentsFromMongo(
  db: any,
  user: any,
  SITE_UUID?: string
): Promise<Agent[]> {
  const mongoose = require('mongoose');

  // Build site filter for company roles vs global roles
  const companyRoles = ['COMPANY_ADMIN', 'COMPANY_OPERATOR', 'COMPANY_VIEWER'];
  const isCompanyRole = companyRoles.includes(user.role);
  
  const filter: any = {};
  // Hanya apply site_uuid filter untuk NON-company roles
  if (SITE_UUID && !isCompanyRole) filter.site_uuid = SITE_UUID;

  // 🔒 Security: COMPANY_ADMIN/OPERATOR/VIEWER hanya boleh melihat agent yang di-assign
  // freshAgentUuids dideklarasikan di outer scope agar bisa dipakai di fallback summaries
  let freshAgentUuids: string[] = [];
  if (isCompanyRole) {
    // Selalu baca agent_uuids dari database — token bisa stale jika assignment berubah setelah login
    freshAgentUuids = user.agent_uuids || [];
    try {
      const UserModel = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ agent_uuids: [String] }, { strict: false }));
      const dbUser = await UserModel.findById(user.id).select('agent_uuids').lean() as any;
      if (dbUser?.agent_uuids && dbUser.agent_uuids.length > 0) {
        freshAgentUuids = dbUser.agent_uuids;
      }
    } catch (dbErr: any) {
      console.warn('[getAgents] Could not fetch fresh agent_uuids from DB, using token:', dbErr.message);
    }

    if (freshAgentUuids.length > 0) {
      filter.uuid = { $in: freshAgentUuids };
    } else {
      // Tidak ada agent yang di-assign → kembalikan list kosong (secure by default)
      console.log(`[getAgents] ${user.role} ${user.username} has no assigned agents — returning []`);
      return [];
    }
  }

  // 1. Get agents from agent_registry (filtered by role)
  const registryAgents = await db.collection('agent_registry')
    .find(filter)
    .sort({ uuid: 1 })
    .toArray();

  // 2. If agent_registry is empty, fall back to summaries
  let agentSource = registryAgents;
  if (registryAgents.length === 0) {
    const summaryFilter: any = { agent_uuid: { $nin: [null, ''], $exists: true } };
    // Hanya apply site_uuid filter untuk non-company roles
    if (SITE_UUID && !isCompanyRole) summaryFilter.site_uuid = SITE_UUID;
    // Apply company role filter on summaries fallback using fresh agent_uuids from DB
    if (isCompanyRole && freshAgentUuids.length > 0) {
      summaryFilter.agent_uuid = { $in: freshAgentUuids };
    } else if (isCompanyRole && freshAgentUuids.length === 0) {
      return [];
    }
    const agentSummaries = await db.collection('summaries')
      .aggregate([
        { $match: summaryFilter },
        { $sort: { timestamp: -1 } },
        { $group: { _id: '$agent_uuid', lastSeen: { $first: '$timestamp' }, label: { $first: '$agent_label' } } },
      ]).toArray();
    // Map summaries to registry-like format
    agentSource = agentSummaries.map((s: any) => ({
      uuid: s._id, serial: s._id, label: s.label, site_uuid: SITE_UUID,
      provisioned: true, activated: true, last_seen_at: s.lastSeen ? { date: s.lastSeen.toISOString() } : null,
    }));
  }

  // 3. Optimize status check and last seen per agent using parallel indexed queries
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600000);

  const agentResults = await Promise.all(
    agentSource.map(async (item: any, idx: number) => {
      const uuid = item.uuid || item.serial;
      if (!uuid) return null;

      // Execute status checks for active flow, latest flow, and latest summary in parallel
      const [activeFlow, latestFlow, latestSummary] = await Promise.all([
        db.collection('flows').findOne(
          { agent_uuid: uuid, timestamp: { $gte: twentyFourHoursAgo } },
          { projection: { _id: 1 } }
        ),
        db.collection('flows').findOne(
          { agent_uuid: uuid },
          { projection: { timestamp: 1 }, sort: { timestamp: -1 } }
        ),
        db.collection('summaries').findOne(
          { agent_uuid: uuid },
          { projection: { timestamp: 1 }, sort: { timestamp: -1 } }
        ),
      ]);

      const isOnline = !!activeFlow;

      const registryLastSeenRaw = item.last_seen_at;
      let lastSeenDate: Date | null = null;
      if (registryLastSeenRaw?.date) {
        lastSeenDate = new Date(registryLastSeenRaw.date);
      } else if (registryLastSeenRaw instanceof Date) {
        lastSeenDate = registryLastSeenRaw;
      } else if (typeof registryLastSeenRaw === 'string') {
        lastSeenDate = new Date(registryLastSeenRaw);
      }

      if (latestFlow && latestFlow.timestamp) {
        const flowDate = new Date(latestFlow.timestamp);
        if (!lastSeenDate || flowDate > lastSeenDate) {
          lastSeenDate = flowDate;
        }
      }
      if (latestSummary && latestSummary.timestamp) {
        const summaryDate = new Date(latestSummary.timestamp);
        if (!lastSeenDate || summaryDate > lastSeenDate) {
          lastSeenDate = summaryDate;
        }
      }

      let statusHuman = 'No Flows Detected';
      if (isOnline) {
        if (lastSeenDate) {
          const now = new Date();
          const isToday = lastSeenDate.getDate() === now.getDate() &&
                          lastSeenDate.getMonth() === now.getMonth() &&
                          lastSeenDate.getFullYear() === now.getFullYear();
          const timeStr = lastSeenDate.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) + ' WIB';
          const dateStr = lastSeenDate.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit' });
          statusHuman = isToday ? `Last seen: ${timeStr}` : `Last seen: ${dateStr} ${timeStr}`;
        } else {
          statusHuman = 'Last seen: Just now';
        }
      }

      return {
        id: idx + 1,
        uuid: uuid,
        serial: item.serial || uuid,
        site_uuid: item.site_uuid || SITE_UUID || '',
        organization_uuid: '',
        provisioned: item.provisioned ?? true,
        activated: true,
        label: item.label || uuid,
        created_at: { human: 'N/A', date: '', unix_time: 0 },
        updated_at: { human: 'N/A', date: '', unix_time: 0 },
        last_seen_at: {
          human: statusHuman,
          date: lastSeenDate?.toISOString() || '',
          unix_time: lastSeenDate ? lastSeenDate.getTime() / 1000 : 0,
        },
      } as Agent;
    })
  );

  return agentResults.filter(Boolean) as Agent[];
}
