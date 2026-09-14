<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { GreenhouseScene, type PickedObjectInfo } from './three/GreenhouseScene';
import type {
  SensorData,
  ActuatorDevice,
  CropZone,
  AGVRobot,
  EnvironmentSnapshot,
  CameraPreset,
  ViewDisplayMode,
  PondWaterQuality,
  ProjectedTag,
  UnifiedAlarm,
  AgroRiskWarning,
  EnvironmentFieldType,
  WeatherNowcastPoint,
  RadarEchoFrame,
  OutdoorWeatherSnapshot,
  GreenhouseMicroclimate,
  FarmingRecord,
  GreenhousePlantingCycle,
  PestMonitoringRecord,
  PestWeeklyTrendItem,
  PondFeedingRecord,
  EnvironmentalHistoryLog,
  FarmEnergyRecord,
  FarmInventoryItem,
  FarmLaborRecord,
  FarmHarvestSalesRecord,
} from './types/digitalTwin';
import {
  initialEnvironment,
  initialSensors,
  initialActuators,
  initialCropZones,
  initialAGV,
  initialPondWaterData,
  initialOutdoorWeather,
  initialGreenhousesMicroclimates,
} from './data/mockData';
import {
  initialFarmingRecords,
  initialPlantingCycles,
  initialFishPondFeedingRecords,
  initialPestMonitoringRecords,
  initialPestWeeklyTrend,
  initialEnvironmentalHistoryLogs,
  initialFarmEnergyRecords,
  initialFarmInventoryItems,
  initialFarmLaborRecords,
  initialFarmSalesRecords,
} from './data/farmingData';
import { dataService } from './services/dataService';
import { weatherService } from './services/weatherService';

import TopNavbar from './components/TopNavbar.vue';
import LeftMetricsPanel from './components/LeftMetricsPanel.vue';
import RightControlPanel from './components/RightControlPanel.vue';
import BottomTrendPanel from './components/BottomTrendPanel.vue';
import DeviceDetailModal from './components/DeviceDetailModal.vue';
import RoamGuideOverlay from './components/RoamGuideOverlay.vue';
import HoverTooltip from './components/HoverTooltip.vue';
import SpatialTagsOverlay from './components/SpatialTagsOverlay.vue';
import WeatherPanel from './components/WeatherPanel.vue';
import UnifiedAlertCenter from './components/UnifiedAlertCenter.vue';
import EnvironmentFieldController from './components/EnvironmentFieldController.vue';
import HistoryPlaybackBar from './components/HistoryPlaybackBar.vue';
import GreenhouseStationModal from './components/GreenhouseStationModal.vue';
import GreenhouseMatrixModal from './components/GreenhouseMatrixModal.vue';
import UnifiedFarmingCenterModal from './components/UnifiedFarmingCenterModal.vue';
import FarmingRecordAddModal from './components/FarmingRecordAddModal.vue';
import PestMonitoringModal from './components/PestMonitoringModal.vue';
import PondFeedingModal from './components/PondFeedingModal.vue';
import TemperatureHistoryModal from './components/TemperatureHistoryModal.vue';
import EnterpriseOwnerHubModal from './components/EnterpriseOwnerHubModal.vue';
import LogisticsLedgerModal from './components/LogisticsLedgerModal.vue';

const canvasContainerRef = ref<HTMLDivElement | null>(null);
let sceneInstance: GreenhouseScene | null = null;

// Digital Twin Dynamic States (accessed via dataService layer)
const environment = ref<EnvironmentSnapshot>(initialEnvironment);
const sensors = ref<SensorData[]>(initialSensors);
const actuators = ref<ActuatorDevice[]>(initialActuators);
const crops = ref<CropZone[]>(initialCropZones);
const agv = ref<AGVRobot>(initialAGV);
const pondWater = ref<PondWaterQuality>(initialPondWaterData);
const dataSourceMode = ref<'local' | 'api'>(dataService.getMode());

// Per-Greenhouse Microclimate & Outdoor Weather Separation
const selectedGreenhouseId = ref<string>('gh_001');
const outdoorWeather = ref<OutdoorWeatherSnapshot>(initialOutdoorWeather);
const greenhousesMicroclimates = ref<GreenhouseMicroclimate[]>(initialGreenhousesMicroclimates);

// Dedicated Per-Greenhouse Station & Matrix Views
const showGreenhouseStation = ref<boolean>(false);
const stationGreenhouseId = ref<string>('gh_001');
const showGreenhouseMatrix = ref<boolean>(false);

// Per-Greenhouse Farming Records & Planting Cycles Management
const farmingRecords = ref<FarmingRecord[]>(initialFarmingRecords);
const plantingCycles = ref<Record<string, GreenhousePlantingCycle>>(initialPlantingCycles);
const showFarmingCenter = ref<boolean>(false);
const showAddRecordModal = ref<boolean>(false);
const targetAddRecordGhId = ref<string>('gh_001');

// Smart Pest Monitoring & Trap System
const pestRecords = ref<PestMonitoringRecord[]>(initialPestMonitoringRecords);
const pestWeeklyTrend = ref<PestWeeklyTrendItem[]>(initialPestWeeklyTrend);
const showPestMonitoring = ref<boolean>(false);

// Fish Pond Feeding & Micro-ecology Water Quality Records
const feedingRecords = ref<PondFeedingRecord[]>(initialFishPondFeedingRecords);
const showFeedingModal = ref<boolean>(false);

