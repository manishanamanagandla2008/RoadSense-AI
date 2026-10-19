import React from 'react';
import { Menu, RefreshCw, Plus, Upload, CheckCircle2 } from 'lucide-react';
import { NavSection } from './Sidebar';

interface TopBarProps {
  currentSection: NavSection;
  onOpenMobile: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  secondsUntilNextPoll: number;
  lastUpdated: string | null;
  onOpenAddModal: () => void;
  onNavigate: (section: NavSection) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentSection,
  onOpenMobile,
  onRefresh,
  isRefreshing,
  secondsUntilNextPoll,
  lastUpdated,
  onOpenAddModal,
  onNavigate
}) => {
  const sectionTitles: Record<NavSection, { title: string; subtitle: string }> = {
    overview: { title: 'Overview & Mission', subtitle: 'Platform introduction, architecture & safety objectives' },
    records: { title: 'Accident Records', subtitle: 'Detailed ledger, search, validation & database records management' },
    dashboard: { title: 'Live Analytics Dashboard', subtitle: 'Interactive visualizations, statistics & multi-parameter filtering' },
    analytics: { title: 'Accident Analytics', subtitle: 'Time patterns, exposure considerations & statistical distributions' },
    map: { title: 'Interactive Accident Map', subtitle: 'Spatial event points, verified coordinates & regional statistics' },
    severity: { title: 'Accident Severity Dashboard', subtitle: 'In-depth casualty levels, temporal & vehicle distributions' },
    import: { title: 'Data Import & CSV Ingestion', subtitle: 'File validation, column mapping, duplicate detection & batch saving' },
    reports: { title: 'Reports & Downloads', subtitle: 'Export analytical summaries in CSV and print-optimized PDF format' },
    quality: { title: 'Data Quality & Provenance', subtitle: 'Missingness audit, incomplete record inspector & ingestion logs' },
    settings: { title: 'Settings & Database Schema', subtitle: 'MySQL DDL specifications, sample datasets & polling configuration' },
  };

  const { title } = sectionTitles[currentSection];

  const formatTime = (isoString: string | null) => {
    if (!isoString) return 'Pending sync';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Zone 1: Mobile Hamburger & Page Context */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>RoadSense AI</span>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-slate-700 capitalize">{currentSection}</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* Zone 2: Real-time Telemetry & Sync Status */}
      <div className="hidden md:flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200">
          <span className="text-slate-500">DB Sync:</span>
          <span className="font-mono text-slate-700 tabular-nums">
            {formatTime(lastUpdated)}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-teal-700 font-medium font-mono tabular-nums">
            Next in {secondsUntilNextPoll}s
          </span>
        </div>
      </div>

      {/* Zone 3: Functional Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          title="Force refresh database statistics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        <button
          onClick={() => onNavigate('import')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          <span>Import CSV</span>
        </button>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 text-teal-400" />
          <span>Add Record</span>
        </button>
      </div>
    </header>
  );
};
