// proxy/scheduler.js
// Cron scheduler for automatic data collection from DPI API
// Runs every 5 minutes, collecting data for all agents or a specific agent.

const cron = require('node-cron');
const { collectAllAgents, collectSpecificAgent } = require('./collector');

// Mode: 'all' = collect all agents, 'agent' = collect specific agent
const COLLECT_MODE   = process.env.PROXY_COLLECT_MODE || 'all';
const SPECIFIC_AGENT = process.env.PROXY_AGENT_UUID   || null;
const CRON_SCHEDULE  = process.env.PROXY_CRON_SCHEDULE || '*/5 * * * *';

let isRunning = false;
let lastRunAt = null;
let lastRunResult = null;
let runCount = 0;

/**
 * Execute one collection cycle (called by cron and manual trigger).
 * Prevents concurrent runs with isRunning guard.
 */
async function runCollection() {
  if (isRunning) {
    console.log('[Scheduler] Skipping - previous run still in progress');
    return { skipped: true, reason: 'already_running' };
  }

  isRunning = true;
  lastRunAt = new Date();
  runCount++;

  try {
    let result;
    if (COLLECT_MODE === 'agent' && SPECIFIC_AGENT) {
      console.log(`[Scheduler] Run #${runCount} - Mode: SPECIFIC AGENT (${SPECIFIC_AGENT})`);
      result = await collectSpecificAgent(SPECIFIC_AGENT);
    } else {
      console.log(`[Scheduler] Run #${runCount} - Mode: ALL AGENTS`);
      result = await collectAllAgents();
    }
    lastRunResult = { ...result, run_count: runCount };
    
    // Log MongoDB database capacity usage after collection run
    const { logCapacityStats } = require('../backend/db/capacityTracker');
    await logCapacityStats(`[PROXY] [MongoDB] Capacity Used after Run #${runCount}:`);
    
    return lastRunResult;
  } catch (err) {
    console.error('[Scheduler] Unhandled error during collection:', err.message);
    lastRunResult = { success: false, error: err.message, run_count: runCount };
    return lastRunResult;
  } finally {
    isRunning = false;
  }
}

/**
 * Start the scheduler (cron job + immediate first run).
 */
function startScheduler() {
  console.log(`[Scheduler] Starting proxy data collector`);
  console.log(`[Scheduler] Mode     : ${COLLECT_MODE === 'agent' ? 'SPECIFIC AGENT (' + SPECIFIC_AGENT + ')' : 'ALL AGENTS'}`);
  console.log(`[Scheduler] Schedule : ${CRON_SCHEDULE} (every 5 minutes by default)`);

  // Validate cron expression
  if (!cron.validate(CRON_SCHEDULE)) {
    console.error(`[Scheduler] Invalid cron expression: "${CRON_SCHEDULE}". Using default.`);
  }

  // Start recurring cron job
  cron.schedule(CRON_SCHEDULE, () => {
    runCollection().catch(err => console.error('[Scheduler] Cron error:', err.message));
  });

  console.log('[Scheduler] Cron job registered. Starting initial collection...');
  
  // Initial run immediately on startup (async, do not block server start)
  setTimeout(() => {
    runCollection().catch(err => console.error('[Scheduler] Initial run error:', err.message));
  }, 2000);
}

/**
 * Get current scheduler status (for REST API endpoint).
 */
function getStatus() {
  return {
    is_running:    isRunning,
    run_count:     runCount,
    last_run_at:   lastRunAt?.toISOString() ?? null,
    collect_mode:  COLLECT_MODE,
    agent_uuid:    SPECIFIC_AGENT,
    cron_schedule: CRON_SCHEDULE,
    last_result:   lastRunResult,
  };
}

module.exports = { startScheduler, runCollection, getStatus };
