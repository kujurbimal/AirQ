
import React from 'react';
import { AQILevel } from './types';

export const AQI_COLORS: Record<AQILevel, string> = {
  [AQILevel.GOOD]: 'bg-green-500',
  [AQILevel.MODERATE]: 'bg-yellow-400',
  [AQILevel.UNHEALTHY_SENSITIVE]: 'bg-orange-500',
  [AQILevel.UNHEALTHY]: 'bg-red-500',
  [AQILevel.VERY_UNHEALTHY]: 'bg-purple-600',
  [AQILevel.HAZARDOUS]: 'bg-rose-900',
};

export const AQI_TEXT_COLORS: Record<AQILevel, string> = {
  [AQILevel.GOOD]: 'text-green-600',
  [AQILevel.MODERATE]: 'text-yellow-600',
  [AQILevel.UNHEALTHY_SENSITIVE]: 'text-orange-600',
  [AQILevel.UNHEALTHY]: 'text-red-600',
  [AQILevel.VERY_UNHEALTHY]: 'text-purple-600',
  [AQILevel.HAZARDOUS]: 'text-rose-900',
};

export const MOCK_STATIONS = [
  { id: '1', name: 'Westside Primary', lat: 34.0522, lng: -118.2437, pm25: 12 },
  { id: '2', name: 'Industrial Hub', lat: 34.0622, lng: -118.2537, pm25: 45 },
  { id: '3', name: 'Lakeside Park', lat: 34.0422, lng: -118.2337, pm25: 8 },
  { id: '4', name: 'Downtown Center', lat: 34.0552, lng: -118.2417, pm25: 22 },
];
