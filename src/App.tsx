import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar, NavSection } from './components/Sidebar.js';
import { TopBar } from './components/TopBar.js';
import { OverviewView } from './views/OverviewView.js';
import { DashboardView } from './views/DashboardView.js';
import { RecordsView } from './views/RecordsView.js';
import { AnalyticsView } from './views/AnalyticsView.js';
import { MapView } from './views/MapView.js';
import { SeverityView } from './views/SeverityView.js';
import { ImportView } from './views/ImportView.js';
import { ReportsView } from './views/ReportsView.js';
import { DataQualityView } from './views/DataQualityView.js';
import { SettingsView } from './views/SettingsView.js';
import { DashboardSummary } from './types.js';
import { CheckCircle2, X } from 'lucide-react';

export default function App() {
  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(30);
  const [secondsUntilNextPoll, setSecondsUntilNextPoll] = useState(30);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const prevTotalRef = useRef<number | null>(null);

  // Fetch summary statistics
  const fetchSummary = useCallback(async (isManual = false) => {
    if (isManual) setIsLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (json.success) {
        setSummary(json.data);
        setLastUpdated(json.data.lastUpdated);

        // Check if new records were added since last check
        if (prevTotalRef.current !== null && json.data.totalAccidents > prevTotalRef.current) {
          const delta = json.data.totalAccidents - prevTotalRef.current;
          setToastNotification(`Database sync: ${delta} new accident record${delta > 1 ? 's' : ''} ingested.`);
          setTimeout(() => setToastNotification(null), 5000);
        }
        prevTotalRef.current = json.data.totalAccidents;
      }
    } catch (err) {
      console.error('Failed to poll dashboard data:', err);
    } finally {
      if (isManual) setIsLoading(false);
      setSecondsUntilNextPoll(pollingInterval);
    }
  }, [pollingInterval]);

  // Initial fetch
  useEffect(() => {
    fetchSummary(true);
  }, [fetchSummary]);

  // Periodic polling countdown (Section 6 Real-Time requirements)
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilNextPoll(prev => {
        if (prev <= 1) {
          fetchSummary(false);
          return pollingInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchSummary, pollingInterval]);

  const handleOpenAddModal = () => {
    setCurrentSection('records');
    setOpenAddModal(true);
    // Reset flag shortly after navigation
    setTimeout(() => setOpenAddModal(false), 300);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        totalRecords={summary?.totalAccidents || 0}
        lastUpdated={lastUpdated}
        isPolling={true}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        <TopBar
          currentSection={currentSection}
          onOpenMobile={() => setIsOpenMobile(true)}
          onRefresh={() => fetchSummary(true)}
          isRefreshing={isLoading}
          secondsUntilNextPoll={secondsUntilNextPoll}
          lastUpdated={lastUpdated}
          onOpenAddModal={handleOpenAddModal}
          onNavigate={setCurrentSection}
        />

        {/* Real-time Notification Banner */}
        {toastNotification && (
          <div className="sticky top-16 z-20 px-4 sm:px-6 lg:px-8 pt-3">
            <div className="bg-teal-900 text-teal-100 px-4 py-2.5 rounded-lg border border-teal-700 shadow-md flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-300" />
                <span className="font-medium">{toastNotification}</span>
              </div>
              <button
                onClick={() => setToastNotification(null)}
                className="text-teal-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Viewport Canvas */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {currentSection === 'overview' && (
            <OverviewView
              onNavigate={setCurrentSection}
              totalRecords={summary?.totalAccidents || 0}
            />
          )}

          {currentSection === 'dashboard' && (
            <DashboardView
              summary={summary}
              isLoading={isLoading}
              onRefresh={() => fetchSummary(true)}
              secondsUntilNextPoll={secondsUntilNextPoll}
            />
          )}

          {currentSection === 'records' && (
            <RecordsView
              onRecordChanged={() => fetchSummary(true)}
              openAddDirectly={openAddModal}
            />
          )}

          {currentSection === 'analytics' && <AnalyticsView />}

          {currentSection === 'map' && <MapView />}

          {currentSection === 'severity' && <SeverityView />}

          {currentSection === 'import' && (
            <ImportView onImportSuccess={() => fetchSummary(true)} />
          )}

          {currentSection === 'reports' && <ReportsView />}

          {currentSection === 'quality' && <DataQualityView />}

          {currentSection === 'settings' && (
            <SettingsView
              onDataReset={() => fetchSummary(true)}
              pollingInterval={pollingInterval}
              onUpdatePollingInterval={(sec) => {
                setPollingInterval(sec);
                setSecondsUntilNextPoll(sec);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
