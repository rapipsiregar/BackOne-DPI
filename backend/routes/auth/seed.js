// backend/routes/auth/seed.js
// ─────────────────────────────────────────────────────────────────────────────
// Seeding logic for default roles, site configs, and agent locations
// ─────────────────────────────────────────────────────────────────────────────

const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const { TenantConfig, CustomAgentLocation } = require('../../models/Schemas');

async function seedAuth() {
  try {
    const count = await User.countDocuments({ role: 'SUPER_ADMIN' });
    if (count === 0) {
      const hash = bcrypt.hashSync('admin', 10);
      await User.create({
        username: 'admin',
        password_hash: hash,
        account_name: 'BackOne Administrator',
        role: 'SUPER_ADMIN',
        site_uuid: process.env.BACKONE_SITE_UUID || null,
        agent_uuid: null,
      });
      console.log('[Auth] ✓ Default SUPER_ADMIN created: admin / admin');
      console.log('[Auth] ⚠ GANTI PASSWORD INI SEGERA DI PRODUCTION!');
    }

    const siabCount = await User.countDocuments({ username: 'siab' });
    if (siabCount === 0) {
      const hash = bcrypt.hashSync('siab', 10);
      await User.create({
        username: 'siab',
        password_hash: hash,
        account_name: 'SIAB Administrator',
        role: 'TENANT_ADMIN',
        site_uuid: '6681452d_9cae_4ff4_8ae8_0d504774265e',
        agent_uuid: null,
      });
      console.log('[Auth] ✓ Default SIAB Tenant created: siab / siab');
    }

    const officeCount = await User.countDocuments({ username: 'office' });
    if (officeCount === 0) {
      const hash = bcrypt.hashSync('office', 10);
      await User.create({
        username: 'office',
        password_hash: hash,
        account_name: 'Office Administrator',
        role: 'TENANT_ADMIN',
        site_uuid: '1959bb55_045b_47c7_bbdd_f33b7db197b9',
        agent_uuid: null,
      });
      console.log('[Auth] ✓ Default Office Tenant created: office / office');
    }

    // Repair/Migration: Ensure legacy users have appropriate created_by values
    try {
      const missingCreatedBy = await User.find({ $or: [{ created_by: { $exists: false } }, { created_by: null }] });
      if (missingCreatedBy.length > 0) {
        console.log(`[Auth] Migrating ${missingCreatedBy.length} legacy users to set created_by...`);
        for (const u of missingCreatedBy) {
          if (u.username === 'admin') {
            u.created_by = 'admin';
          } else if (u.site_uuid === '6681452d_9cae_4ff4_8ae8_0d504774265e') {
            u.created_by = 'siab';
          } else if (u.site_uuid === '1959bb55_045b_47c7_bbdd_f33b7db197b9') {
            u.created_by = 'office';
          } else {
            u.created_by = 'admin';
          }
          await u.save();
        }
        console.log(`[Auth] Migration complete.`);
      }
    } catch (migrateErr) {
      console.error('[Auth] Migration failed:', migrateErr.message);
    }

    const defaultConfigs = [
      {
        site_uuid: 'default',
        brand_name: 'BackOne',
        brand_logo: '/backone-logo.png',
        footer_copyright: 'PT. Data Bisnis Solusi',
        primary_color: '#E11D48',
      },
      {
        site_uuid: '6681452d_9cae_4ff4_8ae8_0d504774265e',
        brand_name: 'SIAB',
        brand_logo: '/siab-logo.png',
        footer_copyright: 'PT. Data Bisnis Solusi',
        primary_color: '#3B82F6',
      },
      {
        site_uuid: '1959bb55_045b_47c7_bbdd_f33b7db197b9',
        brand_name: 'Office',
        brand_logo: '/backone-logo.png',
        footer_copyright: 'PT. Data Bisnis Solusi',
        primary_color: '#E11D48',
      }
    ];

    for (const config of defaultConfigs) {
      await TenantConfig.findOneAndUpdate({ site_uuid: config.site_uuid }, config, { upsert: true });
      console.log(`[Auth] ✓ Seeded/Updated TenantConfig for: ${config.brand_name}`);
    }

    // Seed default agent locations
    const defaultLocations = [
      {
        agent_uuid: 'F6-2V-DT-8A',
        site_uuid: '6681452d_9cae_4ff4_8ae8_0d504774265e',
        latitude: -6.2263304,
        longitude: 106.4247322,
        label: 'CPI Balaraja Agent Office'
      },
      {
        agent_uuid: '2F-TF-1D-GK',
        site_uuid: '6681452d_9cae_4ff4_8ae8_0d504774265e',
        latitude: -6.3763318,
        longitude: 106.8983017,
        label: 'JRP Cibubur Agent Office'
      },
      {
        agent_uuid: '8A-V3-PB-85',
        site_uuid: '6681452d_9cae_4ff4_8ae8_0d504774265e',
        latitude: -6.2253265,
        longitude: 106.8061484,
        label: 'IFG LT.18 Agent HQ'
      }
    ];

    for (const loc of defaultLocations) {
      const existing = await CustomAgentLocation.findOne({ agent_uuid: loc.agent_uuid });
      if (!existing) {
        await CustomAgentLocation.create(loc);
        console.log(`[Auth] ✓ Seeded CustomAgentLocation for: ${loc.agent_uuid}`);
      }
    }

  } catch (err) {
    console.warn('[Auth] Seed skipped (MongoDB not ready yet):', err.message);
  }
}

module.exports = seedAuth;