// Regional Temperature History & Time-Series Microclimate Logs
const historyLogs = ref<EnvironmentalHistoryLog[]>(initialEnvironmentalHistoryLogs);
const showTempHistoryModal = ref<boolean>(false);

// Agricultural Enterprise Owner Hub States (Energy, Inventory, Labor, Sales)
const energyRecords = ref<FarmEnergyRecord[]>(initialFarmEnergyRecords);
const inventoryItems = ref<FarmInventoryItem[]>(initialFarmInventoryItems);
const laborRecords = ref<FarmLaborRecord[]>(initialFarmLaborRecords);
const salesRecords = ref<FarmHarvestSalesRecord[]>(initialFarmSalesRecords);
const showOwnerHubModal = ref<boolean>(false);

// Produce Shipment & Agricultural Supplies Logistics Ledger
const showLogisticsLedger = ref<boolean>(false);

const handleAddPestRecord = (record: PestMonitoringRecord) => {
  pestRecords.value.unshift(record);
};

const handleAddFeedingRecord = (record: PondFeedingRecord) => {
  feedingRecords.value.unshift(record);
};

// Digital Twin Advanced Features & Panels
const showWeatherPanel = ref<boolean>(false);
const showAlertCenter = ref<boolean>(false);
const showFieldController = ref<boolean>(false);
const showHistoryBar = ref<boolean>(false);
const showSensors = ref<boolean>(true);

// Alerts & Risks
const alarms = ref<UnifiedAlarm[]>([]);
const riskWarnings = ref<AgroRiskWarning[]>([]);
const totalAlertCount = computed(() => {
  return (
    alarms.value.filter((a) => a.status !== 'acknowledged').length +
    riskWarnings.value.filter((r) => !r.isMitigated).length
  );
});

// Continuous Environment Field Parameters
const activeEnvField = ref<EnvironmentFieldType>('none');
const envSliceHeight = ref<number>(2.2);
const envFieldOpacity = ref<number>(0.75);

// Load data via unified DataService
const loadDataFromService = async () => {
  try {
    const [envData, sensorsData, actuatorsData, cropsData, pondData, agvData, alarmsData, risksData] =
      await Promise.all([
        dataService.getEnvironmentSnapshot(),
        dataService.getSensorData(),
        dataService.getDeviceStatus(),
        dataService.getCropStatus(),
        dataService.getPondWaterQuality(),
        dataService.getTrajectory(),
        dataService.getUnifiedAlarms(),
        weatherService.getRiskWarnings(),
      ]);
    if (envData) environment.value = envData;
    if (sensorsData) sensors.value = sensorsData;
    if (actuatorsData) actuators.value = actuatorsData;
    if (cropsData) crops.value = cropsData;
    if (pondData) pondWater.value = pondData;
    if (alarmsData) alarms.value = alarmsData;
    if (risksData) {
      riskWarnings.value = risksData;
      sceneInstance?.setRiskWarnings(risksData);
    }
    if (agvData) {
      agv.value = {
        ...agv.value,
        battery: agvData.battery,
        speed: agvData.speed,
        currentTask: agvData.currentTask,
      };
    }
  } catch (err) {
    console.warn('[DataService] Error loading data:', err);
  }
};

const handleToggleDataSource = async () => {
  const nextMode = dataSourceMode.value === 'local' ? 'api' : 'local';
  dataService.setMode(nextMode);
  dataSourceMode.value = nextMode;
  await loadDataFromService();
};

// View & UI Controls
const currentPreset = ref<CameraPreset>('aerial');
const displayMode = ref<ViewDisplayMode>('standard');
const autoMode = ref<boolean>(true);
const showRoamGuide = ref<boolean>(false);
const spatialTags = ref<ProjectedTag[]>([]);
const showSpatialTags = ref<boolean>(true);

// Coordinated responsive panel states to prevent overlapping
const isMobileScreen = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
const leftPanelCollapsed = ref<boolean>(isMobileScreen);
const rightPanelCollapsed = ref<boolean>(isMobileScreen);
const bottomPanelCollapsed = ref<boolean>(true); // Default collapsed for clean visual presentation

// Zen / Clean Screen Mode
const isZenMode = computed(() => leftPanelCollapsed.value && rightPanelCollapsed.value && bottomPanelCollapsed.value);
const handleToggleZenMode = () => {
  if (isZenMode.value) {
    leftPanelCollapsed.value = false;
    rightPanelCollapsed.value = false;
    bottomPanelCollapsed.value = false;
  } else {
    leftPanelCollapsed.value = true;
    rightPanelCollapsed.value = true;
    bottomPanelCollapsed.value = true;
  }
};

// Interaction State
const selectedObject = ref<PickedObjectInfo | null>(null);
const hoveredObject = ref<PickedObjectInfo | null>(null);
const hoverScreenPos = ref<{ x: number; y: number } | null>(null);

// Live Clock
const timeString = ref<string>('');
let clockTimer: ReturnType<typeof setInterval> | null = null;
let telemetryTimer: ReturnType<typeof setInterval> | null = null;

