<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  X,
  Building2,
  Wind,
  Sun,
  Droplets,
  Thermometer,
  Activity,
  Gauge,
  Eye,
  Camera,
  Crosshair,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  ShieldCheck,
  Zap,
  Sprout,
  Video,
  Maximize2,
  LayoutGrid,
  Power,
  TrendingUp,
  Cpu,
  FileSpreadsheet,
  FlaskConical,
  Calendar,
  PackageCheck,
  Scissors,
  Plus,
  ChevronRight,
} from 'lucide-vue-next';
import type {
  GreenhouseMicroclimate,
  GreenhouseActuatorControl,
  CameraPreset,
  OutdoorWeatherSnapshot,
  FarmingRecord,
  GreenhousePlantingCycle,
} from '../types/digitalTwin';

const props = defineProps<{
  visible: boolean;
  greenhouseId: string;
  greenhouses: GreenhouseMicroclimate[];
  outdoorWeather?: OutdoorWeatherSnapshot;
  farmingRecords?: FarmingRecord[];
  plantingCycles?: Record<string, GreenhousePlantingCycle>;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'selectGreenhouse', id: string): void;
  (e: 'focusCamera', preset: CameraPreset): void;
  (e: 'openMatrix'): void;
  (e: 'openFarmingCenter'): void;
  (e: 'openAddRecordModal', ghId: string): void;
  (e: 'toggleActuator', ghId: string, actuatorId: string, status: boolean): void;
  (e: 'updateActuatorValue', ghId: string, actuatorId: string, value: number): void;
}>();

// Current active greenhouse
const currentGreenhouse = computed(() => {
  return props.greenhouses.find((g) => g.id === props.greenhouseId) || props.greenhouses[0];
});

// Active tab in the modal: 'telemetry' | 'controls' | 'farming' | 'agronomy' | 'camera'
const activeTab = ref<'telemetry' | 'controls' | 'farming' | 'agronomy' | 'camera'>('telemetry');

// Farming Filter within this greenhouse
const farmingFilterType = ref<'all' | 'irrigation' | 'fertilization' | 'pesticide' | 'harvest'>('all');

// All records for this greenhouse
const ghFarmingRecords = computed(() => {
  if (!props.farmingRecords || !currentGreenhouse.value) return [];
  return props.farmingRecords.filter((r) => r.greenhouseId === currentGreenhouse.value.id);
});

// Filtered records for this greenhouse
const filteredGhRecords = computed(() => {
  if (farmingFilterType.value === 'all') return ghFarmingRecords.value;
  return ghFarmingRecords.value.filter((r) => r.type === farmingFilterType.value);
});

// Current Planting cycle info
const currentPlantingCycle = computed(() => {
  if (!props.plantingCycles || !currentGreenhouse.value) return undefined;
  return props.plantingCycles[currentGreenhouse.value.id];
});

// Cumulative Irrigation in this greenhouse
const ghCumulativeIrrigation = computed(() => {
  return ghFarmingRecords.value
    .filter((r) => r.type === 'irrigation' && r.irrigationDetails)
    .reduce((sum, r) => sum + (r.irrigationDetails?.waterVolumeL || 0), 0);
});

// Cumulative Fertilizer in this greenhouse
const ghCumulativeFertilizer = computed(() => {
  return ghFarmingRecords.value
    .filter((r) => r.type === 'fertilization' && r.fertilizationDetails)
    .reduce((sum, r) => sum + (r.fertilizationDetails?.fertilizerAmountKg || 0), 0);
});

// Cumulative Spray/Biocontrol in this greenhouse
const ghSprayCount = computed(() => {
  return ghFarmingRecords.value.filter((r) => r.type === 'pesticide').length;
});

// Camera view mode: 'rgb' | 'thermal'
const cameraMode = ref<'rgb' | 'thermal'>('rgb');

// Control mode: 'auto' | 'manual'
const controlMode = ref<'auto' | 'manual'>('auto');

// Calculate VPD (Vapor Pressure Deficit)
const vpd = computed(() => {
  if (!currentGreenhouse.value) return '1.02';
  const t = currentGreenhouse.value.airTemp;
  const rh = currentGreenhouse.value.airHumidity;
  const svp = 0.61078 * Math.exp((17.27 * t) / (t + 237.3));
  const avp = svp * (rh / 100);
  return Math.max(0.1, svp - avp).toFixed(2);
});

// Calculate Dew Point
const dewPoint = computed(() => {
  if (!currentGreenhouse.value) return '16.5';
  const t = currentGreenhouse.value.airTemp;
  const rh = currentGreenhouse.value.airHumidity;
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * t) / (b + t)) + Math.log(rh / 100);
  const dp = (b * alpha) / (a - alpha);
  return dp.toFixed(1);
});

// Indoor vs Outdoor differentials
const deltaTemp = computed(() => {
  if (!props.outdoorWeather || !currentGreenhouse.value) return '+4.8';
  const diff = currentGreenhouse.value.airTemp - props.outdoorWeather.temperature;
  return (diff >= 0 ? '+' : '') + diff.toFixed(1);
});

const deltaHumidity = computed(() => {
  if (!props.outdoorWeather || !currentGreenhouse.value) return '+20.4';
  const diff = currentGreenhouse.value.airHumidity - props.outdoorWeather.humidity;
  return (diff >= 0 ? '+' : '') + diff.toFixed(1);
});

// Local actuator toggle handler
const handleToggleActuator = (actuator: GreenhouseActuatorControl) => {
  const newStatus = !actuator.status;
  emit('toggleActuator', currentGreenhouse.value.id, actuator.id, newStatus);
};

