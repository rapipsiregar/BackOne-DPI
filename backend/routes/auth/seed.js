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
        site_uuid: process.env.NETIFY_SITE_UUID || null,
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

    const nexusCount = await User.countDocuments({ username: 'nexus' });
    if (nexusCount === 0) {
      const hash = bcrypt.hashSync('nexus', 10);
      await User.create({
        username: 'nexus',
        password_hash: hash,
        account_name: 'Nexus Administrator',
        role: 'TENANT_ADMIN',
        site_uuid: 'd7902405_0dc2_458b_8584_ed4d24b64f24',
        agent_uuid: null,
      });
      console.log('[Auth] ✓ Default Nexus Tenant created: nexus / nexus');
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
          } else if (u.site_uuid === 'd7902405_0dc2_458b_8584_ed4d24b64f24') {
            u.created_by = 'nexus';
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
        footer_copyright: 'PT. SIAB Indonesia',
        primary_color: '#3B82F6',
      },
      {
        site_uuid: 'd7902405_0dc2_458b_8584_ed4d24b64f24',
        brand_name: 'Nexus',
        brand_logo: '/nexus-logo.png',
        footer_copyright: 'PT. Nexus Solusi',
        primary_color: '#8B5CF6',
      }
    ];

    for (const config of defaultConfigs) {
      const existing = await TenantConfig.findOne({ site_uuid: config.site_uuid });
      if (!existing) {
        await TenantConfig.create(config);
        console.log(`[Auth] ✓ Seeded TenantConfig for: ${config.brand_name}`);
      }
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