// 1. Initialize Three.js Scene
onMounted(() => {
  loadDataFromService();

  if (canvasContainerRef.value) {
    sceneInstance = new GreenhouseScene(canvasContainerRef.value, {
      onHover: (info, screenPos) => {
        hoveredObject.value = info;
        hoverScreenPos.value = screenPos || null;
      },
      onSelect: (info) => {
        if (info) {
          // Direct facility modal triggers
          if (info.id.includes('coldchain') || info.id.includes('truck') || info.id.includes('loader')) {
            showLogisticsLedger.value = true;
            return;
          }
          if (info.id.includes('pond') || info.id.includes('water') || info.id.includes('inspector')) {
            showFeedingModal.value = true;
            return;
          }

          let matchedGhId: string | null = null;
          if (info.id.includes('gh2') || info.id.includes('greenhouse_2')) {
            matchedGhId = 'gh_002';
          } else if (info.id.includes('gh3') || info.id.includes('greenhouse_3')) {
            matchedGhId = 'gh_003';
          } else if (info.id.includes('gh4') || info.id.includes('greenhouse_4')) {
            matchedGhId = 'gh_004';
          } else if (info.id.includes('gh5') || info.id.includes('greenhouse_5')) {
            matchedGhId = 'gh_005';
          } else if (info.id.includes('gh6') || info.id.includes('greenhouse_6')) {
            matchedGhId = 'gh_006';
          } else if (info.id.includes('gh7') || info.id.includes('greenhouse_7')) {
            matchedGhId = 'gh_007';
          } else if (info.id.includes('gh8') || info.id.includes('greenhouse_8')) {
            matchedGhId = 'gh_008';
          } else if (info.id.includes('flux_tower')) {
            matchedGhId = 'outdoor';
          } else if (info.id.includes('greenhouse') || info.id.includes('roof') || info.id.includes('glass')) {
            matchedGhId = 'gh_001';
          }

          if (matchedGhId) {
            selectedGreenhouseId.value = matchedGhId;
            if (matchedGhId !== 'outdoor') {
              openGreenhouseStation(matchedGhId);
              return;
            }
          }
        }
        selectedObject.value = info;
      },
      onTagsUpdate: (tags) => {
        spatialTags.value = tags;
      },
      onCameraOrbit: () => {
        currentPreset.value = 'custom' as any;
      },
    });
  }

  // 2. Real-time Clock
  const updateTime = () => {
    const now = new Date();
    timeString.value = now.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };
  updateTime();
  clockTimer = setInterval(updateTime, 1000);

  // 3. Simulated IoT Real-time Micro-telemetry Fluctuation Loop
  telemetryTimer = setInterval(() => {
    // Environment micro-fluctuations
    const prevEnv = environment.value;
    const dTemp = (Math.random() - 0.48) * 0.15;
    const dHum = (Math.random() - 0.5) * 0.2;
    const dCo2 = (Math.random() - 0.49) * 2.5;
    const dLight = (Math.random() - 0.49) * 0.2;

    environment.value = {
      ...prevEnv,
      airTemp: +(prevEnv.airTemp + dTemp).toFixed(1),
      airHumidity: +(prevEnv.airHumidity + dHum).toFixed(1),
      co2: Math.round(prevEnv.co2 + dCo2),
      lightLux: +(prevEnv.lightLux + dLight).toFixed(1),
    };

    // Live microclimates update for each greenhouse
    greenhousesMicroclimates.value = greenhousesMicroclimates.value.map((gh) => {
      const dt = (Math.random() - 0.5) * 0.1;
      const dh = (Math.random() - 0.5) * 0.15;
      return {
        ...gh,
        airTemp: +(gh.airTemp + dt).toFixed(1),
        airHumidity: +(Math.min(95, Math.max(30, gh.airHumidity + dh))).toFixed(1),
      };
    });

    // Live outdoor meteorological weather fluctuations
    if (outdoorWeather.value) {
      const odt = (Math.random() - 0.5) * 0.08;
      const odh = (Math.random() - 0.5) * 0.1;
      const odw = (Math.random() - 0.5) * 0.05;
      outdoorWeather.value = {
        ...outdoorWeather.value,
        temperature: +(outdoorWeather.value.temperature + odt).toFixed(1),
        humidity: +(outdoorWeather.value.humidity + odh).toFixed(1),
        windSpeed: +(Math.max(0.5, outdoorWeather.value.windSpeed + odw)).toFixed(1),
      };
    }

    // Update sensors values
    sensors.value = sensors.value.map((s) => {
      if (s.type === 'temperature') {
        const val = +(s.value + (Math.random() - 0.5) * 0.1).toFixed(1);
        return { ...s, value: val };
      }
      if (s.type === 'co2') {
        const val = Math.round(s.value + (Math.random() - 0.5) * 2);
        return { ...s, value: val };
      }
      if (s.type === 'light') {
        const val = +(s.value + (Math.random() - 0.5) * 0.15).toFixed(1);
        return { ...s, value: val };
      }
      return s;
    });

    // Battery consumption simulation for AGV
    agv.value = {
      ...agv.value,
      battery: Math.max(20, +(agv.value.battery - 0.01).toFixed(1)),
    };

    // Realistic micro-fluctuation for Pond Water Quality & Level
    const prevPond = pondWater.value;
    const dLevel = (Math.random() - 0.49) * 0.005;
    const dDo = (Math.random() - 0.5) * 0.08;
    const dWaterTemp = (Math.random() - 0.5) * 0.05;
    const dPh = (Math.random() - 0.5) * 0.02;
    const newLevel = Math.max(1.8, Math.min(3.2, +(prevPond.waterLevelMeters + dLevel).toFixed(3)));
    const newCapacity = +(Math.min(100, (newLevel / 3.2) * 100)).toFixed(1);
    const newStorage = Math.round(newLevel * 1750);

    pondWater.value = {
      ...prevPond,
      waterLevelMeters: newLevel,
      capacityPercentage: newCapacity,
      storageCapacityM3: newStorage,
      dissolvedOxygen: Math.max(5.5, +(prevPond.dissolvedOxygen + dDo).toFixed(2)),
      waterTemp: +(prevPond.waterTemp + dWaterTemp).toFixed(1),
      ph: +(prevPond.ph + dPh).toFixed(2),
    };
  }, 2000);
});

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer);
  if (telemetryTimer) clearInterval(telemetryTimer);
  if (sceneInstance) {
    sceneInstance.dispose();
    sceneInstance = null;
  }
});

