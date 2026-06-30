const fs = require('fs');
const files = [
  'src/app/network-infrastructure/page.tsx', 
  'src/app/dpi-analytics/page.tsx', 
  'src/app/intelligence/page.tsx'
];

files.forEach(f => {
  let text = fs.readFileSync(f, 'utf8');
  text = text.replace(/accessorKey:\s*"([^"]+)"/g, 'accessor: (row: any) => row.$1');
  text = text.replace(/accessorKey:\s*\(/g, 'accessor: (');
  fs.writeFileSync(f, text);
});
console.log('Fixed accessorKey');
