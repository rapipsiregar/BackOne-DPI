const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('src/app/(dashboard)');

for (const file of files) {
  try {
    const gitFile = file.replace(/\\/g, '/');
    const original = execSync('git show HEAD:"' + gitFile + '"').toString();
    const current = fs.readFileSync(file, 'utf8');
    
    let regex1 = /<div className="flex items-center justify-between">\s*(<div>\s*)?<h2 className="text-[23]xl[^>]*>[\s\S]*?<\/h2>(\s*<p[^>]*>[\s\S]*?<\/p>\s*)?(<\/div>\s*)?(<div[^>]*>[\s\S]*?<\/div>\s*)?<\/div>/;
    let regex2 = /<div className="flex items-center justify-between">\s*<h2 className="text-[23]xl[^>]*>[\s\S]*?<\/h2>\s*<\/div>/;
    let regex3 = /<h2 className="text-[23]xl[^>]*>[\s\S]*?<\/h2>/;
    
    let match = original.match(regex1) || original.match(regex2) || original.match(regex3);
    
    if (match && !current.includes('<h2 className="text-')) {
       let spaceYRegex = /<div className="space-y-[^"]*"/;
       let spaceYMatch = current.match(spaceYRegex);
       if (spaceYMatch) {
          let insertPos = current.indexOf(spaceYMatch[0]);
          let closingBracket = current.indexOf('>', insertPos);
          let newContent = current.slice(0, closingBracket + 1) + '\n' + match[0] + current.slice(closingBracket + 1);
          fs.writeFileSync(file, newContent);
          console.log('Restored header in ' + file);
       }
    }
  } catch(e) {
    console.log("Error processing " + file + ": " + e.message);
  }
}
