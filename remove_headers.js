const fs = require('fs');
const path = require('path');

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
  let content = fs.readFileSync(file, 'utf8');
  
  let regex1 = /<div className="flex items-center justify-between">\s*<div>\s*<h2 className="text-[23]xl[^>]*>[\s\S]*?<\/h2>\s*(<p[^>]*>[\s\S]*?<\/p>)?\s*<\/div>\s*(<div[^>]*>[\s\S]*?<\/div>)?\s*<\/div>/g;
  let regex2 = /<div className="flex items-center justify-between">\s*<h2 className="text-[23]xl[^>]*>[\s\S]*?<\/h2>\s*<\/div>/g;
  let regex3 = /<h2 className="text-[23]xl[^>]*>[\s\S]*?<\/h2>/g;
  
  let newContent = content.replace(regex1, '').replace(regex2, '');
  
  // Also clean up stray headers that might not have the div wrapper
  if(newContent.match(regex3)) {
      newContent = newContent.replace(regex3, '');
  }
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log('Updated ' + file);
  }
}
