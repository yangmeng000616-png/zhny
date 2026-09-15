<script setup lang="ts">
import { ref, computed } from 'vue';
import type {
  EnvironmentSnapshot,
  SensorData,
  PondWaterQuality,
  GreenhouseMicroclimate,
  OutdoorWeatherSnapshot,
} from '../types/digitalTwin';
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Gauge,
  Waves,
  ArrowUpRight,
  Building2,
  Sprout,
  Zap,
  CloudSun,
  Layers,
  ShieldCheck,
  Sliders,
  LayoutGrid,
  FileSpreadsheet,
  Bug,
  Briefcase,
  Truck,
  CheckCircle2,
  CloudRain,
  AlertTriangle,
} from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    environment?: EnvironmentSnapshot;
    greenhousesMicroclimates?: GreenhouseMicroclimate[];
    selectedGreenhouseId?: string;
    outdoorWeather?: OutdoorWeatherSnapshot;
    sensors: SensorData[];
    pondWater: PondWaterQuality;
    collapsed?: boolean;
    isDemoMode?: boolean;
    lastUpdateTime?: string;
    dataSourceMode?: 'local' | 'api';
  }>(),
  {
    collapsed: false,
    selectedGreenhouseId: 'gh_001',
    isDemoMode: false,
  }
);

const emit = defineEmits<{
  (e: 'selectSensor', sensorId: string): void;
  (e: 'focusPond'): void;
  (e: 'selectGreenhouse', ghId: string): void;
  (e: 'update:collapsed', val: boolean): void;
  (e: 'toggleDemoJitter', val?: boolean): void;
  (e: 'openStation', ghId: string): void;
  (e: 'openMatrix'): void;
  (e: 'openFeedingModal'): void;
  (e: 'openTempModal'): void;
  (e: 'openPestModal'): void;
  (e: 'openOwnerHubModal'): void;
  (e: 'openLogisticsModal'): void;
  (e: 'openWeatherModal'): void;
}>();

const localCollapsed = ref(false);
const isCollapsed = computed({
  get: () => props.collapsed ?? localCollapsed.value,
  set: (val: boolean) => {
    localCollapsed.value = val;
    emit('update:collapsed', val);
  },
});

const activeTab = ref<'microclimate' | 'water' | 'sensors'>('microclimate');
const showGhSelector = ref(false);

// If selectedGreenhouseId === 'outdoor', we show the outdoor meteorological station!
const isOutdoorMode = computed(() => props.selectedGreenhouseId === 'outdoor');

// Currently active greenhouse
const currentGh = computed<GreenhouseMicroclimate | undefined>(() => {
  if (!props.greenhousesMicroclimates || props.greenhousesMicroclimates.length === 0) {
    return undefined;
  }
  return (
    props.greenhousesMicroclimates.find((g) => g.id === props.selectedGreenhouseId) ||
    props.greenhousesMicroclimates[0]
  );
});

// Calculate delta between indoor greenhouse and outdoor weather
const tempDelta = computed(() => {
  if (!currentGh.value || !props.outdoorWeather) return 0;
  return +(currentGh.value.airTemp - props.outdoorWeather.temperature).toFixed(1);
});

const humidityDelta = computed(() => {
  if (!currentGh.value || !props.outdoorWeather) return 0;
  return +(currentGh.value.airHumidity - props.outdoorWeather.humidity).toFixed(1);
});

// Sensors filtered for the selected greenhouse or zone
const filteredSensors = computed(() => {
  if (!props.sensors) return [];
  if (isOutdoorMode.value) {
    return props.sensors.filter(
      (s) => s.id.includes('outdoor') || s.zone.includes('室外') || s.zone.includes('气象')
    );
  }
  const gh = currentGh.value;
  if (!gh) return props.sensors;

  // Match sensors by greenhouse id or zone name
  const matched = props.sensors.filter((s) => {
    if (gh.id === 'gh_001') {
      return (
        s.zone.includes('东区') ||
        s.zone.includes('西区') ||
        s.zone.includes('示范') ||
        s.id.includes('temp_001') ||
        s.id.includes('hum_001')
      );
    }
    return s.zone.includes(gh.shortName) || s.id.includes(gh.id);
  });

  return matched.length > 0 ? matched : props.sensors.slice(0, 4);
});

const selectGreenhouse = (ghId: string) => {
  showGhSelector.value = false;
  emit('selectGreenhouse', ghId);
};
</script>