// 4. Actuator Handlers
const handleToggleActuator = (id: string, power: boolean) => {
  actuators.value = actuators.value.map((a) => {
    if (a.id === id) {
      return { ...a, power, status: power ? 'running' : 'idle' };
    }
    return a;
  });

  dataService.updateDeviceStatus(id, power);

  if (!sceneInstance) return;
  const act = actuators.value.find((a) => a.id === id);
  if (!act) return;

  if (act.type === 'fan') {
    sceneInstance.updateFanSpeed(id, power ? act.value : 0);
  } else if (act.type === 'roof_vent') {
    sceneInstance.updateRoofVentAngle(power ? act.value : 0);
  } else if (act.type === 'shade_curtain') {
    sceneInstance.updateShadeCurtainRatio(power ? 1.0 : 0.0);
  } else if (act.type === 'irrigation_pump') {
    sceneInstance.updateIrrigation(power);
  } else if (act.type === 'grow_light') {
    sceneInstance.updateGrowLights(power, act.value);
  }
};

const handleUpdateActuatorValue = (id: string, value: number) => {
  actuators.value = actuators.value.map((a) => {
    if (a.id === id) {
      return { ...a, value };
    }
    return a;
  });

  dataService.updateDeviceStatus(id, true, value);

  if (!sceneInstance) return;
  const act = actuators.value.find((a) => a.id === id);
  if (!act || !act.power) return;

  if (act.type === 'fan') {
    sceneInstance.updateFanSpeed(id, value);
  } else if (act.type === 'roof_vent') {
    sceneInstance.updateRoofVentAngle(value);
  } else if (act.type === 'shade_curtain') {
    sceneInstance.updateShadeCurtainRatio(value / 100);
  } else if (act.type === 'grow_light') {
    sceneInstance.updateGrowLights(true, value);
  }
};

// 5. Camera & Display Presets and Greenhouse Linking
const presetToGhMap: Record<string, string> = {
  aerial: 'gh_001',
  front: 'gh_001',
  side: 'gh_001',
  top: 'gh_001',
  zone1: 'gh_001',
  zone2: 'gh_001',
  interior: 'gh_001',
  gh2: 'gh_002',
  gh3: 'gh_003',
  gh4: 'gh_004',
  gh5: 'gh_005',
  gh6: 'gh_006',
  gh7: 'gh_007',
  gh8: 'gh_008',
  flux_tower: 'outdoor',
};

const ghToPresetMap: Record<string, CameraPreset> = {
  gh_001: 'aerial',
  gh_002: 'gh2',
  gh_003: 'gh3',
  gh_004: 'gh4',
  gh_005: 'gh5',
  gh_006: 'gh6',
  gh_007: 'gh7',
  gh_008: 'gh8',
  outdoor: 'flux_tower',
};

const handlePresetChange = (preset: CameraPreset) => {
  currentPreset.value = preset;
  sceneInstance?.setCameraPreset(preset);
  if (presetToGhMap[preset]) {
    selectedGreenhouseId.value = presetToGhMap[preset];
  }
};

const handleSelectGreenhouse = (ghId: string) => {
  selectedGreenhouseId.value = ghId;
  const targetPreset = ghToPresetMap[ghId];
  if (targetPreset) {
    handlePresetChange(targetPreset);
  }
};

// Open Dedicated Greenhouse Station Modal
const openGreenhouseStation = (ghId: string) => {
  let normalizedId = ghId;
  if (ghId.includes('02') || ghId.includes('_2') || ghId.includes('gh2')) normalizedId = 'gh_002';
  else if (ghId.includes('03') || ghId.includes('_3') || ghId.includes('gh3')) normalizedId = 'gh_003';
  else if (ghId.includes('04') || ghId.includes('_4') || ghId.includes('gh4')) normalizedId = 'gh_004';
  else if (ghId.includes('05') || ghId.includes('_5') || ghId.includes('gh5')) normalizedId = 'gh_005';
  else if (ghId.includes('06') || ghId.includes('_6') || ghId.includes('gh6')) normalizedId = 'gh_006';
  else if (ghId.includes('07') || ghId.includes('_7') || ghId.includes('gh7')) normalizedId = 'gh_007';
  else if (ghId.includes('08') || ghId.includes('_8') || ghId.includes('gh8')) normalizedId = 'gh_008';
  else if (ghId.includes('01') || ghId.includes('_1') || ghId.includes('aerial') || ghId.includes('greenhouse')) normalizedId = 'gh_001';

  stationGreenhouseId.value = normalizedId;
  selectedGreenhouseId.value = normalizedId;
  showGreenhouseStation.value = true;
  showGreenhouseMatrix.value = false;
  selectedObject.value = null;

  const targetPreset = ghToPresetMap[normalizedId];
  if (targetPreset) {
    handlePresetChange(targetPreset);
  }
};

// Open 8-Greenhouse Cluster Matrix View
const openGreenhouseMatrix = () => {
  showGreenhouseMatrix.value = true;
  showGreenhouseStation.value = false;
  selectedObject.value = null;
};

