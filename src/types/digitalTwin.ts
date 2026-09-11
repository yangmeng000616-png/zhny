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
  | 'gh4';

export type ViewDisplayMode = 'standard' | 'xray' | 'thermal' | 'structure_only';

export interface SpatialTagAnchor {
  id: string;
  name: string;
  category: 'weather' | 'fan' | 'light' | 'sensor' | 'control' | 'irrigation' | 'pond' | 'agv';
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
