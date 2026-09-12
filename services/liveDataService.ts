import { AQILevel, AirQualityData, Pollutants } from '../types';
import { getAQILevel } from './locationService';

export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  weatherCode: number;
  timezone: string;
  timestamp: string;
}

export interface LiveAirData extends AirQualityData {
  hourly: Array<{ time: string; aqi: number; pm25: number; pm10: number; o3: number }>;
}

const airUrl = (lat: number, lng: number) => {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: 'us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,carbon_monoxide,sulphur_dioxide',
    hourly: 'us_aqi,pm2_5,pm10,ozone',
    forecast_hours: '24',
    timezone: 'auto',
  });
  return `https://air-quality-api.open-meteo.com/v1/air-quality?${params}`;
};

const weatherUrl = (lat: number, lng: number) => {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code',
    timezone: 'auto',
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
};

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`API request failed (${response.status})`);
    return await response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function fetchLiveAirQuality(
  lat: number,
  lng: number,
  location: AirQualityData['location']
): Promise<LiveAirData> {
  const data = await fetchJson(airUrl(lat, lng));
  const c = data.current || {};
  const pollutants: Pollutants = {
    pm25: Number(c.pm2_5 ?? 0),
    pm10: Number(c.pm10 ?? 0),
    no2: Number(c.nitrogen_dioxide ?? 0),
    o3: Number(c.ozone ?? 0),
    co: Number(c.carbon_monoxide ?? 0) / 1000,
    so2: Number(c.sulphur_dioxide ?? 0),
  };

  const h = data.hourly || {};
  const hourly = (h.time || []).map((time: string, i: number) => ({
    time,
    aqi: Number(h.us_aqi?.[i] ?? 0),
    pm25: Number(h.pm2_5?.[i] ?? 0),
    pm10: Number(h.pm10?.[i] ?? 0),
    o3: Number(h.ozone?.[i] ?? 0),
  }));

  const aqi = Number(c.us_aqi ?? hourly[0]?.aqi ?? 0);
  return {
    aqi,
    level: getAQILevel(aqi),
    pollutants,
    timestamp: c.time || new Date().toISOString(),
    location,
    hourly,
  };
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const data = await fetchJson(weatherUrl(lat, lng));
  const c = data.current;
  return {
    temperature: Number(c.temperature_2m),
    apparentTemperature: Number(c.apparent_temperature),
    humidity: Number(c.relative_humidity_2m),
    windSpeed: Number(c.wind_speed_10m),
    windDirection: Number(c.wind_direction_10m),
    precipitation: Number(c.precipitation),
    weatherCode: Number(c.weather_code),
    timezone: data.timezone,
    timestamp: c.time,
  };
}

export function weatherLabel(code: number): string {
  if (code === 0) return 'Clear sky';
  if ([1, 2, 3].includes(code)) return 'Partly cloudy';
  if ([45, 48].includes(code)) return 'Fog';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rain';
  if ([71, 73, 75, 77].includes(code)) return 'Snow';
  if ([80, 81, 82].includes(code)) return 'Rain showers';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Current conditions';
}
