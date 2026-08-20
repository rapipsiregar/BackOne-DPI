export function sortAppOptions(options: string[]): string[] {
  const KNOWN_PORTS = new Set([
    "1433", "1434", "1521", "1812", "1813", "1900", "3306", "3389",
    "5060", "5061", "5353", "5432", "5900", "6379", "8000", "8080",
    "8443", "9200", "27017"
  ]);

  const getPortInfo = (opt: string) => {
    const m = opt.trim().match(/^(?:Port\s+)?(\d+)$/i);
    if (!m) {
      return { isPort: false, portNum: 0, isStandard: true, name: opt };
    }
    const portNum = parseInt(m[1], 10);
    const isStandard = portNum < 1024 || KNOWN_PORTS.has(String(portNum));
    return { isPort: true, portNum, isStandard, name: opt };
  };

  return [...options].sort((a, b) => {
    const infoA = getPortInfo(a);
    const infoB = getPortInfo(b);

    if (infoA.isStandard && !infoB.isStandard) return -1;
    if (!infoA.isStandard && infoB.isStandard) return 1;

    if (infoA.isStandard && infoB.isStandard) {
      if (!infoA.isPort && infoB.isPort) return -1;
      if (infoA.isPort && !infoB.isPort) return 1;
      if (!infoA.isPort && !infoB.isPort) {
        return infoA.name.localeCompare(infoB.name);
      }
      return infoA.portNum - infoB.portNum;
    }

    return infoA.portNum - infoB.portNum;
  });
}
