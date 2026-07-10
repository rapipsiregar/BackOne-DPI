// Script to update all API hooks to accept timeRange parameter
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'api.ts');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

let count = 0;

// Helper to replace hook signatures and add timeRange to useEffect deps
function patchHook(content, hookSignature, fetchCall, newFetchCall, depArray, newDepArray) {
  if (content.includes(hookSignature)) {
    content = content.replace(hookSignature, hookSignature.replace(')', ', timeRange?: string)'));
    if (fetchCall && newFetchCall) {
      content = content.replace(fetchCall, newFetchCall);
    }
    if (depArray && newDepArray) {
      content = content.replace(depArray, newDepArray);
    }
    count++;
  }
  return content;
}

// useDashboardSummary
content = content.replace(
  'export function useDashboardSummary() {',
  'export function useDashboardSummary(timeRange?: string) {'
);
content = content.replace(
  "    fetcher<DashboardSummary>('/summary')\n      .then(setData)",
  "    fetcher<DashboardSummary>('/summary', timeRange)\n      .then(setData)"
);
content = content.replace(
  "  }, []);\n\n  return { data, error, isLoading };\n}\n\nexport function useTimeline",
  "  }, [timeRange]);\n\n  return { data, error, isLoading };\n}\n\nexport function useTimeline"
);

// useTimeline
content = content.replace(
  'export function useTimeline(points: number = 60) {',
  'export function useTimeline(points: number = 60, timeRange?: string) {'
);
content = content.replace(
  "    fetcher<TimelinePoint[]>(`/timeline?points=${points}`)",
  "    fetcher<TimelinePoint[]>(`/timeline?points=${points}`, timeRange)"
);
content = content.replace(
  "  }, [points]);\n\n  return { data, error, isLoading };\n}\n\nexport function useTopApps",
  "  }, [points, timeRange]);\n\n  return { data, error, isLoading };\n}\n\nexport function useTopApps"
);

// useTopApps
content = content.replace(
  'export function useTopApps(limit: number = 10) {',
  'export function useTopApps(limit: number = 10, timeRange?: string) {'
);
content = content.replace(
  "    fetcher<AppStat[]>(`/apps?limit=${limit}`)",
  "    fetcher<AppStat[]>(`/apps?limit=${limit}`, timeRange)"
);
content = content.replace(
  "  }, [limit]);\n\n  return { data, error, isLoading };\n}\n\nexport function useTopProtocols",
  "  }, [limit, timeRange]);\n\n  return { data, error, isLoading };\n}\n\nexport function useTopProtocols"
);

// useTopProtocols
content = content.replace(
  'export function useTopProtocols() {',
  'export function useTopProtocols(timeRange?: string) {'
);
content = content.replace(
  "    fetcher<ProtocolStat[]>('/protocols')",
  "    fetcher<ProtocolStat[]>('/protocols', timeRange)"
);
content = content.replace(
  "  }, []);\n\n  return { data, error, isLoading };\n}\n\nexport function useDevices",
  "  }, [timeRange]);\n\n  return { data, error, isLoading };\n}\n\nexport function useDevices"
);

// useDevices
content = content.replace(
  'export function useDevices(limit: number = 50) {',
  'export function useDevices(limit: number = 50, timeRange?: string) {'
);
content = content.replace(
  "    fetcher<DeviceStat[]>(`/devices?limit=${limit}`)",
  "    fetcher<DeviceStat[]>(`/devices?limit=${limit}`, timeRange)"
);
content = content.replace(
  "  }, [limit]);\n\n  return { data, error, isLoading };\n}\n\nexport function useThreats",
  "  }, [limit, timeRange]);\n\n  return { data, error, isLoading };\n}\n\nexport function useThreats"
);

