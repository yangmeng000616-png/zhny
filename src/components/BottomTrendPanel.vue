<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CropZone, AGVRobot } from '../types/digitalTwin';
import {
  tempTrend,
  humidityTrend,
  co2Trend,
  soilTrend,
  waterLevelTrend,
  waterDoTrend,
} from '../data/mockData';
import {
  TrendingUp,
  Sprout,
  Bot,
  ChevronUp,
  ChevronDown,
  Activity,
} from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    crops: CropZone[];
    agv: AGVRobot;
    leftCollapsed?: boolean;
    rightCollapsed?: boolean;
    collapsed?: boolean;
  }>(),
  {
    leftCollapsed: false,
    rightCollapsed: false,
    collapsed: false,
  }
);

const emit = defineEmits<{
  (e: 'focusCropZone', zoneId: string): void;
  (e: 'focusAGV'): void;
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

const activeMetric = ref<'temp' | 'humidity' | 'co2' | 'soil' | 'water_level' | 'water_do'>('temp');

const chartConfig = computed(() => {
  if (activeMetric.value === 'humidity') {
    return {
      trend: humidityTrend,
      label: '空气湿度 (%)',
      strokeColor: '#38bdf8',
      minVal: 50,
      maxVal: 95,
    };
  } else if (activeMetric.value === 'co2') {
    return {
      trend: co2Trend,
      label: 'CO₂ 浓度 (ppm)',
      strokeColor: '#10b981',
      minVal: 500,
      maxVal: 900,
    };
  } else if (activeMetric.value === 'soil') {
    return {
      trend: soilTrend,
      label: '土壤基质水分 (%)',
      strokeColor: '#818cf8',
      minVal: 55,
      maxVal: 75,
    };
  } else if (activeMetric.value === 'water_level') {
    return {
      trend: waterLevelTrend,
      label: '河塘水位标高 (m)',
      strokeColor: '#06b6d4',
      minVal: 2.0,
      maxVal: 2.8,
    };
  } else if (activeMetric.value === 'water_do') {
    return {
      trend: waterDoTrend,
      label: '河塘溶解氧 DO (mg/L)',
      strokeColor: '#14b8a6',
      minVal: 6.0,
      maxVal: 8.5,
    };
  }
  return {
    trend: tempTrend,
    label: '空气温度 (℃)',
    strokeColor: '#f59e0b',
    minVal: 18,
    maxVal: 32,
  };
});

const width = 420;
const height = 75;

const points = computed(() => {
  const { trend, minVal, maxVal } = chartConfig.value;
  return trend.map((val, idx) => {
    const x = (idx / (trend.length - 1)) * (width - 24) + 12;
    const norm = (val - minVal) / (maxVal - minVal);
    const y = height - 12 - norm * (height - 24);
    return { x, y, val };
  });
});

const pathD = computed(() => {
  return points.value.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');
});

const areaD = computed(() => {
  if (points.value.length === 0) return '';
  return `${pathD.value} L ${points.value[points.value.length - 1].x},${height} L ${points.value[0].x},${height} Z`;
});
</script>

<template>
  <div
    :class="[
      'absolute bottom-2.5 z-20 pointer-events-none transition-all duration-300 flex flex-col items-center',
      leftCollapsed ? 'left-14' : 'left-3 xl:left-[336px]',
      rightCollapsed ? 'right-14' : 'right-3 xl:right-[316px]'
    ]"
  >
    <!-- Drawer Toggle Header Button -->
    <button
      @click="isCollapsed = !isCollapsed"
      class="pointer-events-auto mb-1 flex items-center gap-1.5 px-3 py-1 rounded-t-xl bg-slate-950/70 hover:bg-slate-900/90 text-cyan-300 text-[11px] font-semibold border-t border-x border-cyan-500/30 shadow-[0_-4px_16px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors cursor-pointer shrink-0"
    >
      <TrendingUp class="w-3.5 h-3.5 text-cyan-400" />
      <span>24H环境态势 / 作物长势 / 巡检机 ({{ isCollapsed ? '点击展开' : '收起' }})</span>
      <ChevronUp v-if="isCollapsed" class="w-3.5 h-3.5 text-cyan-400" />
      <ChevronDown v-else class="w-3.5 h-3.5 text-cyan-400" />
    </button>

    <!-- Main Drawer Content -->
    <div
      v-if="!isCollapsed"
      class="pointer-events-auto w-full max-w-5xl bg-slate-950/45 hover:bg-slate-950/60 backdrop-blur-2xl rounded-2xl border border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10 p-2.5 sm:p-3 grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-2.5 text-xs transition-all duration-300"
    >
      <!-- Section 1: 24-Hour Environment Spline Graph (col 5) -->
      <div class="lg:col-span-5 flex flex-col justify-between bg-slate-950/35 hover:bg-slate-900/45 backdrop-blur-md p-2.5 rounded-xl border border-white/10 shadow-xs">
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-1.5 font-bold text-slate-100">
            <Activity class="w-4 h-4 text-cyan-400" />
            <span>24H 连续生境趋势</span>
          </div>
          <!-- Metric tabs -->
          <div class="flex items-center gap-1 bg-slate-950/60 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              @click="activeMetric = 'temp'"
              :class="[
                'px-1.5 py-0.5 rounded transition-colors cursor-pointer',
                activeMetric === 'temp' ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-slate-200'
              ]"
            >
              温度
            </button>
            <button
              @click="activeMetric = 'humidity'"
              :class="[
                'px-1.5 py-0.5 rounded transition-colors cursor-pointer',
                activeMetric === 'humidity' ? 'bg-sky-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-slate-200'
              ]"
            >
              湿度
            </button>
            <button
              @click="activeMetric = 'co2'"
              :class="[
                'px-1.5 py-0.5 rounded transition-colors cursor-pointer',
                activeMetric === 'co2' ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-slate-200'
              ]"
            >
              CO₂
            </button>
            <button
              @click="activeMetric = 'soil'"
              :class="[
                'px-1.5 py-0.5 rounded transition-colors cursor-pointer',
                activeMetric === 'soil' ? 'bg-indigo-500 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-slate-200'
              ]"
            >
              基质
            </button>
            <button
              @click="activeMetric = 'water_level'"
              :class="[
                'px-1.5 py-0.5 rounded transition-colors cursor-pointer',
                activeMetric === 'water_level' ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-cyan-300'
              ]"
              title="河塘水位标高"
            >
              水位
            </button>
            <button
              @click="activeMetric = 'water_do'"
              :class="[
                'px-1.5 py-0.5 rounded transition-colors cursor-pointer',
                activeMetric === 'water_do' ? 'bg-teal-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-teal-300'
              ]"
              title="水质溶解氧"
            >
              溶氧
            </button>
          </div>
        </div>

        <!-- SVG Chart -->
        <div class="relative w-full h-20 overflow-hidden">
          <svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-full">
            <defs>
              <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="chartConfig.strokeColor" stop-opacity="0.35" />
                <stop offset="100%" :stop-color="chartConfig.strokeColor" stop-opacity="0.0" />
              </linearGradient>
            </defs>
            <!-- Horizontal reference grid lines -->
            <line x1="0" y1="20" :x2="width" y2="20" stroke="#334155" stroke-dasharray="3 3" opacity="0.6" />
            <line x1="0" y1="50" :x2="width" y2="50" stroke="#334155" stroke-dasharray="3 3" opacity="0.6" />
            <!-- Area and Line -->
            <path :d="areaD" fill="url(#metricGrad)" />
            <path :d="pathD" fill="none" :stroke="chartConfig.strokeColor" stroke-width="2.2" stroke-linecap="round" />
            <!-- Points -->
            <circle
              v-for="(pt, i) in points"
              :key="i"
              :cx="pt.x"
              :cy="pt.y"
              r="2.5"
              fill="#0f172a"
              :stroke="chartConfig.strokeColor"
              stroke-width="1.8"
            />
          </svg>
        </div>

        <div class="flex justify-between text-[10px] text-slate-400 font-mono mt-1 px-1">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>当前 (24:00)</span>
        </div>
      </div>

      <!-- Section 2: Crop Zones Growth Progress (col 4) -->
      <div class="lg:col-span-4 bg-slate-950/35 hover:bg-slate-900/45 backdrop-blur-md p-2.5 rounded-xl border border-white/10 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-1.5 font-bold text-slate-100">
            <Sprout class="w-4 h-4 text-emerald-400" />
            <span>种植分区长势与采收倒计时</span>
          </div>
          <span class="text-[10px] text-slate-400 font-mono font-medium">4 个标准化功能区</span>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="crop in crops"
            :key="crop.id"
            @click="$emit('focusCropZone', crop.id)"
            class="bg-slate-950/40 hover:bg-slate-900/50 p-2 rounded-lg border border-white/10 cursor-pointer transition-all hover:border-emerald-500/50 group shadow-xs backdrop-blur-xs"
            title="点击三维视角聚焦此栽培区"
          >
            <div class="flex items-center justify-between text-[11px]">
              <span class="font-semibold text-slate-200 group-hover:text-emerald-400 truncate max-w-[120px]">
                {{ crop.name.split('·')[0] }}
              </span>
              <span class="text-emerald-400 font-mono font-bold">{{ crop.growthProgress }}%</span>
            </div>
            <div class="text-[10px] text-slate-400 truncate mt-0.5">{{ crop.cropType }}</div>
            <!-- Progress bar -->
            <div class="w-full bg-slate-800/90 h-1 rounded-full mt-1.5 overflow-hidden">
              <div
                class="bg-emerald-500 h-full rounded-full shadow-[0_0_6px_#10b981]"
                :style="{ width: `${crop.growthProgress}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 3: Autonomous Patrol AGV Telemetry (col 3) -->
      <div
        @click="$emit('focusAGV')"
        class="lg:col-span-3 bg-slate-950/35 hover:bg-slate-900/45 backdrop-blur-md p-2.5 rounded-xl border border-white/10 shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:border-cyan-400/50 group"
        title="点击三维视角追踪农情巡检机器人"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1 text-slate-200 font-bold group-hover:text-cyan-300">
            <Bot class="w-4 h-4 text-cyan-400" />
            <span>AGV-01 巡检</span>
          </div>
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping shadow-[0_0_8px_#34d399]"></span>
        </div>

        <div class="my-1.5 space-y-1 text-[11px] font-mono">
          <div class="flex justify-between text-slate-400">
            <span>电量:</span>
            <span class="text-emerald-400 font-bold">{{ agv.battery }}%</span>
          </div>
          <div class="flex justify-between text-slate-400">
            <span>巡航时速:</span>
            <span class="text-slate-200 font-semibold">{{ agv.speed }} m/s</span>
          </div>
          <div class="flex justify-between text-slate-400">
            <span>激光雷达:</span>
            <span class="text-cyan-300 font-medium">360° 点云正常</span>
          </div>
        </div>

        <div class="text-[10px] text-cyan-400 font-semibold group-hover:underline flex items-center gap-1">
          <span>视角追踪巡查 &gt;</span>
        </div>
      </div>
    </div>
  </div>
</template>
