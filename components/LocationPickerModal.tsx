import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Navigation, 
  Search, 
  Compass, 
  Check, 
  Loader2, 
  Building2, 
  Waves, 
  Factory, 
  Mountain, 
  Trees, 
  AlertCircle,
  Radio
} from 'lucide-react';
import { 
  PRESET_LOCATIONS, 
  HyperlocalLocation, 
  reverseGeocode, 
  searchLocations, 
  calculateDistanceKm 
} from '../services/locationService';
import { MOCK_STATIONS } from '../constants';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLat: number;
  currentLng: number;
  currentAddress: string;
  isGpsLive?: boolean;
  onSelectLocation: (loc: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    neighborhood?: string;
    accuracy?: number;
    isGpsLive: boolean;
  }) => void;
}

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  currentLat,
  currentLng,
  currentAddress,
  isGpsLive = false,
  onSelectLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; lat: number; lng: number; address: string; city: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLiveGps = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        try {
          const geo = await reverseGeocode(latitude, longitude);
          onSelectLocation({
            lat: latitude,
            lng: longitude,
            address: geo.address,
            city: geo.city,
            neighborhood: geo.neighborhood,
            accuracy: Math.round(accuracy),
            isGpsLive: true,
          });
          setIsLocatingGps(false);
          onClose();
        } catch (err) {
          console.error('Reverse geocode error:', err);
          onSelectLocation({
            lat: latitude,
            lng: longitude,
            address: `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°W`,
            city: 'My Location',
            accuracy: Math.round(accuracy),
            isGpsLive: true,
          });
          setIsLocatingGps(false);
          onClose();
        }
      },
      (err) => {
        setIsLocatingGps(false);
        let msg = 'Unable to retrieve your location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. You can still pick a neighborhood below or search manually.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out. Please try again or select a neighborhood.';
        }
        setGpsError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await searchLocations(searchQuery);
      setSearchResults(res);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const getZoneIcon = (type: HyperlocalLocation['zoneType']) => {
    switch (type) {
      case 'coastal': return <Waves size={16} className="text-cyan-500" />;
      case 'industrial': return <Factory size={16} className="text-amber-500" />;
      case 'foothill': return <Mountain size={16} className="text-indigo-500" />;
      case 'park': return <Trees size={16} className="text-emerald-500" />;
      default: return <Building2 size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Compass size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Hyperlocal Location</h3>
              <p className="text-xs text-slate-400">Select street, GPS coordinate, or microclimate zone</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50 transition-colors"
            aria-label="Close location picker"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
          {/* GPS Quick Action */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg shadow-emerald-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-100">
                  <Radio size={14} className="animate-pulse text-emerald-200" />
                  Live GPS Telemetry
                </div>
                <h4 className="text-base font-black mt-0.5">Use Device Location</h4>
                <p className="text-xs text-emerald-100 mt-0.5 max-w-xs">
                  Read street coordinates from browser sensors for exact street-level forecasting.
                </p>
              </div>
              <button
                onClick={handleLiveGps}
                disabled={isLocatingGps}
                className="px-4 py-2.5 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold text-xs shadow transition-all shrink-0 flex items-center gap-1.5 disabled:opacity-80"
              >
                {isLocatingGps ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-emerald-600" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <Navigation size={14} className="fill-current" />
                    Locate Me
                  </>
                )}
              </button>
            </div>
            {gpsError && (
              <div className="mt-3 p-2.5 bg-white/20 rounded-xl flex items-start gap-2 text-xs font-medium text-white backdrop-blur-sm">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{gpsError}</span>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Search Any City or Neighborhood
            </label>
            <form onSubmit={handleSearchSubmit} className="relative flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Santa Monica, Pasadena, Brooklyn..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors disabled:opacity-50"
              >
                {isSearching ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
              </button>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2.5 space-y-1.5 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase px-2 pt-1">Search Results</div>
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onSelectLocation({
                        lat: res.lat,
                        lng: res.lng,
                        address: res.address,
                        city: res.city,
                        isGpsLive: false,
                      });
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all flex items-start gap-2.5 group"
                  >
                    <MapPin size={16} className="text-emerald-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{res.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{res.address}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hyperlocal Microclimate Presets */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Hyperlocal Zones & Microclimates
              </span>
              <span className="text-[11px] font-semibold text-emerald-600">Simulated Sensor Meshes</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_LOCATIONS.map((loc) => {
                const isCurrent = Math.abs(loc.lat - currentLat) < 0.005 && Math.abs(loc.lng - currentLng) < 0.005;
                // Nearest station
                const nearest = MOCK_STATIONS.reduce((prev, curr) => {
                  const distPrev = calculateDistanceKm(loc.lat, loc.lng, prev.lat, prev.lng);
                  const distCurr = calculateDistanceKm(loc.lat, loc.lng, curr.lat, curr.lng);
                  return distCurr < distPrev ? curr : prev;
                }, MOCK_STATIONS[0]);
                const distance = calculateDistanceKm(loc.lat, loc.lng, nearest.lat, nearest.lng);

                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      onSelectLocation({
                        lat: loc.lat,
                        lng: loc.lng,
                        address: loc.address,
                        city: loc.city,
                        neighborhood: loc.neighborhood,
                        isGpsLive: false,
                      });
                      onClose();
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between relative group ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-2 ring-emerald-400/20'
                        : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-50 rounded-lg group-hover:scale-105 transition-transform">
                          {getZoneIcon(loc.zoneType)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 leading-tight">{loc.name}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{loc.neighborhood}, {loc.city}</div>
                        </div>
                      </div>
                      {isCurrent && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <Check size={12} />
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="capitalize bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-600">
                        {loc.zoneType}
                      </span>
                      <span className="font-semibold text-slate-400">
                        {distance} km to sensor
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 font-medium truncate">
            <MapPin size={14} className="text-emerald-500 shrink-0" />
            <span className="truncate">Current: {currentAddress}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors shrink-0 ml-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;