// useThreats
content = content.replace(
  'export function useThreats(limit: number = 20) {',
  'export function useThreats(limit: number = 20, timeRange?: string) {'
);
content = content.replace(
  "    fetcher<ThreatStat[]>(`/threats?limit=${limit}`)",
  "    fetcher<ThreatStat[]>(`/threats?limit=${limit}`, timeRange)"
);
content = content.replace(
  "  }, [limit]);\n\n  return { data, error, isLoading };\n}\n\nexport function useAppCategories",
  "  }, [limit, timeRange]);\n\n  return { data, error, isLoading };\n}\n\nexport function useAppCategories"
);

// useAppCategories
content = content.replace(
  'export function useAppCategories() {',
  'export function useAppCategories(timeRange?: string) {'
);
content = content.replace(
  "    fetcher<AppCategoryStat[]>('/app-categories')",
  "    fetcher<AppCategoryStat[]>('/app-categories', timeRange)"
);
content = content.replace(
  "  }, []);\n\n  return { data, error, isLoading };\n}\n\nexport function useContinents",
  "  }, [timeRange]);\n\n  return { data, error, isLoading };\n}\n\nexport function useContinents"
);

// useContinents
content = content.replace(
  'export function useContinents() {',
  'export function useContinents(timeRange?: string) {'
);
content = content.replace(
  "    fetcher<ContinentStat[]>('/continents')",
  "    fetcher<ContinentStat[]>('/continents', timeRange)"
);
content = content.replace(
  "  }, []);\n\n  return { data, error, isLoading };\n}\n\nexport function useFlows",
  "  }, [timeRange]);\n\n  return { data, error, isLoading };\n}\n\nexport function useFlows"
);

// useFlows
content = content.replace(
  'export function useFlows(limit: number = 50) {',
  'export function useFlows(limit: number = 50, timeRange?: string) {'
);
content = content.replace(
  "    fetcher<FlowStat[]>(`/flows?limit=${limit}`)",
  "    fetcher<FlowStat[]>(`/flows?limit=${limit}`, timeRange)"
);
content = content.replace(
  "  }, [limit]);\n\n  return { data, error, isLoading };\n}\n\nexport function useCountries",
  "  }, [limit, timeRange]);\n\n  return { data, error, isLoading };\n}\n\nexport function useCountries"
);

// useCountries
content = content.replace(
  'export function useCountries(limit: number = 50) {',
  'export function useCountries(limit: number = 50, timeRange?: string) {'
);
content = content.replace(
  "    fetcher<CountryStat[]>(`/countries?limit=${limit}`)",
  "    fetcher<CountryStat[]>(`/countries?limit=${limit}`, timeRange)"
);
content = content.replace(
  "  }, [limit]);\n\n  return { data, error, isLoading };\n}\n\nexport function useDNS",
  "  }, [limit, timeRange]);\n\n  return { data, error, isLoading };\n}\n\nexport function useDNS"
);

// useDNS
content = content.replace(
  'export function useDNS(limit: number = 50) {',
  'export function useDNS(limit: number = 50, timeRange?: string) {'
);
content = content.replace(
  "    fetcher<DnsStat[]>(`/dns?limit=${limit}`)",
  "    fetcher<DnsStat[]>(`/dns?limit=${limit}`, timeRange)"
);
content = content.replace(
  "  }, [limit]);\n\n  return { data, error, isLoading };\n}\n\nexport function useEvents",
  "  }, [limit, timeRange]);\n\n  return { data, error, isLoading };\n}\n\nexport function useEvents"
);

// useEvents
content = content.replace(
  'export function useEvents(limit: number = 50) {',
  'export function useEvents(limit: number = 50, timeRange?: string) {'
);
content = content.replace(
  "    fetcher<EventStat[]>(`/events?limit=${limit}`)",
  "    fetcher<EventStat[]>(`/events?limit=${limit}`, timeRange)"
);
content = content.replace(
  "  }, [limit]);\n\n  return { data, error, isLoading };\n}\n\nexport function useTlsVersions",
  "  }, [limit, timeRange]);\n\n  return { data, error, isLoading };\n}\n\nexport function useTlsVersions"
);

