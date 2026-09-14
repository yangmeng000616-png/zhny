export type DeviceStatus = 'running' | 'idle' | 'warning' | 'offline';

export interface SensorData {
  id: string;
  type: 'temperature' | 'humidity' | 'co2' | 'light' | 'soil_moisture' | 'soil_ec' | 'soil_ph';
  name: string;
  zone: string;
  position: [number, number, number]; // [x, y, z] in 3D space
  status: 'normal' | 'warning' | 'alert';
  value: number;
  unit: string;
  targetRange: [number, number];
  history: number[];
}

export interface ActuatorDevice {
  id: string;
  type: 'fan' | 'roof_vent' | 'wet_curtain' | 'irrigation_pump' | 'grow_light' | 'shade_curtain' | 'heater';
  name: string;
  zone: string;
  position: [number, number, number];
  status: DeviceStatus;
  power: boolean;
  value: number; // e.g. 0-100% speed or angle or brightness
  metricUnit: string;
  operatingHours: number;
  powerConsumptionKw: number;
}

export interface CropZone {
  id: string;
  name: string;
  cropType: string;
  plantingDate: string;
  expectedHarvest: string;
  growthProgress: number; // 0 - 100
  health: 'optimal' | 'good' | 'attention';
  areaSqMeters: number;
  stemCount: number;
  soilMoisture: number;
  soilEc: number;
  soilTemp: number;
  centerPos: [number, number, number];
}

export interface AGVRobot {
  id: string;
  name: string;
  status: 'patrolling' | 'charging' | 'idle';
  battery: number;
  speed: number;
  currentTask: string;
  position: [number, number, number];
  heading: number;
}

export interface EnvironmentSnapshot {
  airTemp: number;
  airHumidity: number;
  co2: number;
  lightLux: number;
  soilMoisture: number;
  soilEc: number;
  soilPh: number;
  waterLevel: number;
}

export interface OutdoorWeatherSnapshot {
  temperature: number; // e.g. 23.8 ℃
  humidity: number; // e.g. 54.2 %
  windSpeed: number; // e.g. 3.2 m/s
  windDirection: string; // e.g. '东南风'
  solarRadiation: number; // e.g. 820 W/m²
  par: number; // e.g. 1650 µmol/m²·s
  pressure: number; // e.g. 1012.8 hPa
  rainRate: number; // e.g. 0.0 mm/h
  airQualityAqi: number; // e.g. 28 (优)
}

export interface GreenhouseActuatorControl {
  id: string;
  name: string;
  type: 'vent' | 'shading' | 'curtain' | 'fan' | 'light' | 'irrigation' | 'co2' | 'special';
  status: boolean;
  value?: number; // 0-100% or level
  unit?: string;
}

export interface GreenhouseAgronomyInfo {
  variety: string;
  transplantDate: string;
  growthDays: number;
  harvestCountdownDays: number;
  expectedYieldKgPerM2: number;
  healthIndex: number; // 0 - 100
  diseaseRisk: '极低' | '低' | '中等' | '需注意';
  aiAdvice: string;
  areaM2: number;
  plantDensity: string;
}

export interface GreenhouseMicroclimate {
  id: string; // 'gh_001', 'gh_002', ..., 'gh_008'
  presetKey: CameraPreset; // 'aerial', 'gh2', 'gh3', etc.
  name: string; // '1# Venlo核心示范玻璃大棚'
  shortName: string; // '1# 示范棚'
  cropName: string; // '荷兰粉果番茄'
  growthStage: string; // '开花坐果期'
  structureType: string; // 'Venlo三联栋超白玻璃'
  airTemp: number; // e.g. 28.6
  airHumidity: number; // e.g. 74.6
  co2: number; // e.g. 725
  lightLux: number; // e.g. 46.9
  tempRange: [number, number]; // [22, 30]
  humidityRange: [number, number]; // [60, 80]
  co2Status: string; // '充足'
  lightStatus: string; // '自然光+外遮阳'
  rootzoneType: string; // '椰糠基质' | '高架基质' | 'NFT水培' | '人工光立体' | '相变土壤' | '生态鱼水' | '气雾喷雾' | '菌棒基质'
  rootMoisture: number; // %
  rootEc: number; // mS/cm
  rootPh: number;
  specialMetric?: { label: string; value: string; hint?: string };
  agronomy?: GreenhouseAgronomyInfo;
  actuators?: GreenhouseActuatorControl[];
}

export interface PondWaterQuality {
  id: string;
  name: string;
  waterLevelMeters: number; // Current water level, e.g. 2.45m
  targetWaterLevelRange: [number, number]; // [1.8, 3.2]
  storageCapacityM3: number; // Total volume, e.g. 4280 m³
  capacityPercentage: number; // e.g. 85.6%
  waterTemp: number; // e.g. 21.4 ℃
  dissolvedOxygen: number; // DO, e.g. 7.4 mg/L
  ph: number; // e.g. 7.35
  turbidity: number; // NTU, e.g. 3.8
  ammoniaNitrogen: number; // NH3-N, e.g. 0.15 mg/L
  cod: number; // mg/L, e.g. 2.1
  conductivityEc: number; // μS/cm, e.g. 288
  qualityGrade: 'Ⅰ类 (优)' | 'Ⅱ类 (良)' | 'Ⅲ类 (轻度)';
  intakePumpStatus: 'running' | 'idle';
  intakeFlowRate: number; // m³/h, e.g. 45
  lastUpdated: string;
}

