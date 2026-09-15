import dataConfig from '../config/dataConfig';
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
import { localAdapter } from './localAdapter';

export class ApiAdapter implements IDataAdapter {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = dataConfig.api.baseURL || 'http://localhost:8000/api';
    this.timeout = dataConfig.api.timeout || 10000;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      return (json && json.data) ? json.data : json;
    } catch (err) {
      clearTimeout(timeoutId);
      // If backend is not available yet, log warning and gracefully fallback to local adapter
      console.warn(`[ApiAdapter] Request to ${endpoint} failed, falling back to local adapter:`, err);
      throw err;
    }
  }

  async getGreenhouseInfo(): Promise<GreenhouseInfo> {
    try {
      return await this.request<GreenhouseInfo>('/greenhouse/info');
    } catch {
      return localAdapter.getGreenhouseInfo();
    }
  }

  async getSensorData(): Promise<SensorData[]> {
    try {
      return await this.request<SensorData[]>('/greenhouse/sensors/latest');
    } catch {
      return localAdapter.getSensorData();
    }
  }

  async getDeviceStatus(): Promise<ActuatorDevice[]> {
    try {
      return await this.request<ActuatorDevice[]>('/greenhouse/devices/status');
    } catch {
      return localAdapter.getDeviceStatus();
    }
  }

  async getCropStatus(): Promise<CropZone[]> {
    try {
      return await this.request<CropZone[]>('/greenhouse/crops/status');
    } catch {
      return localAdapter.getCropStatus();
    }
  }

  async getEnvironmentSnapshot(): Promise<EnvironmentSnapshot> {
    try {
      return await this.request<EnvironmentSnapshot>('/greenhouse/environment/current');
    } catch {
      return localAdapter.getEnvironmentSnapshot();
    }
  }

  async getEnvironmentHistory(): Promise<EnvironmentHistory> {
    try {
      return await this.request<EnvironmentHistory>('/greenhouse/environment/history');
    } catch {
      return localAdapter.getEnvironmentHistory();
    }
  }

  async getDeviceHistory(deviceId?: string): Promise<any> {
    try {
      return await this.request<any>(`/greenhouse/devices/history${deviceId ? `?deviceId=${deviceId}` : ''}`);
    } catch {
      return localAdapter.getDeviceHistory(deviceId);
    }
  }

  async getModelInfo(): Promise<any> {
    try {
      return await this.request<any>('/greenhouse/model');
    } catch {
      return localAdapter.getModelInfo();
    }
  }

  async getTrajectory(): Promise<AGVTrajectoryData> {
    try {
      return await this.request<AGVTrajectoryData>('/greenhouse/agv/trajectory');
    } catch {
      return localAdapter.getTrajectory();
    }
  }

  async getPondWaterQuality(): Promise<PondWaterQuality> {
    try {
      return await this.request<PondWaterQuality>('/greenhouse/pond/latest');
    } catch {
      return localAdapter.getPondWaterQuality();
    }
  }

  async updateDeviceStatus(deviceId: string, power: boolean, value?: number): Promise<boolean> {
    try {
      await this.request<{ success: boolean }>(`/greenhouse/devices/${deviceId}/control`, {
        method: 'POST',
        body: JSON.stringify({ power, value }),
      });
      // Synchronize local adapter memory as well
      await localAdapter.updateDeviceStatus(deviceId, power, value);
      return true;
    } catch {
      return localAdapter.updateDeviceStatus(deviceId, power, value);
    }
  }

  async getWeatherNowcast(): Promise<any> {
    try {
      return await this.request<any>('/weather/nowcast');
    } catch {
      return localAdapter.getWeatherNowcast();
    }
  }

  async getWeatherRadar(): Promise<any> {
    try {
      return await this.request<any>('/weather/radar');
    } catch {
      return localAdapter.getWeatherRadar();
    }
  }

  async getAgroRiskAlerts(): Promise<any> {
    try {
      return await this.request<any>('/weather/alerts');
    } catch {
      return localAdapter.getAgroRiskAlerts();
    }
  }

  async getUnifiedAlarms(): Promise<any> {
    try {
      return await this.request<any>('/greenhouse/alarms');
    } catch {
      return localAdapter.getUnifiedAlarms();
    }
  }

  async acknowledgeAlarm(alarmId: string): Promise<boolean> {
    try {
      await this.request<{ success: boolean }>(`/greenhouse/alarms/${alarmId}/ack`, { method: 'POST' });
      return localAdapter.acknowledgeAlarm(alarmId);
    } catch {
      return localAdapter.acknowledgeAlarm(alarmId);
    }
  }

  async executeDeviceLinkage(actions: any[]): Promise<boolean> {
    try {
      await this.request<{ success: boolean }>('/greenhouse/linkage/execute', {
        method: 'POST',
        body: JSON.stringify({ actions }),
      });
      await localAdapter.executeDeviceLinkage(actions);
      return true;
    } catch {
      return localAdapter.executeDeviceLinkage(actions);
    }
  }

  async getGreenhousesMicroclimates(): Promise<GreenhouseMicroclimate[]> {
    try {
      return await this.request<GreenhouseMicroclimate[]>('/greenhouse/microclimates');
    } catch {
      return localAdapter.getGreenhousesMicroclimates();
    }
  }

  async getOutdoorWeather(): Promise<OutdoorWeatherSnapshot> {
    try {
      return await this.request<OutdoorWeatherSnapshot>('/weather/outdoor');
    } catch {
      return localAdapter.getOutdoorWeather();
    }
  }
}

export const apiAdapter = new ApiAdapter();
