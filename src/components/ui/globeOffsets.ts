// src/components/ui/globeOffsets.ts

export const SMALL_LABEL_COUNTRIES = new Set([
  // Europe
  'GB', 'IE', 'FR', 'DE', 'NL', 'BE', 'LU', 'CH', 'IT', 'ES', 'PT', 'GR', 'TR', 'CY',
  'NO', 'SE', 'FI', 'DK', 'PL', 'UA', 'BY', 'LT', 'LV', 'EE', 'RO', 'BG', 'HU', 'SK', 'CZ', 'AT', 'MD',
  // Central America & Caribbean
  'GP', 'TT', 'PA', 'CR', 'NI', 'HN', 'SV', 'GT', 'BZ', 'JM', 'PR', 'DO', 'HT', 'BS', 'VG', 'DM',
  // Indian Ocean
  'MU', 'RE', 'SC'
]);

export function getStaggeredCoordinates(countryCode: string, startLat: number, startLng: number): { lat: number; lng: number } {
  let lat = startLat;
  let lng = startLng;

  if (countryCode === 'SG') {
    lat += 1.5;
    lng -= 1.0;
  } else if (countryCode === 'MY') {
    lat += 3.0;
    lng -= 1.5;
  } else if (countryCode === 'VE') {
    lat += 2.5;
    lng += 1.0;
  } else if (countryCode === 'CO') {
    lat += 1.0;
    lng -= 3.0;
  } else if (countryCode === 'EC') {
    lat -= 0.5;
    lng -= 3.5;
  } else if (countryCode === 'PE') {
    lat -= 1.0;
    lng -= 2.5;
  } else if (countryCode === 'BO') {
    lat -= 1.5;
    lng -= 1.5;
  } else if (countryCode === 'PY') {
    lat -= 1.0;
    lng += 2.0;
  } else if (countryCode === 'UY') {
    lat -= 2.0;
    lng += 3.0;
  } else if (countryCode === 'BR') {
    lat += 1.5;
    lng += 2.0;
  } else if (countryCode === 'CL') {
    lat -= 3.0;
    lng -= 2.0;
  } else if (countryCode === 'AR') {
    lat -= 3.5;
    lng += 1.0;
  } else if (countryCode === 'SR') {
    lat += 1.5;
    lng += 2.0;
  } else if (countryCode === 'GY') {
    lat += 2.5;
    lng -= 1.0;
  } else if (countryCode === 'PA') {
    lat -= 1.0;
    lng -= 1.0;
  } else if (countryCode === 'GT') {
    lat += 2.5;
    lng -= 2.0;
  } else if (countryCode === 'TT') {
    lat -= 1.5;
    lng += 1.5;
  } else if (countryCode === 'GP') {
    lat += 3.0;
    lng += 1.5;
  } else if (countryCode === 'PR') {
    lat += 1.5;
    lng -= 1.5;
  } else if (countryCode === 'VG') {
    lat += 2.2;
    lng += 1.0;
  } else if (countryCode === 'DO') {
    lat -= 1.0;
    lng -= 1.0;
  } else if (countryCode === 'HT') {
    lat -= 1.5;
    lng -= 2.5;
  } else if (countryCode === 'JM') {
    lat -= 2.0;
    lng -= 4.0;
  } else if (countryCode === 'CR') {
    lat -= 0.5;
    lng -= 2.0;
  } else if (countryCode === 'NI') {
    lat += 0.5;
    lng -= 1.5;
  } else if (countryCode === 'HN') {
    lat += 1.5;
    lng -= 1.0;
  } else if (countryCode === 'SV') {
    lat -= 1.5;
    lng -= 2.5;
  } else if (countryCode === 'MU') {
    lat += 0.8;
    lng += 0.8;
  } else if (countryCode === 'RE') {
    lat -= 0.8;
    lng -= 0.8;
  } else if (countryCode === 'NO') {
    lat += 2.0;
    lng -= 1.0;
  } else if (countryCode === 'SE') {
    lat += 3.0;
    lng += 1.0;
  } else if (countryCode === 'FI') {
    lat += 4.0;
    lng += 2.0;
  } else if (countryCode === 'DK') {
    lat += 0.8;
  } else if (countryCode === 'NL') {
    lat += 1.5;
    lng += 0.5;
  } else if (countryCode === 'BE') {
    lat -= 0.5;
    lng -= 1.2;
  } else if (countryCode === 'LU') {
    lat -= 1.5;
    lng -= 0.8;
  } else if (countryCode === 'CH') {
    lat -= 2.5;
    lng -= 1.0;
  } else if (countryCode === 'DE') {
    lat += 1.0;
    lng += 1.0;
  } else if (countryCode === 'AT') {
    lat -= 1.5;
    lng -= 0.5;
  } else if (countryCode === 'IT') {
    lat -= 4.0;
    lng -= 0.5;
  } else if (countryCode === 'ES') {
    lat -= 1.5;
  } else if (countryCode === 'PT') {
    lat -= 1.0;
    lng -= 1.5;
  } else if (countryCode === 'GR') {
    lat -= 4.0;
    lng += 1.0;
  } else if (countryCode === 'EE') {
    lat += 2.0;
    lng += 1.5;
  } else if (countryCode === 'LV') {
    lat += 1.2;
    lng += 1.5;
  } else if (countryCode === 'LT') {
    lat += 0.5;
    lng += 1.5;
  } else if (countryCode === 'PL') {
    lat += 1.0;
    lng += 1.5;
  } else if (countryCode === 'UA') {
    lat += 0.5;
    lng += 3.0;
  } else if (countryCode === 'MD') {
    lat -= 0.2;
    lng += 2.5;
  } else if (countryCode === 'BY') {
    lat += 2.0;
    lng += 2.0;
  } else if (countryCode === 'RO') {
    lat -= 1.0;
    lng += 2.0;
  } else if (countryCode === 'BG') {
    lat -= 2.5;
    lng += 2.0;
  } else if (countryCode === 'HU') {
    lat -= 2.0;
    lng += 1.0;
  } else if (countryCode === 'SK') {
    lat -= 1.2;
    lng += 0.5;
  } else if (countryCode === 'CZ') {
    lat -= 0.5;
    lng -= 1.0;
  }

  return { lat, lng };
}
