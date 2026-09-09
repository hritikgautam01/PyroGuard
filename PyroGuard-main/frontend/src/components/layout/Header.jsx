import React from 'react';
import { Flame, ShieldAlert, Cpu, Database, Activity, RefreshCw } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, healthStatus, checkBackendHealth }) {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-white/20">
            <Flame className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-amber-400 bg-clip-text text-transparent">
                PyroGuard
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                NASA FIRMS AI
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Wildfire vs. Industrial Thermal Source Classifier • India 2024 Dataset
            </p>
          </div>
        </div>

        {/* Navigation Tabs & Status */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'map'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Spatial Map</span>
            </button>

            <button
              onClick={() => setActiveTab('predict')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'predict'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>AI Classifier</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </div>

          {/* Health Status Indicator */}
          <div 
            onClick={checkBackendHealth}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
            title="Click to re-check backend connection"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                healthStatus === 'healthy' ? 'bg-emerald-400' : 'bg-rose-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                healthStatus === 'healthy' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}></span>
            </span>
            <span className="text-[11px] font-medium text-slate-300 hidden sm:inline">
              {healthStatus === 'healthy' ? 'API Live' : 'Backend Disconnected'}
            </span>
            <RefreshCw className="w-3 h-3 text-slate-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
