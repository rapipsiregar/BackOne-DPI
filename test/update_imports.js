// Script to update page files to use api-with-context instead of api
// This ensures all page hooks automatically use timeRange from TimeFilterContext

const fs = require('fs');
const path = require('path');

// Files that import hooks from @/lib/api (not fetch functions, just hooks)
const pageFiles = [
  'src/app/(dashboard)/page.tsx',
  'src/app/(dashboard)/threats/page.tsx',
  'src/app/(dashboard)/flows/page.tsx',
  'src/app/(dashboard)/devices/page.tsx',
  'src/app/(dashboard)/apps/page.tsx',
  'src/app/(dashboard)/dns/page.tsx',
  'src/app/(dashboard)/events/page.tsx',
  'src/app/(dashboard)/geography/page.tsx',
  'src/app/(dashboard)/intelligence/page.tsx',
  'src/app/(dashboard)/network-intelligence/page.tsx',
  'src/app/(dashboard)/security-audit/page.tsx',
];

// Hooks that are context-aware (exist in api-with-context.ts)
const contextHooks = [
  'useDashboardSummary', 'useTimeline', 'useTopApps', 'useTopProtocols',
  'useDevices', 'useThreats', 'useAppCategories', 'useContinents',
  'useFlows', 'useCountries', 'useDNS', 'useEvents',
  'useTlsVersions', 'useTlsCiphers', 'useTlsSecurity', 'useIntelligenceStats',
];

// Types/fetch functions that should remain in @/lib/api
const apiOnly = [
  'fetcher', 'fetchAgentDetails', 'fetchDeviceDetails', 'fetchAppDetails',
  'fetchSecurityDevices', 'useLookupApplications',
  // Type re-exports
  'DashboardSummary', 'TimelinePoint', 'AppStat', 'ProtocolStat', 'DeviceStat',
  'ThreatStat', 'AppCategoryStat', 'ContinentStat', 'FlowStat', 'CountryStat',
  'DnsStat', 'EventStat', 'TlsVersionStat', 'TlsCipherStat', 'TlsSecurityStat',
  'IntelligenceStats', 'AgentDetails', 'DeviceDetails', 'AppDetails', 'SecurityDevice',
];

let totalChanges = 0;

for (const relPath of pageFiles) {
  const filePath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(filePath)) {
    console.log('SKIP (not found):', relPath);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  const original = content;

  // Find all imports from @/lib/api (not api-with-context, not api-advanced)
  const importRegex = /import \{([^}]+)\} from ["']@\/lib\/api["'];?/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const fullImport = match[0];
    const importedItems = match[1].split(',').map(s => s.trim()).filter(Boolean);
    
    // Categorize: hooks go to api-with-context, types/fetchers stay in api
    const hooksToMove = importedItems.filter(item => 
      contextHooks.includes(item) || contextHooks.includes(item.split(' ')[0]) // handle "as" aliases
    );
    const typesToKeep = importedItems.filter(item => 
      !contextHooks.includes(item) && !contextHooks.includes(item.split(' ')[0])
    );
    
    if (hooksToMove.length === 0) continue; // nothing to move
    
    let newImports = '';
    
    if (typesToKeep.length > 0) {
      newImports += `import { ${typesToKeep.join(', ')} } from "@/lib/api";\n`;
    }
    if (hooksToMove.length > 0) {
      newImports += `import { ${hooksToMove.join(', ')} } from "@/lib/api-with-context";`;
    }
    
    content = content.replace(fullImport, newImports);
    totalChanges++;
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content.replace(/\n/g, '\r\n'), 'utf8');
    console.log('✓ Updated:', relPath);
  } else {
    console.log('  No changes needed:', relPath);
  }
}

console.log(`\nTotal files updated: ${totalChanges}`);
