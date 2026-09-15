<script setup lang="ts">
import { ref, computed } from 'vue';
import type { WeatherNowcastPoint } from '../types/digitalTwin';
import {
  tempTrend,
  humidityTrend,
  co2Trend,
  soilTrend,
} from '../data/mockData';
import {
  TrendingUp,
  Activity,
  CloudRain,
  Calendar,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Sun,
  Wind,
  Clock,
  Sparkles,
  ArrowUpRight,
} from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
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
  (e: 'update:collapsed', val: boolean): void;
  (e: 'simulateWeather', point: WeatherNowcastPoint): void;
  (e: 'openWeatherModal'): void;
  (e: 'focusGreenhouse', ghId: string): void;
}>();

const localCollapsed = ref(false);
const isCollapsed = computed({
  get: () => props.collapsed ?? localCollapsed.value,
  set: (val: boolean) => {
    localCollapsed.value = val;
    emit('update:collapsed', val);
  },
});

// -------------------------------------------------------------
// 1. 24H Continuous Environment Trends (24H连续生境趋势)
// -------------------------------------------------------------
const activeMetric = ref<'temp' | 'humidity' | 'co2' | 'soil'>('temp');

const chartConfig = computed(() => {
  if (activeMetric.value === 'humidity') {
    return {
      trend: humidityTrend,
      label: '空气湿度 (%)',
      strokeColor: '#38bdf8',
      minVal: 50,
      maxVal: 95,
      unit: '%',
    };
  } else if (activeMetric.value === 'co2') {
    return {
      trend: co2Trend,
      label: 'CO₂ 浓度 (ppm)',
      strokeColor: '#10b981',
      minVal: 500,
      maxVal: 900,
      unit: 'ppm',
    };
  } else if (activeMetric.value === 'soil') {
    return {
      trend: soilTrend,
      label: '土壤水分 (%)',
      strokeColor: '#818cf8',
      minVal: 55,
      maxVal: 75,
      unit: '%',
    };
  }
  return {
    trend: tempTrend,
    label: '空气温度 (℃)',
    strokeColor: '#f59e0b',
    minVal: 18,
    maxVal: 32,
    unit: '℃',
  };
});

const svgWidth = 360;
const svgHeight = 70;

