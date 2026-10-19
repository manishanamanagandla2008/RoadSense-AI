import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Filter,
  Layers,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Info
} from 'lucide-react';
import { MapData, AccidentRecord } from '../types.js';

export const MapView: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterRegion, setFilterRegion] = useState('');

  // Selected Pin for detail drawer
  const [selectedIncident, setSelectedIncident] = useState<AccidentRecord | null>(null);

  // Fetch data
  const fetchMapPoints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterSeverity) params.append('severity', filterSeverity);
      if (filterVehicle) params.append('vehicleType', filterVehicle);
      if (filterRegion) params.append('region', filterRegion);

      const res = await fetch(`/api/map/accidents?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setMapData(data);
      }
    } catch (err) {
      console.error('Failed to load map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapPoints();
  }, [filterSeverity, filterVehicle, filterRegion]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [37.7749, -122.38],
        zoom: 10,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer || !mapData) return;

    layer.clearLayers();

    const getPinColor = (severity: string | null) => {
      switch (severity) {
        case 'Fatal':
          return '#E11D48'; // red
        case 'Serious Injury':
          return '#EA580C'; // orange
        case 'Minor Injury':
          return '#0284C7'; // sky blue
        default:
          return '#475569'; // slate
      }
    };

    const bounds: [number, number][] = [];

    mapData.mappable.forEach(rec => {
      if (rec.latitude === null || rec.longitude === null) return;

      const color = getPinColor(rec.severity);
      bounds.push([rec.latitude, rec.longitude]);

      const customHtmlIcon = L.divIcon({
        className: 'custom-accident-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 0.15s ease;
          "></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([rec.latitude, rec.longitude], { icon: customHtmlIcon });

      const popupContent = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; padding: 4px; line-height: 1.4; color: #1e293b;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">
            ${rec.road_name || 'Unspecified Road'}
          </div>
          <div style="color: #64748b; margin-bottom: 6px;">${rec.region}</div>
          <div style="display: flex; gap: 4px; align-items: center; margin-bottom: 4px;">
            <span style="font-weight: 600; color: ${color};">${rec.severity || 'PDO'}</span>
            <span>·</span>
            <span>${rec.vehicle_type || 'Vehicle'}</span>
          </div>
          <div style="font-size: 10px; color: #64748b;">
            Date: ${rec.accident_datetime ? rec.accident_datetime.substring(0, 16) : 'N/A'}<br/>
            Weather: ${rec.weather || 'Unrecorded'}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        setSelectedIncident(rec);
      });

      layer.addLayer(marker);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [mapData]);

  const handleResetFilters = () => {
    setFilterSeverity('');
    setFilterVehicle('');
    setFilterRegion('');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Map Control Bar & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-teal-600" />
            <span className="font-semibold text-slate-800">Spatial Map Filtering</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 font-mono">
              {mapData?.stats.totalMappable || 0} Points Rendered ({mapData?.stats.coordinateCoveragePct || 0}% GPS Coverage)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {(filterSeverity || filterVehicle || filterRegion) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Map Filters</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Filter Severity</label>
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
            >
              <option value="">All Severity Categories</option>
              <option value="Fatal">Fatal</option>
              <option value="Serious Injury">Serious Injury</option>
              <option value="Minor Injury">Minor Injury</option>
              <option value="Property Damage Only">Property Damage Only</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Filter Vehicle Type</label>
            <select
              value={filterVehicle}
              onChange={e => setFilterVehicle(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
            >
              <option value="">All Vehicle Classes</option>
              <option value="Passenger Car">Passenger Car</option>
              <option value="SUV">SUV</option>
              <option value="Commercial Truck">Commercial Truck</option>
              <option value="Motorcycle">Motorcycle</option>
              <option value="Transit Bus">Transit Bus</option>
              <option value="Bicycle">Bicycle</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Focus Region</label>
            <select
              value={filterRegion}
              onChange={e => setFilterRegion(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
            >
              <option value="">All Municipal Regions</option>
              <option value="Downtown Metro">Downtown Metro</option>
              <option value="East Bay Hub">East Bay Hub</option>
              <option value="North Peninsula">North Peninsula</option>
              <option value="South Valley">South Valley</option>
              <option value="Coastal Sector">Coastal Sector</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Map Viewport & Legend */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Canvas */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden relative">
          <div ref={mapContainerRef} className="w-full h-[520px] z-10" />

          {/* Map Floating Legend */}
          <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-xs p-3 rounded-lg border border-slate-200 shadow-md text-xs space-y-1.5">
            <span className="font-semibold text-slate-800 block text-[11px]">Severity Coding</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
              <span className="text-slate-600 text-[11px]">Fatal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-600 shrink-0" />
              <span className="text-slate-600 text-[11px]">Serious Injury</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600 shrink-0" />
              <span className="text-slate-600 text-[11px]">Minor Injury</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0" />
              <span className="text-slate-600 text-[11px]">Property Damage (PDO)</span>
            </div>
          </div>
        </div>

        {/* Sidebar: Regional Aggregation for Unmapped Points */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-600" />
              <h3 className="font-bold text-slate-900 text-sm">Region-Level Summaries</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Records lacking verified GPS coordinates are preserved here regionally to prevent fabricating false pin locations.
            </p>

            <div className="space-y-2 pt-2">
              {(mapData?.unmappedByRegion || []).map((unm, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs border border-slate-100">
                  <span className="font-medium text-slate-800">{unm.region}</span>
                  <span className="font-mono text-slate-600 tabular-nums">
                    {unm.unmapped_count} unmapped
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 mt-2">
              Total unmapped records: <strong className="text-slate-700">{mapData?.stats.totalUnmapped || 0}</strong>
            </div>
          </div>

          {/* Selected Incident Drawer */}
          {selectedIncident && (
            <div className="bg-white rounded-xl border border-teal-500/40 p-4 shadow-sm space-y-2 text-xs">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>Selected Pin</span>
                <span className="font-mono text-[11px] text-teal-700">
                  {selectedIncident.source_record_id || `#${selectedIncident.accident_id}`}
                </span>
              </div>
              <p className="font-medium text-slate-800">{selectedIncident.road_name}</p>
              <div className="text-slate-500 space-y-0.5 text-[11px]">
                <div>Region: {selectedIncident.region}</div>
                <div>Severity: <strong className="text-slate-800">{selectedIncident.severity}</strong></div>
                <div>Vehicle: {selectedIncident.vehicle_type}</div>
                <div>Weather: {selectedIncident.weather || 'N/A'}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Geographic Precision & Caution Note */}
      <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-slate-700" />
          <span>Spatial Precision & Context Mandate</span>
        </div>
        <p className="leading-relaxed">
          Actual coordinates from verified record sets are displayed. If a record contains only roadway or region titles, 
          coordinates are never simulated. Map clusters reflect recorded incident counts and must not be used to label a location 
          as hazardous without normalizing for traffic volume, intersection geometry, and signalization.
        </p>
      </div>
    </div>
  );
};
