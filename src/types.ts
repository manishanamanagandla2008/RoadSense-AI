export interface AccidentRecord {
  accident_id: number;
  source_record_id: string | null;
  accident_datetime: string | null;
  location_id: number | null;
  region: string | null;
  road_name: string | null;
  latitude: number | null;
  longitude: number | null;
  vehicle_type: string | null;
  severity: string | null;
  weather: string | null;
  source_name: string | null;
  imported_at: string;
}

export interface DashboardSummary {
  totalAccidents: number;
  accidentsToday: number;
  accidentsThisMonth: number;
  locationsRepresented: number;
  mostFrequentVehicle: string;
  mostFrequentSeverity: string;
  monthlyTrends: Array<{ month: string; count: number }>;
  severityDistribution: Array<{ severity: string; count: number }>;
  vehicleDistribution: Array<{ vehicle_type: string; count: number }>;
  topRegions: Array<{ region: string; count: number }>;
  weatherSummary: Array<{ weather: string; count: number }>;
  lastUpdated: string;
}

export interface AnalyticsTrends {
  hourly: Array<{ hour: number; count: number }>;
  weekday: Array<{ weekday: number; count: number }>;
  monthly: Array<{ month: string; count: number }>;
  daily: Array<{ day: string; count: number }>;
  weekdayVsWeekend: {
    weekday: number;
    weekend: number;
  };
}

export interface StatisticalSummary {
  sampleSizeDays: number;
  totalRecordedAccidents?: number;
  meanDaily: number;
  medianDaily: number;
  minDaily: number;
  maxDaily: number;
  stdDev: number;
  notes: string;
}

export interface LocationStats {
  regions: Array<{ region: string; count: number; fatal_count: number; serious_count: number }>;
  roads: Array<{ road_name: string; region: string; count: number; fatal_count: number }>;
  disclaimer: string;
}

export interface VehicleStats {
  vehicleSummary: Array<{ vehicle_type: string; count: number }>;
  vehicleBySeverity: Array<{ vehicle_type: string; severity: string; count: number }>;
  note: string;
}

export interface SeverityStats {
  totalKnownSeverity: number;
  missingSeverityCount: number;
  distribution: Array<{ severity: string; count: number }>;
  severityByRegion: Array<{ region: string; severity: string; count: number }>;
  severityByHour: Array<{ hour: number; severity: string; count: number }>;
}

export interface WeatherStats {
  knownWeather: Array<{ weather: string; count: number; fatal_count: number }>;
  missingWeatherCount: number;
}

export interface MapData {
  mappable: AccidentRecord[];
  unmappedByRegion: Array<{ region: string; unmapped_count: number }>;
  stats: {
    totalMappable: number;
    totalUnmapped: number;
    coordinateCoveragePct: number;
  };
  disclaimer: string;
}

export interface DataQualityReport {
  totalRecords: number;
  missingDates: number;
  missingLocations: number;
  missingVehicles: number;
  missingSeverity: number;
  missingWeather: number;
  missingCoordinates: number;
  importHistory: Array<{
    import_id: number;
    source_id: number | null;
    filename: string;
    total_rows: number;
    successful_rows: number;
    rejected_rows: number;
    duplicate_rows: number;
    missing_value_rows: number;
    validation_status: string;
    imported_at: string;
  }>;
  dataSources: Array<{
    source_id: number;
    source_name: string;
    source_type: string;
    description: string | null;
    is_synthetic: number;
    imported_at: string;
  }>;
  incompleteSample: AccidentRecord[];
  auditedAt: string;
}

export interface FilterState {
  startDate: string;
  endDate: string;
  region: string;
  roadName: string;
  vehicleType: string;
  severity: string;
  weather: string;
}