const points = computed(() => {
  const { trend, minVal, maxVal } = chartConfig.value;
  return trend.map((val, idx) => {
    const x = (idx / (trend.length - 1)) * (svgWidth - 24) + 12;
    const norm = (val - minVal) / (maxVal - minVal);
    const y = svgHeight - 12 - norm * (svgHeight - 24);
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
  return `${pathD.value} L ${points.value[points.value.length - 1].x},${svgHeight} L ${points.value[0].x},${svgHeight} Z`;
});

// -------------------------------------------------------------
// 2. 0~2H Nowcasting Steps & Events (未来0-2H短临预警与演变)
// -------------------------------------------------------------
interface NowcastStep {
  offsetMin: number;
  timeStr: string;
  rainRate: number; // mm/h
  windSpeed: number; // m/s
  eventText: string;
  riskLevel: 'safe' | 'warning' | 'critical';
  impactedGh: string;
}

const nowcastSteps = ref<NowcastStep[]>([
  { offsetMin: 0, timeStr: '当前', rainRate: 0.0, windSpeed: 3.2, eventText: '多云无雨', riskLevel: 'safe', impactedGh: '' },
  { offsetMin: 15, timeStr: '+15m', rainRate: 2.1, windSpeed: 5.4, eventText: '零星阵雨', riskLevel: 'warning', impactedGh: 'gh_003' },
  { offsetMin: 30, timeStr: '+30m', rainRate: 28.0, windSpeed: 12.8, eventText: '短时强降水', riskLevel: 'critical', impactedGh: 'gh_001, gh_003' },
  { offsetMin: 45, timeStr: '+45m', rainRate: 18.5, windSpeed: 14.2, eventText: '大风降水维持', riskLevel: 'critical', impactedGh: 'gh_001, gh_002' },
  { offsetMin: 60, timeStr: '+60m', rainRate: 8.2, windSpeed: 8.0, eventText: '雨强明显减弱', riskLevel: 'warning', impactedGh: '' },
  { offsetMin: 90, timeStr: '+90m', rainRate: 1.0, windSpeed: 4.8, eventText: '降雨渐止', riskLevel: 'safe', impactedGh: '' },
  { offsetMin: 120, timeStr: '+120m', rainRate: 0.0, windSpeed: 3.5, eventText: '雨过天晴', riskLevel: 'safe', impactedGh: '' },
]);

const selectedStepOffset = ref<number>(0);

const handleSimulateStep = (step: NowcastStep) => {
  selectedStepOffset.value = step.offsetMin;
  const mockPoint: WeatherNowcastPoint = {
    isoTime: new Date(Date.now() + step.offsetMin * 60000).toISOString(),
    displayTime: step.timeStr,
    timeOffsetMinutes: step.offsetMin,
    isForecast: step.offsetMin > 0,
    precipitationMmPerHour: step.rainRate,
    accumulatedRainMm: +(step.rainRate * 0.35).toFixed(1),
    temperature: 28.5 - (step.offsetMin > 20 ? 3.5 : 0),
    relativeHumidity: Math.min(95, 68 + step.rainRate * 1.2),
    windSpeed: step.windSpeed,
    windDirectionDegrees: 135,
    windDirectionText: '东南风',
    windGust: step.windSpeed * 1.35,
    radarReflectivityDbz: step.rainRate > 20 ? 52 : step.rainRate > 5 ? 38 : 15,
    solarRadiationWm2: step.rainRate > 0 ? 120 : 680,
    condition: step.rainRate > 20 ? 'heavy_rain' : step.rainRate > 0 ? 'moderate_rain' : 'cloudy',
    conditionText: step.eventText,
  };
  emit('simulateWeather', mockPoint);
};

// -------------------------------------------------------------
// 3. 0~72H Short-range Trends & Golden Windows (0-72H短期趋势)
// -------------------------------------------------------------
interface ShortRangeDay {
  day: string;
  weather: string;
  temp: string;
  rain: string;
  goldenTask: string;
  badgeType: 'prime' | 'danger' | 'caution';
}

const shortRangeDays = ref<ShortRangeDay[]>([
  {
    day: '今日 (D1)',
    weather: '短时雷暴强风',
    temp: '24~28℃',
    rain: '17.5mm',
    goldenTask: '全园防汛闭窗，严禁喷药',
    badgeType: 'danger',
  },
  {
    day: '明日 (D2)',
    weather: '晴空万里 · 丰光',
    temp: '18~28℃',
    rain: '0mm',
    goldenTask: '07:00~10:30 植保喷药黄金期',
    badgeType: 'prime',
  },
  {
    day: '后天 (D3)',
    weather: '多云和煦 · 微风',
    temp: '20~27℃',
    rain: '0mm',
    goldenTask: '08:30 重启大田滴灌水肥一体化',
    badgeType: 'caution',
  },
]);
</script>

<template>
  <div
    :class="[
      'absolute bottom-2.5 z-20 pointer-events-none transition-all duration-300 flex flex-col items-center',
      leftCollapsed ? 'left-12' : 'left-2 xl:left-[304px]',
      rightCollapsed ? 'right-12' : 'right-2 xl:right-[290px]'
    ]"
  >
    <!-- Drawer Toggle Header Button -->
    <button
      id="btn-bottom-trend-toggle"
      @click="isCollapsed = !isCollapsed"
      :class="[
        'pointer-events-auto flex items-center gap-2 px-3 py-1 bg-slate-950/85 hover:bg-slate-900 text-cyan-300 text-[11px] font-bold border border-cyan-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all cursor-pointer shrink-0 ring-1 ring-white/10',
        isCollapsed ? 'rounded-xl mb-0 hover:scale-105' : 'rounded-t-xl border-b-0 mb-1'
      ]"
    >
      <div class="flex items-center gap-1.5">
        <TrendingUp class="w-3.5 h-3.5 text-cyan-400" />
        <span>气象驱动态势中枢: 24H生境趋势 | 0~2H短临预警 | 0~72H短期决策 ({{ isCollapsed ? '展开' : '收起' }})</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
        <span class="text-[10px] text-rose-300 font-mono">30m后强降雨</span>
      </div>
      <ChevronUp v-if="isCollapsed" class="w-3.5 h-3.5 text-cyan-400" />
      <ChevronDown v-else class="w-3.5 h-3.5 text-cyan-400" />
    </button>

    <!-- Main Drawer Content (3 Core Weather-Agri Columns) -->
    <div
      v-if="!isCollapsed"
      class="pointer-events-auto w-full max-w-6xl bg-slate-950/70 hover:bg-slate-950/80 backdrop-blur-2xl rounded-2xl border border-cyan-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 p-2.5 sm:p-3 grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-2.5 text-xs transition-all duration-300"
    >
      <!-- ========================================================= -->
      <!-- COLUMN 1: 24H Environmental Trend Graph (col 4) -->
      <!-- ========================================================= -->
      <div class="lg:col-span-4 flex flex-col justify-between bg-slate-950/45 hover:bg-slate-900/55 backdrop-blur-md p-2.5 rounded-xl border border-white/10 shadow-xs">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-1.5 font-bold text-slate-100 text-[11px]">
            <Activity class="w-3.5 h-3.5 text-cyan-400" />
            <span>24H 生境连续态势</span>
          </div>

          <!-- Metric Selector Pills -->
          <div class="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            <button
              @click="activeMetric = 'temp'"
              :class="[
                'px-1.5 py-0.5 rounded transition-colors cursor-pointer',
                activeMetric === 'temp' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              ]"
            >
              温度
            </button>
            <button
              @click="activeMetric = 'humidity'"
              :class="[
                'px-1.5 py-0.5 rounded transition-colors cursor-pointer',
                activeMetric === 'humidity' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              ]"
            >
              湿度
            </button>
            <button
              @click="activeMetric = 'co2'"
              :class="[
                'px-1.5 py-0.5 rounded transition-colors cursor-pointer',
                activeMetric === 'co2' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              ]"
            >
              CO₂
            </button>
            <button
              @click="activeMetric = 'soil'"
              :class="[
                'px-1.5 py-0.5 rounded transition-colors cursor-pointer',
                activeMetric === 'soil' ? 'bg-indigo-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              ]"
            >
              水分
            </button>
          </div>
        </div>

        <!-- SVG Line Chart -->
        <div class="relative w-full h-18 overflow-hidden">
          <svg :viewBox="`0 0 ${svgWidth} ${svgHeight}`" class="w-full h-full">
            <defs>
              <linearGradient id="metricGradBottom" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="chartConfig.strokeColor" stop-opacity="0.35" />
                <stop offset="100%" :stop-color="chartConfig.strokeColor" stop-opacity="0.0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="18" :x2="svgWidth" y2="18" stroke="#334155" stroke-dasharray="3 3" opacity="0.4" />
            <line x1="0" y1="45" :x2="svgWidth" y2="45" stroke="#334155" stroke-dasharray="3 3" opacity="0.4" />
            <path :d="areaD" fill="url(#metricGradBottom)" />
            <path :d="pathD" fill="none" :stroke="chartConfig.strokeColor" stroke-width="2" stroke-linecap="round" />
            <circle
              v-for="(pt, i) in points"
              :key="i"
              :cx="pt.x"
              :cy="pt.y"
              r="2.2"
              fill="#090d16"
              :stroke="chartConfig.strokeColor"
              stroke-width="1.6"
            />
          </svg>
        </div>

        <div class="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5 px-1">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span class="text-cyan-300 font-bold">现在 (实况)</span>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- COLUMN 2: 0~2H Nowcast Timeline & Turning Events (col 4) -->
      <!-- ========================================================= -->
      <div class="lg:col-span-5 bg-slate-950/45 hover:bg-slate-900/55 backdrop-blur-md p-2.5 rounded-xl border border-rose-500/30 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-1.5 font-bold text-slate-100 text-[11px]">
            <CloudRain class="w-3.5 h-3.5 text-rose-400" />
            <span>未来 0~2H 短临分钟级演变与大棚风险映射</span>
          </div>
          <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
            橙色风险 · 影响 1# / 3# 棚
          </span>
        </div>

        <!-- Minute-by-Minute Step Bars with quick simulate click -->
        <div class="grid grid-cols-7 gap-1 my-1">
          <div
            v-for="step in nowcastSteps"
            :key="step.offsetMin"
            @click="handleSimulateStep(step)"
            :class="[
              'p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col items-center text-center group',
              selectedStepOffset === step.offsetMin
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400 shadow-xs'
                : step.riskLevel === 'critical'
                ? 'bg-rose-950/30 border-rose-500/40 hover:border-rose-300 text-rose-200'
                : step.riskLevel === 'warning'
                ? 'bg-amber-950/30 border-amber-500/40 hover:border-amber-300 text-amber-200'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
            ]"
            :title="`点击在三维场景中模拟推演 ${step.timeStr} (${step.eventText})`"
          >
            <span class="text-[9px] font-mono font-bold">{{ step.timeStr }}</span>

            <!-- Rain Rate bar visual -->
            <div class="w-full bg-slate-800 h-6 rounded mt-1 relative overflow-hidden flex items-end">
              <div
                :class="[
                  'w-full transition-all rounded-b',
                  step.rainRate >= 20
                    ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                    : step.rainRate >= 5
                    ? 'bg-amber-400'
                    : step.rainRate > 0
                    ? 'bg-sky-400'
                    : 'bg-transparent'
                ]"
                :style="{ height: `${Math.min(100, Math.max(10, (step.rainRate / 30) * 100))}%` }"
              />
            </div>

            <span class="text-[8px] font-mono mt-1 truncate max-w-full">
              {{ step.rainRate > 0 ? `${step.rainRate.toFixed(0)}mm` : '无雨' }}
            </span>
          </div>
        </div>

        <!-- Turning Point Events Description -->
        <div class="flex items-center justify-between text-[10px] text-slate-300 pt-1 border-t border-slate-800">
          <div class="flex items-center gap-1.5 truncate">
            <AlertTriangle class="w-3 h-3 text-rose-400 shrink-0" />
            <span class="truncate">
              <strong>关键节点:</strong> +30m 强降雨入园(28mm/h) · 建议天窗闭锁
            </span>
          </div>
          <button
            @click="emit('openWeatherModal')"
            class="text-cyan-400 hover:text-cyan-200 shrink-0 flex items-center gap-0.5 cursor-pointer text-[10px] font-medium"
          >
            <span>演练中枢</span>
            <ArrowUpRight class="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- COLUMN 3: 0~72H Short-range Trend & Golden Windows (col 3) -->
      <!-- ========================================================= -->
      <div class="lg:col-span-3 bg-slate-950/45 hover:bg-slate-900/55 backdrop-blur-md p-2.5 rounded-xl border border-emerald-500/30 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-1.5 font-bold text-slate-100 text-[11px]">
            <Calendar class="w-3.5 h-3.5 text-emerald-400" />
            <span>0~72H 短期趋势与农事窗口</span>
          </div>
          <span class="text-[9px] font-mono text-emerald-400 font-semibold">3日科学研判</span>
        </div>

        <!-- 3 Days mini list -->
        <div class="space-y-1.5 my-1">
          <div
            v-for="d in shortRangeDays"
            :key="d.day"
            class="p-1.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between text-[10px]"
          >
            <div class="space-y-0.5 min-w-0">
              <div class="flex items-center gap-1 font-semibold text-slate-200">
                <span>{{ d.day }}</span>
                <span class="text-[9px] text-slate-400">({{ d.temp }})</span>
              </div>
              <div class="text-[9px] text-slate-300 truncate" :title="d.goldenTask">
                {{ d.goldenTask }}
              </div>
            </div>

            <span
              :class="[
                'px-1.5 py-0.5 rounded text-[8px] font-mono font-bold shrink-0 ml-1',
                d.badgeType === 'prime'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : d.badgeType === 'danger'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              ]"
            >
              {{ d.badgeType === 'prime' ? '宜喷药' : d.badgeType === 'danger' ? '防汛避灾' : '水肥灌溉' }}
            </span>
          </div>
        </div>

        <div class="text-[9px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
          <span>明日自然光热充足: 750W/m²</span>
          <span class="text-emerald-400 font-mono">节能 ¥120</span>
        </div>
      </div>
    </div>
  </div>
</template>
