<script setup lang="ts">
import { ref } from 'vue';
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

defineProps<{
  environment: EnvironmentSnapshot;
  sensors: SensorData[];
  pondWater: PondWaterQuality;
}>();

const emit = defineEmits<{
  (e: 'selectSensor', sensorId: string): void;
  (e: 'focusPond'): void;
}>();

const collapsed = ref(false);
const activeTab = ref<'realtime' | 'water' | 'sensors'>('realtime');
</script>

<template>
  <div
    :class="[
      'absolute top-20 left-3 bottom-12 z-20 transition-all duration-300 pointer-events-none flex items-start',
      collapsed ? '-translate-x-[calc(100%-12px)]' : 'translate-x-0'
    ]"
  >
    <!-- Main Panel Box -->
    <div class="pointer-events-auto w-72 sm:w-80 h-full max-h-[calc(100vh-140px)] flex flex-col bg-slate-950/80 hover:bg-slate-950/90 backdrop-blur-2xl rounded-2xl border border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10 overflow-hidden transition-all duration-300">
      <!-- Panel Header -->
      <div class="p-3.5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shadow-[0_0_8px_#22d3ee]"></div>
          <h2 class="text-xs font-bold text-slate-100 tracking-wider uppercase">
            空间微生境实时监测 (Micro-Climate)
          </h2>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono font-semibold backdrop-blur-xs">
          生境指数 96
        </span>
      </div>

      <!-- Tab switch -->
      <div class="flex border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-sm text-xs font-medium">
        <button
          @click="activeTab = 'realtime'"
          :class="[
            'flex-1 py-2 text-center transition-colors border-b-2',
            activeTab === 'realtime'
              ? 'text-cyan-300 border-cyan-400 bg-slate-850/80 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-850/40'
          ]"
        >
          空间环境
        </button>
        <button
          @click="activeTab = 'water'"
          :class="[
            'flex-1 py-2 text-center transition-colors border-b-2 flex items-center justify-center gap-1',
            activeTab === 'water'
              ? 'text-cyan-300 border-cyan-400 bg-slate-850/80 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-850/40'
          ]"
        >
          <Waves class="w-3.5 h-3.5 text-cyan-400" />
          河塘水质
        </button>
        <button
          @click="activeTab = 'sensors'"
          :class="[
            'flex-1 py-2 text-center transition-colors border-b-2',
            activeTab === 'sensors'
              ? 'text-cyan-300 border-cyan-400 bg-slate-850/80 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-850/40'
          ]"
        >
          节点 ({{ sensors.length }})
        </button>
      </div>

      <!-- Content Scrollable Area -->
      <div class="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs text-slate-300">
        <!-- Tab 1: Realtime Environment -->
        <template v-if="activeTab === 'realtime'">
          <!-- Air Temperature -->
          <div class="bg-slate-900/70 hover:bg-slate-900/95 p-2.5 rounded-xl border border-slate-800/90 hover:border-cyan-500/40 shadow-xs transition-colors">
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-2 text-amber-400 font-semibold">
                <Thermometer class="w-4 h-4 text-amber-400" />
                <span>空气温度 (Air Temp)</span>
              </div>
              <span class="text-[11px] font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30 font-medium">
                适宜 22~30℃
              </span>
            </div>
            <div class="flex items-baseline justify-between">
              <div class="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                {{ environment.airTemp.toFixed(1) }}
                <span class="text-sm font-normal text-slate-400 ml-1">℃</span>
              </div>
              <div class="text-[11px] text-slate-400 font-mono">
                均值 28.2℃ · 波动 ±0.3℃
              </div>
            </div>
            <!-- Visual bar -->
            <div class="w-full bg-slate-800/90 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-700/50">
              <div
                class="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 h-full rounded-full transition-all duration-500"
                :style="{ width: `${Math.min(100, Math.max(0, (environment.airTemp / 40) * 100))}%` }"
              ></div>
            </div>
          </div>

          <!-- Air Humidity -->
          <div class="bg-slate-900/70 hover:bg-slate-900/95 p-2.5 rounded-xl border border-slate-800/90 hover:border-cyan-500/40 shadow-xs transition-colors">
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-2 text-sky-400 font-semibold">
                <Droplets class="w-4 h-4 text-sky-400" />
                <span>空气湿度 (Humidity)</span>
              </div>
              <span class="text-[11px] font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30 font-medium">
                适宜 60~80%
              </span>
            </div>
            <div class="flex items-baseline justify-between">
              <div class="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                {{ environment.airHumidity.toFixed(1) }}
                <span class="text-sm font-normal text-slate-400 ml-1">%</span>
              </div>
              <div class="text-[11px] text-slate-400 font-mono">露点温度 22.8℃</div>
            </div>
            <div class="w-full bg-slate-800/90 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-700/50">
              <div
                class="bg-sky-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#38bdf8]"
                :style="{ width: `${environment.airHumidity}%` }"
              ></div>
            </div>
          </div>

          <!-- CO2 Concentration -->
          <div class="bg-slate-900/70 hover:bg-slate-900/95 p-2.5 rounded-xl border border-slate-800/90 hover:border-cyan-500/40 shadow-xs transition-colors">
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-2 text-emerald-400 font-semibold">
                <Wind class="w-4 h-4 text-emerald-400" />
                <span>CO₂ 浓度 (Carbon Dioxide)</span>
              </div>
              <span class="text-[11px] font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30 font-medium">
                充足
              </span>
            </div>
            <div class="flex items-baseline justify-between">
              <div class="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                {{ Math.round(environment.co2) }}
                <span class="text-sm font-normal text-slate-400 ml-1">ppm</span>
              </div>
              <div class="text-[11px] text-slate-400 font-mono">富碳补气待机</div>
            </div>
            <div class="w-full bg-slate-800/90 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-700/50">
              <div
                class="bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#34d399]"
                :style="{ width: `${Math.min(100, (environment.co2 / 1200) * 100)}%` }"
              ></div>
            </div>
          </div>

          <!-- Light Intensity PAR -->
          <div class="bg-slate-900/70 hover:bg-slate-900/95 p-2.5 rounded-xl border border-slate-800/90 hover:border-cyan-500/40 shadow-xs transition-colors">
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-2 text-amber-400 font-semibold">
                <Sun class="w-4 h-4 text-amber-400" />
                <span>光照强度 (PAR Lux)</span>
              </div>
              <span class="text-[11px] font-mono text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 font-medium">
                自然采光 88%
              </span>
            </div>
            <div class="flex items-baseline justify-between">
              <div class="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                {{ environment.lightLux.toFixed(1) }}
                <span class="text-sm font-normal text-slate-400 ml-1">klux</span>
              </div>
              <div class="text-[11px] text-slate-400 font-mono">DLI 18.6 mol/m²</div>
            </div>
            <div class="w-full bg-slate-800/90 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-700/50">
              <div
                class="bg-amber-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#fbbf24]"
                :style="{ width: `${Math.min(100, (environment.lightLux / 60) * 100)}%` }"
              ></div>
            </div>
          </div>

          <!-- Soil / Rootzone Metrics 2x2 Grid -->
          <div class="grid grid-cols-2 gap-2 pt-1">
            <div class="bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 shadow-xs">
              <div class="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <Droplets class="w-3 h-3 text-cyan-400" /> 土壤湿度
              </div>
              <div class="text-base font-bold font-mono text-slate-100 mt-1">
                {{ environment.soilMoisture.toFixed(1) }}%
              </div>
              <div class="text-[10px] text-emerald-400 font-mono font-medium">水肥充盈</div>
            </div>

            <div class="bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 shadow-xs">
              <div class="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <Activity class="w-3 h-3 text-purple-400" /> 基质 EC
              </div>
              <div class="text-base font-bold font-mono text-slate-100 mt-1">
                {{ environment.soilEc.toFixed(2) }}
                <span class="text-[10px] font-normal text-slate-400 ml-0.5">mS/cm</span>
              </div>
              <div class="text-[10px] text-emerald-400 font-mono font-medium">无盐渍化</div>
            </div>

            <div class="bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 shadow-xs">
              <div class="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <Gauge class="w-3 h-3 text-emerald-400" /> 酸碱度 pH
              </div>
              <div class="text-base font-bold font-mono text-slate-100 mt-1">
                {{ environment.soilPh.toFixed(1) }}
              </div>
              <div class="text-[10px] text-emerald-400 font-mono font-medium">微酸最优</div>
            </div>

            <div class="bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 shadow-xs">
              <div class="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <Radio class="w-3 h-3 text-cyan-400" /> 储水液位
              </div>
              <div class="text-base font-bold font-mono text-slate-100 mt-1">
                {{ environment.waterLevel.toFixed(1) }}%
              </div>
              <div class="text-[10px] text-cyan-300 font-mono font-medium">8.45 m³ 存量</div>
            </div>
          </div>
        </template>

        <!-- Tab 2: Pond Water Tab -->
        <template v-else-if="activeTab === 'water'">
          <div class="space-y-2.5">
            <!-- Fly to Pond Button -->
            <button
              @click="$emit('focusPond')"
              class="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400/40 transition-all shadow-lg shadow-cyan-600/30 group cursor-pointer"
            >
              <div class="flex items-center gap-2">
                <Waves class="w-4 h-4 text-cyan-200 group-hover:animate-bounce" />
                <span class="font-semibold text-xs">聚焦生态河塘浮标监测站</span>
              </div>
              <ArrowUpRight class="w-4 h-4 text-cyan-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            <!-- Water Level Card -->
            <div class="bg-slate-900/70 p-3 rounded-xl border border-cyan-500/30 shadow-xs">
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-1.5 text-cyan-300 font-semibold text-xs">
                  <Waves class="w-4 h-4 text-cyan-400" />
                  <span>河塘水位标高 (Water Level)</span>
                </div>
                <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {{ pondWater.qualityGrade }}
                </span>
              </div>

              <div class="flex items-baseline justify-between">
                <div class="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                  {{ pondWater.waterLevelMeters.toFixed(2) }}
                  <span class="text-sm font-normal text-slate-400 ml-1">m</span>
                </div>
                <div class="text-right font-mono text-[11px] text-slate-300">
                  蓄水库容: <span class="text-cyan-300 font-bold">{{ pondWater.storageCapacityM3 }} m³</span>
                </div>
              </div>

              <!-- Progress bar -->
              <div class="mt-2">
                <div class="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>当前库容率: {{ pondWater.capacityPercentage.toFixed(1) }}%</span>
                  <span>安全标高: 1.80 ~ 3.20m</span>
                </div>
                <div class="w-full h-2 bg-slate-800/90 rounded-full overflow-hidden border border-slate-700/60">
                  <div
                    class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500 shadow-[0_0_8px_#06b6d4]"
                    :style="{ width: `${Math.min(100, (pondWater.waterLevelMeters / 3.2) * 100)}%` }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Water Quality Indices Grid -->
            <div class="grid grid-cols-2 gap-2">
              <div class="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
                <div class="text-[11px] text-slate-400 flex items-center justify-between font-medium">
                  <span>溶解氧 (DO)</span>
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"></span>
                </div>
                <div class="text-base font-bold font-mono text-emerald-400 mt-1">
                  {{ pondWater.dissolvedOxygen.toFixed(1) }}
                  <span class="text-[10px] font-normal text-slate-400 ml-1">mg/L</span>
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">标准 ≥ 6.0 Ⅰ类水</div>
              </div>

              <div class="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
                <div class="text-[11px] text-slate-400 flex items-center justify-between font-medium">
                  <span>水体温度 (Temp)</span>
                  <Thermometer class="w-3 h-3 text-amber-400" />
                </div>
                <div class="text-base font-bold font-mono text-slate-100 mt-1">
                  {{ pondWater.waterTemp.toFixed(1) }}
                  <span class="text-[10px] font-normal text-slate-400 ml-1">℃</span>
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">适温稳定</div>
              </div>

              <div class="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
                <div class="text-[11px] text-slate-400 flex items-center justify-between font-medium">
                  <span>酸碱度 (pH)</span>
                  <Gauge class="w-3 h-3 text-cyan-400" />
                </div>
                <div class="text-base font-bold font-mono text-cyan-300 mt-1">
                  {{ pondWater.ph.toFixed(2) }}
                </div>
                <div class="text-[10px] text-emerald-400 font-medium mt-0.5">弱碱适农 (7.0~8.5)</div>
              </div>

              <div class="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
                <div class="text-[11px] text-slate-400 flex items-center justify-between font-medium">
                  <span>水质浊度</span>
                  <Activity class="w-3 h-3 text-purple-400" />
                </div>
                <div class="text-base font-bold font-mono text-purple-300 mt-1">
                  {{ pondWater.turbidity.toFixed(1) }}
                  <span class="text-[10px] font-normal text-slate-400 ml-1">NTU</span>
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">清澈达标 (&lt;5 NTU)</div>
              </div>

              <div class="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
                <div class="text-[11px] text-slate-400 font-medium">氨氮 (NH3-N)</div>
                <div class="text-base font-bold font-mono text-slate-100 mt-1">
                  {{ pondWater.ammoniaNitrogen.toFixed(2) }}
                  <span class="text-[10px] font-normal text-slate-400 ml-1">mg/L</span>
                </div>
                <div class="text-[10px] text-emerald-400 font-medium mt-0.5">无富营养化风险</div>
              </div>

              <div class="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
                <div class="text-[11px] text-slate-400 font-medium">电导率 (EC)</div>
                <div class="text-base font-bold font-mono text-slate-100 mt-1">
                  {{ pondWater.conductivityEc.toFixed(0) }}
                  <span class="text-[10px] font-normal text-slate-400 ml-1">μS/cm</span>
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">低矿化天然净水</div>
              </div>
            </div>

            <!-- Intake Pumping Station Status -->
            <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 text-slate-300 shadow-xs">
              <div class="flex items-center justify-between text-xs font-semibold">
                <span class="flex items-center gap-1.5 text-slate-100">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
                  河塘生态取水提水泵站
                </span>
                <span class="text-[10px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-medium">
                  运行中 50Hz
                </span>
              </div>
              <div class="flex justify-between text-[11px] font-mono text-slate-400 mt-1.5">
                <span>提水流量: {{ pondWater.intakeFlowRate }} m³/h</span>
                <span>管网静压: 0.38 MPa</span>
              </div>
            </div>
          </div>
        </template>

        <!-- Tab 3: Sensors Tab -->
        <template v-else>
          <div class="space-y-2">
            <div class="text-[11px] text-slate-400 pb-1 font-medium">
              点击传感节点可在三维场景中快速飞行聚焦：
            </div>
            <div
              v-for="sensor in sensors"
              :key="sensor.id"
              @click="$emit('selectSensor', sensor.id)"
              class="bg-slate-900/60 hover:bg-slate-850 p-2.5 rounded-xl border border-slate-800/80 cursor-pointer transition-all hover:border-cyan-500/60 flex items-center justify-between shadow-xs"
            >
              <div>
                <div class="font-semibold text-slate-100 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
                  {{ sensor.name }}
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">{{ sensor.zone }}</div>
              </div>
              <div class="text-right">
                <div class="font-mono font-bold text-cyan-300">
                  {{ sensor.value }} {{ sensor.unit }}
                </div>
                <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                  正常
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Footer Info -->
      <div class="p-2.5 bg-slate-950/80 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
        <span>采样频率: 1000ms</span>
        <span class="text-emerald-400 font-medium">● 传感器状态 100% 优良</span>
      </div>
    </div>

    <!-- Collapse/Expand Handle Button -->
    <button
      @click="collapsed = !collapsed"
      class="pointer-events-auto mt-6 -ml-1 bg-slate-900/90 hover:bg-slate-850 text-cyan-400 hover:text-cyan-200 p-1 rounded-r-lg border-y border-r border-cyan-500/30 shadow-lg backdrop-blur-md transition-colors cursor-pointer"
      :title="collapsed ? '展开监测面板' : '折叠监测面板'"
    >
      <ChevronRight v-if="collapsed" class="w-4 h-4" />
      <ChevronLeft v-else class="w-4 h-4" />
    </button>
  </div>
</template>
