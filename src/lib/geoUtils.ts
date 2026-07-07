export interface GeoLocation {
  lat: number;
  lng: number;
  label: string;
}

// ─── 1. GLOBAL DESTINATION COORDINATES (By Country Code) ────────────────
export const COUNTRY_COORDS: Record<string, [number, number]> = {
  "ID": [113.9213, -0.7893],
  "US": [-95.7129, 37.0902],
  "HK": [114.1095, 22.3964],
  "SG": [103.8198, 1.3521],
  "JP": [138.2529, 36.2048],
  "SC": [55.4920, -4.6796],
  "GB": [-3.4360, 55.3781],
  "IT": [12.5674, 41.8719],
  "CN": [104.1954, 35.8617],
  "KR": [127.7669, 35.9078],
  "CA": [-106.3468, 56.1304],
  "LU": [6.1296, 49.8153],
  "NL": [5.2913, 52.1326],
  "TR": [35.2433, 38.9637],
  "UA": [31.1656, 48.3794],
  "RU": [105.3188, 61.5240],
  "HU": [19.5033, 47.1625],
  "BD": [90.3563, 23.6850],
  "AU": [133.7751, -25.2744],
  "IN": [78.9629, 20.5937],
  "DE": [10.4515, 51.1657],
  "FR": [2.2137, 46.2276],
  "ES": [-3.7492, 40.4637],
  "BR": [-51.9253, -14.2350],
  "MY": [101.9758, 4.2105],
  "TH": [100.9925, 15.8700],
  "VN": [108.2772, 14.0583],
  "PH": [121.7740, 12.8797],
  "TW": [120.9605, 23.6978],
  "GR": [21.8243, 39.0742],
};

// ─── 2. MANUAL CONFIGURATION (For Local IPs, Agent UUIDs, or City Names) ───
// Users can edit this section to map their internal locations accurately.
export const MANUAL_OVERRIDES: Record<string, GeoLocation> = {
  // Map by IP
  "192.168.201.30": { lat: -7.2504, lng: 112.7688, label: "Surabaya, Indonesia" },
  
  // Map by Network Agent UUID (Example UUIDs)
  "Balaraja-Agent": { lat: -6.1915, lng: 106.4526, label: "Balaraja, Indonesia" },
  "F6-2V-DT-8A": { lat: -6.1915, lng: 106.4526, label: "Balaraja, Indonesia" },
  "2F-TF-1D-GK": { lat: -6.9147, lng: 107.6098, label: "Bandung, Indonesia" },
  
  // Map by City Names
  "Jakarta": { lat: -6.2088, lng: 106.8456, label: "Jakarta, Indonesia" },
  "Surabaya": { lat: -7.2504, lng: 112.7688, label: "Surabaya, Indonesia" },
  "Bandung": { lat: -6.9147, lng: 107.6098, label: "Bandung, Indonesia" },
  "Balaraja": { lat: -6.1915, lng: 106.4526, label: "Balaraja, Indonesia" },
};

// Default fallback origin if nothing matches
export const DEFAULT_ORIGIN: GeoLocation = { 
  lat: -6.2088, 
  lng: 106.8456, 
  label: "Jakarta, Indonesia" 
};

export const COUNTRY_CAPITALS: Record<string, string> = {
  "ID": "Jakarta",
  "US": "Washington D.C.",
  "HK": "Hong Kong",
  "SG": "Singapore",
  "JP": "Tokyo",
  "SC": "Victoria",
  "GB": "London",
  "IT": "Rome",
  "CN": "Beijing",
  "KR": "Seoul",
  "CA": "Ottawa",
  "LU": "Luxembourg",
  "NL": "Amsterdam",
  "TR": "Ankara",
  "UA": "Kyiv",
  "RU": "Moscow",
  "HU": "Budapest",
  "BD": "Dhaka",
  "AU": "Canberra",
  "IN": "New Delhi",
  "DE": "Berlin",
  "FR": "Paris",
  "ES": "Madrid",
  "BR": "Brasília",
  "MY": "Kuala Lumpur",
  "TH": "Bangkok",
  "VN": "Hanoi",
  "PH": "Manila",
  "TW": "Taipei",
  "GR": "Athens",
};

/**
 * Gets the exact origin coordinates based on IP, Agent, or City overrides.
 */
export function getOriginLocation(identifier?: string): GeoLocation {
  if (identifier && MANUAL_OVERRIDES[identifier]) {
    const override = MANUAL_OVERRIDES[identifier];
    // Ensure format is "City, Country"
    if (!override.label.includes(",")) {
      return { ...override, label: `${override.label}, Indonesia` };
    }
    return override;
  }
  return DEFAULT_ORIGIN;
}

/**
 * Gets the exact destination coordinates based on Country Code.
 */
export function getDestinationLocation(countryCode: string, countryName?: string): GeoLocation | null {
  const coords = COUNTRY_COORDS[countryCode];
  if (!coords) return null;
  
  const cityName = COUNTRY_CAPITALS[countryCode] || "Unknown City";
  const cName = countryName || countryCode;
  
  // Note: COUNTRY_COORDS uses [lng, lat] format
  return {
    lat: coords[1],
    lng: coords[0],
    label: `${cityName}, ${cName}`
  };
}
