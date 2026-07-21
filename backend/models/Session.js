// backend/models/Session.js
// ─────────────────────────────────────────────────────────────────────────────
// MongoDB User Session Schema for remote revocation capability
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  ip_address: { type: String, default: 'Unknown' },
  user_agent: { type: String, default: 'Unknown' },
  session_token: { type: String, required: true, unique: true }, // JWT JTI or unique token hash
  last_active: { type: Date, default: Date.now },
  expires_at: { type: Date, required: true, index: true }, // MongoDB TTL Index will auto-expire sessions
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// TTL index to automatically remove expired sessions from MongoDB
SessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', SessionSchema);
