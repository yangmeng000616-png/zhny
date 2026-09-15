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
  WeatherNowcastData,
  RadarEchoFrame,
  AgroRiskWarning,
  UnifiedAlarm,
  DeviceLinkageAction,
  GreenhouseMicroclimate,
  OutdoorWeatherSnapshot,
} from '../types/digitalTwin';
import {
  initialEnvironment,
  initialSensors,
  initialActuators,
  initialCropZones,
  initialPondWaterData,
  initialAGV,
  greenhousesMicroclimates,
  outdoorWeather,
} from '../data/mockData';

export class LocalAdapter implements IDataAdapter {
  private basePath: string;
  private localDevices: ActuatorDevice[] = [...initialActuators];
  private localEnvironment: EnvironmentSnapshot = { ...initialEnvironment };
  private localGreenhouses: GreenhouseMicroclimate[] = JSON.parse(JSON.stringify(greenhousesMicroclimates));
  private localOutdoor: OutdoorWeatherSnapshot = { ...outdoorWeather };
  private activeRisks: AgroRiskWarning[] = [];

  constructor() {
    this.basePath = dataConfig.local.basePath || '/data';
  }

  private async fetchJson<T>(fullPath: string, fallback: T): Promise<T> {
    try {
      const url = `${this.basePath}/${fullPath}`;
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
    return this.fetchJson<GreenhouseInfo>('greenhouse/model/greenhouse.json', fallback);
  }

  async getSensorData(timestamp?: string): Promise<SensorData[]> {
    const targetFile = timestamp ? `greenhouse/sensors/sensor_${timestamp}.json` : 'greenhouse/sensors/sensor_20260914_090000.json';
    return this.fetchJson<SensorData[]>(targetFile, initialSensors);
  }

  async getDeviceStatus(): Promise<ActuatorDevice[]> {
    if (this.localDevices.length > 0) {
      return this.localDevices;
    }
    const fetched = await this.fetchJson<ActuatorDevice[]>('greenhouse/devices/device_20260914_090000.json', initialActuators);
    this.localDevices = fetched;
    return fetched;
  }

  async getCropStatus(): Promise<CropZone[]> {
    return this.fetchJson<CropZone[]>('greenhouse/crops/crop_20260914_090000.json', initialCropZones);
  }

  async getEnvironmentSnapshot(): Promise<EnvironmentSnapshot> {
    return this.fetchJson<EnvironmentSnapshot>('greenhouse/environment/greenhouse_environment_latest.json', this.localEnvironment);
  }

  async getEnvironmentHistory(): Promise<EnvironmentHistory> {
    const fallback: EnvironmentHistory = {
      timestamps: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00'],
      airTemp: [18.2, 17.5, 17.1, 18.0, 22.4, 26.5, 29.2, 28.8, 27.2, 24.1, 21.5, 19.8, 18.5],
      airHumidity: [92.0, 93.5, 94.0, 91.2, 82.5, 74.0, 68.5, 70.2, 75.0, 82.0, 87.5, 90.0, 91.5],
      co2: [920, 950, 980, 890, 780, 690, 640, 660, 710, 790, 850, 890, 910],
      lightLux: [0.0, 0.0, 0.0, 2.5, 18.4, 42.0, 58.5, 54.0, 32.5, 8.0, 0.0, 0.0, 0.0],
      soilMoisture: [68.0, 67.8, 67.5, 67.2, 66.5, 65.0, 64.2, 70.5, 69.2, 68.5, 68.2, 68.0, 67.9],
      irrigationAccumulatedM3: [0, 0, 0, 0, 3.2, 11.5, 19.8, 32.5, 38.0, 42.0, 42.0, 42.0, 42.0],
    };
    return this.fetchJson<EnvironmentHistory>('greenhouse/history/history_20260914_090000.json', fallback);
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
    return this.fetchJson<AGVTrajectoryData>('greenhouse/trajectories/greenhouse_trajectory_latest.json', fallback);
  }

  async getPondWaterQuality(): Promise<PondWaterQuality> {
    return this.fetchJson<PondWaterQuality>('greenhouse/pond/pond_water_latest.json', initialPondWaterData);
  }

  async getGreenhousesMicroclimates(): Promise<GreenhouseMicroclimate[]> {
    return this.fetchJson<GreenhouseMicroclimate[]>('greenhouse/microclimates/microclimates_latest.json', this.localGreenhouses);
  }

  async getOutdoorWeather(): Promise<OutdoorWeatherSnapshot> {
    return this.fetchJson<OutdoorWeatherSnapshot>('greenhouse/weather/outdoor_weather_latest.json', this.localOutdoor);
  }

  async updateDeviceStatus(deviceId: string, power: boolean, value?: number): Promise<boolean> {
    this.localDevices = this.localDevices.map((dev) => {
      if (dev.id === deviceId) {
        return {
          ...dev,
          power,
          status: dev.status === 'offline' ? 'offline' : (power ? 'running' : 'idle'),
          value: value !== undefined ? value : dev.value,
        };
      }
      return dev;
    });

    this.localGreenhouses.forEach((gh) => {
      if (gh.actuators) {
        gh.actuators.forEach((act) => {
          if (act.id === deviceId) {
            act.status = power;
            if (value !== undefined) act.value = value;
          }
        });
      }
    });

    return true;
  }

  // -------------------------------------------------------------
  // Weather & Agro-Risk APIs
  // -------------------------------------------------------------
  async getWeatherNowcast(): Promise<WeatherNowcastData> {
    const fallbackRaw = {
      current: {
        timeOffsetMinutes: 0,
        isoTime: '2026-09-14T09:00:00Z',
        displayTime: '09:00 (实况)',
        isForecast: false,
        precipitationMmPerHour: 0.0,
        accumulatedRainMm: 0.0,
        temperature: 28.6,
        relativeHumidity: 72.3,
        windSpeed: 3.2,
        windDirectionDegrees: 135,
        windDirectionText: '东南风 2级',
        windGust: 5.1,
        radarReflectivityDbz: 18,
        solarRadiationWm2: 680,
        condition: 'cloudy' as const,
        conditionText: '多云转阴',
      },
      timeline: [
        { timeOffsetMinutes: 0, isoTime: '2026-09-14T09:00:00Z', displayTime: '09:00 (实况)', isForecast: false, precipitationMmPerHour: 0.0, accumulatedRainMm: 0.0, temperature: 28.6, relativeHumidity: 72.3, windSpeed: 3.2, windDirectionDegrees: 135, windDirectionText: '东南风 2级', windGust: 5.1, radarReflectivityDbz: 18, solarRadiationWm2: 680, condition: 'cloudy' as const, conditionText: '多云转阴' },
        { timeOffsetMinutes: 15, isoTime: '2026-09-14T09:15:00Z', displayTime: '09:15 (+15m)', isForecast: true, precipitationMmPerHour: 1.2, accumulatedRainMm: 0.3, temperature: 27.8, relativeHumidity: 76.5, windSpeed: 5.6, windDirectionDegrees: 145, windDirectionText: '东南风 3级', windGust: 8.4, radarReflectivityDbz: 28, solarRadiationWm2: 420, condition: 'light_rain' as const, conditionText: '局地零星小阵雨' },
        { timeOffsetMinutes: 30, isoTime: '2026-09-14T09:30:00Z', displayTime: '09:30 (+30m)', isForecast: true, precipitationMmPerHour: 18.5, accumulatedRainMm: 4.9, temperature: 25.4, relativeHumidity: 88.0, windSpeed: 11.2, windDirectionDegrees: 160, windDirectionText: '偏南大风 6级', windGust: 15.8, radarReflectivityDbz: 45, solarRadiationWm2: 180, condition: 'heavy_rain' as const, conditionText: '强对流短时强降水' },
        { timeOffsetMinutes: 45, isoTime: '2026-09-14T09:45:00Z', displayTime: '09:45 (+45m)', isForecast: true, precipitationMmPerHour: 28.0, accumulatedRainMm: 11.9, temperature: 24.1, relativeHumidity: 94.5, windSpeed: 13.8, windDirectionDegrees: 170, windDirectionText: '偏南大风 7级', windGust: 18.2, radarReflectivityDbz: 52, solarRadiationWm2: 110, condition: 'storm' as const, conditionText: '暴雨大风雷暴云团过境' },
        { timeOffsetMinutes: 60, isoTime: '2026-09-14T10:00:00Z', displayTime: '10:00 (+60m)', isForecast: true, precipitationMmPerHour: 14.2, accumulatedRainMm: 15.4, temperature: 24.5, relativeHumidity: 92.0, windSpeed: 8.5, windDirectionDegrees: 190, windDirectionText: '南风 5级', windGust: 12.0, radarReflectivityDbz: 38, solarRadiationWm2: 240, condition: 'moderate_rain' as const, conditionText: '降雨强度减弱为中雨' },
        { timeOffsetMinutes: 90, isoTime: '2026-09-14T10:30:00Z', displayTime: '10:30 (+90m)', isForecast: true, precipitationMmPerHour: 3.5, accumulatedRainMm: 17.2, temperature: 25.8, relativeHumidity: 85.0, windSpeed: 5.0, windDirectionDegrees: 210, windDirectionText: '西南风 3级', windGust: 7.5, radarReflectivityDbz: 24, solarRadiationWm2: 390, condition: 'light_rain' as const, conditionText: '小阵雨逐渐转停' },
        { timeOffsetMinutes: 120, isoTime: '2026-09-14T11:00:00Z', displayTime: '11:00 (+120m)', isForecast: true, precipitationMmPerHour: 0.0, accumulatedRainMm: 17.5, temperature: 27.2, relativeHumidity: 78.0, windSpeed: 3.8, windDirectionDegrees: 220, windDirectionText: '西南风 2级', windGust: 5.2, radarReflectivityDbz: 12, solarRadiationWm2: 580, condition: 'cloudy' as const, conditionText: '云开转阴到多云' },
      ],
    };

    const fetched = await this.fetchJson<any>('weather/rain_nowcast_20260914_090000.json', fallbackRaw);
    const radFrames = await this.getWeatherRadar();

    return {
      stationId: 'AGRO_WX_001',
      stationName: '国家农业科技示范园微距气象站',
      coordinate: [120.15, 30.28],
      issueTime: '2026-09-14T09:00:00Z',
      forecastRangeHours: 2,
      timeStepMinutes: 15,
      currentObservation: fetched.current || fallbackRaw.current,
      timeline: fetched.timeline || fallbackRaw.timeline,
      radarFrames: radFrames,
    };
  }

  async getWeatherRadar(): Promise<RadarEchoFrame[]> {
    const fallback = {
      frames: [
        { timestamp: '2026-09-14T08:30:00Z', timeOffsetMinutes: -30, isExtrapolation: false, maxDbz: 22, coverageCenter: [120.15, 30.28] as [number, number] },
        { timestamp: '2026-09-14T08:45:00Z', timeOffsetMinutes: -15, isExtrapolation: false, maxDbz: 26, coverageCenter: [120.15, 30.28] as [number, number] },
        { timestamp: '2026-09-14T09:00:00Z', timeOffsetMinutes: 0, isExtrapolation: false, maxDbz: 30, coverageCenter: [120.15, 30.28] as [number, number] },
        { timestamp: '2026-09-14T09:15:00Z', timeOffsetMinutes: 15, isExtrapolation: true, maxDbz: 40, coverageCenter: [120.15, 30.28] as [number, number] },
        { timestamp: '2026-09-14T09:30:00Z', timeOffsetMinutes: 30, isExtrapolation: true, maxDbz: 48, coverageCenter: [120.15, 30.28] as [number, number] },
        { timestamp: '2026-09-14T09:45:00Z', timeOffsetMinutes: 45, isExtrapolation: true, maxDbz: 54, coverageCenter: [120.15, 30.28] as [number, number] },
        { timestamp: '2026-09-14T10:00:00Z', timeOffsetMinutes: 60, isExtrapolation: true, maxDbz: 42, coverageCenter: [120.15, 30.28] as [number, number] },
        { timestamp: '2026-09-14T10:30:00Z', timeOffsetMinutes: 90, isExtrapolation: true, maxDbz: 28, coverageCenter: [120.15, 30.28] as [number, number] },
        { timestamp: '2026-09-14T11:00:00Z', timeOffsetMinutes: 120, isExtrapolation: true, maxDbz: 18, coverageCenter: [120.15, 30.28] as [number, number] },
      ],
    };
    const res = await this.fetchJson<any>('weather/radar_20260914_090000.json', fallback);
    return res.frames || fallback.frames;
  }

  async getAgroRiskAlerts(): Promise<AgroRiskWarning[]> {
    if (this.activeRisks.length > 0) {
      return this.activeRisks;
    }
    const defaultRisks: AgroRiskWarning[] = [
      {
        id: 'risk_rain_001',
        type: 'heavy_rain',
        severity: 'critical',
        title: '短临强降水与屋顶排水倒灌红警',
        summary: '预测未来30-45分钟降水强度达28mm/h，累积降水量超15mm',
        triggerCondition: '短临雨量≥20mm/h 且 蓄水塘水位>2.4m',
        forecastLeadMinutes: 30,
        impactedGreenhouses: ['gh_001', 'gh_002', 'gh_003'],
        impactedCropZones: ['crop_zone_01', 'crop_zone_02'],
        impactDescription: '天沟承载负荷骤增，文洛式屋面若开启天窗将导致雨水直接冲淋番茄花穗与生菜苗床，诱发灰霉病；园区主排水沟有壅水顶托风险。',
        aiRecommendation: '建议紧急关闭所有脊顶双向电动天窗，同时启动取水泵站与防汛强排泵降低内河水位。',
        linkageActions: [
          {
            actionId: 'act_close_vent',
            title: '紧急关闭屋脊电动天窗群',
            targetDeviceId: 'vent_roof_001',
            targetDeviceName: '屋脊双向电动排气天窗群',
            targetPower: false,
            targetValue: 0,
            reason: '阻断雨水直接淋入棚内破坏作物植株',
          },
          {
            actionId: 'act_retract_shade',
            title: '收拢外遮阳铝箔保温拉幕',
            targetDeviceId: 'shade_curtain_001',
            targetDeviceName: '内保温遮阳反光铝箔拉幕',
            targetPower: false,
            targetValue: 0,
            reason: '防范雨水积聚压垮铝箔幕布桁架',
          },
        ],
        isMitigated: false,
        timestamp: '2026-09-14T09:00:00Z',
      },
      {
        id: 'risk_wind_002',
        type: 'strong_wind',
        severity: 'warning',
        title: '突发性强阵风撕裂与风压预警',
        summary: '预测未来45分钟伴随7-8级强阵风 (18.2 m/s)',
        triggerCondition: '阵风预报值≥15m/s',
        forecastLeadMinutes: 45,
        impactedGreenhouses: ['gh_001', 'gh_003'],
        impactedCropZones: ['crop_zone_03', 'crop_zone_04'],
        impactDescription: '迎风面山墙及大棚端面产生剧烈空气动压，未闭合的侧窗和天窗易出现负压掀翻效应，造成玻璃碎裂或减反射膜撕脱。',
        aiRecommendation: '立即协同关闭侧窗、天窗，停止负压风机全速运转，开启风机转速防护保护模式。',
        linkageActions: [
          {
            actionId: 'act_slow_fans',
            title: '调节端山墙负压风机至安全转速',
            targetDeviceId: 'fan_001',
            targetDeviceName: '1号山墙负压风机',
            targetPower: true,
            targetValue: 35,
            reason: '防止强风逆灌损坏风机叶片电驱总成',
          },
        ],
        isMitigated: false,
        timestamp: '2026-09-14T09:00:00Z',
      },
    ];

    const fetched = await this.fetchJson<AgroRiskWarning[]>('weather/alerts_20260914_090000.json', defaultRisks);
    this.activeRisks = fetched;
    return fetched;
  }

  async getUnifiedAlarms(): Promise<UnifiedAlarm[]> {
    const risks = await this.getAgroRiskAlerts();
    const alarms: UnifiedAlarm[] = [];

    // Map active agro-risks into alarms
    risks.forEach((risk) => {
      if (!risk.isMitigated) {
        let metricName = '气象遥测';
        let currentValue = '超限';
        let thresholdValue = '预警线';
        let unit = '';

        if (risk.type === 'heavy_rain') {
          metricName = '降水外推率';
          currentValue = '28.0 mm/h';
          thresholdValue = '20.0 mm/h';
          unit = 'mm/h';
        } else if (risk.type === 'strong_wind') {
          metricName = '阵风预报';
          currentValue = '18.2 m/s';
          thresholdValue = '15.0 m/s';
          unit = 'm/s';
        } else if (risk.type === 'high_temperature') {
          metricName = '极端高温';
          currentValue = '36.8 ℃';
          thresholdValue = '35.0 ℃';
          unit = '℃';
        } else if (risk.type === 'low_temperature') {
          metricName = '逆温霜冻';
          currentValue = '2.5 ℃';
          thresholdValue = '5.0 ℃';
          unit = '℃';
        }

        alarms.push({
          id: `alarm_${risk.id}`,
          timestamp: risk.timestamp,
          level: risk.severity,
          sourceType: 'weather',
          sourceId: risk.id,
          sourceName: risk.title,
          location: `大棚群 (${risk.impactedGreenhouses.join(', ')})`,
          metricName,
          currentValue,
          thresholdValue,
          unit,
          message: risk.summary,
          status: 'active',
          recommendedAction: risk.aiRecommendation,
          linkageActions: risk.linkageActions,
        });
      }
    });

    // Check device anomalies (warning, offline)
    this.localDevices.forEach((dev) => {
      if (dev.status === 'warning') {
        alarms.push({
          id: `alarm_dev_${dev.id}`,
          timestamp: '2026-09-14T09:05:00Z',
          level: 'warning',
          sourceType: 'device',
          sourceId: dev.id,
          sourceName: dev.name,
          location: dev.zone,
          metricName: '电机负载',
          currentValue: '108% (超载)',
          thresholdValue: '100% 额定',
          unit: dev.metricUnit || '%',
          message: `${dev.name} 运行电流微幅超出额定区间 (108%)`,
          status: 'active',
          recommendedAction: '建议降低负荷转速或切换备用机组进行电气检修',
        });
      } else if (dev.status === 'offline') {
        alarms.push({
          id: `alarm_dev_${dev.id}`,
          timestamp: '2026-09-14T08:50:00Z',
          level: 'warning',
          sourceType: 'device',
          sourceId: dev.id,
          sourceName: dev.name,
          location: dev.zone,
          metricName: 'RS485通信心跳',
          currentValue: '超时无应答',
          thresholdValue: '在线应答',
          unit: '',
          message: `${dev.name} 通信总线响应超时 (离线状态)`,
          status: 'active',
          recommendedAction: '检查棚端边缘IoT网关、RS485线缆连接与供电模块',
        });
      }
    });

    return alarms.map((a) =>
      this.acknowledgedAlarmIds.has(a.id) ? { ...a, status: 'acknowledged' as const } : a
    );
  }

  private acknowledgedAlarmIds: Set<string> = new Set();

  async acknowledgeAlarm(alarmId: string): Promise<boolean> {
    this.acknowledgedAlarmIds.add(alarmId);
    return true;
  }

  async executeDeviceLinkage(actions: DeviceLinkageAction[]): Promise<boolean> {
    for (const action of actions) {
      await this.updateDeviceStatus(action.targetDeviceId, action.targetPower, action.targetValue);
    }
    // Mark risks that share these actions as mitigated
    this.activeRisks = this.activeRisks.map((r) => {
      const hasAction = r.linkageActions.some((la) => actions.some((a) => a.actionId === la.actionId));
      return hasAction ? { ...r, isMitigated: true } : r;
    });
    return true;
  }
}

export const localAdapter = new LocalAdapter();
