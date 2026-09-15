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
  GreenhouseMicroclimate,
  OutdoorWeatherSnapshot,
} from '../types/digitalTwin';

class DataService {
  private adapter: IDataAdapter;

  constructor() {
    const savedMode = (typeof localStorage !== 'undefined' && localStorage.getItem('smart_agri_data_mode')) as 'local' | 'api' | null;
    if (savedMode === 'api' || savedMode === 'local') {
      dataConfig.mode = savedMode;
    }
    this.adapter = dataConfig.mode === 'api' ? apiAdapter : localAdapter;
  }

  setMode(mode: 'local' | 'api'): void {
    dataConfig.mode = mode;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('smart_agri_data_mode', mode);
      } catch {}
    }
    this.adapter = mode === 'api' ? apiAdapter : localAdapter;
  }

  getMode(): 'local' | 'api' {
    return dataConfig.mode;
  }

  async getGreenhousesMicroclimates(): Promise<GreenhouseMicroclimate[]> {
    return this.adapter.getGreenhousesMicroclimates();
  }

  async getOutdoorWeather(): Promise<OutdoorWeatherSnapshot> {
    return this.adapter.getOutdoorWeather();
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

  async getWeatherNowcast(): Promise<any> {
    return this.adapter.getWeatherNowcast();
  }

  async getWeatherRadar(): Promise<any> {
    return this.adapter.getWeatherRadar();
  }

  async getAgroRiskAlerts(): Promise<any> {
    return this.adapter.getAgroRiskAlerts();
  }

  async getUnifiedAlarms(): Promise<any> {
    return this.adapter.getUnifiedAlarms();
  }

  async acknowledgeAlarm(alarmId: string): Promise<boolean> {
    return this.adapter.acknowledgeAlarm(alarmId);
  }

  async executeDeviceLinkage(actions: any[]): Promise<boolean> {
    return this.adapter.executeDeviceLinkage(actions);
  }
}

export const dataService = new DataService();
export default dataService;
