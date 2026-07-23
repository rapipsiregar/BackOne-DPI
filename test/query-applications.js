const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config({ path: './.env.local' });

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-backone-key';

async function main() {
  console.log('Generating auth token...');
  // Create a mock authenticated user token
  const payload = {
    id: 'mock-admin-id',
    role: 'SUPER_ADMIN',
    email: 'admin@backone.local',
    site_uuid: 'mock-site-uuid'
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  
  console.log('Querying local backend `/api/dashboard/lookup/applications` with token...');
  const res = await axios.get('http://127.0.0.1:3001/api/dashboard/lookup/applications', {
    params: { limit: 5 },
    headers: {
      Cookie: `token=${token}`
    }
  });
  
  console.log('Response Status:', res.status);
  console.log('Response Data:', JSON.stringify(res.data, null, 2));
}

main().catch(console.error);
