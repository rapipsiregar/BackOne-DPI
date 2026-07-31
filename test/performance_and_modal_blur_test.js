// test/performance_and_modal_blur_test.js
// ─────────────────────────────────────────────────────────────────────────────
// TDD Test Suite: Modal Backdrop Blur & High Performance Query Optimization
// ─────────────────────────────────────────────────────────────────────────────

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Running TDD Test: Modal Backdrop Blur & Performance Optimization');

// 1. Verify DeviceDetailModal backdrop overlay has backdrop-filter styling
const modalPath = path.resolve(__dirname, '../src/components/ui/DeviceDetailModal.tsx');
const modalContent = fs.readFileSync(modalPath, 'utf8');

assert(
  modalContent.includes('backdropFilter') || modalContent.includes('backdrop-blur'),
  'FAIL: DeviceDetailModal must have backdrop-blur filter on modal overlay'
);
assert(
  modalContent.includes('fixed inset-0') && modalContent.includes('bg-slate-950') || modalContent.includes('bg-black'),
  'FAIL: DeviceDetailModal must use fixed inset-0 overlay for modal backdrop blur'
);

// 2. Verify MongoDB Schemas define compound indexes on Flow for src_ip and dst_ip
const schemasPath = path.resolve(__dirname, '../backend/models/Schemas.js');
const schemasContent = fs.readFileSync(schemasPath, 'utf8');

assert(
  schemasContent.includes('FlowSchema.index({ agent_uuid: 1, src_ip: 1'),
  'FAIL: Schemas.js MUST define compound index FlowSchema.index({ agent_uuid: 1, src_ip: 1, timestamp: -1 })'
);
assert(
  schemasContent.includes('FlowSchema.index({ agent_uuid: 1, dst_ip: 1'),
  'FAIL: Schemas.js MUST define compound index FlowSchema.index({ agent_uuid: 1, dst_ip: 1, timestamp: -1 })'
);

// 3. Verify deviceDetailsHandler uses indexed query optimization
const handlerPath = path.resolve(__dirname, '../backend/routes/deviceDetailsHandler.js');
const handlerContent = fs.readFileSync(handlerPath, 'utf8');

assert(
  !handlerContent.includes('limit(5000)'),
  'FAIL: deviceDetailsHandler must NOT load 5000 un-indexed flows on single device click'
);
assert(
  handlerContent.includes('Promise.all') || handlerContent.includes('src_ip'),
  'FAIL: deviceDetailsHandler MUST execute optimized parallel queries for device details'
);

// 4. Verify getAgents server action uses parallelized Promise.all for agent status checks
const agentsActionPath = path.resolve(__dirname, '../src/lib/actions/agents.ts');
const agentsActionContent = fs.readFileSync(agentsActionPath, 'utf8');

assert(
  agentsActionContent.includes('Promise.all') && agentsActionContent.includes('agentSource.map'),
  'FAIL: getAgents in agents.ts MUST use Promise.all to query agent statuses in parallel'
);

console.log('✅ ALL TDD TESTS FOR PERFORMANCE & MODAL BLUR PASSED!');
