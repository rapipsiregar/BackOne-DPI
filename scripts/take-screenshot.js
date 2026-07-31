const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outputDir = "C:\\Users\\rafif\\.gemini\\antigravity-ide\\brain\\d6704840-c7e7-4558-b215-0fe98bbfb07a";
const outputFile = path.join(outputDir, "mobile-localhost.png");

console.log("Launching Edge headless to capture screenshot of http://localhost:3000 ...");

const res = spawnSync(edgePath, [
  '--headless',
  '--disable-gpu',
  '--window-size=400,844',
  `--screenshot=${outputFile}`,
  'http://localhost:3000'
], { encoding: 'utf-8', timeout: 15000 });

console.log("Exit code:", res.status);
if (fs.existsSync(outputFile)) {
  console.log("Screenshot successfully saved to:", outputFile, "Size:", fs.statSync(outputFile).size, "bytes");
} else {
  console.log("Screenshot file not found.");
}
