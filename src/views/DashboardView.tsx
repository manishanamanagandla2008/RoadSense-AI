import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  Car,
  MapPin,
  Calendar,
  CloudSun,
  Filter,
  RotateCcw,
  RefreshCw,
  TrendingUp,
  Clock,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import '../utils/chartSetup.js';
import { DashboardSummary, FilterState } from '../types.js';

interface DashboardViewProps {
  summary: DashboardSummary | null;
  isLoading: boolean;
  onRefresh: () => void;
  secondsUntilNextPoll: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  isLoading,
  onRefresh,
  secondsUntilNextPoll
}) => {
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    region: '',
    roadName: '',
    vehicleType: '',
    severity: '',
    weather: ''
  });

  const [filteredSummary, setFilteredSummary] = useState<DashboardSummary | null>(summary);
  const [isFiltering, setIsFiltering] = useState(false);
  const [trendsData, setTrendsData] = useState<{
    hourly: Array<{ hour: number; count: number }>;
    weekdayVsWeekend: { weekday: number; weekend: number };
  } | null>(null);

  // Fetch dashboard with filters applied
  const fetchFilteredData = useCallback(async (activeFilters: FilterState) => {
    setIsFiltering(true);
    try {
      const params = new URLSearchParams();
      if (activeFilters.startDate) params.append('startDate', activeFilters.startDate);
      if (activeFilters.endDate) params.append('endDate', activeFilters.endDate);
      if (activeFilters.region) params.append('region', activeFilters.region);
      if (activeFilters.roadName) params.append('roadName', activeFilters.roadName);
      if (activeFilters.vehicleType) params.append('vehicleType', activeFilters.vehicleType);
      if (activeFilters.severity) params.append('severity', activeFilters.severity);
      if (activeFilters.weather) params.append('weather', activeFilters.weather);

      const [dashRes, trendsRes] = await Promise.all([
        fetch(`/api/dashboard?${params.toString()}`),
        fetch(`/api/analytics/trends?${params.toString()}`)
      ]);

      const dashJson = await dashRes.json();
      const trendsJson = await trendsRes.json();

      if (dashJson.success) {
        setFilteredSummary(dashJson.data);
      }
      if (trendsJson.success) {
        setTrendsData(trendsJson.data);
      }
    } catch (err) {
      console.error('Failed to apply dashboard filters:', err);
    } finally {
      setIsFiltering(false);
    }
  }, []);

  // Update whenever parent summary updates (if no filters are active)
  useEffect(() => {
    const hasActiveFilters = Object.values(filters).some(val => Boolean(val));
    if (!hasActiveFilters) {
      setFilteredSummary(summary);
      // Also fetch default trends
      fetch('/api/analytics/trends')
        .then(res => res.json())
        .then(data => {
          if (data.success) setTrendsData(data.data);
        })
        .catch(console.error);
    } else {
      fetchFilteredData(filters);
    }
  }, [summary, fetchFilteredData]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    fetchFilteredData(updated);
  };

  const handleResetFilters = () => {
    const resetState: FilterState = {
      startDate: '',
      endDate: '',
      region: '',
      roadName: '',
      vehicleType: '',
      severity: '',
      weather: ''
    };
    setFilters(resetState);
    fetchFilteredData(resetState);
  };

  const currentData = filteredSummary || summary;

  // Chart 1: Accident Trends (Monthly / Period Line Chart)
  const monthlyTrendsChart = {
    labels: (currentData?.monthlyTrends || []).map(m => m.month),
    datasets: [
      {
        label: 'Recorded Accidents',
        data: (currentData?.monthlyTrends || []).map(m => m.count),
        borderColor: '#0284C7',
        backgroundColor: 'rgba(2, 132, 199, 0.08)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#0284C7',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
      }
    ]
  };

  // Chart 2: Hourly distribution bar chart
  const hoursLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const hoursData = Array.from({ length: 24 }, () => 0);
  if (trendsData?.hourly) {
    trendsData.hourly.forEach(h => {
      if (h.hour >= 0 && h.hour < 24) {
        hoursData[h.hour] = h.count;
      }
    });
  }

  const hourlyChart = {
    labels: hoursLabels,
    datasets: [
      {
        label: 'Accidents by Hour',
        data: hoursData,
        backgroundColor: '#0D9488',
        borderRadius: 4,
        borderSkipped: false
      }
    ]
  };

  // Chart 3: Accidents by Region Horizontal Bar Chart
  const regionChart = {
    labels: (currentData?.topRegions || []).map(r => r.region),
    datasets: [
      {
        label: 'Accidents Recorded',
        data: (currentData?.topRegions || []).map(r => r.count),
        backgroundColor: '#475569',
        borderRadius: 4
      }
    ]
  };

  // Chart 4: Severity Distribution Doughnut Chart
  const severityColors: Record<string, string> = {
    'Fatal': '#E11D48',
    'Serious Injury': '#F97316',
    'Minor Injury': '#38BDF8',
    'Property Damage Only': '#64748B',
    'Not Recorded': '#94A3B8'
  };

  const severityChart = {
    labels: (currentData?.severityDistribution || []).map(s => s.severity),
    datasets: [
      {
        data: (currentData?.severityDistribution || []).map(s => s.count),
        backgroundColor: (currentData?.severityDistribution || []).map(
          s => severityColors[s.severity] || '#64748B'
        ),
        borderWidth: 2,
        borderColor: '#FFFFFF'
      }
    ]
  };

  // Chart 5: Vehicle Type Bar Chart
  const vehicleChart = {
    labels: (currentData?.vehicleDistribution || []).map(v => v.vehicle_type),
    datasets: [
      {
        label: 'Vehicles Involved',
        data: (currentData?.vehicleDistribution || []).map(v => v.count),
        backgroundColor: '#2563EB',
        borderRadius: 4
      }
    ]
  };

  // Chart 6: Weather Bar Chart
  const weatherChart = {
    labels: (currentData?.weatherSummary || []).map(w => w.weather),
    datasets: [
      {
        label: 'Recorded Conditions',
        data: (currentData?.weatherSummary || []).map(w => w.count),
        backgroundColor: '#0891B2',
        borderRadius: 4
      }
    ]
  };

  const hasActiveFilters = Object.values(filters).some(val => Boolean(val));

  return (
    <div className="space-y-6 pb-12">
      {/* Real-time Status & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-teal-600" />
              <span>Multi-Parameter Filters</span>
            </span>
            {hasActiveFilters && (
              <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-[11px] font-medium">
                Active Filtering
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500">
              Auto-refreshes in <span className="font-mono font-medium text-teal-700 tabular-nums">{secondsUntilNextPoll}s</span>
            </span>
            <button
              onClick={onRefresh}
              disabled={isLoading || isFiltering}
              className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 font-medium px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isFiltering ? 'animate-spin text-teal-600' : ''}`} />
              <span>Update Data</span>
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => handleFilterChange('startDate', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-teal-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => handleFilterChange('endDate', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-teal-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Region</label>
            <select
              value={filters.region}
              onChange={e => handleFilterChange('region', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-teal-500 focus:bg-white"
            >
              <option value="">All Regions</option>
              <option value="Downtown Metro">Downtown Metro</option>
              <option value="East Bay Hub">East Bay Hub</option>
              <option value="North Peninsula">North Peninsula</option>
              <option value="South Valley">South Valley</option>
              <option value="Coastal Sector">Coastal Sector</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Road Name</label>
            <input
              type="text"
              placeholder="e.g. Interstate, Grand"
              value={filters.roadName}
              onChange={e => handleFilterChange('roadName', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-teal-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Vehicle Type</label>
            <select
              value={filters.vehicleType}
              onChange={e => handleFilterChange('vehicleType', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-teal-500 focus:bg-white"
            >
              <option value="">All Vehicles</option>
              <option value="Passenger Car">Passenger Car</option>
              <option value="SUV">SUV</option>
              <option value="Commercial Truck">Commercial Truck</option>
              <option value="Motorcycle">Motorcycle</option>
              <option value="Transit Bus">Transit Bus</option>
              <option value="Bicycle">Bicycle</option>
              <option value="Pickup Truck">Pickup Truck</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Severity</label>
            <select
              value={filters.severity}
              onChange={e => handleFilterChange('severity', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-teal-500 focus:bg-white"
            >
              <option value="">All Severities</option>
              <option value="Property Damage Only">Property Damage Only</option>
              <option value="Minor Injury">Minor Injury</option>
              <option value="Serious Injury">Serious Injury</option>
              <option value="Fatal">Fatal</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Weather</label>
            <select
              value={filters.weather}
              onChange={e => handleFilterChange('weather', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-teal-500 focus:bg-white"
            >
              <option value="">All Weather</option>
              <option value="Clear">Clear</option>
              <option value="Rain">Rain</option>
              <option value="Fog / Mist">Fog / Mist</option>
              <option value="Overcast">Overcast</option>
              <option value="Snow / Sleet">Snow / Sleet</option>
              <option value="Missing">Missing Weather Data</option>
            </select>
          </div>
        </div>
      </div>

      {/* 6 Key Statistics Cards (Calculated directly from Database) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Stat 1: Total Accidents */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Recorded</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {(currentData?.totalAccidents || 0).toLocaleString()}
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">Database Records</span>
          </div>
        </div>

        {/* Stat 2: Today (Past 24h) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Recorded 24h</span>
            <Clock className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-teal-700 font-mono tabular-nums">
              {(currentData?.accidentsToday || 0).toLocaleString()}
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">Active Incidents</span>
          </div>
        </div>

        {/* Stat 3: This Month */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Past 30 Days</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {(currentData?.accidentsThisMonth || 0).toLocaleString()}
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">Monthly Ingestion</span>
          </div>
        </div>

        {/* Stat 4: Locations Represented */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Regions Represented</span>
            <MapPin className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {(currentData?.locationsRepresented || 0).toLocaleString()}
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">Distinct Jurisdictions</span>
          </div>
        </div>

        {/* Stat 5: Top Vehicle */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Frequent Vehicle</span>
            <Car className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-base font-bold text-slate-900 truncate block" title={currentData?.mostFrequentVehicle}>
              {currentData?.mostFrequentVehicle || 'N/A'}
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">Primary Involved Type</span>
          </div>
        </div>

        {/* Stat 6: Top Severity */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Frequent Severity</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <span className="text-base font-bold text-slate-900 truncate block" title={currentData?.mostFrequentSeverity}>
              {currentData?.mostFrequentSeverity || 'N/A'}
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">Casualty Level Mode</span>
          </div>
        </div>
      </div>

      {/* Charts Grid: Section 5 A, B, C */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Accident Trends (Monthly / Period) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">A. Accident Trends Over Time</h3>
              <p className="text-xs text-slate-500">Monthly recorded incident totals across periods</p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-64">
            <Line
              data={monthlyTrendsChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => `Accidents: ${context.parsed.y}`
                    }
                  }
                },
                scales: {
                  x: { grid: { display: false } },
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        </div>

        {/* Chart B: Accidents by Time (Hour of Day) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">B. Accidents by Time of Day</h3>
              <p className="text-xs text-slate-500">Hourly crash frequency identifying peak rush windows</p>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-64">
            <Bar
              data={hourlyChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } },
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        </div>

        {/* Chart C: Accidents by Region & High-Count Corridors */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">C. Regional Accident Distribution</h3>
              <p className="text-xs text-slate-500">Incident totals ranked by municipal jurisdictions</p>
            </div>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-64">
            <Bar
              data={regionChart}
              options={{
                indexAxis: 'y' as const,
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { beginAtZero: true },
                  y: { grid: { display: false } }
                }
              }}
            />
          </div>
        </div>

        {/* Chart D: Vehicle Type Analysis */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">D. Vehicle-Type Analysis</h3>
              <p className="text-xs text-slate-500">Recorded counts across vehicle categories</p>
            </div>
            <Car className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-64">
            <Bar
              data={vehicleChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false } },
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        </div>

        {/* Chart E: Severity Distribution Doughnut */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">E. Severity Breakdown</h3>
              <p className="text-xs text-slate-500">Distribution of casualty severity levels</p>
            </div>
            <ShieldAlert className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="w-56 h-56">
              <Doughnut
                data={severityChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { boxWidth: 10, font: { size: 10 } }
                    }
                  },
                  cutout: '65%'
                }}
              />
            </div>
          </div>
        </div>

        {/* Chart F: Weather Analysis */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">F. Environmental & Weather Conditions</h3>
              <p className="text-xs text-slate-500">Incidents recorded under varying weather states</p>
            </div>
            <CloudSun className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-64">
            <Bar
              data={weatherChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false } },
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
