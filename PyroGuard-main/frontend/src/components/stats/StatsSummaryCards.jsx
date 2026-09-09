import React from 'react';
import {
  Flame,
  Factory,
  Compass,
  Zap,
  Activity
} from 'lucide-react';

export default function StatsSummaryCards({ stats, onCardClick }) {
  if (!stats) return null;

  const total = stats.total_detections || 0;

  const wildfireCount =
    (stats.by_type && stats.by_type['0']) || 0;

  const industrialCount =
    (stats.by_type && stats.by_type['2']) || 0;

  const otherCount =
    (stats.by_type && stats.by_type['3']) || 0;

  const wildfirePct =
    total > 0
      ? ((wildfireCount / total) * 100).toFixed(1)
      : 0;

  const industrialPct =
    total > 0
      ? ((industrialCount / total) * 100).toFixed(1)
      : 0;

  const avgWildfireFRP =
    (stats.avg_frp_by_type &&
      stats.avg_frp_by_type['0']) || '0.0';

  const avgIndustrialFRP =
    (stats.avg_frp_by_type &&
      stats.avg_frp_by_type['2']) || '0.0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

      {/* =====================================================
          TOTAL DETECTIONS
      ===================================================== */}
      <button
        type="button"
        onClick={() => onCardClick?.('all')}
        className="
          glass-panel p-4 rounded-2xl
          border border-slate-800
          relative overflow-hidden
          text-left w-full
          hover:border-amber-500/50
          hover:-translate-y-1
          hover:shadow-lg hover:shadow-amber-500/10
          transition-all duration-200
          cursor-pointer
          focus:outline-none
          focus:ring-2 focus:ring-amber-500/40
        "
      >
        <div className="flex items-center justify-between">

          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Detections
          </span>

          <div className="p-2 rounded-xl bg-slate-800/80 text-amber-400">
            <Activity className="w-4 h-4" />
          </div>

        </div>

        <div className="text-2xl font-black text-slate-100 mt-2">
          {total.toLocaleString()}
        </div>

        <p className="text-[11px] text-slate-400 mt-1">
          FIRMS VIIRS satellite observations (2024)
        </p>

      </button>


      {/* =====================================================
          WILDFIRE
      ===================================================== */}
      <button
        type="button"
        onClick={() => onCardClick?.(0)}
        className="
          glass-panel p-4 rounded-2xl
          border border-emerald-500/20
          relative overflow-hidden
          text-left w-full
          hover:border-emerald-500/60
          hover:-translate-y-1
          hover:shadow-lg hover:shadow-emerald-500/10
          transition-all duration-200
          cursor-pointer
          focus:outline-none
          focus:ring-2 focus:ring-emerald-500/40
        "
      >

        <div className="flex items-center justify-between">

          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Wildfires & Vegetation
          </span>

          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Flame className="w-4 h-4" />
          </div>

        </div>

        <div className="text-2xl font-black text-emerald-300 mt-2 flex items-baseline space-x-2">

          <span>
            {wildfireCount.toLocaleString()}
          </span>

          <span className="text-xs font-bold text-emerald-500">
            ({wildfirePct}%)
          </span>

        </div>

        <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">

          <Zap className="w-3 h-3 text-amber-400" />

          <span>
            Avg FRP: {avgWildfireFRP} MW
          </span>

        </p>

      </button>


      {/* =====================================================
          INDUSTRIAL
      ===================================================== */}
      <button
        type="button"
        onClick={() => onCardClick?.(2)}
        className="
          glass-panel p-4 rounded-2xl
          border border-amber-500/20
          relative overflow-hidden
          text-left w-full
          hover:border-amber-500/60
          hover:-translate-y-1
          hover:shadow-lg hover:shadow-amber-500/10
          transition-all duration-200
          cursor-pointer
          focus:outline-none
          focus:ring-2 focus:ring-amber-500/40
        "
      >

        <div className="flex items-center justify-between">

          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Industrial Heat Sources
          </span>

          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Factory className="w-4 h-4" />
          </div>

        </div>

        <div className="text-2xl font-black text-amber-300 mt-2 flex items-baseline space-x-2">

          <span>
            {industrialCount.toLocaleString()}
          </span>

          <span className="text-xs font-bold text-amber-500">
            ({industrialPct}%)
          </span>

        </div>

        <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">

          <Zap className="w-3 h-3 text-amber-400" />

          <span>
            Avg FRP: {avgIndustrialFRP} MW
          </span>

        </p>

      </button>


      {/* =====================================================
          OTHER / OFFSHORE
      ===================================================== */}
      <button
        type="button"
        onClick={() => onCardClick?.(3)}
        className="
          glass-panel p-4 rounded-2xl
          border border-cyan-500/20
          relative overflow-hidden
          text-left w-full
          hover:border-cyan-500/60
          hover:-translate-y-1
          hover:shadow-lg hover:shadow-cyan-500/10
          transition-all duration-200
          cursor-pointer
          focus:outline-none
          focus:ring-2 focus:ring-cyan-500/40
        "
      >

        <div className="flex items-center justify-between">

          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Other / Offshore
          </span>

          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Compass className="w-4 h-4" />
          </div>

        </div>

        <div className="text-2xl font-black text-cyan-300 mt-2">
          {otherCount.toLocaleString()}
        </div>

        <p className="text-[11px] text-slate-400 mt-1">
          Offshore oil flares & volcanic anomalies
        </p>

      </button>

    </div>
  );
}

