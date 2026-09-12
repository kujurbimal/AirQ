import { AQILevel, AirQualityData, Pollutants } from '../types';

export interface HyperlocalLocation {
  id: string;
  name: string;
  neighborhood: string;
  city: string;
  lat: number;
  lng: number;
  address: string;
  zoneType: 'urban' | 'coastal' | 'industrial' | 'foothill' | 'park';
  baselineAqi: number;
}

export const PRESET_LOCATIONS: HyperlocalLocation[] = [
  {
    id: 'la-dt',
    name: 'Downtown Core',
    neighborhood: 'Historic Core',
    city: 'Los Angeles',
    lat: 34.0522,
    lng: -118.2437,
    address: 'Spring St & 5th St, Los Angeles, CA',
    zoneType: 'urban',
    baselineAqi: 72,
  },
  {
    id: 'la-sm',
    name: 'Santa Monica Beach',
    neighborhood: 'Ocean Park',
    city: 'Santa Monica',
    lat: 34.0099,
    lng: -118.4895,
    address: 'Ocean Ave & Colorado, Santa Monica, CA',
    zoneType: 'coastal',
    baselineAqi: 28,
  },
  {
    id: 'la-ind',
    name: 'Vernon Logistics Corridor',
    neighborhood: 'Industrial District',
    city: 'Vernon',
    lat: 34.0039,
    lng: -118.2300,
    address: 'Slauson Ave & Santa Fe Ave, Vernon, CA',
    zoneType: 'industrial',
    baselineAqi: 118,
  },
  {
    id: 'la-pas',
    name: 'Pasadena Foothills',
    neighborhood: 'Arroyo Seco',
    city: 'Pasadena',
    lat: 34.1478,
    lng: -118.1445,
    address: 'Colorado Blvd & Orange Grove, Pasadena, CA',
    zoneType: 'foothill',
    baselineAqi: 54,
  },
  {
    id: 'la-hol',
    name: 'Hollywood Hills',
    neighborhood: 'Griffith Park',
    city: 'Los Angeles',
    lat: 34.1184,
    lng: -118.3004,
    address: 'Observatory Rd, Los Angeles, CA',
    zoneType: 'park',
    baselineAqi: 35,
  },
  {
    id: 'ny-cp',
    name: 'Central Park West',
    neighborhood: 'Upper West Side',
    city: 'New York',
    lat: 40.7812,
    lng: -73.9665,
    address: 'Central Park West & 72nd St, New York, NY',
    zoneType: 'park',
    baselineAqi: 42,
  },
  {
    id: 'sf-ms',
    name: 'Mission District',
    neighborhood: 'Valencia Corridor',
    city: 'San Francisco',
    lat: 37.7599,
    lng: -122.4148,
    address: 'Valencia St & 18th St, San Francisco, CA',
    zoneType: 'urban',
    baselineAqi: 38,
  }
];

// Calculate distance between two GPS coordinates using Haversine formula
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

// Convert AQI number to Level
export function getAQILevel(aqi: number): AQILevel {
  if (aqi <= 50) return AQILevel.GOOD;
  if (aqi <= 100) return AQILevel.MODERATE;
  if (aqi <= 150) return AQILevel.UNHEALTHY_SENSITIVE;
  if (aqi <= 200) return AQILevel.UNHEALTHY;
  if (aqi <= 300) return AQILevel.VERY_UNHEALTHY;
  return AQILevel.HAZARDOUS;
}

// Synthesize street-level pollutants based on location coordinates & base AQI
export function synthesizeAirDataForLocation(
  lat: number,
  lng: number,
  address: string,
  city: string = 'Local Area',
  neighborhood?: string,
  accuracy?: number,
  isGpsLive: boolean = false
): AirQualityData {
  // Deterministic seed based on coordinates
  const coordSum = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233)) * 43758.5453;
  const variance = (coordSum % 30) - 15; // -15 to +15

  // Default base AQI around 65 with coordinate variation
  let aqi = Math.round(Math.max(18, Math.min(185, 65 + variance)));
  
  // Calculate realistic pollutant ratios
  const pm25 = Number((aqi * 0.32 + ((coordSum % 5) - 2.5)).toFixed(1));
  const pm10 = Number((pm25 * 1.9 + (coordSum % 4)).toFixed(1));
  const o3 = Number((Math.max(15, Math.min(85, 35 + (coordSum % 25)))).toFixed(1));
  const no2 = Number((Math.max(5, Math.min(60, 15 + (aqi * 0.15)))).toFixed(1));
  const co = Number((0.4 + (aqi * 0.008)).toFixed(1));
  const so2 = Number((1.2 + (aqi * 0.015)).toFixed(1));

  const pollutants: Pollutants = {
    pm25,
    pm10,
    no2,
    o3,
    co,
    so2,
  };

  return {
    aqi,
    level: getAQILevel(aqi),
    pollutants,
    timestamp: new Date().toISOString(),
    location: {
      lat,
      lng,
      address,
      city,
      neighborhood,
      accuracy,
      isGpsLive,
    },
  };
}

// Reverse Geocode using OpenStreetMap Nominatim with graceful fallback
export async function reverseGeocode(lat: number, lng: number): Promise<{
  address: string;
  neighborhood?: string;
  city: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en',
        },
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const street = addr.road || addr.pedestrian || addr.street || addr.neighbourhood || '';
      const suburb = addr.suburb || addr.neighbourhood || addr.quarter || addr.district || '';
      const city = addr.city || addr.town || addr.municipality || addr.county || 'Detected Area';
      const state = addr.state || addr.country || '';

      const addressParts = [street, suburb, city].filter(Boolean);
      const fullAddress = addressParts.length > 0 
        ? `${addressParts.join(', ')}${state ? ` (${state})` : ''}` 
        : `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°W`;

      return {
        address: fullAddress,
        neighborhood: suburb || street || undefined,
        city: city,
      };
    }
  } catch (err) {
    console.warn('Reverse geocode fallback used due to network or timeout:', err);
  }

  // Fallback if network fails
  return {
    address: `GPS Pin: ${lat.toFixed(4)}°N, ${Math.abs(lng).toFixed(4)}°${lng < 0 ? 'W' : 'E'}`,
    city: 'Local Area',
    neighborhood: 'Current Hyperlocal Point',
  };
}

// Forward Geocode / Search using OpenStreetMap Nominatim
export async function searchLocations(query: string): Promise<Array<{
  name: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
}>> {
  if (!query || query.trim().length < 2) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query.trim()
      )}&limit=5&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en',
        },
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data.map((item: any) => {
        const addr = item.address || {};
        const city = addr.city || addr.town || addr.municipality || addr.county || item.display_name.split(',')[0];
        return {
          name: item.name || item.display_name.split(',')[0],
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          address: item.display_name,
          city,
        };
      });
    }
  } catch (err) {
    console.warn('Nominatim search request error:', err);
  }

  // Local preset search fallback
  const q = query.toLowerCase();
  return PRESET_LOCATIONS
    .filter(p => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.address.toLowerCase().includes(q))
    .map(p => ({
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      address: p.address,
      city: p.city,
    }));
}
