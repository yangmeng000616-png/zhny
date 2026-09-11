import dataConfig from '../config/dataConfig';
import { localAdapter } from './localAdapter';
import { apiAdapter } from './apiAdapter';
import type {
  IDataAdapter,
  GreenhouseInfo,
  EnvironmentHistory,
  AGVTrajectoryData,
} from './dataAdapter';
import type {
  SensorData,
  ActuatorDevice,
  CropZone,
  EnvironmentSnapshot,
  PondWaterQuality,
} from '../types/digitalTwin';

class DataService {
  private adapter: IDataAdapter;

  constructor() {
    this.adapter = dataConfig.mode === 'api' ? apiAdapter : localAdapter;
  }

  setMode(mode: 'local' | 'api'): void {
    dataConfig.mode = mode;
    this.adapter = mode === 'api' ? apiAdapter : localAdapter;
  }

  getMode(): 'local' | 'api' {
    return dataConfig.mode;
  }

  async getGreenhouseInfo(): Promise<GreenhouseInfo> {
    return this.adapter.getGreenhouseInfo();
  }

  async getSensorData(): Promise<SensorData[]> {
    return this.adapter.getSensorData();
  }

  async getDeviceStatus(): Promise<ActuatorDevice[]> {
    return this.adapter.getDeviceStatus();
  }

  async getCropStatus(): Promise<CropZone[]> {
    return this.adapter.getCropStatus();
  }

  async getEnvironmentSnapshot(): Promise<EnvironmentSnapshot> {
    return this.adapter.getEnvironmentSnapshot();
  }

  async getEnvironmentHistory(): Promise<EnvironmentHistory> {
    return this.adapter.getEnvironmentHistory();
  }

  async getDeviceHistory(deviceId?: string): Promise<any> {
    return this.adapter.getDeviceHistory(deviceId);
  }

  async getModelInfo(): Promise<any> {
    return this.adapter.getModelInfo();
  }

  async getTrajectory(): Promise<AGVTrajectoryData> {
    return this.adapter.getTrajectory();
  }

  async getPondWaterQuality(): Promise<PondWaterQuality> {
    return this.adapter.getPondWaterQuality();
  }

  async updateDeviceStatus(deviceId: string, power: boolean, value?: number): Promise<boolean> {
    return this.adapter.updateDeviceStatus(deviceId, power, value);
  }
}

export const dataService = new DataService();
export default dataService;
