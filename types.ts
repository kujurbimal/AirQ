
export enum AQILevel {
  GOOD = 'Good',
  MODERATE = 'Moderate',
  UNHEALTHY_SENSITIVE = 'Unhealthy for Sensitive Groups',
  UNHEALTHY = 'Unhealthy',
  VERY_UNHEALTHY = 'Very Unhealthy',
  HAZARDOUS = 'Hazardous'
}

export interface Pollutants {
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  co: number;
  so2: number;
}

export interface AirQualityData {
  aqi: number;
  level: AQILevel;
  pollutants: Pollutants;
  timestamp: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    city?: string;
    neighborhood?: string;
    accuracy?: number;
    isGpsLive?: boolean;
    nearestStation?: string;
    stationDistanceKm?: number;
  };
}

export interface HealthProfile {
  age: number;
  conditions: string[];
  activityLevel: 'low' | 'medium' | 'high';
}

export interface AIRecommendation {
  summary: string;
  activityAdvice: string;
  routeAdvice: string;
  healthWarning?: string;
}

export interface CitizenReport {
  id: string;
  type: 'pollution' | 'clarity' | 'sensor';
  description: string;
  location: string;
  timestamp: string;
  imageUrl?: string;
}
