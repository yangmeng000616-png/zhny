<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import {
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  Compass,
  AlertTriangle,
  Play,
  Pause,
  Layers,
  CheckCircle2,
  Zap,
  Radio,
  X,
  Eye,
} from 'lucide-vue-next';
import type {
  WeatherNowcastPoint,
  RadarEchoFrame,
  AgroRiskWarning,
} from '../types/digitalTwin';
import { weatherService } from '../services/weatherService';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'applyWeather3D', point: WeatherNowcastPoint): void;
  (e: 'applyRadarFrame3D', frame: RadarEchoFrame | null): void;
  (e: 'focusGreenhouse', ghId: string): void;
  (e: 'mitigateRisk', warning: AgroRiskWarning): void;
  (e: 'toggleWeatherLayer', layer: 'rain' | 'wind' | 'radar', visible: boolean): void;
}>();

// Weather Data States
const currentNowcast = ref<WeatherNowcastPoint | null>(null);
const minutelyTimeline = ref<WeatherNowcastPoint[]>([]);
const radarFrames = ref<RadarEchoFrame[]>([]);
const activeRadarIndex = ref<number>(2); // Default to current frame (0, 1, 2, 3, 4)
const isRadarPlaying = ref<boolean>(false);
const showRadarIn3D = ref<boolean>(false);
const showRainIn3D = ref<boolean>(true);
const showWindIn3D = ref<boolean>(true);
const riskWarnings = ref<AgroRiskWarning[]>([]);
const activeTab = ref<'nowcast' | 'radar' | 'risks'>('nowcast');

const handleToggleLayer = (layer: 'rain' | 'wind' | 'radar') => {
  if (layer === 'rain') {
    showRainIn3D.value = !showRainIn3D.value;
    emit('toggleWeatherLayer', 'rain', showRainIn3D.value);
  } else if (layer === 'wind') {
    showWindIn3D.value = !showWindIn3D.value;
    emit('toggleWeatherLayer', 'wind', showWindIn3D.value);
  } else if (layer === 'radar') {
    showRadarIn3D.value = !showRadarIn3D.value;
    emit('toggleWeatherLayer', 'radar', showRadarIn3D.value);
    if (!showRadarIn3D.value) {
      emit('applyRadarFrame3D', null);
    } else if (radarFrames.value[activeRadarIndex.value]) {
      emit('applyRadarFrame3D', radarFrames.value[activeRadarIndex.value]);
    }
  }
};

let radarPlayTimer: ReturnType<typeof setInterval> | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

const loadWeatherData = async () => {
  try {
    const [nowcast, timeline, radar, risks] = await Promise.all([
      weatherService.getCurrentNowcast(),
      weatherService.getMinutelyNowcast(),
      weatherService.getRadarEchoFrames(),
      weatherService.getRiskWarnings(),
    ]);

    currentNowcast.value = nowcast;
    minutelyTimeline.value = timeline;
    radarFrames.value = radar;
    riskWarnings.value = risks;

    if (nowcast) {
      emit('applyWeather3D', nowcast);
    }
    if (showRadarIn3D.value && radar.length > activeRadarIndex.value) {
      emit('applyRadarFrame3D', radar[activeRadarIndex.value]);
    }
  } catch (err) {
    console.warn('[WeatherPanel] Error loading data:', err);
  }
};

const toggleRadarPlay = () => {
  isRadarPlaying.value = !isRadarPlaying.value;
  if (isRadarPlaying.value) {
    radarPlayTimer = setInterval(() => {
      if (radarFrames.value.length === 0) return;
      activeRadarIndex.value = (activeRadarIndex.value + 1) % radarFrames.value.length;
      if (showRadarIn3D.value) {
        emit('applyRadarFrame3D', radarFrames.value[activeRadarIndex.value]);
      }
    }, 1200);
  } else if (radarPlayTimer) {
    clearInterval(radarPlayTimer);
    radarPlayTimer = null;
  }
};

const handleSelectRadarFrame = (idx: number) => {
  activeRadarIndex.value = idx;
  if (showRadarIn3D.value && radarFrames.value[idx]) {
    emit('applyRadarFrame3D', radarFrames.value[idx]);
  }
};

