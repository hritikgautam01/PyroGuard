import React from 'react';
import { Flame, Factory, Compass } from 'lucide-react';

export default function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] glass-panel px-4 py-3 rounded-xl border border-slate-800 shadow-2xl flex flex-wrap items-center gap-4 text-xs">
      <div className="flex items-center space-x-2">
        <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-400 ring-2 ring-emerald-500/20"></span>
        <div className="flex items-center space-x-1 font-medium text-slate-200">
          <Flame className="w-3.5 h-3.5 text-emerald-400" />
          <span>Vegetation / Wildfire</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-400 ring-2 ring-amber-500/20"></span>
        <div className="flex items-center space-x-1 font-medium text-slate-200">
          <Factory className="w-3.5 h-3.5 text-amber-400" />
          <span>Industrial Heat Source</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <span className="w-3 h-3 rounded-full bg-cyan-500 shadow-sm shadow-cyan-400 ring-2 ring-cyan-500/20"></span>
        <div className="flex items-center space-x-1 font-medium text-slate-200">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Other / Offshore</span>
        </div>
      </div>

      <div className="h-3 w-px bg-slate-700 hidden sm:block"></div>

      <div className="text-[11px] text-slate-400">
        Marker size = <span className="font-semibold text-slate-200">FRP (MW)</span>
      </div>
    </div>
  );
}
