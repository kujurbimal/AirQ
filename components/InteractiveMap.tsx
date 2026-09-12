import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Locate, MapPin } from 'lucide-react';

interface UserLocationProp { lat: number; lng: number; address: string; isGpsLive?: boolean; }
interface InteractiveMapProps {
  showTraffic?: boolean;
  showWind?: boolean;
  userLocation?: UserLocationProp;
  onSetUserLocation?: (loc: { lat: number; lng: number; address: string }) => void;
  onTriggerGps?: () => void;
}

const markerIcon = (color: string) => L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 10px #0005"></div>`,
  iconSize: [28, 28], iconAnchor: [14, 14]
});

const InteractiveMap: React.FC<InteractiveMapProps> = ({ userLocation, onSetUserLocation, onTriggerGps }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    const initial = userLocation || { lat: 28.6139, lng: 77.2090 };
    const map = L.map(mapRef.current, { zoomControl: true }).setView([initial.lat, initial.lng], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.current?.remove();
      marker.current = L.marker([lat, lng], { icon: markerIcon('#4f46e5') }).addTo(map)
        .bindPopup(`<b>Selected location</b><br>${lat.toFixed(5)}, ${lng.toFixed(5)}`)
        .openPopup();
      onSetUserLocation?.({ lat, lng, address: `Map selected: ${lat.toFixed(5)}, ${lng.toFixed(5)}` });
    });
    leafletMap.current = map;
    setTimeout(() => map.invalidateSize(), 100);
    return () => { map.remove(); leafletMap.current = null; };
  }, []);

  useEffect(() => {
    if (!leafletMap.current || !userLocation) return;
    leafletMap.current.setView([userLocation.lat, userLocation.lng], Math.max(leafletMap.current.getZoom(), 11));
    marker.current?.remove();
    marker.current = L.marker([userLocation.lat, userLocation.lng], { icon: markerIcon('#10b981') })
      .addTo(leafletMap.current)
      .bindPopup(`<b>${userLocation.isGpsLive ? 'Live GPS location' : 'Selected location'}</b><br>${userLocation.address}`);
  }, [userLocation]);

  return <div className="relative w-full h-[420px] rounded-3xl overflow-hidden border border-slate-200 shadow-inner">
    <div ref={mapRef} className="absolute inset-0" />
    <div className="absolute top-4 left-4 z-[500] bg-white/95 backdrop-blur px-3 py-2 rounded-xl shadow border text-xs font-bold text-slate-700 flex items-center gap-2">
      <MapPin size={14} className="text-emerald-500" /> Live OpenStreetMap
    </div>
    {onTriggerGps && <button onClick={onTriggerGps} className="absolute bottom-4 right-4 z-[500] bg-white px-3 py-2 rounded-xl shadow border text-xs font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50"><Locate size={15} className="text-emerald-500" /> My Location</button>}
  </div>;
};
export default InteractiveMap;
