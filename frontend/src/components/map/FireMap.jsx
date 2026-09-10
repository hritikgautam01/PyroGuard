import React, { useMemo, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  ZoomControl
} from 'react-leaflet';

import MapLegend from './MapLegend';

import {
  Thermometer,
  Zap,
  Calendar,
  Sun,
  Moon,
  MapPin,
  Factory,
  Loader2,
  AlertTriangle
} from 'lucide-react';

import { fetchInfrastructure } from '../../api/client';

const INDIA_CENTER = [22.5937, 78.9629];
const DEFAULT_ZOOM = 5;

/* =========================================================
   FIRE TYPE COLORS
========================================================= */

const getColorForType = (typeVal) => {
  switch (typeVal) {
    case 0:
      return {
        fill: '#10b981',
        border: '#059669',
        badgeClass:
          'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      };

    case 2:
      return {
        fill: '#f59e0b',
        border: '#d97706',
        badgeClass:
          'bg-amber-500/20 text-amber-300 border-amber-500/30'
      };

    case 3:
      return {
        fill: '#06b6d4',
        border: '#0891b2',
        badgeClass:
          'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
      };

    default:
      return {
        fill: '#8b5cf6',
        border: '#7c3aed',
        badgeClass:
          'bg-purple-500/20 text-purple-300 border-purple-500/30'
      };
  }
};

/* =========================================================
   INFRASTRUCTURE ICON
========================================================= */

const getInfrastructureIcon = (type) => {
  const value = String(type || '').toLowerCase();

  if (
    value.includes('power') ||
    value.includes('electric')
  ) {
    return (
      <Zap className="w-3.5 h-3.5 text-yellow-400" />
    );
  }

  if (
    value.includes('industrial') ||
    value.includes('factory') ||
    value.includes('refinery')
  ) {
    return (
      <Factory className="w-3.5 h-3.5 text-orange-400" />
    );
  }

  return (
    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
  );
};

/* =========================================================
   FIRE MAP
========================================================= */

export default function FireMap({
  detections,
  totalCount,
  isLoading
}) {
  const [infrastructureData, setInfrastructureData] =
    useState({});

  /* =======================================================
     LOAD NEARBY INFRASTRUCTURE
  ======================================================= */

  const loadInfrastructure = async (det) => {
    const key = `${det.latitude},${det.longitude}`;

    /*
      If we already successfully loaded this location,
      don't make another request.
    */

    if (
  infrastructureData[key]?.loaded ||
  infrastructureData[key]?.loading
) {
  return;
}

    /*
      Show loading state immediately.
    */

    setInfrastructureData((prev) => ({
      ...prev,

      [key]: {
        loading: true,
        loaded: false,
        data: [],
        error: null
      }
    }));

    try {
      console.log(
        'Loading nearby infrastructure for:',
        det.latitude,
        det.longitude
      );

      const response = await fetchInfrastructure(
        det.latitude,
        det.longitude,
        10
      );

      console.log(
        'Infrastructure response:',
        response
      );

      /*
        Backend response:

        {
          nearby_infrastructure: [...]
        }
      */

      const infrastructure =
        response?.nearby_infrastructure ||
        response?.infrastructure ||
        response?.results ||
        [];

      setInfrastructureData((prev) => ({
        ...prev,

        [key]: {
          loading: false,
          loaded: true,
          data: Array.isArray(infrastructure)
            ? infrastructure
            : [],
          error: null
        }
      }));

    } catch (error) {
      console.error(
        'Failed to load infrastructure:',
        error
      );

      setInfrastructureData((prev) => ({
        ...prev,

        [key]: {
          loading: false,
          loaded: false,
          data: [],
          error:
            'Unable to retrieve nearby infrastructure.'
        }
      }));
    }
  };

  /* =======================================================
     MARKERS
  ======================================================= */

  const markers = useMemo(() => {
    return detections.map((det, index) => {
      const colors = getColorForType(det.type);

      const radius = Math.max(
        3.5,
        Math.min(
          11,
          Math.sqrt(det.frp || 1) * 2.2
        )
      );

      const infrastructureKey =
        `${det.latitude},${det.longitude}`;

      const infrastructure =
        infrastructureData[infrastructureKey];

      return (
        <CircleMarker
          key={`${det.latitude}-${det.longitude}-${index}`}
          center={[
            Number(det.latitude),
            Number(det.longitude)
          ]}
          radius={radius}
          pathOptions={{
            color: colors.border,
            fillColor: colors.fill,
            fillOpacity: 0.75,
            weight: 1.2
          }}
          eventHandlers={{
            click: () => {
              loadInfrastructure(det);
            }
          }}
        >
          <Popup className="pyro-popup">
            <div className="p-2 space-y-3 min-w-[240px]">

              {/* HEADER */}

              <div className="flex items-center justify-between gap-1">

                <span
                  className={`
                    px-2 py-0.5
                    rounded-full
                    text-[11px]
                    font-bold
                    border
                    ${colors.badgeClass}
                  `}
                >
                  {det.type_name}
                </span>

                <div className="flex items-center space-x-1">
                  {det.stream_mode === 'live' ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                      <span>LIVE</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">
                      Type {det.type}
                    </span>
                  )}
                </div>

              </div>

              {/* SATELLITE & ML CONFIDENCE INFO */}
              {(det.satellite || det.ml_confidence) && (
                <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-800 font-mono">
                  {det.satellite && (
                    <span className="text-amber-300 font-semibold">
                      {det.satellite}
                    </span>
                  )}
                  {det.ml_confidence && (
                    <span className="text-emerald-400 font-semibold">
                      AI Conf: {Math.round(det.ml_confidence * 100)}%
                    </span>
                  )}
                </div>
              )}

              {/* FRP + TEMPERATURE */}

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">

                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/80">

                  <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>FRP</span>
                  </div>

                  <div className="text-xs font-bold text-amber-300 mt-0.5">
                    {det.frp}
                    <span className="text-[9px] font-normal text-slate-400">
                      {' '}MW
                    </span>
                  </div>

                </div>

                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/80">

                  <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                    <Thermometer className="w-3 h-3 text-rose-400" />
                    <span>Temp (ti4)</span>
                  </div>

                  <div className="text-xs font-bold text-rose-300 mt-0.5">
                    {det.bright_ti4}
                    <span className="text-[9px] font-normal text-slate-400">
                      {' '}K
                    </span>
                  </div>

                </div>

              </div>

              {/* DATE + ORBIT */}

              <div className="space-y-1 text-[11px] text-slate-300 pt-1">

                <div className="flex items-center justify-between text-slate-400">

                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>
                      {det.acq_date}
                    </span>
                  </span>

                  <span className="flex items-center space-x-1">

                    {det.daynight === 'D' ? (
                      <Sun className="w-3 h-3 text-amber-400" />
                    ) : (
                      <Moon className="w-3 h-3 text-indigo-400" />
                    )}

                    <span>
                      {det.daynight === 'D'
                        ? 'Day Orbit'
                        : 'Night Orbit'}
                    </span>

                  </span>

                </div>

                <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-mono pt-0.5">

                  <MapPin className="w-3 h-3" />

                  <span>
                    {Number(det.latitude).toFixed(4)} N,
                    {' '}
                    {Number(det.longitude).toFixed(4)} E
                  </span>

                </div>

              </div>

              {/* NEARBY INFRASTRUCTURE */}

              <div className="pt-2 border-t border-slate-800">

                <div className="flex items-center space-x-2 mb-2">

                  <Factory className="w-4 h-4 text-orange-400" />

                  <span className="text-xs font-bold text-slate-200">
                    Nearby Infrastructure
                  </span>

                </div>

                {/* LOADING */}

                {infrastructure?.loading && (
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 py-2">

                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />

                    <span>
                      Searching nearby infrastructure...
                    </span>

                  </div>
                )}

                {/* ERROR */}

                {infrastructure?.error && (
                  <div className="flex items-start space-x-2 text-[11px] text-rose-300 py-2">

                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-rose-400" />

                    <span>
                      {infrastructure.error}
                    </span>

                  </div>
                )}

                {/* RESULTS */}

                {!infrastructure?.loading &&
                  !infrastructure?.error &&
                  infrastructure?.loaded &&
                  infrastructure.data.length > 0 && (

                    <div className="space-y-1.5">

                      {infrastructure.data
                        .slice(0, 5)
                        .map((item, infraIndex) => {

                          const name =
                            item.name ||
                            item.display_name ||
                            item.tags?.name ||
                            'Unnamed facility';

                          const type =
                            item.type ||
                            item.category ||
                            item.tags?.industrial ||
                            item.tags?.power ||
                            'Infrastructure';

                          const distance =
                            item.distance_km ??
                            item.distance ??
                            null;

                          return (
                            <div
                              key={`${name}-${infraIndex}`}
                              className="flex items-center justify-between gap-2 bg-slate-900/70 border border-slate-800 rounded-lg px-2 py-1.5"
                            >

                              <div className="flex items-center gap-2 min-w-0">

                                {getInfrastructureIcon(type)}

                                <div className="min-w-0">

                                  <div className="text-[10px] font-semibold text-slate-200 truncate">
                                    {name}
                                  </div>

                                  <div className="text-[9px] text-slate-500 capitalize">
                                    {String(type).replace(/_/g, ' ')}
                                  </div>

                                </div>

                              </div>

                              {distance !== null && (
                                <span className="text-[9px] font-mono text-amber-300 whitespace-nowrap">
                                  {Number(distance).toFixed(1)} km
                                </span>
                              )}

                            </div>
                          );
                        })}

                    </div>
                  )}

                {/* NO RESULTS */}

                {!infrastructure?.loading &&
                  !infrastructure?.error &&
                  infrastructure?.loaded &&
                  infrastructure.data.length === 0 && (

                    <div className="text-[10px] text-slate-500 py-2">
                      No mapped industrial infrastructure
                      found within 10 km.
                    </div>
                  )}

                {/* INITIAL STATE */}

                {!infrastructure?.loading &&
                  !infrastructure?.loaded && (

                    <div className="text-[10px] text-slate-500">
                      Click the marker to search nearby
                      industrial facilities and power
                      infrastructure.
                    </div>
                  )}

              </div>

            </div>
          </Popup>
        </CircleMarker>
      );
    });
  }, [
    detections,
    infrastructureData
  ]);

  /* =======================================================
     RENDER MAP
  ======================================================= */

  return (
    <div className="relative w-full h-[600px] lg:h-[650px] rounded-2xl overflow-hidden glass-panel border border-slate-800 shadow-2xl">

      <MapContainer
        center={INDIA_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full"
      >

        <ZoomControl position="topright" />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markers}

      </MapContainer>

      {/* MAP LEGEND */}

      <MapLegend />

      {/* RESULT COUNT */}

      {detections.length < totalCount && (
        <div className="absolute top-4 left-4 z-[1000] glass-panel px-3 py-1.5 rounded-lg border border-amber-500/30 text-xs text-amber-300 flex items-center space-x-2">

          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>

          <span>
            Showing {detections.length.toLocaleString()}
            {' '}of{' '}
            {totalCount.toLocaleString()}
            {' '}detections. Use filters to refine.
          </span>

        </div>
      )}

      {/* LOADING OVERLAY */}

      {isLoading && (
        <div className="absolute inset-0 z-[1001] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">

          <div className="glass-panel px-6 py-4 rounded-2xl border border-amber-500/30 flex items-center space-x-3">

            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>

            <span className="text-sm font-semibold text-slate-200">
              Updating Satellite Detections...
            </span>

          </div>

        </div>
      )}

    </div>
  );
}