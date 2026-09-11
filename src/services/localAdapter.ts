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
} from '../types/digitalTwin';
import {
  initialEnvironment,
  initialSensors,
  initialActuators,
  initialCropZones,
  initialPondWaterData,
  initialAGV,
} from '../data/mockData';

export class LocalAdapter implements IDataAdapter {
  private basePath: string;
  private localDevices: ActuatorDevice[] = [...initialActuators];
  private localEnvironment: EnvironmentSnapshot = { ...initialEnvironment };

  constructor() {
    this.basePath = dataConfig.local.basePath || '/data';
  }

  private async fetchJson<T>(relativePath: string, fallback: T): Promise<T> {
    try {
      const url = `${this.basePath}/greenhouse/${relativePath}`;
      const res = await fetch(url);
      if (!res.ok) {
        return fallback;
      }
      const json = await res.json();
      return (json && json.data) ? json.data : json;
    } catch {
      return fallback;
    }
  }

  async getGreenhouseInfo(): Promise<GreenhouseInfo> {
    const fallback: GreenhouseInfo = {
      id: 'gh_001',
      name: '1号数字化连栋文洛式玻璃温室',
      parkName: '国家农业科技现代示范园',
      areaSqMeters: 864,
      dimensions: {
        length: 36.0,
        width: 24.0,
        ridgeHeight: 6.8,
        gutterHeight: 4.5,
        bayCount: 3,
        spanWidth: 8.0,
      },
      structureType: '双坡文洛式镀锌轻钢骨架 + 超白减反射散射钢化玻璃',
      subsystems: [
        '自然脊顶双向开窗通风系统',
        '湿帘-端山墙/侧墙负压风机强力降温系统',
        '内外双层铝箔电机驱动遮阳保温幕帘',
        '全光谱植物补光悬挂灯阵',
        '滴灌-喷灌双回路水肥一体化',
        '智能温控暖风加热系统',
        'AGV轨道自动巡检与采摘物流机器人',
        '生态河塘与智能取水泵房协同网络',
      ],
      zones: ['A区·高端水果番茄', 'B区·欧洲水果黄瓜', 'C区·无土栽培水培生菜', 'D区·草莓立体多层高架'],
    };
    return this.fetchJson<GreenhouseInfo>('model/greenhouse.json', fallback);
  }

  async getSensorData(): Promise<SensorData[]> {
    return this.fetchJson<SensorData[]>('sensors/greenhouse_sensor_latest.json', initialSensors);
  }

  async getDeviceStatus(): Promise<ActuatorDevice[]> {
    const fetched = await this.fetchJson<ActuatorDevice[]>('devices/greenhouse_device_latest.json', this.localDevices);
    // Merge with any runtime modifications
    if (this.localDevices.length > 0) {
      return this.localDevices;
    }
    this.localDevices = fetched;
    return fetched;
  }

  async getCropStatus(): Promise<CropZone[]> {
    return this.fetchJson<CropZone[]>('crops/greenhouse_crop_latest.json', initialCropZones);
  }

  async getEnvironmentSnapshot(): Promise<EnvironmentSnapshot> {
    return this.fetchJson<EnvironmentSnapshot>('environment/greenhouse_environment_latest.json', this.localEnvironment);
  }

  async getEnvironmentHistory(): Promise<EnvironmentHistory> {
    const fallback: EnvironmentHistory = {
      timestamps: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
      airTemp: [22.4, 24.1, 26.5, 27.8, 28.9, 29.2, 28.4],
      airHumidity: [85.0, 80.2, 76.5, 73.0, 70.8, 71.5, 73.5],
      co2: [890, 840, 780, 730, 690, 710, 715],
      lightLux: [15.2, 28.4, 42.0, 52.5, 58.0, 53.2, 47.8],
      irrigationAccumulatedM3: [0, 4.5, 11.2, 19.8, 26.5, 34.0, 42.8],
    };
    return this.fetchJson<EnvironmentHistory>('history/greenhouse_history.json', fallback);
  }

  async getDeviceHistory(deviceId?: string): Promise<any> {
    return {
      deviceId: deviceId || 'all',
      totalEnergyKwh: 342.8,
      todayRuntimeHours: 6.8,
      alarmCount: 0,
      records: [
        { time: '10:00', power: true, loadPercent: 75 },
        { time: '12:00', power: true, loadPercent: 80 },
        { time: '14:00', power: true, loadPercent: 80 },
      ],
    };
  }

  async getModelInfo(): Promise<any> {
    return this.getGreenhouseInfo();
  }

  async getTrajectory(): Promise<AGVTrajectoryData> {
    const fallback: AGVTrajectoryData = {
      robotId: initialAGV.id,
      name: initialAGV.name,
      status: initialAGV.status,
      battery: initialAGV.battery,
      speed: initialAGV.speed,
      currentTask: initialAGV.currentTask,
      currentPosition: initialAGV.position,
      heading: initialAGV.heading,
      waypoints: [
        { point: [0.0, 0.45, -14.0], staySeconds: 15, action: 'multispectral_scan' },
        { point: [0.0, 0.45, -7.0], staySeconds: 10, action: 'leaf_temperature_read' },
        { point: [0.0, 0.45, 0.0], staySeconds: 20, action: 'fruit_counting_ai' },
        { point: [0.0, 0.45, 7.0], staySeconds: 10, action: 'pest_inspection' },
        { point: [0.0, 0.45, 14.0], staySeconds: 15, action: 'tray_height_calibration' },
        { point: [0.0, 0.45, 0.0], staySeconds: 5, action: 'return_transit' },
      ],
      metrics: {
        todayDistanceMeters: 1420,
        scannedPlants: 4820,
        detectedAnomalies: 0,
        payloadKg: 12.5,
      },
    };
    return this.fetchJson<AGVTrajectoryData>('trajectories/greenhouse_trajectory_latest.json', fallback);
  }

  async getPondWaterQuality(): Promise<PondWaterQuality> {
    return this.fetchJson<PondWaterQuality>('pond/pond_water_latest.json', initialPondWaterData);
  }

  async updateDeviceStatus(deviceId: string, power: boolean, value?: number): Promise<boolean> {
    this.localDevices = this.localDevices.map((dev) => {
      if (dev.id === deviceId) {
        return {
          ...dev,
          power,
          status: power ? 'running' : 'idle',
          value: value !== undefined ? value : dev.value,
        };
      }
      return dev;
    });
    return true;
  }
}

export const localAdapter = new LocalAdapter();