// Open Park-wide Farming Operations & Cycles Center
const openFarmingCenter = () => {
  showFarmingCenter.value = true;
};

// Open Add Farming Record Modal
const openAddFarmingRecordModal = (ghId?: string) => {
  targetAddRecordGhId.value = ghId || stationGreenhouseId.value || 'gh_001';
  showAddRecordModal.value = true;
};

// Handle submission of new farming record
const handleAddFarmingRecord = (newRecord: FarmingRecord) => {
  // 1. Prepend to records list
  farmingRecords.value.unshift(newRecord);

  // 2. Update planting cycle cumulative statistics for this greenhouse
  const cycle = plantingCycles.value[newRecord.greenhouseId];
  if (cycle) {
    if (newRecord.type === 'irrigation' && newRecord.irrigationDetails) {
      cycle.cumulativeStats.totalWaterM3 = +(
        cycle.cumulativeStats.totalWaterM3 +
        newRecord.irrigationDetails.waterVolumeL / 1000
      ).toFixed(1);
    } else if (newRecord.type === 'fertilization' && newRecord.fertilizationDetails) {
      cycle.cumulativeStats.totalFertilizerKg = +(
        cycle.cumulativeStats.totalFertilizerKg +
        newRecord.fertilizationDetails.fertilizerAmountKg
      ).toFixed(1);
    } else if (newRecord.type === 'pesticide') {
      cycle.cumulativeStats.sprayCount += 1;
    } else if (newRecord.type === 'harvest' && newRecord.harvestDetails) {
      cycle.cumulativeStats.totalHarvestKg =
        (cycle.cumulativeStats.totalHarvestKg || 0) +
        newRecord.harvestDetails.harvestWeightKg;
      cycle.cumulativeStats.harvestBatches = (cycle.cumulativeStats.harvestBatches || 0) + 1;
    }
  }

  // 3. Reflect into current greenhouse microclimate if irrigation or fertilization occurred
  const gh = greenhousesMicroclimates.value.find((g) => g.id === newRecord.greenhouseId);
  if (gh) {
    if (newRecord.type === 'irrigation' && newRecord.irrigationDetails) {
      gh.rootMoisture = newRecord.irrigationDetails.soilMoistureAfter;
    }
    if (newRecord.type === 'fertilization' && newRecord.fertilizationDetails) {
      gh.rootEc = newRecord.fertilizationDetails.measuredEc;
    }
  }
};

const handleStationSelectGreenhouse = (ghId: string) => {
  stationGreenhouseId.value = ghId;
  selectedGreenhouseId.value = ghId;
  const targetPreset = ghToPresetMap[ghId];
  if (targetPreset) {
    handlePresetChange(targetPreset);
  }
};

const handleStationActuatorToggle = (ghId: string, actuatorId: string, status: boolean) => {
  const gh = greenhousesMicroclimates.value.find((g) => g.id === ghId);
  if (gh && gh.actuators) {
    const act = gh.actuators.find((a) => a.id === actuatorId);
    if (act) {
      act.status = status;
      if (ghId === 'gh_001') {
        if (act.type === 'shading') {
          handleToggleActuator('shade_curtain_001', status);
        } else if (act.type === 'vent') {
          handleToggleActuator('vent_roof_001', status);
        }
      }
    }
  }
};

const handleStationActuatorValue = (ghId: string, actuatorId: string, value: number) => {
  const gh = greenhousesMicroclimates.value.find((g) => g.id === ghId);
  if (gh && gh.actuators) {
    const act = gh.actuators.find((a) => a.id === actuatorId);
    if (act) {
      act.value = value;
      if (ghId === 'gh_001') {
        if (act.type === 'shading') {
          handleUpdateActuatorValue('shade_curtain_001', value);
        } else if (act.type === 'vent') {
          handleUpdateActuatorValue('vent_roof_001', value);
        }
      }
    }
  }
};

const handleStationFocusCamera = () => {
  const targetPreset = ghToPresetMap[stationGreenhouseId.value];
  if (targetPreset) {
    handlePresetChange(targetPreset);
  }
};

const handleMatrixFocusGreenhouse = (preset: CameraPreset) => {
  handlePresetChange(preset);
  showGreenhouseMatrix.value = false;
};

const handleDisplayModeChange = (mode: ViewDisplayMode) => {
  displayMode.value = mode;
  sceneInstance?.setDisplayMode(mode);
};

const handleResetCamera = () => {
  sceneInstance?.setCameraPreset('aerial');
  currentPreset.value = 'aerial';
};

// 6. Navigation jumps from UI to 3D
const handleSelectSensor = (sensorId: string) => {
  const s = sensors.value.find((item) => item.id === sensorId);
  if (!s || !sceneInstance) return;
  const targetPos = new THREE.Vector3(s.position[0], s.position[1], s.position[2]);
  sceneInstance.focusOnPosition(targetPos);
  selectedObject.value = {
    id: s.id,
    type: 'sensor',
    name: s.name,
    worldPosition: targetPos,
  };
};

const handleFocusCropZone = (zoneId: string) => {
  const c = crops.value.find((item) => item.id === zoneId);
  if (!c || !sceneInstance) return;
  if (zoneId === 'crop_zone_01' || zoneId === 'crop_zone_03') {
    handlePresetChange('zone1');
  } else {
    handlePresetChange('zone2');
  }
};

