import type {
  SensorData,
  ActuatorDevice,
  CropZone,
  EnvironmentSnapshot,
  PondWaterQuality,
} from '../types/digitalTwin';

export interface GreenhouseInfo {
  id: string;
  name: string;
  parkName: string;
  areaSqMeters: number;
  dimensions: {
    length: number;
    width: number;
    ridgeHeight: number;
    gutterHeight: number;
    bayCount: number;
    spanWidth: number;
  };
  structureType: string;
  subsystems: string[];
  zones: string[];
}

export interface EnvironmentHistory {
  timestamps: string[];
  airTemp: number[];
  airHumidity: number[];
  co2: number[];
  lightLux: number[];
  irrigationAccumulatedM3: number[];
}

export interface AGVTrajectoryData {
  robotId: string;
  name: string;
  status: 'patrolling' | 'charging' | 'idle';
  battery: number;
  speed: number;
  currentTask: string;
  currentPosition: [number, number, number];
  heading: number;
  waypoints: Array<{ point: [number, number, number]; staySeconds: number; action: string }>;
  metrics: {
    todayDistanceMeters: number;
    scannedPlants: number;
    detectedAnomalies: number;
    payloadKg: number;
  };
}

export interface IDataAdapter {
  getGreenhouseInfo(): Promise<GreenhouseInfo>;
  getSensorData(): Promise<SensorData[]>;
  getDeviceStatus(): Promise<ActuatorDevice[]>;
  getCropStatus(): Promise<CropZone[]>;
  getEnvironmentSnapshot(): Promise<EnvironmentSnapshot>;
  getEnvironmentHistory(): Promise<EnvironmentHistory>;
  getDeviceHistory(deviceId?: string): Promise<any>;
  getModelInfo(): Promise<any>;
  getTrajectory(): Promise<AGVTrajectoryData>;
  getPondWaterQuality(): Promise<PondWaterQuality>;
  updateDeviceStatus(deviceId: string, power: boolean, value?: number): Promise<boolean>;
}
