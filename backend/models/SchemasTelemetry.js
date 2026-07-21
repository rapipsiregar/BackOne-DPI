// backend/models/SchemasTelemetry.js
// ─────────────────────────────────────────────────────────────────────────────
// DPI Telemetry Property Schemas for BackOne Backend (READ-ONLY).
// Split from Schemas.js to keep files under 256 lines.
// Must stay in sync with proxy/models/SchemasTelemetry.js.
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const baseOptions = {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
};

// ─── Helper: build a consistent DPI property schema ───────────────────────────
function dpiPropertySchema(fieldName) {
  const fields = {
    timestamp:  { type: Date,   required: true, index: true, expires: '7d' },
    agent_uuid: { type: String, index: true },
    site_uuid:  { type: String, index: true },
    download:   Number,
    upload:     Number,
    flows:      Number,
  };
  fields[fieldName] = { type: String, required: true };
  const schema = new mongoose.Schema(fields, baseOptions);
  schema.index({ agent_uuid: 1, timestamp: -1 });
  return schema;
}

// ─── DHCP Fingerprints (dhcp_class) ──────────────────────────────────────────
const DhcpFingerprintStatSchema = dpiPropertySchema('fingerprint');

// ─── HTTP User Agents (http_useragent) ────────────────────────────────────────
const HttpUserAgentStatSchema = dpiPropertySchema('user_agent');

// ─── BitTorrent Info Hashes (bittorrent_info_hash) ────────────────────────────
const BittorrentHashStatSchema = new mongoose.Schema({
  timestamp:  { type: Date,   required: true, index: true, expires: '7d' },
  agent_uuid: { type: String, index: true },
  site_uuid:  { type: String, index: true },
  info_hash:  { type: String, required: true },
  label:      { type: String },
  download:   Number,
  upload:     Number,
  flows:      Number,
}, baseOptions);
BittorrentHashStatSchema.index({ agent_uuid: 1, timestamp: -1 });

// ─── HTTPS SNI Hostnames (https_sni_hostname) ─────────────────────────────────
const SniHostnameStatSchema = dpiPropertySchema('sni_hostname');

// ─── SSL Server Common Names (ssl_server_cn) ──────────────────────────────────
const SslServerCnStatSchema = dpiPropertySchema('ssl_server_cn');

// ─── QUIC Hostnames (quic_hostname) ───────────────────────────────────────────
const QuicHostnameStatSchema = dpiPropertySchema('quic_hostname');

// ─── SSH Clients (ssh_client) ─────────────────────────────────────────────────
const SshClientStatSchema = dpiPropertySchema('ssh_client');

// ─── SSH Servers (ssh_server) ─────────────────────────────────────────────────
const SshServerStatSchema = dpiPropertySchema('ssh_server');

// ─── mDNS Hostnames (mdns_hostname) ───────────────────────────────────────────
const MdnsHostnameStatSchema = dpiPropertySchema('mdns_hostname');

// ─── SSL Subject Alternative Names (ssl_subject_alt_name) ──────────────────────
const SslSubjectAltNameStatSchema = dpiPropertySchema('alt_name');

module.exports = {
  DhcpFingerprintStat: mongoose.model('DhcpFingerprintStat', DhcpFingerprintStatSchema),
  HttpUserAgentStat:   mongoose.model('HttpUserAgentStat',   HttpUserAgentStatSchema),
  BittorrentHashStat:  mongoose.model('BittorrentHashStat',  BittorrentHashStatSchema),
  SniHostnameStat:     mongoose.model('SniHostnameStat',     SniHostnameStatSchema),
  SslServerCnStat:     mongoose.model('SslServerCnStat',     SslServerCnStatSchema),
  QuicHostnameStat:    mongoose.model('QuicHostnameStat',    QuicHostnameStatSchema),
  SshClientStat:       mongoose.model('SshClientStat',       SshClientStatSchema),
  SshServerStat:       mongoose.model('SshServerStat',       SshServerStatSchema),
  MdnsHostnameStat:    mongoose.model('MdnsHostnameStat',    MdnsHostnameStatSchema),
  SslSubjectAltNameStat: mongoose.model('SslSubjectAltNameStat', SslSubjectAltNameStatSchema),
};
