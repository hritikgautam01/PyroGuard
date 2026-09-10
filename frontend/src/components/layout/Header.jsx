import React, { useState } from 'react';
import { Flame, ShieldAlert, Cpu, Database, Activity, RefreshCw, Radio, Calendar, Key, CheckCircle, XCircle } from 'lucide-react';
import { validateFirmsApiKey } from '../../api/client';

export default function Header({
  activeTab,
  setActiveTab,
  healthStatus,
  checkBackendHealth,
  streamMode = 'archive',
  setStreamMode,
  firmsMapKey = '',
  setFirmsMapKey
}) {
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [inputKey, setInputKey] = useState(firmsMapKey);
  const [isValidating, setIsValidating] = useState(false);
  const [validationMsg, setValidationMsg] = useState(null);

  const handleSaveKey = async (e) => {
    e.preventDefault();
    if (!inputKey.strip && !inputKey) {
      setFirmsMapKey('');
      setIsKeyModalOpen(false);
      return;
    }

    setIsValidating(true);
    setValidationMsg(null);
    try {
      const res = await validateFirmsApiKey(inputKey);
      if (res.valid) {
        setFirmsMapKey(inputKey);
        localStorage.setItem('FIRMS_MAP_KEY', inputKey);
        setValidationMsg({ type: 'success', text: 'MAP_KEY validated successfully!' });
        setTimeout(() => {
          setIsKeyModalOpen(false);
          setValidationMsg(null);
        }, 1200);
      } else {
        setValidationMsg({ type: 'error', text: res.message || 'Invalid MAP_KEY' });
      }
    } catch (err) {
      setValidationMsg({ type: 'error', text: 'Validation failed. Check API connection.' });
    } finally {
      setIsValidating(false);
    }
  };

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
              Wildfire vs. Industrial Heat Source Classifier • Real-Time & Multi-Year Streams
            </p>
          </div>
        </div>

        {/* Data Stream Switch & Header Navigation */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Live vs Archive Stream Switch */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setStreamMode && setStreamMode('live')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                streamMode === 'live'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-1 ring-rose-400/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Switch to Real-Time NASA FIRMS Stream"
            >
              <Radio className={`w-3.5 h-3.5 ${streamMode === 'live' ? 'animate-pulse text-white' : 'text-slate-400'}`} />
              <span>LIVE Stream</span>
              {streamMode === 'live' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
              )}
            </button>

            <button
              onClick={() => setStreamMode && setStreamMode('archive')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                streamMode === 'archive'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-1 ring-amber-400/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Switch to Historical Multi-Year Stream"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Historical Stream</span>
            </button>
          </div>

          {/* FIRMS API Key Modal Trigger */}
          <button
            onClick={() => setIsKeyModalOpen(true)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              firmsMapKey
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
            }`}
            title="Configure NASA FIRMS API Key"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{firmsMapKey ? 'API Key Saved' : 'Set FIRMS Key'}</span>
          </button>

          {/* Navigation Tabs */}
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
              {healthStatus === 'healthy' ? 'API Live' : 'Backend Offline'}
            </span>
            <RefreshCw className="w-3 h-3 text-slate-400" />
          </div>
        </div>
      </div>

      {/* NASA FIRMS API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Key className="w-5 h-5 text-amber-400" />
                <span>NASA FIRMS API Key Settings</span>
              </h3>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your NASA FIRMS <code className="bg-slate-800 text-amber-300 px-1 py-0.5 rounded">MAP_KEY</code> to enable real-time live satellite feeds directly on the map.
            </p>

            <form onSubmit={handleSaveKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  FIRMS MAP Key
                </label>
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Paste your 32-character FIRMS MAP_KEY here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {validationMsg && (
                <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                  validationMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                }`}>
                  {validationMsg.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{validationMsg.text}</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isValidating}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 shadow-md shadow-amber-600/30 flex items-center space-x-1.5"
                >
                  {isValidating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Validating...</span>
                    </>
                  ) : (
                    <span>Save & Validate</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}