// Local actuator slider handler
const handleSliderChange = (actuator: GreenhouseActuatorControl, event: Event) => {
  const val = Number((event.target as HTMLInputElement).value);
  emit('updateActuatorValue', currentGreenhouse.value.id, actuator.id, val);
};

// Switch greenhouse
const handleSwitchGh = (ghId: string) => {
  emit('selectGreenhouse', ghId);
};

// Focus camera in 3D
const handleFocus = () => {
  if (currentGreenhouse.value) {
    emit('focusCamera', currentGreenhouse.value.presetKey);
  }
};
</script>

<template>
  <div
    v-if="visible && currentGreenhouse"
    id="greenhouse-station-overlay"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
    @click.self="emit('close')"
  >
    <div
      id="greenhouse-station-panel"
      class="w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-900/95 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden text-slate-100 font-sans animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Top Bar: Greenhouse identification, switcher pills, and tools -->
      <header
        id="station-modal-header"
        class="flex flex-col gap-3 px-5 py-3.5 bg-slate-900/90 border-b border-slate-800"
      >
        <div class="flex items-center justify-between flex-wrap gap-2">
          <!-- Left: Greenhouse title and badges -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Building2 class="w-5 h-5" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base sm:text-lg font-bold text-white tracking-wide">
                  {{ currentGreenhouse.name }}
                </h2>
                <span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  专属独立测控工作站
                </span>
                <span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  适生指数 {{ currentGreenhouse.agronomy?.healthIndex ?? 98.5 }}% (优)
                </span>
              </div>
              <div class="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span>作物: <strong class="text-slate-200">{{ currentGreenhouse.cropName }}</strong></span>
                <span>•</span>
                <span>结构: {{ currentGreenhouse.structureType }}</span>
                <span>•</span>
                <span>面积: {{ currentGreenhouse.agronomy?.areaM2 ?? 2400 }} ㎡</span>
              </div>
            </div>
          </div>

          <!-- Right: Actions -->
          <div class="flex items-center gap-2">
            <!-- 3D Camera Focus Button -->
            <button
              id="btn-station-3d-focus"
              @click="handleFocus"
              class="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="3D镜头平滑飞入对准该大棚"
            >
              <Crosshair class="w-3.5 h-3.5" />
              <span>3D空间聚焦</span>
            </button>

            <!-- 8 Greenhouse Matrix Deck Switcher -->
            <button
              id="btn-station-open-matrix"
              @click="emit('openMatrix')"
              class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              title="打开8座大棚独立监控面板集群矩阵"
            >
              <LayoutGrid class="w-3.5 h-3.5 text-cyan-400" />
              <span>8棚全景矩阵</span>
            </button>

            <!-- Close Modal -->
            <button
              id="btn-station-close"
              @click="emit('close')"
              class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="关闭面板"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Fast Switcher: 8 Greenhouse Pills for rapid comparison -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <span class="text-[11px] text-slate-400 font-medium shrink-0 mr-1 flex items-center gap-1">
            <Layers class="w-3 h-3 text-cyan-400" />
            快速切棚:
          </span>
          <button
            v-for="gh in greenhouses"
            :key="gh.id"
            :id="`station-pill-${gh.id}`"
            @click="handleSwitchGh(gh.id)"
            class="px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer"
            :class="[
              gh.id === currentGreenhouse.id
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25 border border-cyan-400'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750'
            ]"
          >
            <span>{{ gh.shortName }}</span>
            <span
              class="text-[10px] px-1 py-0.2 rounded"
              :class="gh.id === currentGreenhouse.id ? 'bg-cyan-900/40 text-cyan-950' : 'bg-slate-900/60 text-slate-400'"
            >
              {{ gh.cropName.split(' ')[0] }}
            </span>
          </button>
        </div>
      </header>

      <!-- Main Body Container: Tabs + Subpanels -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Sub-Tabs Navigation -->
        <div class="flex items-center justify-between px-5 bg-slate-950/60 border-b border-slate-800/80">
          <div class="flex items-center gap-1 sm:gap-2">
            <button
              id="tab-btn-telemetry"
              @click="activeTab = 'telemetry'"
              class="px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer"
              :class="activeTab === 'telemetry' ? 'border-cyan-400 text-cyan-300 font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'"
            >
              <Activity class="w-4 h-4" />
              <span>生境遥测与根区</span>
            </button>

            <button
              id="tab-btn-controls"
              @click="activeTab = 'controls'"
              class="px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer"
              :class="activeTab === 'controls' ? 'border-cyan-400 text-cyan-300 font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'"
            >
              <Sliders class="w-4 h-4" />
              <span>专属设备控盘</span>
              <span class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                {{ currentGreenhouse.actuators?.length ?? 8 }}台
              </span>
            </button>

            <button
              id="tab-btn-agronomy"
              @click="activeTab = 'agronomy'"
              class="px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer"
              :class="activeTab === 'agronomy' ? 'border-cyan-400 text-cyan-300 font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'"
            >
              <Sprout class="w-4 h-4" />
              <span>作物长势与农艺</span>
            </button>

            <button
              id="tab-btn-farming"
              @click="activeTab = 'farming'"
              class="px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer"
              :class="activeTab === 'farming' ? 'border-emerald-400 text-emerald-300 font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'"
            >
              <FileSpreadsheet class="w-4 h-4" />
              <span>农事记录与种植周期</span>
              <span class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                {{ ghFarmingRecords.length }}条
              </span>
            </button>

            <button
              id="tab-btn-camera"
              @click="activeTab = 'camera'"
              class="px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer"
              :class="activeTab === 'camera' ? 'border-cyan-400 text-cyan-300 font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'"
            >
              <Video class="w-4 h-4" />
              <span>巡检球机与热力</span>
            </button>
          </div>

          <!-- Mode indicator / Status -->
          <div class="hidden sm:flex items-center gap-3 text-xs">
            <span class="text-slate-400 flex items-center gap-1">
              <Cpu class="w-3.5 h-3.5 text-cyan-400" />
              托管模式:
            </span>
            <div class="inline-flex p-0.5 rounded-lg bg-slate-900 border border-slate-750">
              <button
                @click="controlMode = 'auto'"
                class="px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer"
                :class="controlMode === 'auto' ? 'bg-cyan-500/30 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'"
              >
                AI自动策略
              </button>
              <button
                @click="controlMode = 'manual'"
                class="px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer"
                :class="controlMode === 'manual' ? 'bg-amber-500/30 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'"
              >
                手动强切
              </button>
            </div>
          </div>
        </div>

        <!-- Tab Content Viewport -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <!-- ================= TAB 1: 生境遥测与根区 (Microclimate & Telemetry) ================= -->
          <div v-if="activeTab === 'telemetry'" class="space-y-4">
            <!-- Top Differential Strip: Indoor vs Outdoor -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
              <div class="flex items-center justify-between px-2">
                <div class="text-slate-400 text-xs">温室储热增温</div>
                <div class="font-mono text-sm font-bold text-amber-400">{{ deltaTemp }} ℃</div>
              </div>
              <div class="flex items-center justify-between px-2 border-l border-slate-800">
                <div class="text-slate-400 text-xs">蒸腾增湿相对差</div>
                <div class="font-mono text-sm font-bold text-cyan-400">{{ deltaHumidity }} %</div>
              </div>
              <div class="flex items-center justify-between px-2 border-l border-slate-800">
                <div class="text-slate-400 text-xs">蒸气压亏缺(VPD)</div>
                <div class="font-mono text-sm font-bold text-emerald-400">{{ vpd }} kPa</div>
              </div>
              <div class="flex items-center justify-between px-2 border-l border-slate-800">
                <div class="text-slate-400 text-xs">室内结露点温度</div>
                <div class="font-mono text-sm font-bold text-blue-400">{{ dewPoint }} ℃</div>
              </div>
            </div>

            <!-- 6 Key Environmental Parameter Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <!-- 1. Air Temperature -->
              <div class="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 hover:border-amber-500/40 transition-colors">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-slate-400 flex items-center gap-1.5">
                    <Thermometer class="w-4 h-4 text-amber-400" />
                    室内空气温度
                  </span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono">
                    目标: {{ currentGreenhouse.tempRange[0] }}~{{ currentGreenhouse.tempRange[1] }}℃
                  </span>
                </div>
                <div class="flex items-baseline justify-between">
                  <div class="text-2xl font-bold font-mono text-white">
                    {{ currentGreenhouse.airTemp.toFixed(1) }} <span class="text-sm font-normal text-slate-400">℃</span>
                  </div>
                  <div class="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 class="w-3.5 h-3.5" />
                    <span>处于最适区间</span>
                  </div>
                </div>
                <!-- Mini visual bar -->
                <div class="w-full bg-slate-700/60 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-blue-400 via-amber-400 to-rose-400 h-full rounded-full"
                    :style="{ width: `${Math.min(100, Math.max(10, ((currentGreenhouse.airTemp - 10) / 30) * 100))}%` }"
                  ></div>
                </div>
              </div>

              <!-- 2. Air Humidity -->
              <div class="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 hover:border-cyan-500/40 transition-colors">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-slate-400 flex items-center gap-1.5">
                    <Droplets class="w-4 h-4 text-cyan-400" />
                    室内相对湿度
                  </span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-mono">
                    目标: {{ currentGreenhouse.humidityRange[0] }}~{{ currentGreenhouse.humidityRange[1] }}%
                  </span>
                </div>
                <div class="flex items-baseline justify-between">
                  <div class="text-2xl font-bold font-mono text-white">
                    {{ currentGreenhouse.airHumidity.toFixed(1) }} <span class="text-sm font-normal text-slate-400">%</span>
                  </div>
                  <div class="text-xs text-cyan-400 flex items-center gap-1">
                    <CheckCircle2 class="w-3.5 h-3.5" />
                    <span>温湿平衡</span>
                  </div>
                </div>
                <div class="w-full bg-slate-700/60 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-amber-400 to-cyan-400 h-full rounded-full"
                    :style="{ width: `${Math.min(100, currentGreenhouse.airHumidity)}%` }"
                  ></div>
                </div>
              </div>

              <!-- 3. CO2 Concentration -->
              <div class="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 hover:border-emerald-500/40 transition-colors">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-slate-400 flex items-center gap-1.5">
                    <Gauge class="w-4 h-4 text-emerald-400" />
                    二氧化碳浓度 (CO₂)
                  </span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono">
                    {{ currentGreenhouse.co2Status }}
                  </span>
                </div>
                <div class="flex items-baseline justify-between">
                  <div class="text-2xl font-bold font-mono text-white">
                    {{ currentGreenhouse.co2 }} <span class="text-sm font-normal text-slate-400">ppm</span>
                  </div>
                  <div class="text-xs text-emerald-400">
                    光合饱和度 88%
                  </div>
                </div>
                <div class="w-full bg-slate-700/60 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    class="bg-emerald-400 h-full rounded-full"
                    :style="{ width: `${Math.min(100, (currentGreenhouse.co2 / 1200) * 100)}%` }"
                  ></div>
                </div>
              </div>

              <!-- 4. Light Radiation -->
              <div class="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 hover:border-yellow-500/40 transition-colors">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-slate-400 flex items-center gap-1.5">
                    <Sun class="w-4 h-4 text-yellow-400" />
                    冠层有效光照度
                  </span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-300 font-mono">
                    {{ currentGreenhouse.lightStatus }}
                  </span>
                </div>
                <div class="flex items-baseline justify-between">
                  <div class="text-2xl font-bold font-mono text-white">
                    {{ currentGreenhouse.lightLux.toFixed(1) }} <span class="text-sm font-normal text-slate-400">kLux</span>
                  </div>
                  <div class="text-xs text-yellow-300">
                    PAR: {{ Math.round(currentGreenhouse.lightLux * 21.5) }} µmol
                  </div>
                </div>
                <div class="w-full bg-slate-700/60 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    class="bg-yellow-400 h-full rounded-full"
                    :style="{ width: `${Math.min(100, (currentGreenhouse.lightLux / 70) * 100)}%` }"
                  ></div>
                </div>
              </div>

              <!-- 5. Rootzone / Substrate Telemetry -->
              <div class="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 hover:border-indigo-500/40 transition-colors">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-slate-400 flex items-center gap-1.5">
                    <Sprout class="w-4 h-4 text-indigo-400" />
                    根区耕层/基质遥测
                  </span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300">
                    {{ currentGreenhouse.rootzoneType }}
                  </span>
                </div>
                <div class="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <div class="text-[10px] text-slate-400">含水率</div>
                    <div class="text-base font-bold font-mono text-indigo-300">{{ currentGreenhouse.rootMoisture }}%</div>
                  </div>
                  <div>
                    <div class="text-[10px] text-slate-400">电导率 EC</div>
                    <div class="text-base font-bold font-mono text-emerald-300">{{ currentGreenhouse.rootEc }} mS/cm</div>
                  </div>
                  <div>
                    <div class="text-[10px] text-slate-400">酸碱度 pH</div>
                    <div class="text-base font-bold font-mono text-amber-300">{{ currentGreenhouse.rootPh }}</div>
                  </div>
                </div>
              </div>

              <!-- 6. Special Metric of this Greenhouse -->
              <div class="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 hover:border-cyan-500/40 transition-colors">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-slate-400 flex items-center gap-1.5">
                    <Sparkles class="w-4 h-4 text-cyan-400" />
                    该棚特异性生境指标
                  </span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300">
                    实时监测
                  </span>
                </div>
                <div class="flex items-baseline justify-between mt-1">
                  <div>
                    <div class="text-xs text-slate-300 font-medium">
                      {{ currentGreenhouse.specialMetric?.label ?? '综合生境适生度' }}
                    </div>
                    <div class="text-xl font-bold font-mono text-cyan-300 mt-0.5">
                      {{ currentGreenhouse.specialMetric?.value ?? '98.5%' }}
                    </div>
                  </div>
                </div>
                <div class="text-[11px] text-slate-400 mt-2 bg-slate-900/60 p-1.5 rounded-md border border-slate-800">
                  {{ currentGreenhouse.specialMetric?.hint ?? '各传感节点数据轮询周期 30s' }}
                </div>
              </div>
            </div>
          </div>

          <!-- ================= TAB 2: 专属机电设备控盘 (Actuators Control Panel) ================= -->
          <div v-else-if="activeTab === 'controls'" class="space-y-4">
            <div class="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div class="flex items-center gap-2">
                <Sliders class="w-4 h-4 text-cyan-400" />
                <span class="text-xs text-slate-300">
                  当前处于 <strong class="text-cyan-300">{{ controlMode === 'auto' ? 'AI自适应策略托管' : '手动强切控盘模式' }}</strong>。
                  点击右侧开关或滑动调控即刻下发 PLC / LoRa 工业控制指令。
                </span>
              </div>
              <div class="text-xs font-mono text-slate-400">
                通信延时: <span class="text-emerald-400">18ms (直连网关)</span>
              </div>
            </div>

            <!-- Actuators Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div
                v-for="actuator in currentGreenhouse.actuators"
                :key="actuator.id"
                :id="`actuator-card-${actuator.id}`"
                class="bg-slate-800/70 p-3.5 rounded-xl border transition-all"
                :class="[
                  actuator.status
                    ? 'border-cyan-500/50 bg-slate-800/90 shadow-sm shadow-cyan-950/40'
                    : 'border-slate-750 opacity-80'
                ]"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span
                      class="w-2.5 h-2.5 rounded-full"
                      :class="actuator.status ? 'bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse' : 'bg-slate-600'"
                    ></span>
                    <span class="text-xs font-semibold text-slate-200">{{ actuator.name }}</span>
                  </div>
                  <!-- Switch Toggle Button -->
                  <button
                    :id="`toggle-btn-${actuator.id}`"
                    @click="handleToggleActuator(actuator)"
                    class="px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                    :class="[
                      actuator.status
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                    ]"
                  >
                    <Power class="w-3 h-3" />
                    <span>{{ actuator.status ? '已开启' : '已待机' }}</span>
                  </button>
                </div>

                <!-- Slider for percentage if supported -->
                <div v-if="actuator.value !== undefined" class="mt-3 space-y-1">
                  <div class="flex items-center justify-between text-[11px] text-slate-400">
                    <span>开度 / 输出等级</span>
                    <span class="font-mono text-cyan-300 font-bold">
                      {{ actuator.value }} {{ actuator.unit ?? '%' }}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    :value="actuator.value"
                    :disabled="!actuator.status"
                    @input="handleSliderChange(actuator, $event)"
                    class="w-full accent-cyan-400 cursor-pointer disabled:opacity-40"
                  />
                </div>
                <div v-else class="text-[11px] text-slate-500 mt-2">
                  双态启停逻辑控制 (运行良好)
                </div>
              </div>
            </div>
          </div>

          <!-- ================= TAB 3: 作物长势与农艺档案 (Agronomy Profile) ================= -->
          <div v-else-if="activeTab === 'agronomy'" class="space-y-4">
            <!-- Crop Overview Card -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Left: Crop profile metrics -->
              <div class="md:col-span-2 bg-slate-800/70 p-4 rounded-xl border border-slate-700/70 space-y-3">
                <div class="flex items-center justify-between border-b border-slate-750 pb-2">
                  <div>
                    <h3 class="text-sm font-bold text-white flex items-center gap-2">
                      <Sprout class="w-4 h-4 text-emerald-400" />
                      {{ currentGreenhouse.cropName }}
                    </h3>
                    <div class="text-xs text-slate-400 mt-0.5">
                      品种: {{ currentGreenhouse.agronomy?.variety ?? '优选高产杂交品系' }}
                    </div>
                  </div>
                  <span class="px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 text-xs font-medium border border-emerald-500/30">
                    {{ currentGreenhouse.growthStage }}
                  </span>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div class="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span class="text-slate-400 block text-[11px]">定植时间</span>
                    <span class="text-white font-mono font-bold">{{ currentGreenhouse.agronomy?.transplantDate ?? '2026-02-18' }}</span>
                  </div>
                  <div class="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span class="text-slate-400 block text-[11px]">在田生长天数</span>
                    <span class="text-cyan-300 font-mono font-bold">{{ currentGreenhouse.agronomy?.growthDays ?? 68 }} 天</span>
                  </div>
                  <div class="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span class="text-slate-400 block text-[11px]">预计采收倒计时</span>
                    <span class="text-amber-300 font-mono font-bold">{{ currentGreenhouse.agronomy?.harvestCountdownDays ?? 16 }} 天</span>
                  </div>
                  <div class="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span class="text-slate-400 block text-[11px]">预估平均单产</span>
                    <span class="text-emerald-300 font-mono font-bold">{{ currentGreenhouse.agronomy?.expectedYieldKgPerM2 ?? 32.5 }} kg/㎡</span>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div class="flex items-center justify-between px-3 py-2 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span class="text-slate-400">种植密度:</span>
                    <span class="text-slate-200 font-medium">{{ currentGreenhouse.agronomy?.plantDensity ?? '3.2 株/㎡' }}</span>
                  </div>
                  <div class="flex items-center justify-between px-3 py-2 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span class="text-slate-400">病虫害侵染风险:</span>
                    <span class="text-emerald-400 font-medium flex items-center gap-1">
                      <ShieldCheck class="w-3.5 h-3.5" />
                      {{ currentGreenhouse.agronomy?.diseaseRisk ?? '极低' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Right: AI Agronomic Doctor Diagnosis -->
              <div class="bg-gradient-to-br from-slate-800/90 to-slate-900/90 p-4 rounded-xl border border-cyan-500/30 flex flex-col justify-between">
                <div>
                  <div class="flex items-center gap-2 mb-2 text-cyan-300 font-semibold text-xs">
                    <Sparkles class="w-4 h-4 text-cyan-400" />
                    <span>AI生境适生度综合诊断</span>
                  </div>
                  <p class="text-slate-300 text-xs leading-relaxed">
                    {{ currentGreenhouse.agronomy?.aiAdvice ?? '当前温光水气肥各项参数处于生理最适区间，植株营养生长与生殖生长协调，暂无生理障碍或病害隐患。' }}
                  </p>
                </div>
                <div class="mt-4 pt-3 border-t border-slate-750 flex items-center justify-between text-[11px] text-slate-400">
                  <span>数字孪生农艺模型</span>
                  <span class="text-cyan-400 font-mono">v4.8 实时更新</span>
                </div>
              </div>
            </div>

            <!-- Quick Link to Farming Records -->
            <div class="bg-slate-800/50 p-3 rounded-xl border border-slate-750 flex items-center justify-between">
              <div class="flex items-center gap-2 text-xs">
                <FileSpreadsheet class="w-4 h-4 text-emerald-400" />
                <span class="text-slate-300">本温室已归档 <strong>{{ ghFarmingRecords.length }}</strong> 笔水肥药农事记录</span>
              </div>
              <button
                @click="activeTab = 'farming'"
                class="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>进入本棚农事台账与种植周期</span>
                <ChevronRight class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- ================= TAB 3.5: 农事台账与种植周期 (Farming Records & Lifecycle) ================= -->
          <div v-else-if="activeTab === 'farming'" class="space-y-4">
            <!-- 1. Planting Cycle Banner -->
            <div class="bg-slate-800/80 p-4 rounded-xl border border-emerald-500/30 space-y-3">
              <div class="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <h3 class="text-sm font-bold text-white">
                      {{ currentGreenhouse.name }} - 作物种植全生命周期档案
                    </h3>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                      {{ currentPlantingCycle?.batchCode ?? 'BATCH-2026-T01' }}
                    </span>
                  </div>
                  <div class="text-xs text-slate-400 mt-1 flex items-center gap-3">
                    <span>作物: <strong class="text-slate-200">{{ currentGreenhouse.cropName }}</strong></span>
                    <span>•</span>
                    <span>品种: {{ currentPlantingCycle?.variety ?? currentGreenhouse.agronomy?.variety ?? '良种选育' }}</span>
                    <span>•</span>
                    <span>定植日期: {{ currentPlantingCycle?.transplantDate ?? currentGreenhouse.agronomy?.transplantDate ?? '2026-02-18' }}</span>
                  </div>
                </div>

                <!-- Harvest countdown chip -->
                <div class="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-right">
                  <span class="text-[10px] text-slate-400 block">预计采收倒计时</span>
                  <span class="font-mono text-sm font-bold text-amber-300">
                    {{ currentGreenhouse.agronomy?.harvestCountdownDays ?? 16 }} 天
                  </span>
                </div>
              </div>

              <!-- Phenology Stages Horizontal Gantt -->
              <div v-if="currentPlantingCycle?.stages" class="space-y-1.5 pt-1">
                <div class="flex items-center justify-between text-xs text-slate-400">
                  <span class="flex items-center gap-1.5">
                    <Calendar class="w-3.5 h-3.5 text-emerald-400" />
                    <span>物候发育阶段进程 (在田 {{ currentPlantingCycle.currentCycleDay }} / {{ currentPlantingCycle.totalCycleDays }} 天)</span>
                  </span>
                  <span class="text-emerald-400 font-semibold font-mono">
                    {{ Math.round((currentPlantingCycle.currentCycleDay / currentPlantingCycle.totalCycleDays) * 100) }}% 周期进度
                  </span>
                </div>

                <!-- Visual Step Segments -->
                <div class="grid grid-flow-col auto-cols-fr gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
                  <div
                    v-for="(stg, sIdx) in currentPlantingCycle.stages"
                    :key="sIdx"
                    class="p-2 rounded-lg text-xs transition-all relative overflow-hidden"
                    :class="[
                      stg.status === 'completed' ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200' :
                      stg.status === 'current' ? 'bg-cyan-950/60 border border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/10' :
                      'bg-slate-950/40 border border-slate-800/60 text-slate-500'
                    ]"
                  >
                    <div class="flex items-center justify-between text-[11px] mb-0.5">
                      <span class="font-semibold truncate">{{ stg.stageName }}</span>
                      <span
                        class="text-[9px] px-1 py-0.2 rounded font-mono"
                        :class="stg.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : stg.status === 'current' ? 'bg-cyan-500/20 text-cyan-300 font-bold animate-pulse' : 'text-slate-600'"
                      >
                        {{ stg.status === 'completed' ? '已完成' : stg.status === 'current' ? '当前进行' : '未开始' }}
                      </span>
                    </div>
                    <div class="text-[10px] text-slate-400">
                      积温: {{ stg.accumulatedTempDegreeDays }} ℃·d
                    </div>
                  </div>
                </div>

                <!-- Current Stage Tasks -->
                <div
                  v-if="currentPlantingCycle.stages.find(s => s.status === 'current')"
                  class="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs text-slate-300 flex items-start justify-between gap-3"
                >
                  <div>
                    <span class="text-cyan-300 font-semibold block mb-0.5">本阶段调控核心目标与农艺指令:</span>
                    <span class="text-slate-400 text-[11px] leading-relaxed">
                      {{ currentPlantingCycle.stages.find(s => s.status === 'current')?.stageTarget }}
                    </span>
                  </div>
                  <div class="shrink-0 flex items-center gap-1 text-[11px] text-cyan-300 bg-cyan-900/40 px-2 py-1 rounded-md border border-cyan-700/50">
                    <Sparkles class="w-3.5 h-3.5" />
                    <span>AI物候模型指导</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. Cumulative Farming Metrics Strip -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="bg-slate-800/70 p-3 rounded-xl border border-slate-750 flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Droplets class="w-4 h-4" />
                </div>
                <div>
                  <span class="text-slate-400 text-[11px] block">已记录浇水补墒</span>
                  <span class="font-mono text-sm font-bold text-white">
                    {{ ghCumulativeIrrigation.toLocaleString() }} <span class="text-xs text-cyan-400">L</span>
                  </span>
                </div>
              </div>

              <div class="bg-slate-800/70 p-3 rounded-xl border border-slate-750 flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <FlaskConical class="w-4 h-4" />
                </div>
                <div>
                  <span class="text-slate-400 text-[11px] block">已记录水肥施用</span>
                  <span class="font-mono text-sm font-bold text-white">
                    {{ ghCumulativeFertilizer.toFixed(1) }} <span class="text-xs text-emerald-400">kg</span>
                  </span>
                </div>
              </div>

              <div class="bg-slate-800/70 p-3 rounded-xl border border-slate-750 flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <ShieldCheck class="w-4 h-4" />
                </div>
                <div>
                  <span class="text-slate-400 text-[11px] block">植保打药巡防</span>
                  <span class="font-mono text-sm font-bold text-white">
                    {{ ghSprayCount }} <span class="text-xs text-amber-400">次 (绿色达标)</span>
                  </span>
                </div>
              </div>

              <div class="bg-slate-800/70 p-3 rounded-xl border border-slate-750 flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <PackageCheck class="w-4 h-4" />
                </div>
                <div>
                  <span class="text-slate-400 text-[11px] block">预估本棚总产</span>
                  <span class="font-mono text-sm font-bold text-white">
                    {{ (currentPlantingCycle?.cumulativeStats.expectedTotalYieldKg ?? 32000).toLocaleString() }} <span class="text-xs text-rose-400">kg</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- 3. Toolbar: Filter by Operation Type + Action Buttons -->
            <div class="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800">
              <div class="flex items-center gap-1.5 overflow-x-auto">
                <button
                  @click="farmingFilterType = 'all'"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer"
                  :class="farmingFilterType === 'all' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:text-white'"
                >
                  全部记录 ({{ ghFarmingRecords.length }})
                </button>
                <button
                  @click="farmingFilterType = 'irrigation'"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
                  :class="farmingFilterType === 'irrigation' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:text-white'"
                >
                  <Droplets class="w-3.5 h-3.5" />
                  <span>浇水灌溉</span>
                </button>
                <button
                  @click="farmingFilterType = 'fertilization'"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
                  :class="farmingFilterType === 'fertilization' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:text-white'"
                >
                  <FlaskConical class="w-3.5 h-3.5" />
                  <span>水肥施肥</span>
                </button>
                <button
                  @click="farmingFilterType = 'pesticide'"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
                  :class="farmingFilterType === 'pesticide' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:text-white'"
                >
                  <ShieldCheck class="w-3.5 h-3.5" />
                  <span>植保打药</span>
                </button>
                <button
                  @click="farmingFilterType = 'harvest'"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
                  :class="farmingFilterType === 'harvest' ? 'bg-rose-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:text-white'"
                >
                  <PackageCheck class="w-3.5 h-3.5" />
                  <span>采收出库</span>
                </button>
              </div>

              <!-- Right: Add Record & Full Park Deck -->
              <div class="flex items-center gap-2">
                <button
                  @click="emit('openFarmingCenter')"
                  class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                  title="打开全园8座大棚农事总台账"
                >
                  <FileSpreadsheet class="w-3.5 h-3.5 text-emerald-400" />
                  <span>全园农事总台账</span>
                </button>

                <button
                  @click="emit('openAddRecordModal', currentGreenhouse.id)"
                  class="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>+ 登记本棚农事</span>
                </button>
              </div>
            </div>

            <!-- 4. Records List for this Greenhouse -->
            <div class="space-y-2.5">
              <div v-if="filteredGhRecords.length === 0" class="text-center py-8 text-slate-400 text-xs bg-slate-800/40 rounded-xl border border-slate-750">
                本大棚暂无此类农事记录，可点击上方「+ 登记本棚农事」立即记录。
              </div>

              <div
                v-for="rec in filteredGhRecords"
                :key="rec.id"
                class="bg-slate-800/80 rounded-xl border border-slate-750 hover:border-emerald-500/40 p-3.5 transition-all space-y-2"
              >
                <div class="flex items-start justify-between flex-wrap gap-2">
                  <div class="flex items-start gap-3">
                    <div
                      class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      :class="[
                        rec.type === 'irrigation' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' :
                        rec.type === 'fertilization' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                        rec.type === 'pesticide' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                        rec.type === 'harvest' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                        'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                      ]"
                    >
                      <Droplets v-if="rec.type === 'irrigation'" class="w-4 h-4" />
                      <FlaskConical v-else-if="rec.type === 'fertilization'" class="w-4 h-4" />
                      <ShieldCheck v-else-if="rec.type === 'pesticide'" class="w-4 h-4" />
                      <PackageCheck v-else-if="rec.type === 'harvest'" class="w-4 h-4" />
                      <Scissors v-else class="w-4 h-4" />
                    </div>

                    <div>
                      <h4 class="text-xs sm:text-sm font-bold text-white">
                        {{ rec.title }}
                      </h4>
                      <div class="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                        <span class="font-mono text-slate-300">{{ rec.timestamp }}</span>
                        <span>•</span>
                        <span>经办: {{ rec.operator }}</span>
                      </div>
                    </div>
                  </div>

                  <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 class="w-3 h-3 text-emerald-400" />
                    已归档
                  </span>
                </div>

                <!-- Parameters Sub-strip -->
                <div
                  v-if="rec.type === 'irrigation' && rec.irrigationDetails"
                  class="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/80 p-2 rounded-lg text-xs"
                >
                  <div>
                    <span class="text-slate-400 text-[10px] block">方式:</span>
                    <span class="text-cyan-300 font-semibold">{{ rec.irrigationDetails.method }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 text-[10px] block">灌溉水量:</span>
                    <span class="text-white font-mono font-bold">{{ rec.irrigationDetails.waterVolumeL.toLocaleString() }} L</span>
                  </div>
                  <div>
                    <span class="text-slate-400 text-[10px] block">基质墒情变化:</span>
                    <span class="font-mono text-emerald-400 font-bold">
                      {{ rec.irrigationDetails.soilMoistureBefore }}% → {{ rec.irrigationDetails.soilMoistureAfter }}%
                    </span>
                  </div>
                  <div>
                    <span class="text-slate-400 text-[10px] block">触发模式:</span>
                    <span class="text-slate-300">{{ rec.irrigationDetails.triggerMode }}</span>
                  </div>
                </div>

                <div
                  v-else-if="rec.type === 'fertilization' && rec.fertilizationDetails"
                  class="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/80 p-2 rounded-lg text-xs"
                >
                  <div class="sm:col-span-2">
                    <span class="text-slate-400 text-[10px] block">水肥配方:</span>
                    <span class="text-emerald-300 font-medium truncate block">{{ rec.fertilizationDetails.formula }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 text-[10px] block">用肥量 / 比例:</span>
                    <span class="text-white font-mono font-bold">{{ rec.fertilizationDetails.fertilizerAmountKg }} kg</span>
                  </div>
                  <div>
                    <span class="text-slate-400 text-[10px] block">实测 EC / pH:</span>
                    <span class="font-mono text-cyan-300 font-bold">
                      {{ rec.fertilizationDetails.measuredEc }} / {{ rec.fertilizationDetails.measuredPh }}
                    </span>
                  </div>
                </div>

                <div
                  v-else-if="rec.type === 'pesticide' && rec.pesticideDetails"
                  class="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/80 p-2 rounded-lg text-xs"
                >
                  <div class="sm:col-span-2">
                    <span class="text-slate-400 text-[10px] block">制剂品名:</span>
                    <span class="text-amber-300 font-medium">{{ rec.pesticideDetails.agentName }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 text-[10px] block">靶标 / 方式:</span>
                    <span class="text-slate-200">{{ rec.pesticideDetails.targetPest }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 text-[10px] block">安全间隔期 (PHI):</span>
                    <span class="font-mono text-emerald-400 font-bold">
                      {{ rec.pesticideDetails.safetyIntervalDays === 0 ? '0天 (绿色无害)' : `${rec.pesticideDetails.safetyIntervalDays}天 (解禁准采)` }}
                    </span>
                  </div>
                </div>

                <div
                  v-else-if="rec.type === 'harvest' && rec.harvestDetails"
                  class="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/80 p-2 rounded-lg text-xs"
                >
                  <div>
                    <span class="text-slate-400 text-[10px] block">批次号:</span>
                    <span class="font-mono text-rose-300">{{ rec.harvestDetails.batchNumber }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 text-[10px] block">采收重量:</span>
                    <span class="font-mono text-white font-bold">{{ rec.harvestDetails.harvestWeightKg }} kg</span>
                  </div>
                  <div>
                    <span class="text-slate-400 text-[10px] block">品质品级:</span>
                    <span class="text-emerald-300 font-semibold">{{ rec.harvestDetails.qualityGrade }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 text-[10px] block">糖度实测:</span>
                    <span class="font-mono text-amber-300 font-bold">{{ rec.harvestDetails.sugarBrix ?? 12 }} °Brix</span>
                  </div>
                </div>

                <!-- Notes -->
                <div v-if="rec.notes" class="text-[11px] text-slate-400 leading-relaxed pl-0.5">
                  {{ rec.notes }}
                </div>
              </div>
            </div>
          </div>

          <!-- ================= TAB 4: 巡检球机与热成像 (Camera & Thermal OSD) ================= -->
          <div v-else-if="activeTab === 'camera'" class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span class="text-xs font-semibold text-white">4K高清AI球机巡检画面 (CAM-{{ currentGreenhouse.id.toUpperCase() }})</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">1080P / 30FPS</span>
              </div>
              <!-- View Mode Toggle: RGB vs Thermal -->
              <div class="inline-flex p-0.5 rounded-lg bg-slate-900 border border-slate-750">
                <button
                  @click="cameraMode = 'rgb'"
                  class="px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer"
                  :class="cameraMode === 'rgb' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'"
                >
                  高清可见光
                </button>
                <button
                  @click="cameraMode = 'thermal'"
                  class="px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer"
                  :class="cameraMode === 'thermal' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-white'"
                >
                  红外热成像 (Thermal IR)
                </button>
              </div>
            </div>

            <!-- Simulated Video Box -->
            <div
              class="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center select-none"
            >
              <!-- Thermal Mode Background -->
              <div
                v-if="cameraMode === 'thermal'"
                class="absolute inset-0 bg-gradient-to-tr from-indigo-900 via-amber-700 to-rose-600 opacity-70 mix-blend-screen animate-pulse"
                style="animation-duration: 4s;"
              ></div>

              <!-- Camera grid lines -->
              <div class="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-15 border border-cyan-400">
                <div v-for="n in 9" :key="n" class="border border-cyan-400"></div>
              </div>

              <!-- Center Object Tracking Bounding Box -->
              <div class="absolute border-2 border-emerald-400/80 rounded-sm p-1 text-[10px] text-emerald-300 font-mono pointer-events-none" style="width: 140px; height: 110px; top: 32%; left: 38%;">
                <div class="absolute -top-5 left-0 bg-emerald-950/80 px-1 py-0.5 rounded border border-emerald-400/60">
                  {{ cameraMode === 'thermal' ? '冠层温 25.8℃' : '果穗着色率 92%' }}
                </div>
              </div>

              <!-- Another tracker box -->
              <div class="absolute border border-cyan-400/80 rounded-sm p-1 text-[10px] text-cyan-300 font-mono pointer-events-none" style="width: 110px; height: 90px; top: 48%; left: 62%;">
                <div class="absolute -top-5 left-0 bg-cyan-950/80 px-1 py-0.5 rounded border border-cyan-400/60">
                  {{ cameraMode === 'thermal' ? '根区基质 22.4℃' : '叶面积指数 4.5' }}
                </div>
              </div>

              <!-- Camera OSD Overlay -->
              <div class="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded text-[11px] font-mono text-cyan-300 border border-slate-750 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>REC 2026-03-14 14:32:08</span>
                <span>CH: {{ currentGreenhouse.shortName }}</span>
              </div>

              <div class="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded text-[11px] font-mono text-slate-300 border border-slate-750 flex items-center gap-3">
                <span>BITRATE: 4.2 Mbps</span>
                <span>NET DELAY: 18ms</span>
                <span>CODEC: H.265+</span>
              </div>

              <!-- Thermal Legend Bar if Thermal Mode -->
              <div v-if="cameraMode === 'thermal'" class="absolute right-3 top-3 bottom-3 w-5 flex flex-col items-center justify-between py-1 bg-slate-900/80 border border-slate-750 rounded text-[9px] font-mono text-slate-200">
                <span>32℃</span>
                <div class="w-2 h-36 rounded-sm bg-gradient-to-b from-rose-500 via-amber-400 to-indigo-500"></div>
                <span>18℃</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