const handleFocusAGV = () => {
  if (!sceneInstance) return;
  handlePresetChange('interior');
};

const handleFocusDevice = (deviceId: string) => {
  const act = actuators.value.find((a) => a.id === deviceId);
  if (!act || !sceneInstance) return;
  const targetPos = new THREE.Vector3(act.position[0], act.position[1], act.position[2]);
  sceneInstance.focusOnPosition(targetPos);
};

// 7. Spatial Tag click navigation
const handleSelectTag = (tag: ProjectedTag) => {
  if (!sceneInstance) return;
  const targetPos = new THREE.Vector3(tag.worldPos[0], tag.worldPos[1], tag.worldPos[2]);
  sceneInstance.focusOnPosition(targetPos);
  selectedObject.value = {
    id: tag.targetId || tag.id,
    type: (tag.category === 'fan'
      ? 'fan'
      : tag.category === 'sensor'
      ? 'sensor'
      : tag.category === 'agv'
      ? 'agv'
      : tag.category === 'light'
      ? 'grow_light'
      : tag.category === 'irrigation'
      ? 'pump'
      : tag.category === 'pond'
      ? 'pond_buoy'
      : 'structure') as any,
    name: tag.name,
    worldPosition: targetPos,
  };
};

// 8. Digital Twin Advanced Handlers
const handleApplyWeather3D = (point: WeatherNowcastPoint) => {
  sceneInstance?.setWeatherEffect(point);
};

const handleApplyRadarFrame3D = (frame: RadarEchoFrame | null) => {
  sceneInstance?.setRadarEchoFrame(frame);
};

const handleToggleWeatherLayer = (layer: 'rain' | 'wind' | 'radar', visible: boolean) => {
  sceneInstance?.setWeatherLayerVisible(layer, visible);
};

const handleFocusGreenhouse = (ghId: string) => {
  sceneInstance?.focusOnObject(ghId);
};

const handleFocusObject = (targetId: string) => {
  sceneInstance?.focusOnObject(targetId);
  const sensorFound = sensors.value.find((s) => s.id === targetId);
  const actuatorFound = actuators.value.find((a) => a.id === targetId);
  if (sensorFound) {
    selectedObject.value = {
      id: sensorFound.id,
      type: 'sensor',
      name: sensorFound.name,
      worldPosition: new THREE.Vector3(...sensorFound.position),
    };
  } else if (actuatorFound) {
    selectedObject.value = {
      id: actuatorFound.id,
      type: actuatorFound.type as any,
      name: actuatorFound.name,
      worldPosition: new THREE.Vector3(...actuatorFound.position),
    };
  }
};

const handleAcknowledgeAlarm = async (alarmId: string) => {
  await dataService.acknowledgeAlarm(alarmId);
  alarms.value = alarms.value.map((a) =>
    a.id === alarmId ? { ...a, status: 'acknowledged' as const } : a
  );
};

const handleMitigateRisk = async (warningOrId: any) => {
  const warningId = typeof warningOrId === 'string' ? warningOrId : warningOrId.id;
  await weatherService.mitigateRiskWarning(warningId);
  riskWarnings.value = riskWarnings.value.map((r) =>
    r.id === warningId ? { ...r, isMitigated: true } : r
  );
  sceneInstance?.setRiskWarnings(riskWarnings.value);

  // Intelligent protective linkage action:
  // If storm/rain, close roof vents & retract shade curtains
  handleToggleActuator('vent_roof_001', true);
  handleUpdateActuatorValue('vent_roof_001', 0); // close vent
  handleToggleActuator('shade_curtain_001', true);
  handleUpdateActuatorValue('shade_curtain_001', 0); // retract curtain
};

const handleUpdateEnvField = (type: EnvironmentFieldType) => {
  activeEnvField.value = type;
  sceneInstance?.setEnvironmentField(type, envSliceHeight.value, envFieldOpacity.value);
};

const handleUpdateSliceHeight = (height: number) => {
  envSliceHeight.value = height;
  sceneInstance?.setEnvironmentField(activeEnvField.value, height, envFieldOpacity.value);
};

const handleUpdateFieldOpacity = (opacity: number) => {
  envFieldOpacity.value = opacity;
  sceneInstance?.setEnvironmentField(activeEnvField.value, envSliceHeight.value, opacity);
};

const handleToggleSensors = () => {
  showSensors.value = !showSensors.value;
  sceneInstance?.setSensorsVisible(showSensors.value);
};

const handleTimeChange = (hourFraction: number) => {
  sceneInstance?.setHistoricalState(hourFraction, environment.value, actuators.value);

  const isDay = hourFraction >= 6 && hourFraction <= 18;
  const noonOffset = Math.abs(hourFraction - 13);
  const tempFactor = Math.max(0, 1 - noonOffset / 8);
  const simulatedTemp = +(20 + tempFactor * 12 + (Math.random() - 0.5) * 0.3).toFixed(1);
  const simulatedLight = isDay
    ? +(Math.max(0, 1 - Math.abs(hourFraction - 12.5) / 6.5) * 42).toFixed(1)
    : 0;
  const simulatedHum = +(85 - tempFactor * 30 + (Math.random() - 0.5) * 1).toFixed(1);
  const simulatedCo2 = Math.round(
    isDay ? 520 + (1 - tempFactor) * 200 : 880 + Math.random() * 40
  );

  environment.value = {
    ...environment.value,
    airTemp: simulatedTemp,
    airHumidity: simulatedHum,
    lightLux: simulatedLight,
    co2: simulatedCo2,
  };
};
</script>

