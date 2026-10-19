import React from 'react';
import {
  Activity,
  ArrowRight,
  Upload,
  BarChart2,
  MapPin,
  ShieldAlert,
  Database,
  FileCheck2,
  Clock,
  Layers
} from 'lucide-react';
import { NavSection } from '../components/Sidebar';

interface OverviewViewProps {
  onNavigate: (section: NavSection) => void;
  totalRecords: number;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate, totalRecords }) => {
  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-xl">
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity">
          <img
            src="/src/assets/images/saferoads_hero_highway_1792382482888.jpg"
            alt="Metropolitan highway corridor at dusk"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950/70" />
        </div>

        <div className="relative z-10 p-8 sm:p-12 lg:p-16 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-6">
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            <span>RoadSense AI Platform · Real-Time Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight mb-4 text-balance">
            Turning Accident Data into Safer Roads.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl">
            A full-stack road safety analytics platform engineered to ingest, audit, and analyze incident records. 
            Evaluate collision patterns across regional corridors, temporal rush-hour windows, vehicle categories, 
            and weather dynamics with statistical rigor.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-teal-500 text-slate-950 hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/20"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('import')}
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-slate-800/90 border border-slate-700 text-white hover:bg-slate-700 transition-colors"
            >
              <Upload className="w-4 h-4 text-teal-400" />
              <span>Upload Accident Data (CSV)</span>
            </button>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-8 text-xs text-slate-400">
            <div>
              <span className="block text-xl font-bold text-white font-mono tabular-nums">
                {totalRecords.toLocaleString()}
              </span>
              <span>Accidents in Database</span>
            </div>
            <div className="w-px h-8 bg-slate-800 hidden sm:block" />
            <div>
              <span className="block text-xl font-bold text-teal-400 font-mono">30s</span>
              <span>Periodic DB Refresh</span>
            </div>
            <div className="w-px h-8 bg-slate-800 hidden sm:block" />
            <div>
              <span className="block text-xl font-bold text-white font-mono">100%</span>
              <span>Relational SQL Persistence</span>
            </div>
          </div>
        </div>
      </section>

      {/* Key Capabilities Bento Grid */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Core System Capabilities</h2>
          <p className="text-sm text-slate-600">Engineered for transportation planners, safety engineers, and civic data analysts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base">Real-Time Analytics Dashboard</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Aggregates incident records into hourly rush-hour bars, monthly trendlines, and severity doughnut distributions with sub-second parameter filters.
              </p>
            </div>
            <button
              onClick={() => onNavigate('dashboard')}
              className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View Live Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base">Interactive Spatial Map</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Renders verified coordinates using Leaflet.js with severity pins. Strictly separates verified geographic points from regional aggregates without fabricating coordinates.
              </p>
            </div>
            <button
              onClick={() => onNavigate('map')}
              className="mt-4 text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>Explore Accident Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base">Severity & Vehicle Stratification</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Analyzes casualty distributions across vehicle classifications (commercial trucks, motorcycles, passenger vehicles) and incorporates exposure guidance.
              </p>
            </div>
            <button
              onClick={() => onNavigate('severity')}
              className="mt-4 text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <span>Analyze Severity</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base">Data Quality & Completeness Audit</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Explicitly distinguishes zero incidents from uncollected attributes, identifies missing weather or location markers, and flags potential duplicates.
              </p>
            </div>
            <button
              onClick={() => onNavigate('quality')}
              className="mt-4 text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Audit Data Quality</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base">Robust CSV Batch Ingestion</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Upload raw CSV files with flexible column mapping, pre-ingestion validation, error isolation, downloadable rejection reports, and duplicate guards.
              </p>
            </div>
            <button
              onClick={() => onNavigate('import')}
              className="mt-4 text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1"
            >
              <span>Open CSV Importer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base">Relational Schema & MySQL Parity</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Full 4-table relational architecture (`locations`, `accidents`, `data_sources`, `import_history`) backed by parameterized queries and ready for production MySQL.
              </p>
            </div>
            <button
              onClick={() => onNavigate('settings')}
              className="mt-4 text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              <span>View MySQL Schema</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* How RoadSense AI Works */}
      <section className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">How RoadSense AI Operates</h2>
          <p className="text-sm text-slate-600">From raw municipal incident records to actionable road safety intelligence.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">
              01
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Data Ingestion & Parsing</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Accepts CSV files or direct record entries. Inspects header mapping, date formatting, and coordinate bounds.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">
              02
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Deduplication & Quality Check</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Detects record conflicts, flags missing environmental attributes, and protects database integrity without discarding partial records.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">
              03
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Relational Persistence</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Separates spatial locations from accident events to normalize corridors and support flexible regional aggregations.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">
              04
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Real-Time Analytics & Map</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dynamically computes statistics, visualizes spatial clusters on Leaflet, and exports verified compliance audit reports.
            </p>
          </div>
        </div>
      </section>

      {/* Official Disclaimer Footer */}
      <footer className="p-6 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs space-y-2">
        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-slate-700" />
          <span>Analytical Governance & Data Disclaimer</span>
        </div>
        <p className="leading-relaxed">
          Results describe patterns in the available accident records and do not establish causation. Recorded counts may be affected 
          by reporting practices, missing information, geographic coverage, and traffic exposure. Findings should not be interpreted as 
          definitive measures of individual road hazard or vehicle safety risk.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500 border-t border-slate-200">
          <span>RoadSense AI Platform · Real-Time Incident Intelligence System</span>
          <span>Database Mode: Relational SQL Engine (MySQL Parity)</span>
        </div>
      </footer>
    </div>
  );
};
