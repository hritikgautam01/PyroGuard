import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import FireMap from './components/map/FireMap';
import StatsSummaryCards from './components/stats/StatsSummaryCards';
import DetectionsByMonthChart from './components/stats/DetectionsByMonthChart';
import TypeBreakdownChart from './components/stats/TypeBreakdownChart';
import PredictionForm from './components/predict/PredictionForm';
import { fetchHealth, fetchDetections, fetchStats } from './api/client';
import { RefreshCw, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';

const DEFAULT_FILTERS = {
  types: [0, 2, 3],
  month: 0,
  daynight: '',
  limit: 2000
};

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [healthStatus, setHealthStatus] = useState('checking');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [detections, setDetections] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState(null);

  const [isLoadingDetections, setIsLoadingDetections] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Check health
  const checkBackendHealth = useCallback(async () => {
    try {
      setHealthStatus('checking');
      await fetchHealth();
      setHealthStatus('healthy');
    } catch (err) {
      console.error('Backend health check failed:', err);
      setHealthStatus('error');
    }
  }, []);

  // Fetch stats once on startup
  const loadStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dataset stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Fetch detections whenever filters change
  const loadDetections = useCallback(async () => {
    setIsLoadingDetections(true);
    try {
      const params = {
        limit: filters.limit || 2000,
        offset: 0
      };

      if (filters.types && filters.types.length > 0) {
        params.type = filters.types.join(',');
      }

      if (filters.month && filters.month > 0) {
        params.month = filters.month;
      }

      if (filters.daynight) {
        params.daynight = filters.daynight;
      }

      const res = await fetchDetections(params);
      setDetections(res.results || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('Failed to load detections:', err);
    } finally {
      setIsLoadingDetections(false);
    }
  }, [filters]);

  useEffect(() => {
    checkBackendHealth();
    loadStats();
  }, [checkBackendHealth, loadStats]);

  // Debounced load detections
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDetections();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadDetections]);

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        healthStatus={healthStatus}
        checkBackendHealth={checkBackendHealth}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* Backend Warning Banner if unreachable */}
        {healthStatus === 'error' && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between shadow-xl animate-fadeIn">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <div>
                <span className="font-bold">Backend Server Unreachable.</span> Ensure FastAPI backend is running on <code className="bg-rose-950 px-1.5 py-0.5 rounded text-rose-200">http://localhost:8000</code>.
              </div>
            </div>
            <button
              onClick={checkBackendHealth}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold flex items-center space-x-1 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Tab 1: Spatial Map Dashboard */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            {/* Top Summary Metrics */}
            <StatsSummaryCards stats={stats} />

            {/* Sidebar + Map Grid */}
            <div className="flex flex-col lg:flex-row gap-6">
              <Sidebar
                filters={filters}
                setFilters={setFilters}
                onReset={handleResetFilters}
                totalCount={totalCount}
                currentCount={detections.length}
                isLoading={isLoadingDetections}
              />

              <div className="flex-1 min-w-0">
                <FireMap
                  detections={detections}
                  totalCount={totalCount}
                  isLoading={isLoadingDetections}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live AI Classifier Form */}
        {activeTab === 'predict' && (
          <PredictionForm />
        )}

        {/* Tab 3: Dataset Analytics & Seasonal Trends */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <StatsSummaryCards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TypeBreakdownChart byType={stats?.by_type} />
              <DetectionsByMonthChart byMonth={stats?.by_month} />
            </div>

            {/* Additional info banner */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Dataset Specifications & Model Architecture</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                The PyroGuard classifier operates on pre-processed VIIRS JPSS-1 2024 satellite thermal anomalies in India. It utilizes an <b>XGBoost Classifier</b> (multi-softprob objective) with standard feature scaling across 16 orbital, thermal, and spatial indicators to differentiate wild vegetation fires from continuous industrial heat sources (refineries, power plants, brick kilns, steel mills).
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-slate-400">PyroGuard Telemetry System</span>
          </div>
          <span>NASA FIRMS & VIIRS Data • Powered by XGBoost & FastAPI + React</span>
        </div>
      </footer>
    </div>
  );
}
