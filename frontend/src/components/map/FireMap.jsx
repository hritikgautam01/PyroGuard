import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl } from 'react-leaflet';
import MapLegend from './MapLegend';
import { Thermometer, Zap, Calendar, Sun, Moon, MapPin } from 'lucide-react';

const INDIA_CENTER = [22.5937, 78.9629];
const DEFAULT_ZOOM = 5;

const getColorForType = (typeVal) => {
  switch (typeVal) {
    case 0:
      return { fill: '#10b981', border: '#059669', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    case 2:
      return { fill: '#f59e0b', border: '#d97706', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    case 3:
      return { fill: '#06b6d4', border: '#0891b2', badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
    default:
      return { fill: '#8b5cf6', border: '#7c3aed', badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
  }
};

export default function FireMap({ detections, totalCount, isLoading }) {
  
  // Memoize marker rendering for high performance
  const markers = useMemo(() => {
    return detections.map((det, index) => {
      const colors = getColorForType(det.type);
      const radius = Math.max(3.5, Math.min(11, Math.sqrt(det.frp || 1) * 2.2));

      return (
        <CircleMarker
          key={`${det.latitude}-${det.longitude}-${index}`}
          center={[det.latitude, det.longitude]}
          radius={radius}
          pathOptions={{
            color: colors.border,
            fillColor: colors.fill,
            fillOpacity: 0.75,
            weight: 1.2
          }}
        >
          <Popup className="pyro-popup">
            <div className="p-2 space-y-2 min-w-[200px]">
              {/* Header Badge */}
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${colors.badgeClass}`}>
                  {det.type_name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Type {det.type}
                </span>
              </div>

              {/* FRP & Brightness Metrics */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>FRP</span>
                  </div>
                  <div className="text-xs font-bold text-amber-300 mt-0.5">
                    {det.frp} <span className="text-[9px] font-normal text-slate-400">MW</span>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                    <Thermometer className="w-3 h-3 text-rose-400" />
                    <span>Temp (ti4)</span>
                  </div>
                  <div className="text-xs font-bold text-rose-300 mt-0.5">
                    {det.bright_ti4} <span className="text-[9px] font-normal text-slate-400">K</span>
                  </div>
                </div>
              </div>

              {/* Date & Orbit Info */}
              <div className="space-y-1 text-[11px] text-slate-300 pt-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{det.acq_date}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    {det.daynight === 'D' ? (
                      <Sun className="w-3 h-3 text-amber-400" />
                    ) : (
                      <Moon className="w-3 h-3 text-indigo-400" />
                    )}
                    <span>{det.daynight === 'D' ? 'Day Orbit' : 'Night Orbit'}</span>
                  </span>
                </div>

                <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-mono pt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>{det.latitude.toFixed(4)} N, {det.longitude.toFixed(4)} E</span>
                </div>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      );
    });
  }, [detections]);

  return (
    <div className="relative w-full h-[600px] lg:h-[650px] rounded-2xl overflow-hidden glass-panel border border-slate-800 shadow-2xl">
      {/* Map Container */}
      <MapContainer
        center={INDIA_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full"
      >
        <ZoomControl position="topright" />
        
        {/* Dark Matter / Standard OpenStreetMap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markers}
      </MapContainer>

      {/* Floating Map Legend */}
      <MapLegend />

      {/* Warning note if result capped */}
      {detections.length < totalCount && (
        <div className="absolute top-4 left-4 z-[1000] glass-panel px-3 py-1.5 rounded-lg border border-amber-500/30 text-xs text-amber-300 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span>Showing {detections.length.toLocaleString()} of {totalCount.toLocaleString()} detections. Use filters to refine.</span>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-[1001] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
          <div className="glass-panel px-6 py-4 rounded-2xl border border-amber-500/30 flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-semibold text-slate-200">Updating Satellite Detections...</span>
          </div>
        </div>
      )}
    </div>
  );
}
