// proxy/models/Schemas.js
// MongoDB schemas shared between the proxy server (write) and backend (read).
// Each document is tagged with agent_uuid + site_uuid for tenant isolation.
//
// IMPORTANT: Indexes are set for common query patterns:
//   - timestamp (for time-range queries)
//   - agent_uuid (for per-tenant filtering)
//   - site_uuid (for site-level aggregation)

const mongoose = require('mongoose');

const baseOptions = {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
};

// ─── Bandwidth Summary (per agent, per collection cycle) ───────────────────────
const SummarySchema = new mongoose.Schema({
  timestamp:      { type: Date,   required: true, index: true, expires: '7d' },
  agent_uuid:     { type: String, index: true },  // null = global/all agents
  site_uuid:      { type: String, index: true },
  bandwidth_down: Number,
  bandwidth_up:   Number,
  active_flows:   Number,
  download_speed: Number,
  upload_speed:   Number,
  total_devices:  Number,
  total_threats:  Number,
  packet_drops:   Number,
  peak_flow_rate: Number,
  cpu_usage:      Number,
  memory_usage:   Number,
  queue_depth:    Number,
}, baseOptions);

// ─── Top Applications (per agent) ─────────────────────────────────────────────
const AppStatSchema = new mongoose.Schema({
  timestamp:  { type: Date,   required: true, index: true, expires: '7d' },
  agent_uuid: { type: String, index: true },
  site_uuid:  { type: String, index: true },
  app_label:  { type: String, required: true },
  download:   Number,
  upload:     Number,
  flows:      Number,
}, baseOptions);

// ─── Protocol Statistics (per agent) ──────────────────────────────────────────
const ProtocolStatSchema = new mongoose.Schema({
  timestamp:      { type: Date,   required: true, index: true, expires: '7d' },
  agent_uuid:     { type: String, index: true },
  site_uuid:      { type: String, index: true },
  protocol_label: { type: String, required: true },
  download:       Number,
  upload:         Number,
  flows:          Number,
}, baseOptions);

// ─── Discovered Devices (per agent, includes IP + MAC + device info) ───────────
const DeviceStatSchema = new mongoose.Schema({
  timestamp:    { type: Date,   required: true, index: true, expires: '7d' },
  agent_uuid:   { type: String, index: true },
  site_uuid:    { type: String, index: true },
  ip_address:   { type: String, required: true, index: true },
  mac_address:  { type: String, index: true },
  device_label: String,
  device_type:  String,
  os_label:     String,
  manufacturer: String,
  download:     Number,
  upload:       Number,
  flows:        Number,
  last_seen:    String,
}, baseOptions);

// ─── Network Flows (per agent) ─────────────────────────────────────────────────
const FlowSchema = new mongoose.Schema({
  timestamp:  { type: Date,   required: true, index: true, expires: '7d' },
  agent_uuid: { type: String, index: true },
  site_uuid:  { type: String, index: true },
  flow_id:    String,
  src_ip:     { type: String, index: true },
  src_mac:    { type: String, index: true },  // indexed for MAC-to-IP resolution in events
  dst_ip:     { type: String, index: true },
  dst_port:   Number,
  protocol:   String,
  app_label:  String,
  domain:     String,
  download:   Number,
  upload:     Number,
  first_seen: String,
  last_seen:  String,
}, baseOptions);

// ─── Cyber Threats (per agent) ─────────────────────────────────────────────────
const ThreatSchema = new mongoose.Schema({
  timestamp:   { type: Date,   required: true, index: true, expires: '7d' },
  agent_uuid:  { type: String, index: true },
  site_uuid:   { type: String, index: true },
  threat_type: String,
  severity:    String,
  src_ip:      String,
  dst_ip:      String,
  dst_port:    Number,
  protocol:    String,
  description: String,
  event_at:    String,
  flow_id:     { type: String, index: true },
}, baseOptions);

// ─── App Categories (per agent) ───────────────────────────────────────────────
const AppCategoryStatSchema = new mongoose.Schema({
  timestamp:      { type: Date,   required: true, index: true, expires: '7d' },
  agent_uuid:     { type: String, index: true },
  site_uuid:      { type: String, index: true },
  category_label: { type: String, required: true },
  download:       Number,
  upload:         Number,
  flows:          Number,
}, baseOptions);

