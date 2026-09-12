
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wind, 
  User, 
  Activity, 
  Map as MapIcon, 
  LayoutDashboard, 
  Bell, 
  Calendar,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  ShieldAlert,
  Loader2,
  MapPin,
  X,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Navigation,
  Compass,
  Radio,
  Locate
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

import { AQILevel, AirQualityData, HealthProfile, AIRecommendation } from './types';
import { AQI_COLORS, AQI_TEXT_COLORS, MOCK_STATIONS } from './constants';
import MetricsCard from './components/MetricsCard';
import InteractiveMap from './components/InteractiveMap';
import CitizenReportForm from './components/CitizenReportForm';
import LocationPickerModal from './components/LocationPickerModal';
import ForecastAndTrends from './components/ForecastAndTrends';
import { getAIRecommendation } from './services/geminiService';
import { reverseGeocode } from './services/locationService';
import { fetchLiveAirQuality, fetchWeather, weatherLabel, WeatherData, LiveAirData } from './services/liveDataService';

const MOCK_CHART_DATA = [
  { time: '00:00', pm25: 12, o3: 30 },
  { time: '04:00', pm25: 15, o3: 28 },
  { time: '08:00', pm25: 45, o3: 35 },
  { time: '12:00', pm25: 38, o3: 50 },
  { time: '16:00', pm25: 25, o3: 55 },
  { time: '20:00', pm25: 18, o3: 40 },
];

