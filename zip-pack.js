// zip-pack.js
// Packages the production components into source2-deploy.zip
// Excludes development node_modules, local configurations, .git, logs, and temp files,
// but retains Next.js standalone server dependencies in .next/standalone/node_modules.

const fs = require('fs');
const path = require('path');
const { ZipArchive } = require('archiver');

// Target location (parent folder: c:\z_Siregar\Magang DBS\1. BackOne-DPI\source2-deploy.zip)
const outputZip = path.join(__dirname, '..', 'source2-deploy.zip');
console.log(`[ZIP] Target destination: ${outputZip}`);

// Create write stream
const output = fs.createWriteStream(outputZip);
const archive = new ZipArchive({
  zlib: { level: 9 } // Maximum compression
});

output.on('close', function() {
  console.log(`[ZIP] ✓ source2-deploy.zip successfully created!`);
  console.log(`[ZIP] Total size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('[ZIP] Warning:', err);
  } else {
    throw err;
  }
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// Whitelisted files to include
const filesToInclude = [
  'package.json',
  'package-lock.json',
  'ecosystem.config.js',
  'deploy-server-setup.sh',
  'start-with-env.js',
  'next.config.ts',
  'postcss.config.mjs',
  'tsconfig.json',
  '.htaccess'
];

// Whitelisted directories to include
const foldersToInclude = [
  '.next',
  'backend',
  'proxy',
  'public',
  'scripts'
];

// Filter function to exclude non-standalone node_modules and Next.js cache/dev folders
function filterNodeModules(entry) {
  const name = entry.name;
  
  // Exclude node_modules EXCEPT those inside standalone folder
  if (name.includes('node_modules') && !name.includes('standalone')) {
    return false;
  }
  
  // Exclude Next.js dev server assets and compiler cache
  if (name.startsWith('cache/') || name === 'cache' || name.startsWith('dev/') || name === 'dev') {
    return false;
  }
  
  return entry;
}

// Append folders
foldersToInclude.forEach(folder => {
  const folderPath = path.join(__dirname, folder);
  if (fs.existsSync(folderPath)) {
    console.log(`[ZIP] Packaging folder: ${folder}`);
    archive.directory(folderPath, folder, filterNodeModules);
  } else {
    console.log(`[ZIP] Folder not found: ${folder}`);
  }
});

// Append files
filesToInclude.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`[ZIP] Packaging file: ${file}`);
    archive.file(filePath, { name: file });
  } else {
    console.log(`[ZIP] File not found: ${file}`);
  }
});

console.log('[ZIP] Creating archive...');
archive.finalize();
