import React, { useState, useEffect, useCallback } from 'react';

import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import FireMap from './components/map/FireMap';

import StatsSummaryCards from './components/stats/StatsSummaryCards';
import DetectionsByMonthChart from './components/stats/DetectionsByMonthChart';
import TypeBreakdownChart from './components/stats/TypeBreakdownChart';

import PredictionForm from './components/predict/PredictionForm';

import {
  fetchHealth,
  fetchDetections,
  fetchStats
} from './api/client';

import {
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Flame
} from 'lucide-react';


/* =========================================================
   DEFAULT FILTERS
========================================================= */

const DEFAULT_FILTERS = {
  types: [0, 2, 3],
  month: 0,
  daynight: '',
  min_confidence: 0,
  limit: 2000
};


/* =========================================================
   APP
========================================================= */

export default function App() {

  /* -------------------------------------------------------
     ACTIVE TAB
  ------------------------------------------------------- */

  const [activeTab, setActiveTab] = useState('map');


  /* -------------------------------------------------------
     BACKEND STATUS
  ------------------------------------------------------- */

  const [healthStatus, setHealthStatus] = useState('checking');


  /* -------------------------------------------------------
     MAP FILTERS
  ------------------------------------------------------- */

  const [filters, setFilters] = useState(DEFAULT_FILTERS);


  /* -------------------------------------------------------
     DATA
  ------------------------------------------------------- */

  const [detections, setDetections] = useState([]);

  const [totalCount, setTotalCount] = useState(0);

  const [stats, setStats] = useState(null);


  /* -------------------------------------------------------
     LOADING STATES
  ------------------------------------------------------- */

  const [isLoadingDetections, setIsLoadingDetections] =
    useState(false);

  const [isLoadingStats, setIsLoadingStats] =
    useState(false);


  /* =======================================================
     BACKEND HEALTH
  ======================================================= */

  const checkBackendHealth = useCallback(async () => {

    try {

      setHealthStatus('checking');

      await fetchHealth();

      setHealthStatus('healthy');

    } catch (err) {

      console.error(
        'Backend health check failed:',
        err
      );

      setHealthStatus('error');

    }

  }, []);


  /* =======================================================
     LOAD STATISTICS
  ======================================================= */

  const loadStats = useCallback(async () => {

    setIsLoadingStats(true);

    try {

      const data = await fetchStats();

      console.log(
        'Dataset statistics:',
        data
      );

      setStats(data);

    } catch (err) {

      console.error(
        'Failed to load dataset stats:',
        err
      );

    } finally {

      setIsLoadingStats(false);

    }

  }, []);


  /* =======================================================
     LOAD DETECTIONS
  ======================================================= */

  const loadDetections = useCallback(async () => {

    setIsLoadingDetections(true);

    try {

      const params = {
        limit: filters.limit || 2000,
        offset: 0
      };


      /* ---------------------------------------------------
         TYPE FILTER
      --------------------------------------------------- */

      /*
       * IMPORTANT:
       *
       * If types is [] we still send:
       *
       *     type: ''
       *
       * This allows the backend to distinguish between
       * "no types selected" and "no type filter".
       *
       * The backend data_loader.py handles [] correctly.
       */

      if (filters.types !== undefined) {

        params.type = filters.types.join(',');

      }


      /* ---------------------------------------------------
         MONTH FILTER
      --------------------------------------------------- */

      if (
        filters.month &&
        filters.month > 0
      ) {

        params.month = filters.month;

      }


      /* ---------------------------------------------------
         DAY / NIGHT FILTER
      --------------------------------------------------- */

      if (filters.daynight) {

        params.daynight = filters.daynight;

      }


      /* ---------------------------------------------------
         CONFIDENCE FILTER
      --------------------------------------------------- */

      if (
        filters.min_confidence !== undefined &&
        filters.min_confidence > 0
      ) {

        params.min_confidence =
          filters.min_confidence;

      }


      /* ---------------------------------------------------
         DEBUG
      --------------------------------------------------- */

      console.log(
        'Loading detections with filters:',
        params
      );


      /* ---------------------------------------------------
         API REQUEST
      --------------------------------------------------- */

      const res =
        await fetchDetections(params);


      console.log(
  'Detection response:',
  JSON.stringify(res, null, 2)
);

      /* ---------------------------------------------------
         UPDATE MAP DATA
      --------------------------------------------------- */

      setDetections(
        res.results || []
      );


      setTotalCount(
        res.total || 0
      );


    } catch (err) {

      console.error(
        'Failed to load detections:',
        err
      );

      setDetections([]);

      setTotalCount(0);

    } finally {

      setIsLoadingDetections(false);

    }

  }, [filters]);


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {

    checkBackendHealth();

    loadStats();

  }, [
    checkBackendHealth,
    loadStats
  ]);


  /* =======================================================
     RELOAD DETECTIONS WHEN FILTERS CHANGE
  ======================================================= */

  useEffect(() => {

    const timer = setTimeout(() => {

      loadDetections();

    }, 250);

    return () => {

      clearTimeout(timer);

    };

  }, [loadDetections]);


  /* =======================================================
     RESET MAP FILTERS
  ======================================================= */

  const handleResetFilters = () => {

    console.log(
      'Resetting map filters'
    );

    setFilters({
      ...DEFAULT_FILTERS
    });

  };


  /* =======================================================
     ANALYTICS → MONTH → SPATIAL MAP
  ======================================================= */

  const handleMonthClick = (monthNumber) => {

    console.log(
      'Analytics month selected:',
      monthNumber
    );


    setFilters(prev => ({

      ...prev,

      month: Number(monthNumber)

    }));


    setActiveTab('map');

  };


  /* =======================================================
     ANALYTICS → FIRE TYPE → SPATIAL MAP
  ======================================================= */

  const handleTypeSelect = (type) => {

    console.log(
      '================================'
    );

    console.log(
      'ANALYTICS TYPE CLICK'
    );

    console.log(
      'Selected type:',
      type
    );

    console.log(
      '================================'
    );


    const selectedType =
      Number(type);


    setFilters(prev => {

      const newFilters = {

        ...prev,

        types: [selectedType],

        /*
         * Remove previous month filter.
         *
         * Clicking a type should display ALL
         * detections belonging to that type.
         */

        month: 0

      };


      console.log(
        'NEW SPATIAL FILTERS:',
        newFilters
      );


      return newFilters;

    });


    console.log(
      'Switching to Spatial Map...'
    );


    setActiveTab('map');

  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100">


      {/* =================================================
          HEADER
      ================================================= */}

      <Header

        activeTab={activeTab}

        setActiveTab={setActiveTab}

        healthStatus={healthStatus}

        checkBackendHealth={checkBackendHealth}

      />


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">


        {/* =================================================
            BACKEND ERROR
        ================================================= */}

        {healthStatus === 'error' && (

          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between shadow-xl">

            <div className="flex items-center space-x-3">

              <AlertTriangle className="w-5 h-5 text-rose-400" />

              <div>

                <span className="font-bold">
                  Backend Server Unreachable.
                </span>

                {' '}

                Ensure FastAPI backend is running on

                {' '}

                <code className="bg-rose-950 px-1.5 py-0.5 rounded text-rose-200">
                  http://localhost:8000
                </code>

              </div>

            </div>


            <button

              type="button"

              onClick={checkBackendHealth}

              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold flex items-center space-x-1"

            >

              <RefreshCw className="w-3.5 h-3.5" />

              <span>
                Retry
              </span>

            </button>

          </div>

        )}


        {/* =================================================
            SPATIAL MAP TAB
        ================================================= */}

        {activeTab === 'map' && (

          <div className="space-y-6">


            {/* SUMMARY */}

            <StatsSummaryCards

              stats={stats}

            />


            {/* MAP + SIDEBAR */}

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


        {/* =================================================
            AI PREDICTION TAB
        ================================================= */}

        {activeTab === 'predict' && (

          <PredictionForm />

        )}


        {/* =================================================
            ANALYTICS TAB
        ================================================= */}

        {activeTab === 'analytics' && (

          <div className="space-y-6">


            {/* SUMMARY CARDS */}

            <StatsSummaryCards

              stats={stats}

              onCardClick={(type) => {

                if (type === 'all') {

                  setFilters({
                    ...DEFAULT_FILTERS
                  });

                } else {

                  handleTypeSelect(type);

                  return;

                }

                setActiveTab('map');

              }}

            />


            {/* CHARTS */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


              {/* FIRE TYPE CHART */}

              <TypeBreakdownChart

                byType={stats?.by_type}

                onTypeSelect={handleTypeSelect}

              />


              {/* MONTH CHART */}

              <DetectionsByMonthChart

                byMonth={stats?.by_month}

                onMonthClick={handleMonthClick}

              />


            </div>


            {/* =================================================
                DATASET INFORMATION
            ================================================= */}

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">


              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-2">

                <ShieldCheck className="w-4 h-4" />

                <span>
                  Dataset Specifications & Model Architecture
                </span>

              </h3>


              <p className="text-xs text-slate-300 leading-relaxed">

                The PyroGuard classifier operates on
                pre-processed VIIRS JPSS-1 2024 satellite
                thermal anomalies in India. It utilizes an
                <b> XGBoost Classifier</b> with standard feature
                scaling across 16 orbital, thermal, and spatial
                indicators to differentiate wild vegetation
                fires from continuous industrial heat sources.

              </p>


              <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">


                <p className="text-xs text-slate-400">

                  <span className="text-amber-400 font-semibold">
                    Interactive Analytics:
                  </span>

                  {' '}

                  Click a month or thermal source type above
                  to jump directly to the Spatial Map with
                  the corresponding filter applied.

                </p>


              </div>


            </div>


          </div>

        )}

      </main>


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">


          <div className="flex items-center space-x-2">

            <Flame className="w-4 h-4 text-amber-500" />

            <span className="font-semibold text-slate-400">
              PyroGuard Telemetry System
            </span>

          </div>


          <span>
            NASA FIRMS & VIIRS Data • Powered by XGBoost & FastAPI + React
          </span>


        </div>

      </footer>


    </div>

  );

}