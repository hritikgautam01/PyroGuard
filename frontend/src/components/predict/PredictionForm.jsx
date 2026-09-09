import React, { useState } from 'react';
import { predictThermalSource } from '../../api/client';
import PredictionResult from './PredictionResult';
import { Cpu, Zap, Sparkles, Flame, Factory, Compass, AlertCircle, RefreshCw } from 'lucide-react';

const PRESETS = {
  wildfire: {
    label: 'Wildfire Sample (Type 0)',
    icon: Flame,
    color: 'emerald',
    values: {
      bright_ti4: 339.55,
      bright_ti5: 288.58,
      temp_diff: 50.97,
      temp_ratio: 1.1766,
      frp: 4.46,
      frp_log: 1.6974,
      intensity_score: 15.14,
      day_of_year: 1,
      month: 1,
      week: 1,
      quarter: 1,
      day_of_week: 0,
      hour: 6,
      is_night: 0,
      detection_count: 1,
      confidence_numeric: 0.7
    }
  },
  industrial: {
    label: 'Industrial Source Sample (Type 2)',
    icon: Factory,
    color: 'amber',
    values: {
      bright_ti4: 320.12,
      bright_ti5: 300.45,
      temp_diff: 19.67,
      temp_ratio: 1.0655,
      frp: 1.85,
      frp_log: 1.0473,
      intensity_score: 5.21,
      day_of_year: 120,
      month: 4,
      week: 18,
      quarter: 2,
      day_of_week: 3,
      hour: 14,
      is_night: 0,
      detection_count: 15,
      confidence_numeric: 0.9
    }
  },
  offshore: {
    label: 'Offshore Flare Sample (Type 3)',
    icon: Compass,
    color: 'cyan',
    values: {
      bright_ti4: 312.40,
      bright_ti5: 295.10,
      temp_diff: 17.30,
      temp_ratio: 1.0586,
      frp: 2.10,
      frp_log: 1.1314,
      intensity_score: 4.80,
      day_of_year: 215,
      month: 8,
      week: 31,
      quarter: 3,
      day_of_week: 4,
      hour: 21,
      is_night: 1,
      detection_count: 3,
      confidence_numeric: 0.6
    }
  }
};

export default function PredictionForm() {
  const [formData, setFormData] = useState(PRESETS.wildfire.values);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const loadPreset = (key) => {
    if (PRESETS[key]) {
      setFormData(PRESETS[key].values);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await predictThermalSource(formData);
      setResult(res);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to classify. Ensure backend server is running on port 8000.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Card: Instructions & Preset Buttons */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-slate-100">
                XGBoost Thermal Classifier (16 Features)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Enter 16 satellite thermal observations or load a preset test sample to run instant live inference.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadPreset('wildfire')}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
              <span>Wildfire Sample</span>
            </button>

            <button
              type="button"
              onClick={() => loadPreset('industrial')}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              <Factory className="w-3.5 h-3.5 text-amber-400" />
              <span>Industrial Sample</span>
            </button>

            <button
              type="button"
              onClick={() => loadPreset('offshore')}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Offshore Sample</span>
            </button>
          </div>
        </div>
      </div>

      {/* Prediction Result Display */}
      {result && <PredictionResult result={result} />}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main 16-Feature Form */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        
        {/* Section 1: Thermal & Radiative Features */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Thermal & Radiative Telemetry</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Bright ti4 (K)
              </label>
              <input
                type="number"
                step="0.01"
                name="bright_ti4"
                value={formData.bright_ti4}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Bright ti5 (K)
              </label>
              <input
                type="number"
                step="0.01"
                name="bright_ti5"
                value={formData.bright_ti5}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Temp Diff (K)
              </label>
              <input
                type="number"
                step="0.01"
                name="temp_diff"
                value={formData.temp_diff}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Temp Ratio
              </label>
              <input
                type="number"
                step="0.0001"
                name="temp_ratio"
                value={formData.temp_ratio}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                FRP (MW)
              </label>
              <input
                type="number"
                step="0.01"
                name="frp"
                value={formData.frp}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                FRP Log
              </label>
              <input
                type="number"
                step="0.0001"
                name="frp_log"
                value={formData.frp_log}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Intensity Score
              </label>
              <input
                type="number"
                step="0.01"
                name="intensity_score"
                value={formData.intensity_score}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Confidence Numeric
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                name="confidence_numeric"
                value={formData.confidence_numeric}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Temporal & Orbit Features */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>Temporal & Orbital Features</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Day of Year (1-366)
              </label>
              <input
                type="number"
                name="day_of_year"
                value={formData.day_of_year}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Month (1-12)
              </label>
              <input
                type="number"
                name="month"
                value={formData.month}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Week (1-53)
              </label>
              <input
                type="number"
                name="week"
                value={formData.week}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Quarter (1-4)
              </label>
              <input
                type="number"
                name="quarter"
                value={formData.quarter}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Day of Week (0-6)
              </label>
              <input
                type="number"
                name="day_of_week"
                value={formData.day_of_week}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Hour UTC (0-23)
              </label>
              <input
                type="number"
                name="hour"
                value={formData.hour}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Is Night (0 or 1)
              </label>
              <select
                name="is_night"
                value={formData.is_night}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value={0}>0 (Day Pass)</option>
                <option value={1}>1 (Night Pass)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Detection Count
              </label>
              <input
                type="number"
                name="detection_count"
                value={formData.detection_count}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running XGBoost Classifier...</span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                <span>Classify Heat Source</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