<template>
  <div
    :class="[
      'absolute top-[68px] left-3 bottom-6 z-20 transition-all duration-300 pointer-events-none flex items-start select-none',
      isCollapsed ? '-translate-x-[calc(100%-12px)]' : 'translate-x-0'
    ]"
  >
    <!-- Main Panel Box -->
    <div
      class="pointer-events-auto w-70 sm:w-72 h-full max-h-[calc(100vh-100px)] flex flex-col bg-slate-950/85 hover:bg-slate-950/95 backdrop-blur-2xl rounded-2xl border border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden transition-all duration-300 text-xs"
    >
      <!-- Panel Top Header with Greenhouse/Outdoor Dropdown -->
      <div class="p-2.5 border-b border-white/10 bg-slate-900/60 backdrop-blur-md">
        <div class="flex items-center justify-between gap-1.5 mb-1.5">
          <div class="flex items-center gap-1.5">
            <span class="relative flex h-2 w-2">
              <span :class="['animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', isDemoMode ? 'bg-amber-400' : 'bg-cyan-400']"></span>
              <span :class="['relative inline-flex rounded-full h-2 w-2', isDemoMode ? 'bg-amber-400' : 'bg-cyan-400']"></span>
            </span>
            <span class="text-[11px] font-bold text-slate-100 tracking-wide truncate">
              {{ isOutdoorMode ? '室外微气象基准' : '大棚微生境遥测' }}
            </span>
          </div>

          <div class="flex items-center gap-1">
            <!-- Explicit Demo Switch & Simulation Badge -->
            <button
              id="btn-left-demo-badge"
              @click="emit('toggleDemoJitter')"
              :class="[
                'text-[9px] px-1.5 py-0.5 rounded-md border font-mono font-semibold flex items-center gap-1 transition-all cursor-pointer',
                isDemoMode
                  ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.25)] hover:bg-amber-500/35'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
              ]"
              :title="isDemoMode ? '【模拟数据·微抖动中】点击关闭模拟，回源后端定时轮询实测值' : '【实测数据·3s定时轮询】(上次回源: ' + (lastUpdateTime || '实时') + ') 点击开启动态模拟微抖动'"
            >
              <span v-if="isDemoMode" class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              <span v-else class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_#34d399]"></span>
              <span>{{ isDemoMode ? '模拟数据' : '实测轮询' }}</span>
            </button>

            <span
              v-if="!isOutdoorMode && currentGh"
              class="text-[9px] px-1 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-semibold hidden sm:inline"
            >
              96.8%
            </span>
          </div>
        </div>

        <!-- Target Greenhouse / Outdoor Switcher Dropdown Button -->
        <div class="relative">
          <button
            @click="showGhSelector = !showGhSelector"
            class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-cyan-500/30 shadow-inner transition-colors cursor-pointer"
          >
            <div class="flex items-center gap-2 truncate">
              <Building2 v-if="!isOutdoorMode" class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <CloudSun v-else class="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span class="font-bold text-xs truncate">
                {{ isOutdoorMode ? '🏞️ 园区室外气象观测站 (基准)' : currentGh?.name || '1# Venlo核心玻璃大棚' }}
              </span>
            </div>
            <ChevronDown
              class="w-3.5 h-3.5 text-cyan-400 transition-transform shrink-0 ml-1"
              :class="{ 'rotate-180': showGhSelector }"
            />
          </button>

          <!-- Dropdown List -->
          <div
            v-if="showGhSelector"
            class="absolute top-full left-0 right-0 mt-1.5 max-h-64 overflow-y-auto bg-slate-950/95 backdrop-blur-2xl rounded-xl border border-cyan-500/40 shadow-[0_16px_36px_rgba(0,0,0,0.9)] ring-1 ring-white/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1"
          >
            <div class="text-[9px] font-mono text-cyan-400 font-semibold px-2 py-0.5 flex justify-between">
              <span>选择大棚或室外基准</span>
              <span class="text-slate-500">点击切换数据与视角</span>
            </div>

            <!-- 8 Greenhouses -->
            <button
              v-for="gh in greenhousesMicroclimates"
              :key="gh.id"
              @click="selectGreenhouse(gh.id)"
              :class="[
                'w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer text-xs',
                selectedGreenhouseId === gh.id
                  ? 'bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'text-slate-300 hover:bg-slate-900'
              ]"
            >
              <div class="truncate mr-1">
                <div class="font-semibold">{{ gh.name }}</div>
                <div class="text-[10px] text-slate-400 font-normal">
                  {{ gh.cropName }} · {{ gh.growthStage }}
                </div>
              </div>
              <span class="text-[9px] text-emerald-400 font-mono shrink-0">
                {{ gh.airTemp }}℃ / {{ gh.airHumidity }}%
              </span>
            </button>

            <!-- Outdoor Meteorological Station -->
            <button
              @click="selectGreenhouse('outdoor')"
              :class="[
                'w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer text-xs border-t border-slate-800/80 pt-1.5',
                selectedGreenhouseId === 'outdoor'
                  ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-cyan-400 hover:bg-slate-900'
              ]"
            >
              <div>
                <div class="font-semibold flex items-center gap-1">
                  <CloudSun class="w-3 h-3 text-cyan-400" />
                  <span>园区室外气象观测站</span>
                </div>
                <div class="text-[10px] text-slate-400 font-normal">
                  通量铁塔·宏观天气基准
                </div>
              </div>
              <span class="text-[9px] text-cyan-300 font-mono shrink-0">
                {{ outdoorWeather?.temperature ?? 23.8 }}℃
              </span>
            </button>
          </div>
        </div>

        <!-- Fast Actions: Open Dedicated Single Greenhouse Station & 8-Greenhouse Matrix -->
        <div class="mt-2 grid grid-cols-2 gap-1.5">
          <button
            v-if="!isOutdoorMode"
            id="btn-open-single-station"
            @click="emit('openStation', currentGh?.id || 'gh_001')"
            class="py-1 px-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border border-cyan-500/40 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
            title="打开当前大棚专属独立测控面板"
          >
            <Sliders class="w-3 h-3" />
            <span>单棚专属面板</span>
          </button>
          <button
            id="btn-open-cluster-matrix"
            @click="emit('openMatrix')"
            class="py-1 px-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-[11px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
            :class="[isOutdoorMode ? 'col-span-2' : '']"
            title="以矩阵形式查看全园8座大棚独立监控面板"
          >
            <LayoutGrid class="w-3 h-3 text-cyan-400" />
            <span>8棚独立矩阵</span>
          </button>
        </div>
      </div>

      <!-- Tab Switcher -->
      <div class="flex border-b border-white/10 bg-slate-950/40 text-[11px] font-medium">
        <button
          @click="activeTab = 'microclimate'"
          :class="[
            'flex-1 py-1.5 text-center transition-colors border-b-2',
            activeTab === 'microclimate'
              ? 'text-cyan-300 border-cyan-400 bg-cyan-500/15 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
          ]"
        >
          {{ isOutdoorMode ? '室外气象指标' : '棚内微环境' }}
        </button>
        <button
          @click="activeTab = 'water'"
          :class="[
            'flex-1 py-1.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1',
            activeTab === 'water'
              ? 'text-cyan-300 border-cyan-400 bg-cyan-500/15 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
          ]"
        >
          <Waves class="w-3 h-3 text-cyan-400" />
          河塘水质
        </button>
        <button
          @click="activeTab = 'sensors'"
          :class="[
            'flex-1 py-1.5 text-center transition-colors border-b-2',
            activeTab === 'sensors'
              ? 'text-cyan-300 border-cyan-400 bg-cyan-500/15 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
          ]"
        >
          节点 ({{ filteredSensors.length }})
        </button>
      </div>

      <!-- Content Scrollable Body -->
      <div class="flex-1 overflow-y-auto p-2.5 space-y-2 text-slate-300">
        <!-- TAB 1: Microclimate & Outdoor Contrast -->
        <template v-if="activeTab === 'microclimate'">
          <!-- Case A: Indoor Greenhouse View -->
          <template v-if="!isOutdoorMode && currentGh">
            <!-- 1. Greenhouse Crop & Agronomy Banner -->
            <div class="bg-slate-900/60 p-2 rounded-xl border border-emerald-500/30 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Sprout class="w-4 h-4" />
                </div>
                <div>
                  <div class="font-bold text-xs text-slate-100 flex items-center gap-1">
                    <span>{{ currentGh.cropName }}</span>
                    <span class="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-normal">
                      {{ currentGh.growthStage }}
                    </span>
                  </div>
                  <div class="text-[10px] text-slate-400">
                    {{ currentGh.rootzoneType }}
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-[9px] text-slate-400">二氧化碳</div>
                <div class="text-[10px] font-mono text-cyan-300 font-semibold">
                  {{ currentGh.co2Status }}
                </div>
              </div>
            </div>

            <!-- 2. 微气象短临防御与72H农事窗口决策条 (Weather-to-Action Impact Bar) -->
            <div
              id="btn-left-weather-decision-card"
              @click="emit('openWeatherModal')"
              class="p-2 rounded-xl bg-gradient-to-r from-amber-500/15 via-slate-900/90 to-emerald-500/15 border border-amber-500/40 hover:border-amber-400/80 cursor-pointer transition-all space-y-1 group shadow-xs"
              title="点击打开微气象短临推演(0~120m)与72小时农事黄金作业窗口"
            >
              <div class="flex items-center justify-between text-[10px]">
                <div class="flex items-center gap-1 font-bold text-amber-300">
                  <Zap class="w-3 h-3 text-amber-400 fill-amber-400/40 animate-pulse" />
                  <span>0~2H短临: 30分钟后短时强降水</span>
                </div>
                <span class="text-[9px] text-cyan-400 group-hover:underline flex items-center gap-0.5">
                  决策中枢 <ArrowUpRight class="w-2.5 h-2.5" />
                </span>
              </div>
              <div class="flex items-center justify-between text-[10px] text-slate-300">
                <div class="flex items-center gap-1 text-emerald-300">
                  <CheckCircle2 class="w-3 h-3 text-emerald-400" />
                  <span>72H农事: 明日07:00~10:30黄金喷药</span>
                </div>
                <span class="text-[9px] font-mono text-slate-400">
                  {{ outdoorWeather?.temperature ?? 23.8 }}℃ / {{ outdoorWeather?.humidity ?? 54.2 }}%
                </span>
              </div>
            </div>

            <!-- 3. 室外宏观气象基准对照条 (Outdoor Meteorological Reference) -->
            <div class="px-2.5 py-1.5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between text-[10px]">
              <div class="flex items-center gap-1.5 text-slate-400">
                <CloudSun class="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>室外宏观气象基准:</span>
              </div>
              <div class="flex items-center gap-2 font-mono text-[10px] text-slate-300">
                <span>{{ outdoorWeather?.temperature ?? 23.8 }}℃</span>
                <span class="text-slate-600">|</span>
                <span>{{ outdoorWeather?.humidity ?? 54.2 }}%</span>
                <span class="text-slate-600">|</span>
                <span>{{ outdoorWeather?.windSpeed ?? 3.2 }}m/s {{ outdoorWeather?.windDirection ?? '东南风' }}</span>
              </div>
            </div>

            <!-- 3. Four Core Microclimate Parameters (No duplication) -->
            <div class="grid grid-cols-2 gap-1.5">
              <!-- Air Temp Gauge -->
              <div class="bg-slate-900/60 p-2 rounded-xl border border-white/10">
                <div class="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span class="flex items-center gap-1 text-amber-400 font-semibold">
                    <Thermometer class="w-3 h-3" /> 室内气温
                  </span>
                  <span class="text-[8px] font-mono text-emerald-400">
                    目标 {{ currentGh.tempRange[0] }}~{{ currentGh.tempRange[1] }}℃
                  </span>
                </div>
                <div class="flex items-baseline justify-between">
                  <span class="text-base font-bold font-mono text-slate-100">
                    {{ currentGh.airTemp }}<span class="text-xs font-normal text-slate-400 ml-0.5">℃</span>
                  </span>
                  <span
                    :class="[
                      'text-[9px] font-mono px-1 py-0.2 rounded font-semibold',
                      tempDelta >= 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                    ]"
                  >
                    比室外 {{ tempDelta >= 0 ? `+${tempDelta}` : tempDelta }}℃
                  </span>
                </div>
                <div class="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-500 rounded-full"
                    :style="{ width: `${Math.min(100, (currentGh.airTemp / 40) * 100)}%` }"
                  ></div>
                </div>
                <div class="flex items-center justify-between text-[8.5px] text-slate-400 mt-1 font-mono">
                  <span>露点 18.2℃</span>
                  <span>{{ tempDelta >= 0 ? '温室储热增温' : '遮阳湿帘降温' }}</span>
                </div>
              </div>

              <!-- Air Humidity Gauge -->
              <div class="bg-slate-900/60 p-2 rounded-xl border border-white/10">
                <div class="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span class="flex items-center gap-1 text-sky-400 font-semibold">
                    <Droplets class="w-3 h-3" /> 室内湿度
                  </span>
                  <span class="text-[8px] font-mono text-emerald-400">
                    目标 {{ currentGh.humidityRange[0] }}~{{ currentGh.humidityRange[1] }}%
                  </span>
                </div>
                <div class="flex items-baseline justify-between">
                  <span class="text-base font-bold font-mono text-slate-100">
                    {{ currentGh.airHumidity }}<span class="text-xs font-normal text-slate-400 ml-0.5">%</span>
                  </span>
                  <span
                    :class="[
                      'text-[9px] font-mono px-1 py-0.2 rounded font-semibold',
                      humidityDelta >= 0 ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-700 text-slate-300'
                    ]"
                  >
                    比室外 {{ humidityDelta >= 0 ? `+${humidityDelta}` : humidityDelta }}%
                  </span>
                </div>
                <div class="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                    :style="{ width: `${currentGh.airHumidity}%` }"
                  ></div>
                </div>
                <div class="flex items-center justify-between text-[8.5px] text-slate-400 mt-1 font-mono">
                  <span class="text-emerald-300">VPD 1.12</span>
                  <span>{{ humidityDelta >= 0 ? '植物蒸腾集湿' : '除湿调节中' }}</span>
                </div>
              </div>

              <!-- CO2 Concentration -->
              <div class="bg-slate-900/60 p-2 rounded-xl border border-white/10">
                <div class="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span class="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Activity class="w-3 h-3" /> CO₂ 浓度
                  </span>
                  <span class="text-[8px] font-mono text-emerald-300 bg-emerald-500/20 px-1 rounded">
                    {{ currentGh.co2Status }}
                  </span>
                </div>
                <div class="flex items-baseline justify-between">
                  <span class="text-base font-bold font-mono text-slate-100">
                    {{ currentGh.co2 }}<span class="text-[10px] font-normal text-slate-400 ml-0.5">ppm</span>
                  </span>
                  <span class="text-[9px] font-mono text-slate-400">阀门就绪</span>
                </div>
                <div class="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                  <div
                    class="h-full bg-emerald-400 rounded-full"
                    :style="{ width: `${Math.min(100, (currentGh.co2 / 1200) * 100)}%` }"
                  ></div>
                </div>
              </div>

              <!-- Solar Radiation / Lux -->
              <div class="bg-slate-900/60 p-2 rounded-xl border border-white/10">
                <div class="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span class="flex items-center gap-1 text-amber-400 font-semibold">
                    <Sun class="w-3 h-3" /> 光照强度
                  </span>
                  <span class="text-[8px] font-mono text-slate-400">DLI 18.4</span>
                </div>
                <div class="flex items-baseline justify-between">
                  <span class="text-base font-bold font-mono text-slate-100">
                    {{ currentGh.lightLux }}<span class="text-[10px] font-normal text-slate-400 ml-0.5">klux</span>
                  </span>
                  <span class="text-[9px] font-mono text-amber-300">透光良好</span>
                </div>
                <div class="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                  <div
                    class="h-full bg-amber-400 rounded-full"
                    :style="{ width: `${Math.min(100, (currentGh.lightLux / 60) * 100)}%` }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- 4. 当前环境 + 未来2小时气象影响组合 (Future 2H Weather Impact & Agro Risk Combo) -->
            <div class="bg-gradient-to-br from-rose-950/40 via-slate-900/80 to-amber-950/30 p-2.5 rounded-xl border border-rose-500/40 space-y-2 shadow-xs">
              <div class="flex items-center justify-between text-[11px] font-bold text-rose-300">
                <div class="flex items-center gap-1.5">
                  <CloudRain class="w-3.5 h-3.5 text-rose-400" />
                  <span>未来2H微气象预测与棚区影响</span>
                </div>
                <span class="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-200 border border-rose-500/40 font-mono">
                  🔴 橙色防汛预警
                </span>
              </div>

              <!-- 4 Future Impact Indicators Grid -->
              <div class="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                <div class="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                  <div class="text-[9px] text-slate-400">2H 累积降水</div>
                  <div class="text-rose-400 font-bold text-xs mt-0.5">17.5 <span class="text-[9px] font-normal text-slate-400">mm (短时28mm/h)</span></div>
                  <div class="text-[8px] text-slate-500">预计 30m 后入园冲淋</div>
                </div>

                <div class="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                  <div class="text-[9px] text-slate-400">最大可能阵风</div>
                  <div class="text-amber-300 font-bold text-xs mt-0.5">18.2 <span class="text-[9px] font-normal text-slate-400">m/s (7级)</span></div>
                  <div class="text-[8px] text-slate-500">风压 210 N/m² 风险</div>
                </div>

                <div class="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                  <div class="text-[9px] text-slate-400">棚区预测极值温</div>
                  <div class="text-slate-200 font-bold text-xs mt-0.5">23.5 ~ 28.0 <span class="text-[9px] font-normal text-slate-400">℃</span></div>
                  <div class="text-[8px] text-emerald-400">落雨后降温 3.5℃</div>
                </div>

                <div class="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                  <div class="text-[9px] text-slate-400">预测最高湿度</div>
                  <div class="text-sky-300 font-bold text-xs mt-0.5">92.5 <span class="text-[9px] font-normal text-slate-400">% (饱和高湿)</span></div>
                  <div class="text-[8px] text-amber-400">需警惕灰霉病侵染</div>
                </div>
              </div>

              <!-- Action Advice Banner -->
              <div class="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[9.5px] text-slate-300 space-y-0.5">
                <div class="text-amber-300 font-semibold flex items-center gap-1">
                  <AlertTriangle class="w-3 h-3 text-amber-400 shrink-0" />
                  <span>棚内应急应对建议:</span>
                </div>
                <div class="text-slate-300 leading-tight">
                  1. 立即闭锁脊顶天窗(0%)，严防雨水倒灌番茄花穗；<br/>
                  2. 展开内保温幕防冷凝滴水，外遮阳收拢防撕裂；<br/>
                  3. 全面暂停叶面打药与无人机飞防作业。
                </div>
              </div>

              <!-- Trigger Buttons -->
              <div class="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  @click="emit('openWeatherModal')"
                  class="py-1 px-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <CloudRain class="w-3 h-3" />
                  <span>气象态势中枢</span>
                </button>
                <button
                  @click="$emit('openTempModal')"
                  class="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-[10px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Thermometer class="w-3 h-3 text-amber-400" />
                  <span>温湿度历史</span>
                </button>
              </div>
            </div>
          </template>

          <!-- Case B: Outdoor Meteorological Station View -->
          <template v-else-if="isOutdoorMode">
            <div class="space-y-2">
              <div class="bg-gradient-to-br from-cyan-950/40 to-slate-900/60 p-2.5 rounded-xl border border-cyan-500/40 space-y-1.5">
                <div class="flex items-center justify-between text-xs font-bold text-cyan-300">
                  <div class="flex items-center gap-1">
                    <CloudSun class="w-4 h-4 text-cyan-400" />
                    <span>园区综合气象观测站</span>
                  </div>
                  <span class="text-[9px] font-mono text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    实时在线
                  </span>
                </div>
                <div class="text-[10px] text-slate-400">
                  位置: 18m高空碳通量观测铁塔 / 园区宏观气候边界
                </div>
              </div>

              <!-- Outdoor Key Indicators Grid -->
              <div class="grid grid-cols-2 gap-1.5">
                <div class="bg-slate-900/60 p-2 rounded-xl border border-white/10">
                  <div class="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                    <Thermometer class="w-3 h-3 text-amber-400" /> 室外气温
                  </div>
                  <div class="text-base font-mono font-bold text-slate-100">
                    {{ outdoorWeather?.temperature ?? 23.8 }}℃
                  </div>
                  <div class="text-[9px] text-slate-400 mt-0.5 font-mono">体感 24.5℃</div>
                </div>

                <div class="bg-slate-900/60 p-2 rounded-xl border border-white/10">
                  <div class="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                    <Droplets class="w-3 h-3 text-sky-400" /> 室外相对湿度
                  </div>
                  <div class="text-base font-mono font-bold text-slate-100">
                    {{ outdoorWeather?.humidity ?? 54.2 }}%
                  </div>
                  <div class="text-[9px] text-slate-400 mt-0.5 font-mono">微风干燥</div>
                </div>

                <div class="bg-slate-900/60 p-2 rounded-xl border border-white/10">
                  <div class="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                    <Wind class="w-3 h-3 text-cyan-400" /> 风速与风向
                  </div>
                  <div class="text-base font-mono font-bold text-cyan-300">
                    {{ outdoorWeather?.windSpeed ?? 3.2 }} m/s
                  </div>
                  <div class="text-[9px] text-slate-400 mt-0.5 font-mono">{{ outdoorWeather?.windDirection ?? '东南风' }}</div>
                </div>

                <div class="bg-slate-900/60 p-2 rounded-xl border border-white/10">
                  <div class="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                    <Sun class="w-3 h-3 text-amber-400" /> 太阳总辐射
                  </div>
                  <div class="text-base font-mono font-bold text-amber-300">
                    {{ outdoorWeather?.solarRadiation ?? 820 }} W/㎡
                  </div>
                  <div class="text-[9px] text-slate-400 mt-0.5 font-mono">PAR {{ outdoorWeather?.par ?? 1650 }} μmol</div>
                </div>

                <div class="bg-slate-900/60 p-2 rounded-xl border border-white/10">
                  <div class="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                    <Gauge class="w-3 h-3 text-emerald-400" /> 大气压强
                  </div>
                  <div class="text-base font-mono font-bold text-slate-100">
                    {{ outdoorWeather?.pressure ?? 1012.8 }} hPa
                  </div>
                  <div class="text-[9px] text-emerald-400 mt-0.5 font-mono">气压稳定</div>
                </div>

                <div class="bg-slate-900/60 p-2 rounded-xl border border-white/10">
                  <div class="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                    <Activity class="w-3 h-3 text-purple-400" /> 空气质量 AQI
                  </div>
                  <div class="text-base font-mono font-bold text-emerald-400">
                    {{ outdoorWeather?.airQualityAqi ?? 28 }} 优
                  </div>
                  <div class="text-[9px] text-slate-400 mt-0.5 font-mono">降雨 {{ outdoorWeather?.rainRate ?? 0.0 }} mm/h</div>
                </div>
              </div>

              <!-- Scientific Notice -->
              <div class="bg-slate-900/60 p-2.5 rounded-xl border border-cyan-500/20 text-[10px] text-slate-400 leading-relaxed">
                <div class="font-bold text-cyan-300 mb-1 flex items-center gap-1">
                  <span>💡 农业生境数字孪生说明:</span>
                </div>
                室外气象代表园区外部宏观大气条件。每个大棚根据其种植品种特性，利用双层充气膜、超白玻璃、外遮阳及地源热泵独立维持专属适生微气候。
              </div>

              <!-- Jump to Greenhouse 1 button -->
              <button
                @click="selectGreenhouse('gh_001')"
                class="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-md transition-all cursor-pointer text-xs"
              >
                <Building2 class="w-3.5 h-3.5" />
                <span>返回 1# Venlo核心示范大棚微生境</span>
              </button>
            </div>
          </template>
        </template>

        <!-- TAB 2: Pond Water Tab -->
        <template v-else-if="activeTab === 'water'">
          <div class="space-y-2">
            <!-- Focus Pond Button -->
            <button
              @click="$emit('focusPond')"
              class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400/30 shadow-md transition-all cursor-pointer text-xs"
            >
              <div class="flex items-center gap-1.5 font-semibold">
                <Waves class="w-3.5 h-3.5 text-cyan-200" />
                <span>飞行聚焦河塘生态水网</span>
              </div>
              <ArrowUpRight class="w-3.5 h-3.5 text-cyan-200" />
            </button>

            <!-- Pond Water Level & Capacity -->
            <div class="bg-slate-900/60 p-2.5 rounded-xl border border-cyan-500/25 space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-cyan-300 flex items-center gap-1">
                  <Waves class="w-3.5 h-3.5" /> 河塘水位标高
                </span>
                <span class="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {{ pondWater.qualityGrade }}
                </span>
              </div>

              <div class="flex items-baseline justify-between">
                <div class="text-xl font-bold font-mono text-slate-100">
                  {{ pondWater.waterLevelMeters.toFixed(2) }}
                  <span class="text-xs font-normal text-slate-400 ml-0.5">m</span>
                </div>
                <div class="text-right font-mono text-[10px] text-slate-300">
                  有效蓄水: <span class="text-cyan-300 font-bold">{{ pondWater.storageCapacityM3 }} m³</span>
                </div>
              </div>

              <!-- Progress bar -->
              <div>
                <div class="flex justify-between text-[9px] text-slate-400 mb-0.5 font-mono">
                  <span>库容率: {{ pondWater.capacityPercentage.toFixed(1) }}%</span>
                  <span>上限 3.2m</span>
                </div>
                <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/10">
                  <div
                    class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500 shadow-[0_0_8px_#06b6d4]"
                    :style="{ width: `${Math.min(100, (pondWater.waterLevelMeters / 3.2) * 100)}%` }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Water Quality Parameters Grid -->
            <div class="grid grid-cols-2 gap-1.5">
              <div class="bg-slate-900/60 p-2 rounded-xl border border-white/10">
                <div class="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>溶解氧 (DO)</span>
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"></span>
                </div>
                <div class="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                  {{ pondWater.dissolvedOxygen.toFixed(1) }}
                  <span class="text-[9px] font-normal text-slate-400">mg/L</span>
                </div>
                <div class="text-[9px] text-slate-400 mt-0.5">Ⅰ类优质富氧水</div>
              </div>

              <div class="bg-slate-900/60 p-2 rounded-xl border border-white/10">
                <div class="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>水体温度</span>
                  <Thermometer class="w-3 h-3 text-amber-400" />
                </div>
                <div class="text-sm font-bold font-mono text-slate-100 mt-0.5">
                  {{ pondWater.waterTemp.toFixed(1) }}
                  <span class="text-[9px] font-normal text-slate-400">℃</span>
                </div>
                <div class="text-[9px] text-slate-400 mt-0.5">适温稳定</div>
              </div>

              <div class="bg-slate-900/60 p-2 rounded-xl border border-white/10">
                <div class="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>酸碱度 pH</span>
                  <Gauge class="w-3 h-3 text-cyan-400" />
                </div>
                <div class="text-sm font-bold font-mono text-cyan-300 mt-0.5">
                  {{ pondWater.ph.toFixed(2) }}
                </div>
                <div class="text-[9px] text-emerald-400 mt-0.5">弱碱适农</div>
              </div>

              <div class="bg-slate-900/60 p-2 rounded-xl border border-white/10">
                <div class="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>水质浊度</span>
                  <Activity class="w-3 h-3 text-purple-400" />
                </div>
                <div class="text-sm font-bold font-mono text-purple-300 mt-0.5">
                  {{ pondWater.turbidity.toFixed(1) }}
                  <span class="text-[9px] font-normal text-slate-400">NTU</span>
                </div>
                <div class="text-[9px] text-slate-400 mt-0.5">清澈达标</div>
              </div>
            </div>

            <!-- Intake Pumping Station Status -->
            <div class="bg-slate-900/60 p-2 rounded-xl border border-white/10 text-slate-300">
              <div class="flex items-center justify-between text-[11px] font-semibold">
                <span class="flex items-center gap-1.5 text-slate-100">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
                  生态取水泵站
                </span>
                <span class="text-[9px] text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-medium">
                  自动加压中
                </span>
              </div>
              <div class="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>流量: {{ pondWater.intakeFlowRate }} m³/h</span>
                <span>管网静压: 0.38 MPa</span>
              </div>
            </div>

            <!-- Water Tab: Fish Feeding Ledger & Temperature History -->
            <div class="grid grid-cols-2 gap-1.5 pt-1">
              <button
                @click="$emit('openFeedingModal')"
                class="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-200 font-semibold text-[10px] transition-colors cursor-pointer"
                title="鱼塘每次喂食记录留痕、投前测温溶氧与Excel导出"
              >
                <Waves class="w-3 h-3 text-teal-400" />
                <span>喂食留痕台账</span>
              </button>
              <button
                @click="$emit('openTempModal')"
                class="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 text-[10px] font-semibold transition-colors cursor-pointer"
                title="查看水体与全园区温度历史记录及曲线并导出Excel"
              >
                <Thermometer class="w-3 h-3 text-amber-400" />
                <span>水温时序曲线</span>
              </button>
            </div>
          </div>
        </template>

        <!-- TAB 3: Sensors Tab -->
        <template v-else>
          <div class="space-y-1.5">
            <div class="text-[10px] text-slate-400 pb-0.5 font-medium flex items-center justify-between">
              <span>{{ isOutdoorMode ? '室外气象传感器' : `${currentGh?.name ?? '当前大棚'} 传感网:` }}</span>
              <span class="text-cyan-400 font-mono">点击飞行聚焦</span>
            </div>

            <div
              v-for="sensor in filteredSensors"
              :key="sensor.id"
              @click="$emit('selectSensor', sensor.id)"
              class="bg-slate-900/60 hover:bg-slate-800/80 p-2 rounded-xl border border-white/10 cursor-pointer transition-all hover:border-cyan-400/50 flex items-center justify-between shadow-xs group"
            >
              <div>
                <div class="font-semibold text-slate-100 flex items-center gap-1.5 text-[11px] group-hover:text-cyan-300 transition-colors">
                  <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
                  {{ sensor.name }}
                </div>
                <div class="text-[9px] text-slate-400 mt-0.5 font-mono">{{ sensor.zone }}</div>
              </div>
              <div class="text-right">
                <div class="font-mono font-bold text-cyan-300 text-xs">
                  {{ sensor.value }} {{ sensor.unit }}
                </div>
                <span class="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium font-mono">
                  在线
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Panel Footer -->
      <div class="px-2.5 py-1.5 bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <button
            @click="$emit('openOwnerHubModal')"
            class="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-medium cursor-pointer transition-colors"
            title="打开农业企业负责人经营决策中枢"
          >
            <Briefcase class="w-3 h-3 text-emerald-400" />
            <span>负责人中枢</span>
          </button>
          <button
            @click="$emit('openLogisticsModal')"
            class="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-medium cursor-pointer transition-colors"
            title="打开果蔬出货与农资进货物流台账"
          >
            <Truck class="w-3 h-3 text-cyan-400" />
            <span>进出货</span>
          </button>
        </div>
        <span class="text-emerald-400/80 font-mono text-[9px]">● 8棚+冷链+鱼塘在线</span>
      </div>
    </div>

    <!-- Collapse/Expand Handle Button -->
    <button
      @click="isCollapsed = !isCollapsed"
      class="pointer-events-auto mt-6 -ml-1 bg-slate-950/80 hover:bg-slate-900 text-cyan-400 hover:text-cyan-200 p-1.5 rounded-r-xl border-y border-r border-cyan-500/30 shadow-lg backdrop-blur-xl transition-colors cursor-pointer"
      :title="isCollapsed ? '展开微生境监测面板' : '折叠微生境监测面板'"
    >
      <ChevronRight v-if="isCollapsed" class="w-4 h-4" />
      <ChevronLeft v-else class="w-4 h-4" />
    </button>
  </div>
</template>
