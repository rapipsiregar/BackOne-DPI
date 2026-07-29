const fs = require('fs');
const path = require('path');

const excludeDirs = ['node_modules', '.next', 'scratch', 'test', '.git', 'dist'];

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        getFiles(filePath, fileList);
      }
    } else {
      if (['.ts', '.tsx', '.js', '.jsx'].includes(path.extname(file))) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const allFiles = getFiles('C:\\Users\\demo\\Downloads\\Deep Package Inspection');

console.log('--- Checking file sizes (Rule 3: 256-LOC limit) ---');
const longFiles = [];
allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n').length;
  if (lines > 256) {
    longFiles.push({ file, lines });
  }
});

console.log(`Found ${longFiles.length} files exceeding 256 lines:`);
longFiles.forEach(f => {
  console.log(`- ${path.relative('C:\\Users\\demo\\Downloads\\Deep Package Inspection', f.file)}: ${f.lines} lines`);
});