<template>
  <div class="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none text-slate-100">
    <!-- 3D WebGL Canvas Layer -->
    <div
      ref="canvasContainerRef"
      class="absolute inset-0 z-0 w-full h-full cursor-grab active:cursor-grabbing"
    />

    <!-- 3D Spatial Anchored Badges Overlay -->
    <SpatialTagsOverlay
      :tags="spatialTags"
      :visible="showSpatialTags"
      @select-tag="handleSelectTag"
    />

    <!-- Top Header Navbar -->
    <TopNavbar
      :current-preset="currentPreset"
      :display-mode="displayMode"
      :time-string="timeString"
      :show-spatial-tags="showSpatialTags"
      :data-source-mode="dataSourceMode"
      :show-weather-panel="showWeatherPanel"
      :show-field-controller="showFieldController"
      :show-alert-center="showAlertCenter"
      :show-history-bar="showHistoryBar"
      :show-sensors="showSensors"
      :total-alert-count="totalAlertCount"
      :zen-mode="isZenMode"
      @preset-change="handlePresetChange"
      @display-mode-change="handleDisplayModeChange"
      @toggle-guide="showRoamGuide = true"
      @reset-camera="handleResetCamera"
      @toggle-spatial-tags="showSpatialTags = !showSpatialTags"
      @toggle-data-source="handleToggleDataSource"
      @toggle-weather-panel="showWeatherPanel = !showWeatherPanel; if (showWeatherPanel) showAlertCenter = false;"
      @toggle-field-controller="showFieldController = !showFieldController"
      @toggle-alert-center="showAlertCenter = !showAlertCenter; if (showAlertCenter) showWeatherPanel = false;"
      @toggle-history-bar="showHistoryBar = !showHistoryBar; if (showHistoryBar) bottomPanelCollapsed = true;"
      @toggle-sensors="handleToggleSensors"
      @toggle-zen-mode="handleToggleZenMode"
      @open-greenhouse-matrix="openGreenhouseMatrix"
      @open-farming-center="openFarmingCenter"
      @open-pest-modal="showPestMonitoring = true"
      @open-feeding-modal="showFeedingModal = true"
      @open-temp-modal="showTempHistoryModal = true"
      @open-owner-hub-modal="showOwnerHubModal = true"
      @open-logistics-modal="showLogisticsLedger = true"
    />

    <!-- Left Environment Telemetry Panel -->
    <LeftMetricsPanel
      :environment="environment"
      :greenhouses-microclimates="greenhousesMicroclimates"
      :selected-greenhouse-id="selectedGreenhouseId"
      :outdoor-weather="outdoorWeather"
      :sensors="sensors"
      :pond-water="pondWater"
      v-model:collapsed="leftPanelCollapsed"
      @select-greenhouse="handleSelectGreenhouse"
      @select-sensor="handleSelectSensor"
      @focus-pond="handlePresetChange('pond')"
      @open-station="openGreenhouseStation"
      @open-matrix="openGreenhouseMatrix"
      @open-feeding-modal="showFeedingModal = true"
      @open-temp-modal="showTempHistoryModal = true"
      @open-pest-modal="showPestMonitoring = true"
      @open-owner-hub-modal="showOwnerHubModal = true"
      @open-logistics-modal="showLogisticsLedger = true"
    />

    <!-- Right Actuators & Control Center -->
    <RightControlPanel
      :actuators="actuators"
      :auto-mode="autoMode"
      v-model:collapsed="rightPanelCollapsed"
      @toggle-actuator="handleToggleActuator"
      @update-actuator-value="handleUpdateActuatorValue"
      @toggle-auto-mode="autoMode = !autoMode"
      @focus-device="handleFocusDevice"
    />

    <!-- Bottom Historical Trend & Crop Status Panel -->
    <BottomTrendPanel
      :crops="crops"
      :agv="agv"
      :left-collapsed="leftPanelCollapsed"
      :right-collapsed="rightPanelCollapsed"
      v-model:collapsed="bottomPanelCollapsed"
      @focus-crop-zone="handleFocusCropZone"
      @focus-a-g-v="handleFocusAGV"
    />

    <!-- Weather & Nowcasting Panel -->
    <WeatherPanel
      :visible="showWeatherPanel"
      @close="showWeatherPanel = false"
      @apply-weather-3-d="handleApplyWeather3D"
      @apply-radar-frame-3-d="handleApplyRadarFrame3D"
      @focus-greenhouse="handleFocusGreenhouse"
      @mitigate-risk="handleMitigateRisk"
      @toggle-weather-layer="handleToggleWeatherLayer"
    />

    <!-- Unified Alert & Emergency Center -->
    <UnifiedAlertCenter
      :visible="showAlertCenter"
      :alarms="alarms"
      :risk-warnings="riskWarnings"
      @close="showAlertCenter = false"
      @focus-object="handleFocusObject"
      @acknowledge-alarm="handleAcknowledgeAlarm"
      @mitigate-risk="handleMitigateRisk"
    />

    <!-- 3D Environment Field Controller -->
    <EnvironmentFieldController
      :visible="showFieldController"
      :active-field="activeEnvField"
      :slice-height="envSliceHeight"
      :opacity="envFieldOpacity"
      @close="showFieldController = false"
      @update-field="handleUpdateEnvField"
      @update-height="handleUpdateSliceHeight"
      @update-opacity="handleUpdateFieldOpacity"
    />

    <!-- 24-Hour Timeline Playback Bar -->
    <HistoryPlaybackBar
      :visible="showHistoryBar"
      @close="showHistoryBar = false"
      @time-change="handleTimeChange"
    />

    <!-- Interactive Detail Modal upon Click -->
    <DeviceDetailModal
      :info="selectedObject"
      :sensors="sensors"
      :actuators="actuators"
      :crops="crops"
      :agv="agv"
      :pond-water="pondWater"
      @close="() => {
        selectedObject = null;
        sceneInstance?.setSelectedObject(null);
      }"
      @toggle-actuator="handleToggleActuator"
      @update-actuator-value="handleUpdateActuatorValue"
      @focus-camera="() => {
        if (selectedObject && sceneInstance) {
          sceneInstance.focusOnPosition(selectedObject.worldPosition);
        }
      }"
      @open-station="openGreenhouseStation"
      @open-feeding-modal="showFeedingModal = true"
      @open-temp-modal="showTempHistoryModal = true"
      @open-pest-modal="showPestMonitoring = true"
    />

    <!-- Dedicated Per-Greenhouse Station Modal -->
    <GreenhouseStationModal
      :visible="showGreenhouseStation"
      :greenhouse-id="stationGreenhouseId"
      :greenhouses="greenhousesMicroclimates"
      :outdoor-weather="outdoorWeather"
      :farming-records="farmingRecords"
      :planting-cycles="plantingCycles"
      @close="showGreenhouseStation = false"
      @select-greenhouse="handleStationSelectGreenhouse"
      @toggle-actuator="handleStationActuatorToggle"
      @update-actuator-value="handleStationActuatorValue"
      @focus-camera="handleStationFocusCamera"
      @open-matrix="openGreenhouseMatrix"
      @open-farming-center="openFarmingCenter"
      @open-add-record-modal="openAddFarmingRecordModal"
      @open-temp-modal="showTempHistoryModal = true"
      @open-pest-modal="showPestMonitoring = true"
    />

    <!-- 8-Greenhouse Cluster Matrix Modal -->
    <GreenhouseMatrixModal
      :visible="showGreenhouseMatrix"
      :greenhouses="greenhousesMicroclimates"
      :outdoor-weather="outdoorWeather"
      @close="showGreenhouseMatrix = false"
      @inspect-greenhouse="openGreenhouseStation"
      @focus-greenhouse="handleMatrixFocusGreenhouse"
    />

    <!-- Park-wide 8-Greenhouse Unified Farming Operations & Lifecycle Center -->
    <UnifiedFarmingCenterModal
      :visible="showFarmingCenter"
      :greenhouses="greenhousesMicroclimates"
      :records="farmingRecords"
      :planting-cycles="plantingCycles"
      @close="showFarmingCenter = false"
      @open-add-modal="(ghId) => openAddFarmingRecordModal(ghId)"
      @inspect-greenhouse="openGreenhouseStation"
    />

    <!-- Add Farming Record Modal -->
    <FarmingRecordAddModal
      :visible="showAddRecordModal"
      :greenhouses="greenhousesMicroclimates"
      :default-greenhouse-id="targetAddRecordGhId"
      @close="showAddRecordModal = false"
      @add-record="handleAddFarmingRecord"
    />

    <!-- Smart Pest Monitoring & Insect Trap Modal -->
    <PestMonitoringModal
      v-if="showPestMonitoring"
      :records="pestRecords"
      :weekly-trend="pestWeeklyTrend"
      @close="showPestMonitoring = false"
      @add-record="handleAddPestRecord"
    />

    <!-- Fish Pond Feeding Ledger Modal -->
    <PondFeedingModal
      v-if="showFeedingModal"
      :records="feedingRecords"
      @close="showFeedingModal = false"
      @add-record="handleAddFeedingRecord"
    />

    <!-- Regional Temperature & Environmental History Modal -->
    <TemperatureHistoryModal
      v-if="showTempHistoryModal"
      :logs="historyLogs"
      @close="showTempHistoryModal = false"
    />

    <!-- Agricultural Enterprise Owner & Executive Hub Modal -->
    <EnterpriseOwnerHubModal
      v-if="showOwnerHubModal"
      :pest-records="pestRecords"
      :feeding-records="feedingRecords"
      :history-logs="historyLogs"
      :farming-records="farmingRecords"
      :energy-records="energyRecords"
      :inventory-items="inventoryItems"
      :labor-records="laborRecords"
      :sales-records="salesRecords"
      @close="showOwnerHubModal = false"
      @open-pest-modal="showOwnerHubModal = false; showPestMonitoring = true"
      @open-feeding-modal="showOwnerHubModal = false; showFeedingModal = true"
      @open-temp-modal="showOwnerHubModal = false; showTempHistoryModal = true"
      @open-farming-modal="showOwnerHubModal = false; showFarmingCenter = true"
      @open-logistics-modal="showOwnerHubModal = false; showLogisticsLedger = true"
    />

    <!-- Produce Shipment & Agricultural Supplies Logistics Ledger Modal -->
    <LogisticsLedgerModal
      v-if="showLogisticsLedger"
      :visible="showLogisticsLedger"
      @close="showLogisticsLedger = false"
    />

    <!-- 3D Mouse Hover Tooltip -->
    <HoverTooltip :info="hoveredObject" :screen-pos="hoverScreenPos" />

    <!-- Navigation Guide Modal -->
    <RoamGuideOverlay :is-open="showRoamGuide" @close="showRoamGuide = false" />
  </div>
</template>
