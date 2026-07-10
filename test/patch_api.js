// Script to patch api.ts with timeRange support
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'api.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix fetcher to accept timeRange
const oldFetcher = `// Fetcher Function
export async function fetcher<T>(endpoint: string): Promise<T> {
  const url = \`/api/dashboard\${endpoint}\`;
  // Tambahkan X-View-As-Agent header jika admin dalam mode view-as
  const viewAsHeaders = getViewAsHeaders();
  const res = await fetch(url, { headers: viewAsHeaders });
  if (!res.ok) {
    throw new Error(\`API error: \${res.status} \${res.statusText}\`);
  }
  const json = await res.json();
  if (!json.ok) {
    throw new Error(json.message || 'API responded with ok: false');
  }
  return json.data;
}`;

const newFetcher = `// Fetcher Function — supports optional timeRange for time-filtered queries
export async function fetcher<T>(endpoint: string, timeRange?: string): Promise<T> {
  // Append timeRange param if provided (appended before X-View-As header)
  let url = \`/api/dashboard\${endpoint}\`;
  if (timeRange) {
    const sep = url.includes('?') ? '&' : '?';
    url += sep + 'timeRange=' + timeRange;
  }
  // X-View-As-Agent header for admin view-as mode
  const viewAsHeaders = getViewAsHeaders();
  const res = await fetch(url, { headers: viewAsHeaders });
  if (!res.ok) {
    throw new Error(\`API error: \${res.status} \${res.statusText}\`);
  }
  const json = await res.json();
  if (!json.ok) {
    throw new Error(json.message || 'API responded with ok: false');
  }
  return json.data;
}`;

// Normalize CRLF → LF for matching
const normalized = content.replace(/\r\n/g, '\n');
const oldNorm = oldFetcher.replace(/\r\n/g, '\n');
const newNorm = newFetcher.replace(/\r\n/g, '\n');

if (!normalized.includes(oldNorm)) {
  console.error('ERROR: Could not find fetcher function in api.ts');
  console.log('Content around line 170:');
  console.log(normalized.split('\n').slice(168, 186).join('\n'));
  process.exit(1);
}

const patched = normalized.replace(oldNorm, newNorm);

// Write back with CRLF (Windows)
fs.writeFileSync(filePath, patched.replace(/\n/g, '\r\n'), 'utf8');
console.log('✓ api.ts patched successfully');
console.log('✓ fetcher now accepts optional timeRange parameter');

// Verify
const verify = fs.readFileSync(filePath, 'utf8');
console.log('✓ timeRange in fetcher:', verify.includes('timeRange?: string') ? 'YES' : 'NO');