export type CameraPreset =
  | 'aerial'
  | 'park_panorama'
  | 'pond'
  | 'front'
  | 'side'
  | 'top'
  | 'interior'
  | 'zone1'
  | 'zone2'
  | 'pump_room'
  | 'gh2'
  | 'gh3'
  | 'gh4'
  | 'gh5'
  | 'gh6'
  | 'gh7'
  | 'gh8'
  | 'drone_dock'
  | 'cold_chain'
  | 'coldchain'
  | 'fertigation'
  | 'fertigation_tanks'
  | 'smart_field'
  | 'flux_tower';

export type ViewDisplayMode = 'standard' | 'xray' | 'thermal' | 'structure_only';

export interface SpatialTagAnchor {
  id: string;
  name: string;
  category: 'weather' | 'fan' | 'light' | 'sensor' | 'control' | 'irrigation' | 'pond' | 'agv' | 'drone' | 'logistics' | 'tank' | 'field' | 'tower';
  worldPos: [number, number, number];
  icon: string;
  statusText: string;
  subtext: string;
  targetId: string;
}

export interface ProjectedTag extends SpatialTagAnchor {
  screenX: number;
  screenY: number;
  isVisible: boolean;
  distance: number;
}

// -------------------------------------------------------------
// METEOROLOGICAL NOWCASTING & RADAR DATA TYPES (0-2H / 0-3H)
// -------------------------------------------------------------
export type WeatherConditionType = 'sunny' | 'cloudy' | 'overcast' | 'light_rain' | 'moderate_rain' | 'heavy_rain' | 'storm' | 'gale';

export interface WeatherNowcastPoint {
  timeOffsetMinutes: number; // e.g. 0, 15, 30, 45, 60, 90, 120
  isoTime: string; // e.g. "2026-09-14T09:30:00"
  displayTime: string; // e.g. "09:30 (+30m)"
  isForecast: boolean;
  precipitationMmPerHour: number; // mm/h
  accumulatedRainMm: number; // accumulated mm
  temperature: number; // ℃
  relativeHumidity: number; // %
  windSpeed: number; // m/s
  windDirectionDegrees: number; // 0-360
  windDirectionText: string; // e.g. '东南风 4级'
  windGust: number; // m/s
  radarReflectivityDbz: number; // 0 - 65 dBZ
  solarRadiationWm2: number; // W/m²
  condition: WeatherConditionType;
  conditionText: string;
}

export interface RadarEchoFrame {
  timestamp: string;
  timeOffsetMinutes: number;
  isExtrapolation: boolean; // false = observation, true = extrapolated nowcast
  maxDbz: number;
  coverageCenter: [number, number]; // lat, lng or local x, z
  echoImageUri?: string; // synthetic or heatmap texture
}

export interface WeatherNowcastData {
  stationId: string;
  stationName: string;
  coordinate: [number, number];
  issueTime: string;
  forecastRangeHours: number; // 2 or 3
  timeStepMinutes: number; // 15
  currentObservation: WeatherNowcastPoint;
  timeline: WeatherNowcastPoint[];
  radarFrames: RadarEchoFrame[];
}

// -------------------------------------------------------------
// AGRICULTURAL IMPACT ANALYSIS & RISK WARNINGS
// -------------------------------------------------------------
export type AgroRiskType =
  | 'heavy_rain'
  | 'strong_wind'
  | 'high_temperature'
  | 'low_temperature'
  | 'high_humidity_mold'
  | 'intense_solar'
  | 'low_radiation';

export type RiskSeverity = 'critical' | 'warning' | 'info';

export interface DeviceLinkageAction {
  actionId: string;
  title: string;
  targetDeviceId: string;
  targetDeviceName: string;
  targetPower: boolean;
  targetValue?: number;
  reason: string;
}

export interface AgroRiskWarning {
  id: string;
  type: AgroRiskType;
  severity: RiskSeverity;
  title: string;
  summary: string;
  triggerCondition: string;
  forecastLeadMinutes: number; // Lead time in minutes, e.g. 30
  impactedGreenhouses: string[]; // e.g. ['gh_001', 'gh_002']
  impactedCropZones: string[]; // e.g. ['crop_zone_01', 'crop_zone_03']
  impactDescription: string;
  aiRecommendation: string;
  linkageActions: DeviceLinkageAction[];
  isMitigated: boolean;
  timestamp: string;
}

// -------------------------------------------------------------
// UNIFIED ALARM SYSTEM (统一告警中心)
// -------------------------------------------------------------
export interface UnifiedAlarm {
  id: string;
  timestamp: string;
  level: RiskSeverity;
  sourceType: 'sensor' | 'device' | 'crop' | 'weather' | 'agv' | 'pond';
  sourceId: string;
  sourceName: string;
  location: string;
  metricName: string;
  currentValue: string | number;
  thresholdValue: string | number;
  unit: string;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  recommendedAction?: string;
  linkageActions?: DeviceLinkageAction[];
}

// -------------------------------------------------------------
// 3D CONTINUOUS ENVIRONMENT FIELD (三维连续空间场)
// -------------------------------------------------------------
export type EnvironmentFieldType = 'none' | 'temp' | 'humidity' | 'co2' | 'light' | 'soil_moisture';

export interface EnvironmentFieldConfig {
  activeType: EnvironmentFieldType;
  sliceHeight: number; // 0 to 6.5 meters
  opacity: number; // 0.1 to 1.0
  showSlicePlane: boolean;
  show3DParticles: boolean;
}

// -------------------------------------------------------------
// TIMELINE & HISTORICAL PLAYBACK (时间轴与历史回放)
// -------------------------------------------------------------
export interface HistoryPlaybackState {
  isPlaybackMode: boolean; // true = playback, false = live
  isPlaying: boolean;
  currentTimeString: string; // "10:30:00"
  currentHourIndex: number; // 0 - 23 or fractional
  playbackSpeed: number; // 1, 2, 5, 10
}