const handleToggleRadar3D = () => {
  showRadarIn3D.value = !showRadarIn3D.value;
  if (!showRadarIn3D.value) {
    emit('applyRadarFrame3D', null);
  } else if (radarFrames.value[activeRadarIndex.value]) {
    emit('applyRadarFrame3D', radarFrames.value[activeRadarIndex.value]);
  }
};

const handleMitigate = async (warning: AgroRiskWarning) => {
  await weatherService.mitigateRiskWarning(warning.id);
  warning.isMitigated = true;
  emit('mitigateRisk', warning);
};

onMounted(() => {
  loadWeatherData();
  refreshTimer = setInterval(loadWeatherData, 30000);
});

onBeforeUnmount(() => {
  if (radarPlayTimer) clearInterval(radarPlayTimer);
  if (refreshTimer) clearInterval(refreshTimer);
});
</script>

<template>
  <div
    v-if="visible"
    class="fixed top-16 right-3 sm:right-74 z-40 w-[350px] max-w-[92vw] bg-slate-950/65 hover:bg-slate-950/80 backdrop-blur-2xl rounded-2xl border border-cyan-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 text-slate-100 overflow-hidden flex flex-col max-h-[82vh] transition-all duration-300 pointer-events-auto"
  >
    <!-- Header -->
    <div class="px-4 py-3 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/40 border-b border-cyan-500/20 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
          <CloudRain class="w-4 h-4" />
        </div>
        <div>
          <h2 class="text-sm font-bold tracking-wide text-white flex items-center gap-2">
            微气象临近预报与农业防灾
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">实时更新</span>
          </h2>
          <p class="text-[10px] text-slate-400 font-mono">X波段双偏振雷达 · 2小时分钟级降水反演</p>
        </div>
      </div>
      <button
        @click="$emit('close')"
        class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center gap-1 px-3 pt-2 border-b border-slate-800 bg-slate-950/50 text-xs">
      <button
        @click="activeTab = 'nowcast'"
        :class="[
          'px-3 py-1.5 rounded-t-lg font-medium transition-all flex items-center gap-1.5 border-b-2',
          activeTab === 'nowcast'
            ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
            : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
      >
        <Droplets class="w-3.5 h-3.5" />
        降水临近预报
      </button>
      <button
        @click="activeTab = 'radar'"
        :class="[
          'px-3 py-1.5 rounded-t-lg font-medium transition-all flex items-center gap-1.5 border-b-2',
          activeTab === 'radar'
            ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
            : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
      >
        <Radio class="w-3.5 h-3.5" />
        气象雷达拼图
      </button>
      <button
        @click="activeTab = 'risks'"
        :class="[
          'px-3 py-1.5 rounded-t-lg font-medium transition-all flex items-center gap-1.5 border-b-2 relative',
          activeTab === 'risks'
            ? 'border-amber-400 text-amber-300 bg-amber-950/20'
            : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
      >
        <AlertTriangle class="w-3.5 h-3.5 text-amber-400" />
        农情灾害预警
        <span
          v-if="riskWarnings.filter(r => !r.isMitigated).length"
          class="px-1 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-bold animate-pulse"
        >
          {{ riskWarnings.filter(r => !r.isMitigated).length }}
        </span>
      </button>
    </div>

    <!-- 3D Weather Layers Quick Controls -->
    <div class="px-3 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-[11px]">
      <span class="text-slate-400 flex items-center gap-1.5 font-medium">
        <Layers class="w-3.5 h-3.5 text-cyan-400" />
        三维视效图层
      </span>
      <div class="flex items-center gap-1.5">
        <button
          @click="handleToggleLayer('rain')"
          :class="[
            'px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer border',
            showRainIn3D
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
          ]"
        >
          雨丝粒子
        </button>
        <button
          @click="handleToggleLayer('wind')"
          :class="[
            'px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer border',
            showWindIn3D
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
          ]"
        >
          3D风场
        </button>
        <button
          @click="handleToggleLayer('radar')"
          :class="[
            'px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer border',
            showRadarIn3D
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
          ]"
        >
          雷达回波
        </button>
      </div>
    </div>

    <!-- Tab Contents -->
    <div class="p-4 overflow-y-auto space-y-4 text-xs">
      <!-- 1. NOWCAST TAB -->
      <div v-if="activeTab === 'nowcast'" class="space-y-4">
        <!-- Current Station Realtime Conditions -->
        <div v-if="currentNowcast" class="grid grid-cols-2 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div class="flex items-center gap-2.5">
            <Thermometer class="w-4 h-4 text-amber-400" />
            <div>
              <div class="text-[10px] text-slate-400">园区外温 / 相对湿度</div>
              <div class="text-sm font-bold text-slate-100 font-mono">
                {{ currentNowcast.temperature }}℃ <span class="text-[11px] text-slate-400 font-normal">({{ currentNowcast.relativeHumidity }}%)</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2.5">
            <Droplets class="w-4 h-4 text-cyan-400" />
            <div>
              <div class="text-[10px] text-slate-400">当前降水量 / 累积</div>
              <div class="text-sm font-bold text-cyan-300 font-mono">
                {{ currentNowcast.precipitationMmPerHour }} <span class="text-[10px] font-normal text-slate-400">mm/h</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2.5">
            <Wind class="w-4 h-4 text-emerald-400" />
            <div>
              <div class="text-[10px] text-slate-400">风速 / 阵风峰值</div>
              <div class="text-sm font-bold text-slate-100 font-mono">
                {{ currentNowcast.windSpeed }} m/s <span class="text-[11px] text-emerald-400">({{ currentNowcast.windGust }} m/s)</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2.5">
            <Compass class="w-4 h-4 text-purple-400" />
            <div>
              <div class="text-[10px] text-slate-400">主导风向</div>
              <div class="text-sm font-bold text-slate-100 font-mono">
                {{ currentNowcast.windDirectionText }} <span class="text-[10px] text-slate-400">({{ currentNowcast.windDirectionDegrees }}°)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2-Hour Rain Nowcast Bar Sequence -->
        <div v-if="minutelyTimeline.length > 0" class="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-slate-200 flex items-center gap-1.5">
              <CloudRain class="w-3.5 h-3.5 text-cyan-400" /> 未来120分钟降水外推演进
            </span>
            <span class="text-[10px] font-mono text-cyan-400">时空微网格步长 15m</span>
          </div>
          <p class="text-[11px] text-slate-300 leading-relaxed bg-cyan-950/20 p-2 rounded-lg border border-cyan-500/20">
            {{ currentNowcast?.conditionText }}，雷达回波反射率实况 {{ currentNowcast?.radarReflectivityDbz }} dBZ，太阳辐射 {{ currentNowcast?.solarRadiationWm2 }} W/m²。
          </p>

          <!-- Minutely Bar Chart Representation -->
          <div class="pt-2">
            <div class="h-20 flex items-end gap-1.5 px-1 bg-slate-950/60 rounded-lg p-2 border border-slate-800/80">
              <div
                v-for="(slot, idx) in minutelyTimeline"
                :key="idx"
                class="flex-1 flex flex-col items-center gap-1 group relative cursor-pointer"
              >
                <!-- Tooltip on hover -->
                <div class="absolute -top-7 px-1.5 py-0.5 rounded bg-slate-900 text-[10px] font-mono border border-cyan-500/40 text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {{ slot.displayTime }}: {{ slot.precipitationMmPerHour }}mm/h
                </div>
                <div
                  class="w-full rounded-t transition-all duration-500"
                  :style="{
                    height: `${Math.max(4, (slot.precipitationMmPerHour / 25) * 60)}px`,
                    backgroundColor: slot.precipitationMmPerHour > 15
                      ? '#ef4444'
                      : slot.precipitationMmPerHour > 8
                      ? '#f97316'
                      : slot.precipitationMmPerHour > 0.5
                      ? '#06b6d4'
                      : '#10b981',
                  }"
                />
                <span class="text-[9px] text-slate-400 font-mono">{{ slot.timeOffsetMinutes }}m</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. RADAR TAB -->
      <div v-if="activeTab === 'radar'" class="space-y-4">
        <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-semibold text-slate-200">气象雷达回波序列 (dBZ)</div>
              <div class="text-[10px] text-slate-400 font-mono">5公里高空垂直剖面与反射率融合</div>
            </div>
            <button
              @click="handleToggleRadar3D"
              :class="[
                'px-2 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1 transition-all cursor-pointer',
                showRadarIn3D
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              ]"
            >
              <Layers class="w-3 h-3" />
              三维立体投影: {{ showRadarIn3D ? '开启' : '关闭' }}
            </button>
          </div>

          <!-- Radar Timeline Control -->
          <div class="flex items-center gap-2 pt-1">
            <button
              @click="toggleRadarPlay"
              class="w-7 h-7 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center hover:bg-cyan-400 transition-colors shadow-sm cursor-pointer"
            >
              <Pause v-if="isRadarPlaying" class="w-3.5 h-3.5 fill-current" />
              <Play v-else class="w-3.5 h-3.5 fill-current ml-0.5" />
            </button>
            <div class="flex-1 grid grid-cols-5 gap-1 font-mono text-[10px]">
              <button
                v-for="(f, i) in radarFrames"
                :key="i"
                @click="handleSelectRadarFrame(i)"
                :class="[
                  'py-1.5 rounded text-center transition-all cursor-pointer',
                  activeRadarIndex === i
                    ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/60 font-bold'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
                ]"
              >
                {{ f.timestamp.slice(11, 16) }}
              </button>
            </div>
          </div>

          <!-- Active Radar Frame Info -->
          <div v-if="radarFrames[activeRadarIndex]" class="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between text-[11px]">
            <span class="text-slate-300">
              峰值反射率: <strong class="text-rose-400 font-mono">{{ radarFrames[activeRadarIndex].maxDbz }} dBZ</strong>
            </span>
            <span class="text-slate-400 font-mono">
              模式: {{ radarFrames[activeRadarIndex].isExtrapolation ? '雷达短临外推预测' : '气象多普勒实况' }}
            </span>
          </div>

          <!-- dBZ Color Scale Legend -->
          <div class="space-y-1 pt-1">
            <div class="text-[10px] text-slate-400">降雨反射率等级标尺:</div>
            <div class="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 via-orange-500 to-red-600 shadow-inner" />
            <div class="flex justify-between text-[9px] text-slate-400 font-mono px-0.5">
              <span>15 (微雨)</span>
              <span>30 (小雨)</span>
              <span>45 (大雨)</span>
              <span>60+ (暴雨/强对流)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. RISKS TAB -->
      <div v-if="activeTab === 'risks'" class="space-y-3">
        <div
          v-for="warning in riskWarnings"
          :key="warning.id"
          :class="[
            'p-3 rounded-xl border transition-all space-y-2',
            warning.isMitigated
              ? 'bg-slate-900/40 border-slate-800 opacity-60'
              : warning.severity === 'critical'
              ? 'bg-rose-950/20 border-rose-500/50 shadow-[0_0_16px_rgba(244,63,94,0.15)]'
              : 'bg-amber-950/20 border-amber-500/40'
          ]"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'px-1.5 py-0.5 rounded text-[10px] font-bold font-mono',
                  warning.isMitigated
                    ? 'bg-slate-800 text-slate-400'
                    : warning.severity === 'critical'
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                ]"
              >
                {{ warning.isMitigated ? '已解除' : warning.severity === 'critical' ? '严重预警' : '中度告警' }}
              </span>
              <h3 class="font-bold text-slate-100">{{ warning.title }}</h3>
            </div>
            <button
              v-if="warning.impactedGreenhouses.length"
              @click="$emit('focusGreenhouse', warning.impactedGreenhouses[0])"
              class="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-200 transition-colors cursor-pointer"
            >
              <Eye class="w-3 h-3" /> 定位温室
            </button>
          </div>

          <p class="text-[11px] text-slate-300 leading-relaxed">{{ warning.impactDescription || warning.summary }}</p>

          <div class="text-[10px] text-slate-400">
            <strong>建议应急响应:</strong> {{ warning.aiRecommendation }}
          </div>

          <!-- Actions -->
          <div class="pt-1 flex items-center justify-between border-t border-slate-800/80">
            <span class="text-[10px] text-slate-500 font-mono">
              影响: {{ warning.impactedGreenhouses.join(', ') }}
            </span>
            <button
              v-if="!warning.isMitigated"
              @click="handleMitigate(warning)"
              class="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-md transition-all cursor-pointer"
            >
              <Zap class="w-3 h-3 fill-current" /> 一键智联防御
            </button>
            <span v-else class="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 class="w-3.5 h-3.5" /> 策略已下发执行
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
