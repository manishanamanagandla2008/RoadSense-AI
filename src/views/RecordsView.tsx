import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  Trash2,
  Edit2,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { AccidentRecord } from '../types.js';

interface RecordsViewProps {
  onRecordChanged: () => void;
  openAddDirectly?: boolean;
}

export const RecordsView: React.FC<RecordsViewProps> = ({ onRecordChanged, openAddDirectly }) => {
  const [records, setRecords] = useState<AccidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('accident_datetime');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Filters
  const [filterRegion, setFilterRegion] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterWeather, setFilterWeather] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(openAddDirectly || false);
  const [editingRecord, setEditingRecord] = useState<AccidentRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<AccidentRecord | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    source_record_id: '',
    accident_datetime: '',
    region: 'Downtown Metro',
    road_name: '',
    latitude: '',
    longitude: '',
    vehicle_type: 'Passenger Car',
    severity: 'Property Damage Only',
    weather: 'Clear',
    source_name: 'Manual Operator Entry'
  });
  const [formError, setFormError] = useState('');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        sortBy,
        sortOrder
      });
      if (search.trim()) params.append('search', search.trim());
      if (filterRegion) params.append('region', filterRegion);
      if (filterVehicle) params.append('vehicleType', filterVehicle);
      if (filterSeverity) params.append('severity', filterSeverity);
      if (filterWeather) params.append('weather', filterWeather);

      const res = await fetch(`/api/accidents?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records);
        setTotalRecords(data.pagination.total);
        setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load accident records:', err);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, search, filterRegion, filterVehicle, filterSeverity, filterWeather]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Handle sorting toggle
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('DESC');
    }
    setPage(1);
  };

  // Open Edit Modal
  const openEdit = (record: AccidentRecord) => {
    setEditingRecord(record);
    setFormData({
      source_record_id: record.source_record_id || '',
      accident_datetime: record.accident_datetime ? record.accident_datetime.replace(' ', 'T').substring(0, 16) : '',
      region: record.region || 'Downtown Metro',
      road_name: record.road_name || '',
      latitude: record.latitude !== null ? record.latitude.toString() : '',
      longitude: record.longitude !== null ? record.longitude.toString() : '',
      vehicle_type: record.vehicle_type || 'Passenger Car',
      severity: record.severity || 'Property Damage Only',
      weather: record.weather || 'Clear',
      source_name: record.source_name || 'Manual Operator Entry'
    });
    setFormError('');
  };

  // Save Add/Edit
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.region.trim()) {
      setFormError('Region is required.');
      return;
    }

    try {
      const url = editingRecord ? `/api/accidents/${editingRecord.accident_id}` : '/api/accidents';
      const method = editingRecord ? 'PUT' : 'POST';

      const payload = {
        source_record_id: formData.source_record_id.trim() || undefined,
        accident_datetime: formData.accident_datetime ? formData.accident_datetime.replace('T', ' ') : null,
        region: formData.region.trim(),
        road_name: formData.road_name.trim() || null,
        latitude: formData.latitude.trim() ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude.trim() ? parseFloat(formData.longitude) : null,
        vehicle_type: formData.vehicle_type || null,
        severity: formData.severity || null,
        weather: formData.weather || null,
        source_name: formData.source_name || 'Manual Operator Entry'
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save accident record');
      }

      setIsAddOpen(false);
      setEditingRecord(null);
      fetchRecords();
      onRecordChanged();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/accidents/${deletingId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDeletingId(null);
        fetchRecords();
        onRecordChanged();
      } else {
        alert(data.error || 'Failed to delete record');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getSeverityBadgeClass = (severity: string | null) => {
    switch (severity) {
      case 'Fatal':
        return 'text-rose-700 font-semibold';
      case 'Serious Injury':
        return 'text-orange-700 font-medium';
      case 'Minor Injury':
        return 'text-sky-700 font-medium';
      case 'Property Damage Only':
        return 'text-slate-600';
      default:
        return 'text-slate-400 italic';
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Controls Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, road, region, vehicle, or source..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              setEditingRecord(null);
              setFormData({
                source_record_id: '',
                accident_datetime: new Date().toISOString().substring(0, 16),
                region: 'Downtown Metro',
                road_name: '',
                latitude: '',
                longitude: '',
                vehicle_type: 'Passenger Car',
                severity: 'Property Damage Only',
                weather: 'Clear',
                source_name: 'Manual Operator Entry'
              });
              setFormError('');
              setIsAddOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-teal-400" />
            <span>Add New Accident</span>
          </button>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          <select
            value={filterRegion}
            onChange={e => {
              setFilterRegion(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 text-xs"
          >
            <option value="">Filter by Region (All)</option>
            <option value="Downtown Metro">Downtown Metro</option>
            <option value="East Bay Hub">East Bay Hub</option>
            <option value="North Peninsula">North Peninsula</option>
            <option value="South Valley">South Valley</option>
            <option value="Coastal Sector">Coastal Sector</option>
          </select>

          <select
            value={filterVehicle}
            onChange={e => {
              setFilterVehicle(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 text-xs"
          >
            <option value="">Filter by Vehicle (All)</option>
            <option value="Passenger Car">Passenger Car</option>
            <option value="SUV">SUV</option>
            <option value="Pickup Truck">Pickup Truck</option>
            <option value="Commercial Truck">Commercial Truck</option>
            <option value="Motorcycle">Motorcycle</option>
            <option value="Transit Bus">Transit Bus</option>
            <option value="Bicycle">Bicycle</option>
          </select>

          <select
            value={filterSeverity}
            onChange={e => {
              setFilterSeverity(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 text-xs"
          >
            <option value="">Filter by Severity (All)</option>
            <option value="Property Damage Only">Property Damage Only</option>
            <option value="Minor Injury">Minor Injury</option>
            <option value="Serious Injury">Serious Injury</option>
            <option value="Fatal">Fatal</option>
          </select>

          <select
            value={filterWeather}
            onChange={e => {
              setFilterWeather(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 text-xs"
          >
            <option value="">Filter by Weather (All)</option>
            <option value="Clear">Clear</option>
            <option value="Rain">Rain</option>
            <option value="Fog / Mist">Fog / Mist</option>
            <option value="Overcast">Overcast</option>
            <option value="Snow / Sleet">Snow / Sleet</option>
            <option value="Missing">Missing Weather Data</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th
                  onClick={() => handleSort('accident_id')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('accident_datetime')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Date & Time</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('region')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Region</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('road_name')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Road Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('vehicle_type')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Vehicle</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('severity')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Severity</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('weather')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Weather</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Coordinates</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading records from database...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No accident records found matching current query or filters.
                  </td>
                </tr>
              ) : (
                records.map(r => (
                  <tr key={r.accident_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-900 tabular-nums">
                      {r.source_record_id || `#${r.accident_id}`}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap tabular-nums">
                      {r.accident_datetime ? r.accident_datetime.substring(0, 16) : (
                        <span className="text-slate-400 italic">Not Recorded</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {r.region || <span className="text-slate-400 italic">Unspecified</span>}
                    </td>
                    <td className="py-2.5 px-4 max-w-xs truncate" title={r.road_name || ''}>
                      {r.road_name || <span className="text-slate-400 italic">Unspecified Road</span>}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {r.vehicle_type || <span className="text-slate-400 italic">Unknown</span>}
                    </td>
                    <td className={`py-2.5 px-4 whitespace-nowrap ${getSeverityBadgeClass(r.severity)}`}>
                      {r.severity || 'Not Recorded'}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {r.weather || <span className="text-slate-400 italic">Missing</span>}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap tabular-nums">
                      {r.latitude !== null && r.longitude !== null ? (
                        `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`
                      ) : (
                        <span className="text-slate-400">No GPS</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingRecord(r)}
                          className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEdit(r)}
                          className="p-1 text-slate-500 hover:text-teal-700 rounded hover:bg-slate-100"
                          title="Edit Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(r.accident_id)}
                          className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-100"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-900 font-mono tabular-nums">{records.length}</span> of{' '}
            <span className="font-semibold text-slate-900 font-mono tabular-nums">{totalRecords}</span> recorded events
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="font-mono text-slate-700 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(isAddOpen || editingRecord) && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingRecord ? `Edit Accident Record #${editingRecord.accident_id}` : 'Create New Accident Record'}
              </h3>
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingRecord(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Source Record ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. CHP-2026-908"
                    value={formData.source_record_id}
                    onChange={e => setFormData({ ...formData, source_record_id: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Accident Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.accident_datetime}
                    onChange={e => setFormData({ ...formData, accident_datetime: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Region *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Downtown Metro"
                    value={formData.region}
                    onChange={e => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Road Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Interstate 880 & Grand Ave"
                    value={formData.road_name}
                    onChange={e => setFormData({ ...formData, road_name: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Latitude (Optional GPS)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 37.7858"
                    value={formData.latitude}
                    onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Longitude (Optional GPS)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. -122.4065"
                    value={formData.longitude}
                    onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Vehicle Type</label>
                  <select
                    value={formData.vehicle_type}
                    onChange={e => setFormData({ ...formData, vehicle_type: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Passenger Car">Passenger Car</option>
                    <option value="SUV">SUV</option>
                    <option value="Pickup Truck">Pickup Truck</option>
                    <option value="Commercial Truck">Commercial Truck</option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Transit Bus">Transit Bus</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Light Van">Light Van</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Recorded Severity</label>
                  <select
                    value={formData.severity}
                    onChange={e => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Property Damage Only">Property Damage Only</option>
                    <option value="Minor Injury">Minor Injury</option>
                    <option value="Serious Injury">Serious Injury</option>
                    <option value="Fatal">Fatal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Weather Condition</label>
                  <select
                    value={formData.weather}
                    onChange={e => setFormData({ ...formData, weather: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Clear">Clear</option>
                    <option value="Rain">Rain</option>
                    <option value="Fog / Mist">Fog / Mist</option>
                    <option value="Overcast">Overcast</option>
                    <option value="Snow / Sleet">Snow / Sleet</option>
                    <option value="">Missing / Unrecorded</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Data Source Name</label>
                  <input
                    type="text"
                    value={formData.source_name}
                    onChange={e => setFormData({ ...formData, source_name: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingRecord(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold text-xs shadow-xs"
                >
                  {editingRecord ? 'Save Changes' : 'Record Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Incident Detail: {viewingRecord.source_record_id || `#${viewingRecord.accident_id}`}
              </h3>
              <button onClick={() => setViewingRecord(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="block text-[11px] text-slate-400">Date & Time</span>
                  <span className="font-mono font-medium text-slate-900 tabular-nums">
                    {viewingRecord.accident_datetime || 'Missing'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="block text-[11px] text-slate-400">Severity</span>
                  <span className={`font-medium ${getSeverityBadgeClass(viewingRecord.severity)}`}>
                    {viewingRecord.severity || 'Missing'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="block text-[11px] text-slate-400">Region</span>
                  <span className="font-medium text-slate-900">{viewingRecord.region || 'Unspecified'}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="block text-[11px] text-slate-400">Road Corridor</span>
                  <span className="font-medium text-slate-900">{viewingRecord.road_name || 'Unspecified'}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="block text-[11px] text-slate-400">Vehicle Type</span>
                  <span className="font-medium text-slate-900">{viewingRecord.vehicle_type || 'Unknown'}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="block text-[11px] text-slate-400">Weather State</span>
                  <span className="font-medium text-slate-900">{viewingRecord.weather || 'Missing'}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 col-span-2">
                  <span className="block text-[11px] text-slate-400">Verified Geographic Coordinates</span>
                  <span className="font-mono text-slate-900 tabular-nums">
                    {viewingRecord.latitude !== null && viewingRecord.longitude !== null
                      ? `${viewingRecord.latitude.toFixed(6)}, ${viewingRecord.longitude.toFixed(6)}`
                      : 'None provided in source records (Aggregated regionally)'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 col-span-2">
                  <span className="block text-[11px] text-slate-400">Provenance / Source Organization</span>
                  <span className="font-medium text-slate-900">{viewingRecord.source_name || 'Database Entry'}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                Database internal ID: #{viewingRecord.accident_id} · Ingested at: {viewingRecord.imported_at}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Confirm Record Deletion</h3>
                <p className="text-xs text-slate-500">Record ID: #{deletingId}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this incident record from the database? This action will permanently remove it from trend aggregations and spatial queries.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
