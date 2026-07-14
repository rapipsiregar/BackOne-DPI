// proxy/models/SchemasAux.js
// ─────────────────────────────────────────────────────────────────────────────
// Auxiliary MongoDB Schemas to maintain Schemas.js under 256 lines limit.
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const baseOptions = {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
};

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

const CustomDeviceLabelSchema = new mongoose.Schema({
  mac_address:  { type: String, required: true, unique: true, index: true },
  device_label: { type: String, required: true },
}, baseOptions);

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

// ─── Tenant Configuration (Dynamic Branding per site_uuid) ─────────────────────
const TenantConfigSchema = new mongoose.Schema({
  site_uuid:        { type: String, required: true, unique: true, index: true },
  brand_name:       { type: String, required: true },
  brand_logo:       { type: String, required: true },
  footer_copyright: { type: String, required: true },
  primary_color:    { type: String, default: '#E11D48' }
}, baseOptions);

const CustomAgentLocationSchema = new mongoose.Schema({
  agent_uuid: { type: String, required: true, unique: true, index: true },
  site_uuid:  { type: String, required: true, index: true },
  latitude:   { type: Number, required: true },
  longitude:  { type: Number, required: true },
  label:      { type: String, default: '' },
}, baseOptions);

const BlacklistRuleSchema = new mongoose.Schema({
  site_uuid:  { type: String, required: true, index: true },
  agent_uuid: { type: String, required: true, index: true },
  type:       { type: String, required: true, enum: ['category', 'domain'] },
  value:      { type: String, required: true },
  is_active:  { type: Boolean, default: true }
}, baseOptions);

// Set compound indexes
TlsVersionStatSchema.index({ agent_uuid: 1, timestamp: -1 });
TlsCipherStatSchema.index({ agent_uuid: 1, timestamp: -1 });
TlsSecurityStatSchema.index({ agent_uuid: 1, timestamp: -1 });
CountryStatSchema.index({ agent_uuid: 1, timestamp: -1 });
LookupAppSchema.index({ label: 1, tag: 1 });
BlacklistRuleSchema.index({ site_uuid: 1, agent_uuid: 1, type: 1, value: 1 }, { unique: true });

module.exports = {
  TlsVersionStat:   mongoose.model('TlsVersionStat', TlsVersionStatSchema),
  TlsCipherStat:    mongoose.model('TlsCipherStat',  TlsCipherStatSchema),
  TlsSecurityStat:  mongoose.model('TlsSecurityStat',TlsSecurityStatSchema),
  CountryStat:      mongoose.model('CountryStat',    CountryStatSchema),
  CustomDeviceLabel:mongoose.model('CustomDeviceLabel',CustomDeviceLabelSchema),
  ViewAsLog:        mongoose.model('ViewAsLog',      ViewAsLogSchema),
  LookupApp:        mongoose.model('LookupApp',      LookupAppSchema),
  TenantConfig:     mongoose.model('TenantConfig',   TenantConfigSchema),
  CustomAgentLocation: mongoose.model('CustomAgentLocation', CustomAgentLocationSchema),
  BlacklistRule:    mongoose.model('BlacklistRule',  BlacklistRuleSchema),
};
