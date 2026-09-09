import React from 'react';
import { Flame, Factory, Compass, CheckCircle2, ShieldCheck, BarChart2 } from 'lucide-react';

export default function PredictionResult({ result }) {
  if (!result) return null;

  const { predicted_label, predicted_class_name, confidence, class_probabilities } = result;

  const getIcon = () => {
    switch (predicted_label) {
      case 0:
        return <Flame className="w-8 h-8 text-emerald-400" />;
      case 2:
        return <Factory className="w-8 h-8 text-amber-400" />;
      case 3:
        return <Compass className="w-8 h-8 text-cyan-400" />;
      default:
        return <ShieldCheck className="w-8 h-8 text-purple-400" />;
    }
  };

  const getBorderColor = () => {
    switch (predicted_label) {
      case 0: return 'border-emerald-500/50 bg-emerald-950/20';
      case 2: return 'border-amber-500/50 bg-amber-950/20';
      case 3: return 'border-cyan-500/50 bg-cyan-950/20';
      default: return 'border-purple-500/50 bg-purple-950/20';
    }
  };

  const confidencePct = (confidence * 100).toFixed(1);

  return (
    <div className={`glass-panel p-6 rounded-2xl border ${getBorderColor()} space-y-6 transition-all animate-fadeIn`}>
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            {getIcon()}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              XGBoost Classification Result
            </div>
            <h3 className="text-xl font-extrabold text-slate-100 mt-0.5">
              {predicted_class_name}
            </h3>
            <span className="text-xs text-slate-400 font-mono">Original Label: {predicted_label}</span>
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="bg-slate-900/90 px-4 py-2.5 rounded-xl border border-slate-800 flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Model Confidence</div>
            <div className="text-lg font-black text-amber-400">{confidencePct}%</div>
          </div>
        </div>
      </div>

      {/* Class Probabilities Progress Bars */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center space-x-1.5">
            <BarChart2 className="w-4 h-4 text-amber-400" />
            <span>Class Probability Distribution</span>
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {/* Class 0: Wildfire */}
          {class_probabilities && class_probabilities['0'] !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-emerald-300 flex items-center space-x-1">
                  <Flame className="w-3 h-3 text-emerald-400" />
                  <span>Vegetation / Wildfire (Type 0)</span>
                </span>
                <span className="text-slate-300 font-mono">{(class_probabilities['0'] * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${class_probabilities['0'] * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Class 2: Industrial */}
          {class_probabilities && class_probabilities['2'] !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-amber-300 flex items-center space-x-1">
                  <Factory className="w-3 h-3 text-amber-400" />
                  <span>Industrial Heat Source (Type 2)</span>
                </span>
                <span className="text-slate-300 font-mono">{(class_probabilities['2'] * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${class_probabilities['2'] * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Class 3: Other */}
          {class_probabilities && class_probabilities['3'] !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-cyan-300 flex items-center space-x-1">
                  <Compass className="w-3 h-3 text-cyan-400" />
                  <span>Other / Offshore Thermal (Type 3)</span>
                </span>
                <span className="text-slate-300 font-mono">{(class_probabilities['3'] * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${class_probabilities['3'] * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
