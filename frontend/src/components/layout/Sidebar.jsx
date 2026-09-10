import React from 'react';
import {
  Filter,
  Flame,
  Factory,
  Compass,
  Calendar,
  Sun,
  Moon,
  Gauge,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

const MONTH_NAMES = [
  'All Months',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export default function Sidebar({
  filters,
  setFilters,
  onReset,
  totalCount,
  currentCount,
  isLoading,
  streamMode = 'archive'
}) {

  /* =========================================================
     TYPE FILTER
  ========================================================= */

  const toggleType = (typeVal) => {
    setFilters(prev => {
      const current = prev.types || [];

      const updated = current.includes(typeVal)
        ? current.filter(t => t !== typeVal)
        : [...current, typeVal];

      return {
        ...prev,
        types: updated
      };
    });
  };


  /* =========================================================
     CONFIDENCE VALUE
  ========================================================= */

  const confidence =
    filters.min_confidence !== undefined
      ? filters.min_confidence
      : 0;


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <aside className="w-full lg:w-72 glass-panel p-5 rounded-2xl border border-slate-800 space-y-6 flex-shrink-0">

      {/* =====================================================
          TITLE & STREAM STATUS BADGE
      ===================================================== */}

      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">

        <div className="flex items-center space-x-2">

          <Filter className="w-4 h-4 text-amber-400" />

          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            {streamMode === 'live' ? '⚡ Live Controls' : '📅 Archive Filters'}
          </h2>

        </div>

        <button
          type="button"
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-amber-400 flex items-center space-x-1 transition-colors"
          title="Reset to defaults"
        >

          <RotateCcw className="w-3 h-3" />

          <span>Reset</span>

        </button>

      </div>


      {/* =====================================================
          DATASET COUNT & STREAM INDICATOR
      ===================================================== */}

      <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs">
        <div className="flex items-center justify-between">
          <div className="text-slate-400 font-medium flex items-center space-x-1.5">
            {streamMode === 'live' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-rose-400 font-bold">Real-Time FIRMS Feed</span>
              </>
            ) : (
              <span>Filtered Heat Points</span>
            )}
          </div>

          <div className="text-[10px] text-slate-500">
            Limit: {filters.limit || 2000}
          </div>
        </div>

        <div className="text-2xl font-black text-amber-400 mt-1">
          {isLoading ? (
            <span className="animate-pulse text-sm">
              Connecting...
            </span>
          ) : (
            totalCount.toLocaleString()
          )}
        </div>

        {!isLoading && (
          <div className="mt-1 text-[10px] text-slate-400">
            Showing{' '}
            <span className="text-slate-200 font-semibold">
              {currentCount.toLocaleString()}
            </span>{' '}
            of{' '}
            <span className="text-slate-200 font-semibold">
              {totalCount.toLocaleString()}
            </span>{' '}
            detections
          </div>
        )}
      </div>

      {/* =====================================================
          LIVE STREAM PARAMETERS (Satellite & Time Horizon)
      ===================================================== */}
      {streamMode === 'live' && (
        <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-rose-300 uppercase tracking-wider mb-1.5">
              Satellite Instrument
            </label>
            <select
              value={filters.source || 'VIIRS_NOAA20_NRT'}
              onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
              className="w-full bg-slate-900 border border-rose-500/30 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-rose-400 font-mono"
            >
              <option value="VIIRS_NOAA20_NRT">VIIRS NOAA-20 (NRT)</option>
              <option value="VIIRS_SNPP_NRT">VIIRS Suomi-NPP (NRT)</option>
              <option value="VIIRS_NOAA21_NRT">VIIRS NOAA-21 (NRT)</option>
              <option value="MODIS_NRT">MODIS Terra & Aqua (NRT)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-rose-300 uppercase tracking-wider mb-1.5">
              Time Horizon
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
              {[
                { label: '24h', val: 1 },
                { label: '48h', val: 2 },
                { label: '3d', val: 3 },
                { label: '7d', val: 7 }
              ].map(item => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, day_range: item.val }))}
                  className={`py-1 rounded-lg text-xs font-semibold transition-all ${
                    (filters.day_range || 1) === item.val
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          HISTORICAL ARCHIVE PARAMETERS (Year & Month)
      ===================================================== */}
      {streamMode === 'archive' && (
        <div className="space-y-3">
          {/* YEAR SELECTOR */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Observation Year</span>
            </label>
            <select
              value={filters.year || 0}
              onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/50 transition-colors"
            >
              <option value={0}>All Available Years</option>
              <option value={2024}>2024 (Primary Trained Set)</option>
              <option value={2023}>2023 (Archive Feed)</option>
              <option value={2022}>2022 (Archive Feed)</option>
              <option value={2021}>2021 (Archive Feed)</option>
            </select>
          </div>

          {/* MONTH SELECTOR */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Observation Month</span>
            </label>
            <select
              value={filters.month || 0}
              onChange={(e) =>
                setFilters(prev => ({
                  ...prev,
                  month: parseInt(e.target.value)
                }))
              }
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/50 transition-colors"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}


      {/* =====================================================
          DAY / NIGHT
      ===================================================== */}

      <div className="space-y-2">

        <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">

          Orbit Pass (Day / Night)

        </label>


        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">

          {/* ALL */}

          <button
            type="button"
            onClick={() =>
              setFilters(prev => ({
                ...prev,
                daynight: ''
              }))
            }
            className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
              !filters.daynight
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >

            All

          </button>


          {/* DAY */}

          <button
            type="button"
            onClick={() =>
              setFilters(prev => ({
                ...prev,
                daynight: 'D'
              }))
            }
            className={`py-1.5 rounded-lg text-xs font-medium flex items-center justify-center space-x-1 transition-all ${
              filters.daynight === 'D'
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >

            <Sun className="w-3 h-3 text-amber-400" />

            <span>
              Day
            </span>

          </button>


          {/* NIGHT */}

          <button
            type="button"
            onClick={() =>
              setFilters(prev => ({
                ...prev,
                daynight: 'N'
              }))
            }
            className={`py-1.5 rounded-lg text-xs font-medium flex items-center justify-center space-x-1 transition-all ${
              filters.daynight === 'N'
                ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >

            <Moon className="w-3 h-3 text-indigo-400" />

            <span>
              Night
            </span>

          </button>

        </div>

      </div>


      {/* =====================================================
          CONFIDENCE THRESHOLD
      ===================================================== */}

      <div className="space-y-3">

        <div className="flex items-center justify-between">

          <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase flex items-center space-x-1.5">

            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />

            <span>
              Minimum Confidence
            </span>

          </label>

          <span className="text-xs font-black text-amber-400">
            {Math.round(confidence * 100)}%
          </span>

        </div>


        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={confidence}
          onChange={(e) =>
            setFilters(prev => ({
              ...prev,
              min_confidence: parseFloat(e.target.value)
            }))
          }
          className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
        />


        <div className="flex justify-between text-[10px] text-slate-500 font-mono">

          <span>
            0%
          </span>

          <span>
            50%
          </span>

          <span>
            100%
          </span>

        </div>


        <p className="text-[10px] text-slate-500 leading-relaxed">

          Only detections with confidence at or above this
          threshold will be displayed.

        </p>

      </div>


      {/* =====================================================
          DISPLAY LIMIT
      ===================================================== */}

      <div className="space-y-2">

        <div className="flex items-center justify-between">

          <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase flex items-center space-x-1.5">

            <Gauge className="w-3.5 h-3.5 text-amber-400" />

            <span>
              Max Render Markers
            </span>

          </label>

          <span className="text-xs font-bold text-amber-400">
            {filters.limit || 2000}
          </span>

        </div>


        <input
          type="range"
          min="500"
          max="5000"
          step="500"
          value={filters.limit || 2000}
          onChange={(e) =>
            setFilters(prev => ({
              ...prev,
              limit: parseInt(e.target.value)
            }))
          }
          className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
        />


        <div className="flex justify-between text-[10px] text-slate-500 font-mono">

          <span>
            500
          </span>

          <span>
            2,500
          </span>

          <span>
            5,000
          </span>

        </div>

      </div>

    </aside>
  );
}