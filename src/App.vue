<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
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
} from './types/digitalTwin';
import {
  initialEnvironment,
  initialSensors,
  initialActuators,
  initialCropZones,
  initialAGV,
  initialPondWaterData,
} from './data/mockData';

import TopNavbar from './components/TopNavbar.vue';
import LeftMetricsPanel from './components/LeftMetricsPanel.vue';
import RightControlPanel from './components/RightControlPanel.vue';
import BottomTrendPanel from './components/BottomTrendPanel.vue';
import DeviceDetailModal from './components/DeviceDetailModal.vue';
import RoamGuideOverlay from './components/RoamGuideOverlay.vue';
import HoverTooltip from './components/HoverTooltip.vue';

const canvasContainerRef = ref<HTMLDivElement | null>(null);
let sceneInstance: GreenhouseScene | null = null;

// Digital Twin Dynamic States
const environment = ref<EnvironmentSnapshot>(initialEnvironment);
const sensors = ref<SensorData[]>(initialSensors);
const actuators = ref<ActuatorDevice[]>(initialActuators);
const crops = ref<CropZone[]>(initialCropZones);
const agv = ref<AGVRobot>(initialAGV);
const pondWater = ref<PondWaterQuality>(initialPondWaterData);

// View & UI Controls
const currentPreset = ref<CameraPreset>('aerial');
const displayMode = ref<ViewDisplayMode>('standard');
const autoMode = ref<boolean>(true);
const showRoamGuide = ref<boolean>(false);

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
  if (canvasContainerRef.value) {
    sceneInstance = new GreenhouseScene(canvasContainerRef.value, {
      onHover: (info, screenPos) => {
        hoveredObject.value = info;
        hoverScreenPos.value = screenPos || null;
      },
      onSelect: (info) => {
        selectedObject.value = info;
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

// 5. Camera & Display Presets
const handlePresetChange = (preset: CameraPreset) => {
  currentPreset.value = preset;
  sceneInstance?.setCameraPreset(preset);
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
</script>

<template>
  <div class="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none text-slate-100">
    <!-- 3D WebGL Canvas Layer -->
    <div
      ref="canvasContainerRef"
      class="absolute inset-0 z-0 w-full h-full cursor-grab active:cursor-grabbing"
    />

    <!-- Top Header Navbar -->
    <TopNavbar
      :current-preset="currentPreset"
      :display-mode="displayMode"
      :time-string="timeString"
      @preset-change="handlePresetChange"
      @display-mode-change="handleDisplayModeChange"
      @toggle-guide="showRoamGuide = true"
      @reset-camera="handleResetCamera"
    />

    <!-- Left Environment Telemetry Panel -->
    <LeftMetricsPanel
      :environment="environment"
      :sensors="sensors"
      :pond-water="pondWater"
      @select-sensor="handleSelectSensor"
      @focus-pond="handlePresetChange('pond')"
    />

    <!-- Right Actuators & Control Center -->
    <RightControlPanel
      :actuators="actuators"
      :auto-mode="autoMode"
      @toggle-actuator="handleToggleActuator"
      @update-actuator-value="handleUpdateActuatorValue"
      @toggle-auto-mode="autoMode = !autoMode"
      @focus-device="handleFocusDevice"
    />

    <!-- Bottom Historical Trend & Crop Status Panel -->
    <BottomTrendPanel
      :crops="crops"
      :agv="agv"
      @focus-crop-zone="handleFocusCropZone"
      @focus-a-g-v="handleFocusAGV"
    />

    <!-- Interactive Detail Modal upon Click -->
    <DeviceDetailModal
      :info="selectedObject"
      :sensors="sensors"
      :actuators="actuators"
      :crops="crops"
      :agv="agv"
      :pond-water="pondWater"
      @close="selectedObject = null"
      @toggle-actuator="handleToggleActuator"
      @update-actuator-value="handleUpdateActuatorValue"
      @focus-camera="() => {
        if (selectedObject && sceneInstance) {
          sceneInstance.focusOnPosition(selectedObject.worldPosition);
        }
      }"
    />

    <!-- 3D Mouse Hover Tooltip -->
    <HoverTooltip :info="hoveredObject" :screen-pos="hoverScreenPos" />

    <!-- Navigation Guide Modal -->
    <RoamGuideOverlay :is-open="showRoamGuide" @close="showRoamGuide = false" />
  </div>
</template>
