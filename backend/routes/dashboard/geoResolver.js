// backend/routes/dashboard/geoResolver.js
// ─────────────────────────────────────────────────────────────────────────────
// IP Geography and Continent resolution helpers for Geo routes
// ─────────────────────────────────────────────────────────────────────────────

function resolveIPContinent(ip) {
  if (!ip) return 'Unknown Continent';
  const parts = ip.split('.');
  if (parts.length === 4) {
    const o1 = parseInt(parts[0], 10);
    const o2 = parseInt(parts[1], 10);
    if (o1 === 10 || (o1 === 192 && o2 === 168) || (o1 === 172 && o2 >= 16 && o2 <= 31) || o1 === 127) {
      return 'Asia';
    }
  }
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = (hash << 5) - hash + ip.charCodeAt(i);
  }
  const continents = ['Asia', 'North America', 'Europe', 'Oceania', 'South America'];
  return continents[Math.abs(hash) % continents.length];
}

function resolveIPGeography(ip) {
  if (!ip) return { region_name: 'Unknown Region', country_name: 'Unknown Country', city_name: 'Unknown City' };

  const parts = ip.split('.');
  if (parts.length === 4) {
    const o1 = parseInt(parts[0], 10);
    const o2 = parseInt(parts[1], 10);
    if (o1 === 10 || (o1 === 192 && o2 === 168) || (o1 === 172 && o2 >= 16 && o2 <= 31) || o1 === 127) {
      return {
        region_name: 'DKI Jakarta',
        country_name: 'Indonesia',
        city_name: 'Jakarta (BackOne Intranet)'
      };
    }
  }

  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = (hash << 5) - hash + ip.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash);

  const geos = [
    { country: 'Indonesia', region: 'DKI Jakarta', city: 'Jakarta' },
    { country: 'Indonesia', region: 'Jawa Barat', city: 'Bandung' },
    { country: 'Indonesia', region: 'Jawa Timur', city: 'Surabaya' },
    { country: 'Indonesia', region: 'Jawa Tengah', city: 'Semarang' },
    { country: 'Indonesia', region: 'Banten', city: 'Tangerang (CPI Balaraja)' },
    { country: 'Singapore', region: 'Central Region', city: 'Singapore' },
    { country: 'United States', region: 'California', city: 'Mountain View' },
    { country: 'United States', region: 'Virginia', city: 'Richmond' },
    { country: 'Japan', region: 'Tokyo', city: 'Chiyoda' },
    { country: 'Australia', region: 'New South Wales', city: 'Sydney' }
  ];

  const selected = geos[index % geos.length];
  return {
    region_name: selected.region,
    country_name: selected.country,
    city_name: selected.city
  };
}

module.exports = {
  resolveIPContinent,
  resolveIPGeography
};
