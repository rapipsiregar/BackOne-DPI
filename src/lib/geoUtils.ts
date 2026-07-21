import { WORLD_COUNTRY_COORDS } from "./countryCoordinates";

export interface GeoLocation {
  lat: number;
  lng: number;
  label: string;
}

// ─── 1. GLOBAL DESTINATION COORDINATES (By Country Code) ────────────────
export const COUNTRY_COORDS: Record<string, [number, number]> = WORLD_COUNTRY_COORDS;

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
  "BR": "Brasilia",
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
  
  const cityName = COUNTRY_CAPITALS[countryCode];
  const cName = countryName || countryCode;
  
  // Note: COUNTRY_COORDS uses [lng, lat] format
  return {
    lat: coords[1],
    lng: coords[0],
    label: cityName ? `${cityName}, ${cName}` : cName
  };
}
