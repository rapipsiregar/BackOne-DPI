// test/field_alignment.js
// Check field name alignment between backend and frontend
const fs = require('fs');

const dash = fs.readFileSync('backend/routes/dashboard.js','utf8') +
             fs.readFileSync('backend/routes/dashboard/helpers.js','utf8') +
             fs.readFileSync('backend/routes/dashboard/summary.js','utf8') +
             fs.readFileSync('backend/routes/dashboard/apps.js','utf8') +
             fs.readFileSync('backend/routes/dashboard/devices.js','utf8') +
             fs.readFileSync('backend/routes/dashboard/flows.js','utf8') +
             fs.readFileSync('backend/routes/dashboard/threats.js','utf8') +
             fs.readFileSync('backend/routes/dashboard/geo.js','utf8') +
             fs.readFileSync('backend/routes/dashboard/tls.js','utf8') +
             fs.readFileSync('backend/routes/dashboard/telemetry.js','utf8') +
             fs.readFileSync('backend/routes/dashboard/events.js','utf8');
const api  = fs.readFileSync('src/lib/api.ts','utf8') +
             fs.readFileSync('src/lib/api-types.ts','utf8');

console.log('=== Field Name Alignment: Backend ↔ Frontend ===\n');

function check(label, backendHas, frontendExpects, mismatchDesc = '') {
  if (backendHas && frontendExpects) {
    console.log(`  ✓ PASS: ${label} is aligned`);
  } else if (backendHas && !frontendExpects) {
    console.log(`  ⚠ WARNING: Backend defines ${label} but Frontend doesn't expect it`);
  } else if (!backendHas && frontendExpects) {
    console.log(`  ✗ FAIL: ${label} is missing in backend routing!`);
    if (mismatchDesc) console.log(`    → ${mismatchDesc}`);
  }
}

// /protocols
console.log('[/protocols]');
check(
  'protocol_label',
  dash.includes('protocol_label'),
  api.includes('protocol_label'),
  'Backend doesn\'t return protocol_label to frontend'
);
console.log('');

// /timeline
console.log('[/timeline]');
check(
  'fetched_at',
  dash.includes('fetched_at'),
  api.includes('fetched_at'),
  'Backend sends timestamp, frontend reads fetched_at'
);
console.log('');

// /countries  
console.log('[/countries]');
check(
  'country_name',
  dash.includes('country_name'),
  api.includes('country_name'),
  'Backend does not return country_name'
);
check(
  'country_code',
  dash.includes('country_code'),
  api.includes('country_code'),
  'Backend does not return country_code'
);
console.log('');

// /dns
console.log('[/dns]');
check(
  'domain',
  dash.includes('domain'),
  api.includes('domain'),
  'Backend does not map domain field'
);
console.log('');

// /summary
console.log('[/summary]');
check('total_devices', dash.includes('total_devices'), api.includes('total_devices'));
check('bandwidth_down', dash.includes('bandwidth_down'), api.includes('bandwidth_down'));
check('download_speed', dash.includes('download_speed'), api.includes('download_speed'));
console.log('');

// /apps
console.log('[/apps]');
check('app_label', dash.includes('app_label'), api.includes('app_label'));
console.log('');

// /flows
console.log('[/flows]');
check('src_ip', dash.includes('src_ip'), api.includes('src_ip'));
check('dst_port', dash.includes('dst_port'), api.includes('dst_port'));
console.log('');

// app-categories
console.log('[/app-categories]');
check(
  'category_label',
  dash.includes('category_label'),
  api.includes('category_label'),
  'Backend sends label, frontend expects category_label'
);
console.log('');
