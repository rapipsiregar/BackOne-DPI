const mongoose = require('mongoose');

const baseOptions = { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } };

// Schema for Timeline / General Summary
const SummarySchema = new mongoose.Schema({
  timestamp: { type: Date, required: true, index: true },
  agent_uuid: { type: String, index: true },
  site_uuid: { type: String, index: true },
  total_devices: Number,
  active_flows: Number,
  bandwidth_down: Number,
  bandwidth_up: Number,
  download_speed: Number,
  upload_speed: Number,
  total_threats: Number
}, baseOptions);

// Schema for Top Apps
const AppStatSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true, index: true },
  agent_uuid: { type: String, index: true },
  site_uuid: { type: String, index: true },
  app_label: { type: String, required: true },
  download: Number,
  upload: Number,
  flows: Number
}, baseOptions);

// Schema for Protocols
const ProtocolStatSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true, index: true },
  agent_uuid: { type: String, index: true },
  site_uuid: { type: String, index: true },
  protocol_name: { type: String, required: true },
  download: Number,
  upload: Number,
  flows: Number
}, baseOptions);

// Schema for Devices
const DeviceStatSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true, index: true },
  agent_uuid: { type: String, index: true },
  site_uuid: { type: String, index: true },
  ip_address: { type: String, required: true, index: true },
  mac_address: { type: String, index: true },
  device_label: String,
  device_type: String,
  os_label: String,
  manufacturer: String,
  download: Number,
  upload: Number,
  flows: Number,
  last_seen: String
}, baseOptions);

// Schema for Flows
const FlowSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true, index: true },
  agent_uuid: { type: String, index: true },
  site_uuid: { type: String, index: true },
  flow_id: String,
  src_ip: { type: String, index: true },
  src_mac: String,
  dst_ip: { type: String, index: true },
  dst_port: Number,
  protocol: String,
  app_label: String,
  domain: String,
  download: Number,
  upload: Number,
  first_seen: String,
  last_seen: String
}, baseOptions);

// Schema for Threats
const ThreatSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true, index: true },
  agent_uuid: { type: String, index: true },
  site_uuid: { type: String, index: true },
  threat_id: String,
  threat_type: String,
  severity: String,
  src_ip: String,
  dst_ip: String,
  details: mongoose.Schema.Types.Mixed
}, baseOptions);

module.exports = {
  Summary: mongoose.model('Summary', SummarySchema),
  AppStat: mongoose.model('AppStat', AppStatSchema),
  ProtocolStat: mongoose.model('ProtocolStat', ProtocolStatSchema),
  DeviceStat: mongoose.model('DeviceStat', DeviceStatSchema),
  Flow: mongoose.model('Flow', FlowSchema),
  Threat: mongoose.model('Threat', ThreatSchema)
};
