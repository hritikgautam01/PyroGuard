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
  isLoading
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
          TITLE
      ===================================================== */}

      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">

        <div className="flex items-center space-x-2">

          <Filter className="w-4 h-4 text-amber-400" />

          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Telemetry Filters
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
          DATASET COUNT
      ===================================================== */}

      <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs">

        <div className="text-slate-400 font-medium">
          Mapped Heat Points
        </div>

        {/* Filtered heat-point count */}
<div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs">
  <div className="flex items-center justify-between">
    <div className="text-slate-400 font-medium">
      Filtered Heat Points
    </div>

    <div className="text-[10px] text-slate-500">
      Limit: {filters.limit || 2000}
    </div>
  </div>

  <div className="text-2xl font-black text-amber-400 mt-1">
    {isLoading ? (
      <span className="animate-pulse text-sm">
        Loading...
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
      matching detections
    </div>
  )}

  {!isLoading && currentCount < totalCount && (
    <div className="mt-2 text-[10px] text-amber-400">
      ⚠ Display capped at {filters.limit || 2000} markers
    </div>
  )}

  {!isLoading && currentCount === totalCount && totalCount > 0 && (
    <div className="mt-2 text-[10px] text-emerald-400">
      ✓ All matching points displayed
    </div>
  )}

  {!isLoading && totalCount === 0 && (
    <div className="mt-2 text-[10px] text-rose-400">
      No detections match the selected filters
    </div>
  )}
</div>
      </div>


      {/* =====================================================
          THERMAL SOURCE TYPE
      ===================================================== */}

      <div className="space-y-3">

        <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase flex items-center justify-between">

          <span>
            Heat Source Class
          </span>

        </label>


        <div className="space-y-2">

          {/* -------------------------------------------------
              WILDFIRE
          ------------------------------------------------- */}

          <button
            type="button"
            onClick={() => toggleType(0)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              (filters.types || []).includes(0)
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-900/30'
                : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:border-slate-700'
            }`}
          >

            <div className="flex items-center space-x-2.5">

              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-400"></span>

              <Flame className="w-4 h-4 text-emerald-400" />

              <span>
                Wildfire / Vegetation
              </span>

            </div>

            <input
              type="checkbox"
              checked={(filters.types || []).includes(0)}
              onChange={() => {}}
              className="rounded accent-emerald-500"
            />

          </button>


          {/* -------------------------------------------------
              INDUSTRIAL
          ------------------------------------------------- */}

          <button
            type="button"
            onClick={() => toggleType(2)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              (filters.types || []).includes(2)
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-900/30'
                : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:border-slate-700'
            }`}
          >

            <div className="flex items-center space-x-2.5">

              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-400"></span>

              <Factory className="w-4 h-4 text-amber-400" />

              <span>
                Industrial Heat Source
              </span>

            </div>

            <input
              type="checkbox"
              checked={(filters.types || []).includes(2)}
              onChange={() => {}}
              className="rounded accent-amber-500"
            />

          </button>


          {/* -------------------------------------------------
              OTHER
          ------------------------------------------------- */}

          <button
            type="button"
            onClick={() => toggleType(3)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              (filters.types || []).includes(3)
                ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-900/30'
                : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:border-slate-700'
            }`}
          >

            <div className="flex items-center space-x-2.5">

              <span className="w-3 h-3 rounded-full bg-cyan-500 shadow-sm shadow-cyan-400"></span>

              <Compass className="w-4 h-4 text-cyan-400" />

              <span>
                Other / Offshore Source
              </span>

            </div>

            <input
              type="checkbox"
              checked={(filters.types || []).includes(3)}
              onChange={() => {}}
              className="rounded accent-cyan-500"
            />

          </button>

        </div>

      </div>


      {/* =====================================================
          MONTH FILTER
      ===================================================== */}

      <div className="space-y-2">

        <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase flex items-center space-x-1.5">

          <Calendar className="w-3.5 h-3.5 text-amber-400" />

          <span>
            Observation Month
          </span>

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

            <option
              key={idx}
              value={idx}
            >
              {name}
            </option>

          ))}

        </select>

      </div>


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