interface CitizenReportItem {
  id: string;
  title: string;
  loc: string;
  time: string;
  score: number;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'profile' | 'science'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingAI, setIsRefreshingAI] = useState(false);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showWind, setShowWind] = useState(true);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  const [reports, setReports] = useState<CitizenReportItem[]>([
    { id: '1', title: 'Industrial Dust', loc: 'Docklands Area', time: '2h ago', score: 94 },
    { id: '2', title: 'Unusual Haze', loc: 'Sunset Blvd', time: '5h ago', score: 82 },
    { id: '3', title: 'Sensor Anomaly', loc: 'Central Park', time: '1d ago', score: 91 },
  ]);

  const [airData, setAirData] = useState<AirQualityData | null>(null);
  const [profile, setProfile] = useState<HealthProfile>({
    age: 32,
    conditions: ['Asthma'],
    activityLevel: 'high'
  });
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  const handleSelectLocation = useCallback(async (loc: {
    lat: number; lng: number; address: string; city: string; neighborhood?: string; accuracy?: number; isGpsLive: boolean;
  }) => {
    setIsRefreshingAI(true);
    try {
      const location = { ...loc };
      const [liveAir, liveWeather] = await Promise.all([
        fetchLiveAirQuality(loc.lat, loc.lng, location),
        fetchWeather(loc.lat, loc.lng),
      ]);
      setAirData(liveAir);
      setWeather(liveWeather);
      const rec = await getAIRecommendation(liveAir, profile);
      setRecommendation(rec);
    } catch (err) {
      console.error('Live AQI/weather request failed', err);
    } finally {
      setIsRefreshingAI(false);
    }
  }, [profile]);

  const triggerQuickGps = useCallback(() => {
    if (!navigator.geolocation) {
      setShowLocationModal(true);
      return;
    }
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        try {
          const geo = await reverseGeocode(latitude, longitude);
          await handleSelectLocation({
            lat: latitude,
            lng: longitude,
            address: geo.address,
            city: geo.city,
            neighborhood: geo.neighborhood,
            accuracy: Math.round(accuracy),
            isGpsLive: true,
          });
        } catch {
          await handleSelectLocation({
            lat: latitude,
            lng: longitude,
            address: `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°W`,
            city: 'My Location',
            accuracy: Math.round(accuracy),
            isGpsLive: true,
          });
        } finally {
          setIsLocatingGps(false);
        }
      },
      (err) => {
        setIsLocatingGps(false);
        setShowLocationModal(true);
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 0 }
    );
  }, [handleSelectLocation]);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    const defaultLat = 28.6139;
    const defaultLng = 77.2090;
    try {
      const geo = await reverseGeocode(defaultLat, defaultLng);
      await handleSelectLocation({
        lat: defaultLat, lng: defaultLng, address: geo.address, city: geo.city,
        neighborhood: geo.neighborhood, isGpsLive: false
      });
    } catch (err) {
      console.error('Initial live data fetch failed', err);
    } finally {
      setIsLoading(false);
    }
  }, [handleSelectLocation]);

  const recalculateAI = async () => {
    if (!airData) return;
    setIsRefreshingAI(true);
    try {
      const rec = await getAIRecommendation(airData, profile);
      setRecommendation(rec);
    } catch (err) {
      console.error("AI recalculation error", err);
    } finally {
      setIsRefreshingAI(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-800">AirQ</h2>
        <p className="text-sm text-slate-500 animate-pulse">Initializing Hyperlocal Forecasting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-0 md:pl-20">
      
      {/* Mobile Header */}
      <header className="bg-white border-b border-slate-100 p-4 sticky top-0 z-40 flex justify-between items-center md:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 gradient-green rounded-lg flex items-center justify-center text-white">
            <Wind size={18} />
          </div>
          <span className="font-bold text-slate-800 text-lg">AirQ</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAlertsModal(true)}
            className="text-slate-400 p-1 relative hover:text-slate-700 transition-colors"
            aria-label="View alerts"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
          </button>
          <div 
            onClick={() => setActiveTab('profile')}
            className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden cursor-pointer"
          >
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Avatar" />
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-20 bg-white border-r border-slate-100 z-50 py-8 items-center justify-between">
        <div className="flex flex-col items-center gap-8">
          <div className="w-10 h-10 gradient-green rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
            <Wind size={24} />
          </div>
          <div className="flex flex-col gap-6">
            <NavItem icon={<LayoutDashboard size={22} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <NavItem icon={<MapIcon size={22} />} label="Map" active={activeTab === 'map'} onClick={() => setActiveTab('map')} />
            <NavItem icon={<Activity size={22} />} label="Science" active={activeTab === 'science'} onClick={() => setActiveTab('science')} />
            <NavItem icon={<User size={22} />} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          </div>
        </div>
        <button 
          onClick={() => setShowAlertsModal(true)}
          className="text-slate-400 hover:text-slate-800 transition-colors relative p-2"
          aria-label="View alerts"
        >
          <Bell size={22} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
        </button>
      </nav>

      {/* Air Alerts Slide-over / Modal */}
      {showAlertsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Active Air Quality Alerts</h3>
                  <p className="text-xs text-slate-400">Hyperlocal Los Angeles Basin</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAlertsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close alerts modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 my-4 max-h-[60vh] overflow-y-auto">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
                  <AlertTriangle size={14} className="text-amber-600" />
                  Midday Ozone Advisory
                </div>
                <p className="text-xs text-amber-700 mt-1">
                  Expected 1:00 PM - 5:00 PM due to solar irradiance. Sensitive groups should shift vigorous outdoor cardio before noon.
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl">
                <div className="flex items-center gap-2 font-bold text-xs text-blue-800">
                  <Info size={14} className="text-blue-600" />
                  Wind Dispersion Pattern
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  WNW seabreeze clearing inland particulate concentrations toward San Gabriel foothills.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-700">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Sensor Mesh Telemetry
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  All 4 photometric municipal sensors online and calibrated with 98.4% uptime.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setShowAlertsModal(false)}
              className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        
        {activeTab === 'dashboard' && airData && (
          <div className="space-y-6">
            {/* Location & Hyperlocal Summary Banner */}
            <section className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 border ${
                    airData.location.isGpsLive 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${airData.location.isGpsLive ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`} />
                    {airData.location.isGpsLive ? `Live GPS (±${airData.location.accuracy || 12}m)` : 'Hyperlocal Mesh Node'}
                  </span>
                  {airData.location.nearestStation && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                      {airData.location.stationDistanceKm ?? 0.4} km to {airData.location.nearestStation}
                    </span>
                  )}
                  <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono">
                    {Math.abs(airData.location.lat).toFixed(4)}°{airData.location.lat >= 0 ? 'N' : 'S'}, {Math.abs(airData.location.lng).toFixed(4)}°{airData.location.lng >= 0 ? 'E' : 'W'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                    {airData.location.city || 'Hyperlocal Sector'}
                  </h1>
                  {airData.location.neighborhood && (
                    <span className="text-sm md:text-base font-semibold text-slate-400">
                      • {airData.location.neighborhood}
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-xs md:text-sm font-medium flex items-center gap-1.5">
                  <MapPin size={14} className="text-emerald-500 shrink-0" />
                  <span className="truncate max-w-xl">{airData.location.address}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <button
                  type="button"
                  onClick={triggerQuickGps}
                  disabled={isLocatingGps}
                  className="px-3.5 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all border border-emerald-200 flex items-center gap-1.5 disabled:opacity-60 shadow-sm"
                  title="Detect live GPS coordinates from your device"
                >
                  {isLocatingGps ? (
                    <Loader2 size={14} className="animate-spin text-emerald-600" />
                  ) : (
                    <Navigation size={13} className="fill-current text-emerald-600" />
                  )}
                  <span>{isLocatingGps ? 'Locating...' : 'Locate Me'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Compass size={14} />
                  <span>Change Location</span>
                </button>

                <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-100 font-medium">
                  <Calendar size={13} />
                  <span>{new Date(airData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </section>

            {/* AQI Overview Card */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={`lg:col-span-2 relative overflow-hidden rounded-[2.5rem] p-8 text-white shadow-2xl ${AQI_COLORS[airData.level]}`}>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center h-full gap-8">
                  <div className="text-center md:text-left">
                    <h2 className="text-lg font-bold opacity-80 uppercase tracking-widest mb-1">Air Quality Index</h2>
                    <div className="flex items-baseline justify-center md:justify-start gap-4">
                      <span className="text-8xl font-black tracking-tighter leading-none">{airData.aqi}</span>
                      <div className="text-2xl font-bold uppercase leading-tight bg-white/20 px-3 py-1 rounded-xl backdrop-blur-sm">
                        {airData.level}
                      </div>
                    </div>
                    <p className="mt-4 text-white/80 font-medium max-w-md">
                      Pollution levels are currently within the moderate range. Sensitive individuals should take precautions.
                    </p>
                  </div>
                  <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center p-4 border border-white/20 backdrop-blur-md">
                    <div className="w-full h-full rounded-full border-[10px] border-white/30 border-t-white flex flex-col items-center justify-center">
                      <span className="text-xs font-bold opacity-80">HEALTH RISK</span>
                      <span className="text-2xl font-black">MEDIUM</span>
                    </div>
                  </div>
                </div>
                {/* Decorative blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              </div>

              {/* AI Insight Sidebar */}
              <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-xl flex flex-col justify-between relative">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                        <BrainCircuit size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">AI Health Insight</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Personalized Assessment</p>
                      </div>
                    </div>
                    {isRefreshingAI && (
                      <RefreshCw size={16} className="animate-spin text-purple-500" />
                    )}
                  </div>
                  
                  {recommendation ? (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600 leading-relaxed italic">
                        "{recommendation.summary}"
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <p className="text-[13px] text-slate-600 leading-tight"><strong>Activity:</strong> {recommendation.activityAdvice}</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          <p className="text-[13px] text-slate-600 leading-tight"><strong>Route:</strong> {recommendation.routeAdvice}</p>
                        </div>
                        {recommendation.healthWarning && (
                          <div className="flex items-start gap-3 p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                            <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 leading-tight">{recommendation.healthWarning}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                      <Loader2 className="animate-spin text-purple-500" size={24} />
                      <span>Generating tailored health logic...</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setActiveTab('profile')}
                  className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-600 font-bold text-sm transition-all border border-slate-100"
                >
                  Tune My Profile <ChevronRight size={16} />
                </button>
              </div>
            </section>

            {weather && (
              <section className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-wrap items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center text-2xl font-black">{Math.round(weather.temperature)}°</div>
                <div><div className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Weather</div><div className="text-lg font-black text-slate-800">{weatherLabel(weather.weatherCode)}</div><div className="text-xs text-slate-500">Feels {Math.round(weather.apparentTemperature)}°C · Humidity {weather.humidity}% · Wind {Math.round(weather.windSpeed)} km/h</div></div>
                <div className="ml-auto text-right text-xs text-slate-400">Data source<br/><span className="font-bold text-slate-600">Open-Meteo</span></div>
              </section>
            )}

            {/* Pollutants Breakdown */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp size={20} className="text-emerald-500" /> Key Pollutants
                </h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest cursor-default">Live API Data</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <MetricsCard label="PM 2.5" value={airData.pollutants.pm25} unit="µg/m³" status="moderate" />
                <MetricsCard label="PM 10" value={airData.pollutants.pm10} unit="µg/m³" status="good" />
                <MetricsCard label="Ozone" value={airData.pollutants.o3} unit="ppb" status="moderate" />
                <MetricsCard label="NO₂" value={airData.pollutants.no2} unit="ppb" status="good" />
                <MetricsCard label="CO" value={airData.pollutants.co} unit="ppm" status="good" />
                <MetricsCard label="SO₂" value={airData.pollutants.so2} unit="ppb" status="good" />
              </div>
            </section>

            {/* Forecast & 7-Day Historical Trend Section */}
            <ForecastAndTrends airData={airData} hourlyData={(airData as LiveAirData).hourly?.map(h => ({ time: h.time.slice(11,16), pm25: h.pm25, o3: h.o3 })) || []} />
          </div>
        )}

        {activeTab === 'map' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Interactive Map</h2>
                <p className="text-slate-500 font-medium">Live OpenStreetMap with API-based AQI and weather</p>
              </div>

              {airData && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={triggerQuickGps}
                    disabled={isLocatingGps}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                  >
                    {isLocatingGps ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} className="fill-current" />}
                    <span>Center on Me</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-black text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Compass size={13} />
                    <span>Change Area</span>
                  </button>
                </div>
              )}
            </header>

            {airData && (
              <div className="bg-slate-100/80 px-4 py-2 rounded-2xl flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="font-bold text-slate-800">Active Sector:</span>
                  <span className="font-medium text-slate-600 truncate max-w-sm">{airData.location.address}</span>
                </div>
                <div className="font-mono text-[11px] text-slate-500">
                  {Math.abs(airData.location.lat).toFixed(4)}°{airData.location.lat >= 0 ? 'N' : 'S'}, {Math.abs(airData.location.lng).toFixed(4)}°{airData.location.lng >= 0 ? 'E' : 'W'}
                </div>
              </div>
            )}

            <InteractiveMap 
              showTraffic={showTraffic} 
              showWind={showWind} 
              userLocation={airData ? airData.location : undefined}
              onSetUserLocation={(loc) => handleSelectLocation({ ...loc, city: 'Custom Map Point', isGpsLive: false })}
              onTriggerGps={triggerQuickGps}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                  <Activity size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Traffic Heatmap</h4>
                  <p className="text-xs text-slate-500">Live arterial congestion correlation overlay.</p>
                </div>
                <button 
                  onClick={() => setShowTraffic(!showTraffic)}
                  className={`ml-auto text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                    showTraffic ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {showTraffic ? 'Active' : 'Disabled'}
                </button>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Wind size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Wind Direction</h4>
                  <p className="text-xs text-slate-500">Pollutant dispersion modeling active.</p>
                </div>
                <button 
                  onClick={() => setShowWind(!showWind)}
                  className={`ml-auto text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                    showWind ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {showWind ? 'Active' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'science' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <header>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Science Community</h2>
              <p className="text-slate-500 font-medium">Empowering the world through crowdsourced environmental data</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <CitizenReportForm 
                currentLocationName={airData?.location.address}
                coords={airData ? { lat: airData.location.lat, lng: airData.location.lng } : undefined}
                onReportSubmitted={(newRep) => {
                  setReports(prev => [{
                    id: Date.now().toString(),
                    ...newRep
                  }, ...prev]);
                }} 
              />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <ShieldAlert size={18} className="text-amber-500" /> Recent Verified Reports
                  </h3>
                  <span className="text-xs font-bold text-slate-400">{reports.length} Reports</span>
                </div>
                <div className="space-y-3">
                  {reports.map((item) => (
                    <ReportItem 
                      key={item.id}
                      title={item.title} 
                      loc={item.loc} 
                      time={item.time} 
                      score={item.score} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
            <header className="text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden mx-auto mb-4">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" alt="Profile" />
                </div>
                <div className="absolute bottom-4 right-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 border-white">
                  <Activity size={16} />
                </div>
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Health Profile</h2>
              <p className="text-slate-500 font-medium">Personalize your AI risk assessments</p>
            </header>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Age</label>
                  <input 
                    type="number" 
                    value={profile.age} 
                    min={1}
                    max={120}
                    onChange={(e) => setProfile({...profile, age: Math.max(1, Number(e.target.value))})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Activity Level</label>
                  <select 
                    value={profile.activityLevel}
                    onChange={(e) => setProfile({...profile, activityLevel: e.target.value as any})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="low">Low (Sedentary / Light)</option>
                    <option value="medium">Medium (Regular walks / jogging)</option>
                    <option value="high">High (Cardio / Outdoor training)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Respiratory & Cardiac Conditions</label>
                <div className="flex flex-wrap gap-2">
                  {['Asthma', 'COPD', 'Heart Disease', 'Allergies', 'None'].map(cond => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => {
                        let newConds: string[];
                        if (cond === 'None') {
                          newConds = ['None'];
                        } else {
                          const withoutNone = profile.conditions.filter(c => c !== 'None');
                          newConds = withoutNone.includes(cond)
                            ? withoutNone.filter(c => c !== cond)
                            : [...withoutNone, cond];
                          if (newConds.length === 0) newConds = ['None'];
                        }
                        setProfile({...profile, conditions: newConds});
                      }}
                      className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                        profile.conditions.includes(cond)
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 space-y-3">
                <button 
                  onClick={recalculateAI}
                  disabled={isRefreshingAI}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-black shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {isRefreshingAI ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Synthesizing Profile Insights...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} className="text-amber-400" />
                      Re-Calculate AI Health Insights
                    </>
                  )}
                </button>

                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1"
                >
                  Return to Dashboard <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Location Picker Modal */}
      {airData && (
        <LocationPickerModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          currentLat={airData.location.lat}
          currentLng={airData.location.lng}
          currentAddress={airData.location.address}
          isGpsLive={airData.location.isGpsLive}
          onSelectLocation={handleSelectLocation}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <footer className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 flex justify-around items-center py-4 px-2 z-50">
        <NavIcon icon={<LayoutDashboard size={20} />} label="Home" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavIcon icon={<MapIcon size={20} />} label="Map" active={activeTab === 'map'} onClick={() => setActiveTab('map')} />
        <NavIcon icon={<Activity size={20} />} label="Science" active={activeTab === 'science'} onClick={() => setActiveTab('science')} />
        <NavIcon icon={<User size={20} />} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
      </footer>
    </div>
  );
};

// Sub-components
const NavItem: React.FC<{ icon: React.ReactNode, label?: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    title={label}
    className={`p-3 rounded-xl transition-all ${active ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
  >
    {icon}
  </button>
);

const NavIcon: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 group">
    <div className={`transition-all duration-300 ${active ? 'text-emerald-600 scale-110' : 'text-slate-400 group-hover:text-slate-600'}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-bold uppercase transition-all ${active ? 'text-emerald-600' : 'text-slate-400'}`}>{label}</span>
  </button>
);

const ReportItem: React.FC<{ title: string, loc: string, time: string, score: number }> = ({ title, loc, time, score }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-slate-200 transition-all">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
        <MapPin size={18} />
      </div>
      <div>
        <h5 className="font-bold text-slate-800 text-sm">{title}</h5>
        <p className="text-[10px] text-slate-400 font-bold">{loc} • {time}</p>
      </div>
    </div>
    <div className="text-right">
      <div className="text-xs font-black text-emerald-600">{score}%</div>
      <div className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">AI Trust Score</div>
    </div>
  </div>
);

export default App;