// ─── System Events (per agent) ─────────────────────────────────────────────────
const EventSchema = new mongoose.Schema({
  timestamp:      { type: Date,   required: true, index: true, expires: '7d' },
  agent_uuid:     { type: String, index: true },
  site_uuid:      { type: String, index: true },
  event_id:       Number,
  event_type:     String,
  severity:       String,
  description:    String,
  category_label: String,
  ip_address:     String,
  mac_address:    String,
  event_at:       Date,
  flow_id:        { type: String, index: true },
}, baseOptions);

// ─── Compound indexes for common dashboard queries ─────────────────────────────
SummarySchema.index({ agent_uuid: 1, timestamp: -1 });
AppStatSchema.index({ agent_uuid: 1, timestamp: -1, download: -1 });
DeviceStatSchema.index({ agent_uuid: 1, ip_address: 1 }, { unique: true });
FlowSchema.index({ agent_uuid: 1, timestamp: -1 });
FlowSchema.index({ agent_uuid: 1, flow_id: 1 });
FlowSchema.index({ site_uuid: 1, timestamp: -1 });
FlowSchema.index({ site_uuid: 1, app_label: 1, timestamp: -1 });
ThreatSchema.index({ agent_uuid: 1, timestamp: -1 });
AppCategoryStatSchema.index({ agent_uuid: 1, timestamp: -1 });
EventSchema.index({ agent_uuid: 1, timestamp: -1 });
FlowSchema.index({ site_uuid: 1, src_mac: 1, timestamp: -1 }); // for MAC-to-IP resolution

// ── Per-Device Per-Application Stats ────────────────────────────────────────
// Collected from DPI API: /data/stats/top/application/download with filter_local_ips
// Allows showing "YouTube 134GB" in Device Detail modal per specific IP
const DeviceAppStatSchema = new mongoose.Schema({
  timestamp:  { type: Date,   required: true, index: true, expires: '7d' },
  agent_uuid: { type: String, index: true },
  site_uuid:  { type: String, index: true },
  ip_address: { type: String, required: true, index: true },
  app_label:  { type: String, required: true },
  app_id:     Number,
  download:   { type: Number, default: 0 },
  upload:     { type: Number, default: 0 },
  flows:      { type: Number, default: 0 },
  last_seen:  String,
}, baseOptions);
DeviceAppStatSchema.index({ agent_uuid: 1, ip_address: 1, timestamp: -1 });
DeviceAppStatSchema.index({ ip_address: 1, app_label: 1, timestamp: -1 });
DeviceAppStatSchema.index({ site_uuid: 1, app_label: 1, timestamp: -1 });

const telemetrySchemas = require('./SchemasTelemetry');
const auxSchemas = require('./SchemasAux');

// ─── Agent Registry (all agents registered in Netify, regardless of activity) ──
// Upserted every collector cycle. Source of truth for the agents list page.
const AgentRegistrySchema = new mongoose.Schema({
  uuid:         { type: String, required: true, unique: true, index: true },
  serial:       { type: String },
  label:        { type: String },
  site_uuid:    { type: String, index: true },
  provisioned:  { type: Boolean, default: false },
  activated:    { type: Boolean, default: false },
  last_seen_at: { type: mongoose.Schema.Types.Mixed },
  netify_id:    { type: Number },
}, { ...baseOptions, collection: 'agent_registry' });

module.exports = {
  Summary:       mongoose.model('Summary',       SummarySchema),
  AppStat:       mongoose.model('AppStat',       AppStatSchema),
  ProtocolStat:  mongoose.model('ProtocolStat',  ProtocolStatSchema),
  DeviceStat:    mongoose.model('DeviceStat',    DeviceStatSchema),
  DeviceAppStat: mongoose.model('DeviceAppStat', DeviceAppStatSchema),
  Flow:          mongoose.model('Flow',          FlowSchema),
  Threat:        mongoose.model('Threat',        ThreatSchema),
  AppCategoryStat: mongoose.model('AppCategoryStat', AppCategoryStatSchema),
  Event:         mongoose.model('Event',         EventSchema),
  AgentRegistry: mongoose.model('AgentRegistry', AgentRegistrySchema),
  ...auxSchemas,
  ...telemetrySchemas,
};


