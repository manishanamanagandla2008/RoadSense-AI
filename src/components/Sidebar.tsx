import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Activity,
  BarChart3,
  MapPin,
  AlertTriangle,
  UploadCloud,
  FileText,
  ShieldCheck,
  Settings,
  ChevronRight,
  Database,
  X
} from 'lucide-react';

export type NavSection =
  | 'overview'
  | 'records'
  | 'dashboard'
  | 'analytics'
  | 'map'
  | 'severity'
  | 'import'
  | 'reports'
  | 'quality'
  | 'settings';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  totalRecords: number;
  lastUpdated: string | null;
  isPolling: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  isOpenMobile,
  onCloseMobile,
  totalRecords,
  lastUpdated,
  isPolling
}) => {
  const navItems: Array<{ id: NavSection; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'records', label: 'Accident Records', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Live Dashboard', icon: <Activity className="w-4 h-4" /> },
    { id: 'analytics', label: 'Accident Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'map', label: 'Accident Map', icon: <MapPin className="w-4 h-4" /> },
    { id: 'severity', label: 'Severity Analysis', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'import', label: 'Data Import', icon: <UploadCloud className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports & Exports', icon: <FileText className="w-4 h-4" /> },
    { id: 'quality', label: 'Data Quality Audit', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings & Schema', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleNav = (id: NavSection) => {
    onSelectSection(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-xs">
              <Activity className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white">RoadSense</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono">AI</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none">Road Safety Intelligence</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database Status Strip */}
        <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>Database Sync</span>
            </div>
            <span className="font-mono text-teal-400 text-[11px] font-medium">30s Active</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Verified Records</span>
            <span className="font-mono font-semibold text-slate-200 tabular-nums">
              {totalRecords.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            Analytics & Platform
          </div>

          {navItems.map((item) => {
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {isActive ? (
                  <ChevronRight className="w-4 h-4 text-teal-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Provenance Note */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Engine</span>
            <span className="text-slate-300 font-mono">MySQL / SQL</span>
          </div>
          <div className="text-[10px] text-slate-400 leading-tight">
            RoadSense AI Platform v2.4 · Real-time analytical database synchronization
          </div>
        </div>
      </aside>
    </>
  );
};
