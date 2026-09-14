<script setup lang="ts">
import { ref, computed } from 'vue';
import type { EnvironmentSnapshot, SensorData, PondWaterQuality } from '../types/digitalTwin';
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Activity,
  ChevronLeft,
  ChevronRight,
  Radio,
  Gauge,
  Waves,
  ArrowUpRight,
} from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    environment: EnvironmentSnapshot;
    sensors: SensorData[];
    pondWater: PondWaterQuality;
    collapsed?: boolean;
  }>(),
  {
    collapsed: false,
  }
);

const emit = defineEmits<{
  (e: 'selectSensor', sensorId: string): void;
  (e: 'focusPond'): void;
  (e: 'update:collapsed', val: boolean): void;
}>();

const localCollapsed = ref(false);
const isCollapsed = computed({
  get: () => props.collapsed ?? localCollapsed.value,
  set: (val: boolean) => {
    localCollapsed.value = val;
    emit('update:collapsed', val);
  },
});

const activeTab = ref<'realtime' | 'water' | 'sensors'>('realtime');
</script>

<template>
  <div
    :class="[
      'absolute top-20 left-3 bottom-12 z-20 transition-all duration-300 pointer-events-none flex items-start',
      isCollapsed ? '-translate-x-[calc(100%-12px)]' : 'translate-x-0'
    ]"
  >
    <!-- Main Panel Box -->
    <div class="pointer-events-auto w-48 sm:w-52 h-full max-h-[calc(100vh-140px)] flex flex-col bg-slate-950/40 hover:bg-slate-950/55 backdrop-blur-2xl rounded-2xl border border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10 overflow-hidden transition-all duration-300">
      <!-- Panel Header -->
      <div class="px-2.5 py-2 border-b border-white/10 bg-slate-900/30 backdrop-blur-md flex items-center justify-between">
        <div class="flex items-center gap-1.5 min-w-0">
          <div class="w-2 h-2 rounded-full bg-cyan-400 animate-ping shadow-[0_0_8px_#22d3ee] shrink-0"></div>
          <h2 class="text-[11px] font-bold text-slate-100 tracking-wide truncate">
            微生境实时监测
          </h2>
        </div>
        <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-semibold shrink-0">
          指数 96
        </span>
      </div>

      <!-- Tab switch -->
      <div class="flex border-b border-white/10 bg-slate-950/25 backdrop-blur-md text-[10px] font-medium">
        <button
          @click="activeTab = 'realtime'"
          :class="[
            'flex-1 py-1.5 text-center transition-colors border-b-2',
            activeTab === 'realtime'
              ? 'text-cyan-300 border-cyan-400 bg-cyan-500/15 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
          ]"
        >
          空间环境
        </button>
        <button
          @click="activeTab = 'water'"
          :class="[
            'flex-1 py-1.5 text-center transition-colors border-b-2 flex items-center justify-center gap-0.5',
            activeTab === 'water'
              ? 'text-cyan-300 border-cyan-400 bg-cyan-500/15 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
          ]"
        >
          <Waves class="w-2.5 h-2.5 text-cyan-400" />
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
          节点 ({{ sensors.length }})
        </button>
      </div>

      <!-- Content Scrollable Area -->
      <div class="flex-1 overflow-y-auto p-2 space-y-1.5 text-xs text-slate-300">
        <!-- Tab 1: Realtime Environment -->
        <template v-if="activeTab === 'realtime'">
          <!-- Air Temperature -->
          <div class="bg-slate-950/35 hover:bg-slate-900/45 backdrop-blur-md p-2 rounded-xl border border-white/10 hover:border-cyan-400/40 shadow-xs transition-colors">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-1 text-amber-400 font-semibold text-[11px]">
                <Thermometer class="w-3 h-3 text-amber-400" />
                <span>空气温度</span>
              </div>
              <span class="text-[9px] font-mono text-emerald-300 bg-emerald-500/20 px-1 py-0.2 rounded border border-emerald-500/30 font-medium">
                22~30℃
              </span>
            </div>
            <div class="flex items-baseline justify-between">
              <div class="text-lg font-bold font-mono text-slate-100 tracking-tight">
                {{ environment.airTemp.toFixed(1) }}
                <span class="text-xs font-normal text-slate-400 ml-0.5">℃</span>
              </div>
              <div class="text-[9px] text-slate-400 font-mono">
                均值 28.2℃
              </div>
            </div>
            <!-- Visual bar -->
            <div class="w-full bg-slate-800/60 h-1.5 rounded-full mt-1.5 overflow-hidden border border-white/10">
              <div
                class="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 h-full rounded-full transition-all duration-500"
                :style="{ width: `${Math.min(100, Math.max(0, (environment.airTemp / 40) * 100))}%` }"
              ></div>
            </div>
          </div>

          <!-- Air Humidity -->
          <div class="bg-slate-950/35 hover:bg-slate-900/45 backdrop-blur-md p-2 rounded-xl border border-white/10 hover:border-cyan-400/40 shadow-xs transition-colors">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-1 text-sky-400 font-semibold text-[11px]">
                <Droplets class="w-3 h-3 text-sky-400" />
                <span>空气湿度</span>
              </div>
              <span class="text-[9px] font-mono text-emerald-300 bg-emerald-500/20 px-1 py-0.2 rounded border border-emerald-500/30 font-medium">
                60~80%
              </span>
            </div>
            <div class="flex items-baseline justify-between">
              <div class="text-lg font-bold font-mono text-slate-100 tracking-tight">
                {{ environment.airHumidity.toFixed(1) }}
                <span class="text-xs font-normal text-slate-400 ml-0.5">%</span>
              </div>
              <div class="text-[9px] text-slate-400 font-mono">露点 22.8℃</div>
            </div>
            <div class="w-full bg-slate-800/60 h-1.5 rounded-full mt-1.5 overflow-hidden border border-white/10">
              <div
                class="bg-sky-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#38bdf8]"
                :style="{ width: `${environment.airHumidity}%` }"
              ></div>
            </div>
          </div>

          <!-- CO2 Concentration -->
          <div class="bg-slate-950/35 hover:bg-slate-900/45 backdrop-blur-md p-2 rounded-xl border border-white/10 hover:border-cyan-400/40 shadow-xs transition-colors">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                <Wind class="w-3 h-3 text-emerald-400" />
                <span>CO₂ 浓度</span>
              </div>
              <span class="text-[9px] font-mono text-emerald-300 bg-emerald-500/20 px-1 py-0.2 rounded border border-emerald-500/30 font-medium">
                充足
              </span>
            </div>
            <div class="flex items-baseline justify-between">
              <div class="text-lg font-bold font-mono text-slate-100 tracking-tight">
                {{ Math.round(environment.co2) }}
                <span class="text-xs font-normal text-slate-400 ml-0.5">ppm</span>
              </div>
              <div class="text-[9px] text-slate-400 font-mono">富碳补气待机</div>
            </div>
            <div class="w-full bg-slate-800/60 h-1.5 rounded-full mt-1.5 overflow-hidden border border-white/10">
              <div
                class="bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#34d399]"
                :style="{ width: `${Math.min(100, (environment.co2 / 1200) * 100)}%` }"
              ></div>
            </div>
          </div>

          <!-- Light Intensity PAR -->
          <div class="bg-slate-950/35 hover:bg-slate-900/45 backdrop-blur-md p-2 rounded-xl border border-white/10 hover:border-cyan-400/40 shadow-xs transition-colors">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-1 text-amber-400 font-semibold text-[11px]">
                <Sun class="w-3 h-3 text-amber-400" />
                <span>光照强度</span>
              </div>
              <span class="text-[9px] font-mono text-amber-300 bg-amber-500/20 px-1 py-0.2 rounded border border-amber-500/30 font-medium">
                自然光 88%
              </span>
            </div>
            <div class="flex items-baseline justify-between">
              <div class="text-lg font-bold font-mono text-slate-100 tracking-tight">
                {{ environment.lightLux.toFixed(1) }}
                <span class="text-xs font-normal text-slate-400 ml-0.5">klux</span>
              </div>
              <div class="text-[9px] text-slate-400 font-mono">DLI 18.6 mol</div>
            </div>
            <div class="w-full bg-slate-800/60 h-1.5 rounded-full mt-1.5 overflow-hidden border border-white/10">
              <div
                class="bg-amber-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#fbbf24]"
                :style="{ width: `${Math.min(100, (environment.lightLux / 60) * 100)}%` }"
              ></div>
            </div>
          </div>

          <!-- Soil / Rootzone Metrics 2x2 Grid -->
          <div class="grid grid-cols-2 gap-1.5 pt-0.5">
            <div class="bg-slate-950/30 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xs">
              <div class="text-[9px] text-slate-400 flex items-center gap-0.5 font-medium">
                <Droplets class="w-2.5 h-2.5 text-cyan-400" /> 土壤湿度
              </div>
              <div class="text-xs font-bold font-mono text-slate-100 mt-0.5">
                {{ environment.soilMoisture.toFixed(1) }}%
              </div>
              <div class="text-[8px] text-emerald-400 font-mono">水肥充盈</div>
            </div>

            <div class="bg-slate-950/30 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xs">
              <div class="text-[9px] text-slate-400 flex items-center gap-0.5 font-medium">
                <Activity class="w-2.5 h-2.5 text-purple-400" /> 基质 EC
              </div>
              <div class="text-xs font-bold font-mono text-slate-100 mt-0.5">
                {{ environment.soilEc.toFixed(2) }}
                <span class="text-[8px] font-normal text-slate-400">mS</span>
              </div>
              <div class="text-[8px] text-emerald-400 font-mono">无盐渍化</div>
            </div>

            <div class="bg-slate-950/30 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xs">
              <div class="text-[9px] text-slate-400 flex items-center gap-0.5 font-medium">
                <Gauge class="w-2.5 h-2.5 text-emerald-400" /> 酸碱 pH
              </div>
              <div class="text-xs font-bold font-mono text-slate-100 mt-0.5">
                {{ environment.soilPh.toFixed(1) }}
              </div>
              <div class="text-[8px] text-emerald-400 font-mono">微酸最优</div>
            </div>

            <div class="bg-slate-950/30 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xs">
              <div class="text-[9px] text-slate-400 flex items-center gap-0.5 font-medium">
                <Radio class="w-2.5 h-2.5 text-cyan-400" /> 储水液位
              </div>
              <div class="text-xs font-bold font-mono text-slate-100 mt-0.5">
                {{ environment.waterLevel.toFixed(1) }}%
              </div>
              <div class="text-[8px] text-cyan-300 font-mono">8.45m³存量</div>
            </div>
          </div>
        </template>

        <!-- Tab 2: Pond Water Tab -->
        <template v-else-if="activeTab === 'water'">
          <div class="space-y-1.5">
            <!-- Fly to Pond Button -->
            <button
              @click="$emit('focusPond')"
              class="w-full flex items-center justify-between px-2 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600/80 to-blue-600/80 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400/30 backdrop-blur-md transition-all shadow-md shadow-cyan-600/20 group cursor-pointer text-xs"
            >
              <div class="flex items-center gap-1">
                <Waves class="w-3 h-3 text-cyan-200 group-hover:animate-bounce" />
                <span class="font-semibold text-[10px]">聚焦河塘浮标</span>
              </div>
              <ArrowUpRight class="w-3 h-3 text-cyan-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            <!-- Water Level Card -->
            <div class="bg-slate-950/35 backdrop-blur-md p-2 rounded-xl border border-cyan-500/25 shadow-xs">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-1 text-cyan-300 font-semibold text-[11px]">
                  <Waves class="w-3 h-3 text-cyan-400" />
                  <span>河塘水位标高</span>
                </div>
                <span class="text-[8px] px-1 py-0.2 rounded font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {{ pondWater.qualityGrade }}
                </span>
              </div>

              <div class="flex items-baseline justify-between">
                <div class="text-lg font-bold font-mono text-slate-100 tracking-tight">
                  {{ pondWater.waterLevelMeters.toFixed(2) }}
                  <span class="text-xs font-normal text-slate-400 ml-0.5">m</span>
                </div>
                <div class="text-right font-mono text-[9px] text-slate-300">
                  库容: <span class="text-cyan-300 font-bold">{{ pondWater.storageCapacityM3 }} m³</span>
                </div>
              </div>

              <!-- Progress bar -->
              <div class="mt-1.5">
                <div class="flex justify-between text-[8px] text-slate-400 mb-0.5">
                  <span>库容率: {{ pondWater.capacityPercentage.toFixed(1) }}%</span>
                  <span>上限 3.2m</span>
                </div>
                <div class="w-full h-1.5 bg-slate-800/60 rounded-full overflow-hidden border border-white/10">
                  <div
                    class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500 shadow-[0_0_8px_#06b6d4]"
                    :style="{ width: `${Math.min(100, (pondWater.waterLevelMeters / 3.2) * 100)}%` }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Water Quality Indices Grid -->
            <div class="grid grid-cols-2 gap-1.5">
              <div class="bg-slate-950/30 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xs">
                <div class="text-[9px] text-slate-400 flex items-center justify-between font-medium">
                  <span>溶解氧(DO)</span>
                  <span class="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"></span>
                </div>
                <div class="text-xs font-bold font-mono text-emerald-400 mt-0.5">
                  {{ pondWater.dissolvedOxygen.toFixed(1) }}
                  <span class="text-[8px] font-normal text-slate-400">mg/L</span>
                </div>
                <div class="text-[8px] text-slate-400 mt-0.5">Ⅰ类优质水</div>
              </div>

              <div class="bg-slate-950/30 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xs">
                <div class="text-[9px] text-slate-400 flex items-center justify-between font-medium">
                  <span>水体温度</span>
                  <Thermometer class="w-2.5 h-2.5 text-amber-400" />
                </div>
                <div class="text-xs font-bold font-mono text-slate-100 mt-0.5">
                  {{ pondWater.waterTemp.toFixed(1) }}
                  <span class="text-[8px] font-normal text-slate-400">℃</span>
                </div>
                <div class="text-[8px] text-slate-400 mt-0.5">适温稳定</div>
              </div>

              <div class="bg-slate-950/30 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xs">
                <div class="text-[9px] text-slate-400 flex items-center justify-between font-medium">
                  <span>酸碱度 pH</span>
                  <Gauge class="w-2.5 h-2.5 text-cyan-400" />
                </div>
                <div class="text-xs font-bold font-mono text-cyan-300 mt-0.5">
                  {{ pondWater.ph.toFixed(2) }}
                </div>
                <div class="text-[8px] text-emerald-400 font-medium mt-0.5">弱碱适农</div>
              </div>

              <div class="bg-slate-950/30 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xs">
                <div class="text-[9px] text-slate-400 flex items-center justify-between font-medium">
                  <span>水质浊度</span>
                  <Activity class="w-2.5 h-2.5 text-purple-400" />
                </div>
                <div class="text-xs font-bold font-mono text-purple-300 mt-0.5">
                  {{ pondWater.turbidity.toFixed(1) }}
                  <span class="text-[8px] font-normal text-slate-400">NTU</span>
                </div>
                <div class="text-[8px] text-slate-400 mt-0.5">清澈达标</div>
              </div>

              <div class="bg-slate-950/30 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xs">
                <div class="text-[9px] text-slate-400 font-medium">氨氮 (NH3)</div>
                <div class="text-xs font-bold font-mono text-slate-100 mt-0.5">
                  {{ pondWater.ammoniaNitrogen.toFixed(2) }}
                  <span class="text-[8px] font-normal text-slate-400">mg/L</span>
                </div>
                <div class="text-[8px] text-emerald-400 font-medium mt-0.5">无富营养化</div>
              </div>

              <div class="bg-slate-950/30 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xs">
                <div class="text-[9px] text-slate-400 font-medium">电导率 EC</div>
                <div class="text-xs font-bold font-mono text-slate-100 mt-0.5">
                  {{ pondWater.conductivityEc.toFixed(0) }}
                  <span class="text-[8px] font-normal text-slate-400">μS</span>
                </div>
                <div class="text-[8px] text-slate-400 mt-0.5">天然净水</div>
              </div>
            </div>

            <!-- Intake Pumping Station Status -->
            <div class="bg-slate-950/30 backdrop-blur-md p-1.5 rounded-xl border border-white/10 text-slate-300 shadow-xs">
              <div class="flex items-center justify-between text-[10px] font-semibold">
                <span class="flex items-center gap-1 text-slate-100">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
                  生态取水泵站
                </span>
                <span class="text-[8px] text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-1 py-0.2 rounded font-mono font-medium">
                  运行中
                </span>
              </div>
              <div class="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                <span>流量: {{ pondWater.intakeFlowRate }} m³/h</span>
                <span>静压: 0.38 MPa</span>
              </div>
            </div>
          </div>
        </template>

        <!-- Tab 3: Sensors Tab -->
        <template v-else>
          <div class="space-y-1.5">
            <div class="text-[9px] text-slate-400 pb-0.5 font-medium">
              点击传感节点三维飞行聚焦：
            </div>
            <div
              v-for="sensor in sensors"
              :key="sensor.id"
              @click="$emit('selectSensor', sensor.id)"
              class="bg-slate-950/30 hover:bg-slate-900/40 backdrop-blur-md p-1.5 rounded-xl border border-white/10 cursor-pointer transition-all hover:border-cyan-400/40 flex items-center justify-between shadow-xs"
            >
              <div>
                <div class="font-semibold text-slate-100 flex items-center gap-1 text-[10px]">
                  <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
                  {{ sensor.name }}
                </div>
                <div class="text-[8px] text-slate-400 mt-0.5">{{ sensor.zone }}</div>
              </div>
              <div class="text-right">
                <div class="font-mono font-bold text-cyan-300 text-[11px]">
                  {{ sensor.value }} {{ sensor.unit }}
                </div>
                <span class="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  正常
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Footer Info -->
      <div class="p-1.5 bg-slate-950/40 backdrop-blur-md border-t border-white/10 text-[8px] text-slate-400 flex items-center justify-between">
        <span>采样: 1000ms</span>
        <span class="text-emerald-300 font-medium">● 传感网 100% 正常</span>
      </div>
    </div>

    <!-- Collapse/Expand Handle Button -->
    <button
      @click="isCollapsed = !isCollapsed"
      class="pointer-events-auto mt-6 -ml-1 bg-slate-950/60 hover:bg-slate-900/80 text-cyan-400 hover:text-cyan-200 p-1 rounded-r-lg border-y border-r border-cyan-500/30 shadow-lg backdrop-blur-xl transition-colors cursor-pointer"
      :title="isCollapsed ? '展开监测面板' : '折叠监测面板'"
    >
      <ChevronRight v-if="isCollapsed" class="w-4 h-4" />
      <ChevronLeft v-else class="w-4 h-4" />
    </button>
  </div>
</template>
