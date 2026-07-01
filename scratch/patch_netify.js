const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'backend', 'netify.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace events block
const oldEventsBlockPattern = /\/\/ ── 6\. Events filtered by agent IPs & MACs ─────────────────────────────────[\s\S]*?const events = allEvents\.slice\(0, 100\);/;
if (oldEventsBlockPattern.test(content)) {
  console.log("Found events block! Replacing...");
  content = content.replace(oldEventsBlockPattern, `// ── 6. Events filtered by agent (aligned with events page) ───────────────
  const events = db.getLatestEvents(200, null, agentUuid);`);
} else {
  console.error("Could not find events block!");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully patched backend/netify.js events section!");
