// backend/models/User.js
// ─────────────────────────────────────────────────────────────────────────────
// MongoDB User Schema untuk BackOne Authentication
//
// Roles:
//   SUPER_ADMIN   → akses semua data semua agent
//   AGENT_VIEWER  → akses data agent_uuid tertentu saja (multi-tenant isolation)
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username:        { type: String, required: true, unique: true, trim: true },
  password_hash:   { type: String, required: true },
  account_name:    { type: String, default: null },
  profile_picture: { type: String, default: null },
  role:            { type: String, enum: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SOC_ANALYST', 'ENGINEER', 'AGENT_VIEWER'], default: 'AGENT_VIEWER' },
  site_uuid:       { type: String, default: null, index: true },
  agent_uuid:      { type: String, default: null },
  created_by:      { type: String, default: null, index: true },
  is_active:       { type: Boolean, default: true },
  login_attempts:  { type: Number, default: 0 },
  lockout_until:   { type: Date, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Virtual 'id' getter (returns string version of _id for backward compat)
UserSchema.virtual('id').get(function () {
  return this._id.toString();
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.password_hash; // Never leak password hash
    return ret;
  }
});

// Compound index for agent_uuid lookup
UserSchema.index({ agent_uuid: 1, is_active: 1 });

module.exports = mongoose.model('User', UserSchema);
