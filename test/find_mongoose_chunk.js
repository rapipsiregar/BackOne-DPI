// test/find_mongoose_chunk.js
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../.next/server/chunks/ssr/[root-of-the-server]__081-pwf._.js');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  console.log(`Total lines: ${lines.length}`);
  
  let matchCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('mongoose-8b99e611e7552af3')) {
      console.log(`Line ${i + 1}:`);
      // Print a slice of the line around the match
      const index = lines[i].indexOf('mongoose-8b99e611e7552af3');
      const start = Math.max(0, index - 100);
      const end = Math.min(lines[i].length, index + 100);
      console.log(lines[i].slice(start, end));
      matchCount++;
      if (matchCount > 5) break;
    }
  }
} catch (err) {
  console.error("Error reading file:", err.message);
}
