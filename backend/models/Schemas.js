// backend/models/Schemas.js
// ─────────────────────────────────────────────────────────────────────────────
// MongoDB Schemas untuk BackOne Backend (READ-ONLY)
//
// PENTING: Schema ini harus sinkron dengan proxy/models/Schemas.js
// Proxy yang MENULIS data, backend yang MEMBACA data.
//
// Setiap dokumen di-tag dengan:
//   agent_uuid  → identifikasi Network Agent spesifik (isolasi per tenant)
//   site_uuid   → identifikasi site DPI (BackOne)
//   timestamp   → waktu data dikumpulkan
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const baseOptions = {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
};

// ─── Bandwidth Summary (per agent, per collection cycle) ───────────────────────
const SummarySchema = new mongoose.Schema({
  timestamp:      { type: Date,   required: true, index: true, expires: '7d' },
  agent_uuid:     { type: String, index: true },   // null = global/all agents
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
  src_mac:    String,
  dst_ip:     { type: String, index: true },
  dst_port:   Number,
  protocol:   String,
  app_label:  String,
  domain:     { type: String, index: true },
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
}, baseOptions);

// ─── Compound Indexes for common dashboard queries ─────────────────────────────
// ─── TLS Versions (per agent) ──────────────────────────────────────────────────
const TlsVersionStatSchema = new mongoose.Schema({
  timestamp:      { type: Date,   required: true, index: true, expires: '7d' },
  agent_uuid:     { type: String, index: true },
  site_uuid:      { type: String, index: true },
  tls_version:    { type: String, required: true },
  download:       Number,
  upload:         Number,
  flows:          Number,
}, baseOptions);

// ─── TLS Ciphers (per agent) ───────────────────────────────────────────────────
const TlsCipherStatSchema = new mongoose.Schema({
  timestamp:      { type: Date,   required: true, index: true, expires: '7d' },
  agent_uuid:     { type: String, index: true },
  site_uuid:      { type: String, index: true },
  tls_cipher:     { type: String, required: true },
  download:       Number,
  upload:         Number,
  flows:          Number,
}, baseOptions);

// ─── TLS Security (per agent) ──────────────────────────────────────────────────
const TlsSecurityStatSchema = new mongoose.Schema({
  timestamp:      { type: Date,   required: true, index: true, expires: '7d' },
  agent_uuid:     { type: String, index: true },
  site_uuid:      { type: String, index: true },
  tls_security:   { type: String, required: true },
  download:       Number,
  upload:         Number,
  flows:          Number,
}, baseOptions);

// ─── Country Traffic Stats (per agent) ────────────────────────────────────────
const CountryStatSchema = new mongoose.Schema({
  timestamp:    { type: Date,   required: true, index: true, expires: '7d' },
  agent_uuid:   { type: String, index: true },
  site_uuid:    { type: String, index: true },
  country_code: { type: String, required: true },
  country_name: { type: String, default: '' },
  download:     Number,
  upload:       Number,
  flows:        Number,
}, baseOptions);

// ─── Compound Indexes for common dashboard queries ─────────────────────────────
SummarySchema.index({ agent_uuid: 1, timestamp: -1 });
AppStatSchema.index({ agent_uuid: 1, timestamp: -1, download: -1 });
DeviceStatSchema.index({ agent_uuid: 1, ip_address: 1 }, { unique: true });
FlowSchema.index({ agent_uuid: 1, timestamp: -1 });
FlowSchema.index({ agent_uuid: 1, flow_id: 1 });
FlowSchema.index({ agent_uuid: 1, protocol: 1, timestamp: -1 });
FlowSchema.index({ agent_uuid: 1, domain: 1, timestamp: -1 });
FlowSchema.index({ site_uuid: 1, app_label: 1, timestamp: -1 });
ThreatSchema.index({ agent_uuid: 1, timestamp: -1 });
AppCategoryStatSchema.index({ agent_uuid: 1, timestamp: -1 });
EventSchema.index({ agent_uuid: 1, timestamp: -1 });
TlsVersionStatSchema.index({ agent_uuid: 1, timestamp: -1 });
TlsCipherStatSchema.index({ agent_uuid: 1, timestamp: -1 });
TlsSecurityStatSchema.index({ agent_uuid: 1, timestamp: -1 });
CountryStatSchema.index({ agent_uuid: 1, timestamp: -1 });

const CustomDeviceLabelSchema = new mongoose.Schema({
  mac_address:  { type: String, required: true, unique: true, index: true },
  device_label: { type: String, required: true },
}, baseOptions);

// ── Per-Device Per-Application Stats (synced from proxy) ─────────────────
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

// ─── View As Audit Logs ────────────────────────────────────────────────────────
const ViewAsLogSchema = new mongoose.Schema({
  timestamp:      { type: Date,   default: Date.now, index: true },
  admin_id:       { type: String, required: true },
  admin_username: { type: String, required: true },
  admin_role:     String,
  agent_uuid:     { type: String, required: true },
  agent_label:    String,
  end_timestamp:  Date,
  duration:       Number, // duration in seconds
}, baseOptions);

// ─── Lookup App Dictionary ────────────────────────────────────────────────────
const LookupAppSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, index: true },
  tag: String,
  label: { type: String, index: true },
  name: String,
  full_name: String,
  description: String,
  favicon: String,
  icon: String,
  logo: String,
  application_category: Object
}, baseOptions);
LookupAppSchema.index({ label: 1, tag: 1 });

const telemetrySchemas = require('./SchemasTelemetry');

module.exports = {
  Summary:       mongoose.model('Summary',       SummarySchema),
  AppStat:       mongoose.model('AppStat',       AppStatSchema),
  ProtocolStat:  mongoose.model('ProtocolStat',  ProtocolStatSchema),
  DeviceStat:    mongoose.model('DeviceStat',    DeviceStatSchema),
  DeviceAppStat: mongoose.model('DeviceAppStat', DeviceAppStatSchema),
  Flow:          mongoose.model('Flow',          FlowSchema),
  Threat:        mongoose.model('Threat',        ThreatSchema),
  CustomDeviceLabel: mongoose.model('CustomDeviceLabel', CustomDeviceLabelSchema),
  AppCategoryStat: mongoose.model('AppCategoryStat', AppCategoryStatSchema),
  Event:         mongoose.model('Event',         EventSchema),
  TlsVersionStat: mongoose.model('TlsVersionStat', TlsVersionStatSchema),
  TlsCipherStat: mongoose.model('TlsCipherStat', TlsCipherStatSchema),
  TlsSecurityStat: mongoose.model('TlsSecurityStat', TlsSecurityStatSchema),
  CountryStat:   mongoose.model('CountryStat',   CountryStatSchema),
  LookupApp:     mongoose.model('LookupApp',     LookupAppSchema),
  ViewAsLog:     mongoose.model('ViewAsLog',     ViewAsLogSchema),
  ...telemetrySchemas
};
