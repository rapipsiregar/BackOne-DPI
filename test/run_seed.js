const mongoose = require('../backend/node_modules/mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backone_dpi';

const User = require('../backend/models/User');
const { TenantConfig, CustomAgentLocation } = require('../backend/models/Schemas');

async function run() {
  console.log('Connecting to MongoDB at:', MONGODB_URI);
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully. Running seeding...');

    // 1. Seed SIAB user
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
      console.log('✓ Seeded SIAB Tenant User: siab / siab');
    } else {
      console.log('SIAB user already exists');
    }

    // 2. Seed Nexus user
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
      console.log('✓ Seeded Nexus Tenant User: nexus / nexus');
    } else {
      console.log('Nexus user already exists');
    }

    // 3. Seed TenantConfigs
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
        site_uuid: 'd7902405_0dc2_458b_8584_ed4d24b64f24',
        brand_name: 'Nexus',
        brand_logo: '/nexus-logo.png',
        footer_copyright: 'PT. Nexus Solusi',
        primary_color: '#8B5CF6',
      }
    ];

    for (const config of defaultConfigs) {
      await TenantConfig.findOneAndUpdate({ site_uuid: config.site_uuid }, config, { upsert: true });
      console.log(`✓ Seeded/Updated TenantConfig for: ${config.brand_name}`);
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
        console.log(`✓ Seeded CustomAgentLocation for: ${loc.agent_uuid}`);
      } else {
        console.log(`CustomAgentLocation for ${loc.agent_uuid} already exists`);
      }
    }

    console.log('Seeding completed successfully!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Seeding error:', err);
  }
}

run();