// useTlsVersions
content = content.replace(
  'export function useTlsVersions(limit: number = 10) {',
  'export function useTlsVersions(limit: number = 10, timeRange?: string) {'
);
content = content.replace(
  "    fetcher<TlsVersionStat[]>(`/tls-versions?limit=${limit}`)",
  "    fetcher<TlsVersionStat[]>(`/tls-versions?limit=${limit}`, timeRange)"
);
content = content.replace(
  "  }, [limit]);\n\n  return { data, error, isLoading };\n}\n\nexport function useTlsCiphers",
  "  }, [limit, timeRange]);\n\n  return { data, error, isLoading };\n}\n\nexport function useTlsCiphers"
);

// useTlsCiphers
content = content.replace(
  'export function useTlsCiphers(limit: number = 15) {',
  'export function useTlsCiphers(limit: number = 15, timeRange?: string) {'
);
content = content.replace(
  "    fetcher<TlsCipherStat[]>(`/tls-ciphers?limit=${limit}`)",
  "    fetcher<TlsCipherStat[]>(`/tls-ciphers?limit=${limit}`, timeRange)"
);
content = content.replace(
  "  }, [limit]);\n\n  return { data, error, isLoading };\n}\n\nexport function useTlsSecurity",
  "  }, [limit, timeRange]);\n\n  return { data, error, isLoading };\n}\n\nexport function useTlsSecurity"
);

// useTlsSecurity
content = content.replace(
  'export function useTlsSecurity(limit: number = 10) {',
  'export function useTlsSecurity(limit: number = 10, timeRange?: string) {'
);
content = content.replace(
  "    fetcher<TlsSecurityStat[]>(`/tls-security?limit=${limit}`)",
  "    fetcher<TlsSecurityStat[]>(`/tls-security?limit=${limit}`, timeRange)"
);
content = content.replace(
  "  }, [limit]);\n\n  return { data, error, isLoading };\n}\n\nexport function useIntelligenceStats",
  "  }, [limit, timeRange]);\n\n  return { data, error, isLoading };\n}\n\nexport function useIntelligenceStats"
);

// useIntelligenceStats
content = content.replace(
  'export function useIntelligenceStats() {',
  'export function useIntelligenceStats(timeRange?: string) {'
);
content = content.replace(
  "    fetcher<IntelligenceStats>('/intelligence/stats')",
  "    fetcher<IntelligenceStats>('/intelligence/stats', timeRange)"
);
content = content.replace(
  "  }, []);\n\n  return { data, error, isLoading };\n}\n\n// ─── LOOKUP APPLICATIONS",
  "  }, [timeRange]);\n\n  return { data, error, isLoading };\n}\n\n// ─── LOOKUP APPLICATIONS"
);

// Write back with CRLF
fs.writeFileSync(filePath, content.replace(/\n/g, '\r\n'), 'utf8');

// Verify
const verify = fs.readFileSync(filePath, 'utf8');
const hooks = [
  'useDashboardSummary', 'useTimeline', 'useTopApps', 'useTopProtocols',
  'useDevices', 'useThreats', 'useAppCategories', 'useContinents',
  'useFlows', 'useCountries', 'useDNS', 'useEvents',
  'useTlsVersions', 'useTlsCiphers', 'useTlsSecurity', 'useIntelligenceStats'
];

console.log('\n=== api.ts Patch Results ===');
let allOk = true;
for (const hook of hooks) {
  const pattern = hook + '(';
  const idx = verify.indexOf('export function ' + hook);
  if (idx < 0) { console.log('✗ MISSING:', hook); allOk = false; continue; }
  const slice = verify.slice(idx, idx + 80);
  const hasTimeRange = slice.includes('timeRange');
  console.log((hasTimeRange ? '✓' : '✗') + ' ' + hook + ' timeRange param');
  if (!hasTimeRange) allOk = false;
}

console.log('\n' + (allOk ? '✓ ALL HOOKS UPDATED' : '✗ SOME HOOKS MISSING'));
