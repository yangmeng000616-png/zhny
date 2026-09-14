<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  X,
  Building2,
  Thermometer,
  Droplets,
  Gauge,
  Sun,
  Sprout,
  Crosshair,
  Maximize2,
  Sliders,
  CheckCircle2,
  Sparkles,
  Layers,
  Search,
  Filter,
} from 'lucide-vue-next';
import type {
  GreenhouseMicroclimate,
  CameraPreset,
  OutdoorWeatherSnapshot,
} from '../types/digitalTwin';

const props = defineProps<{
  visible: boolean;
  greenhouses: GreenhouseMicroclimate[];
  outdoorWeather?: OutdoorWeatherSnapshot;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'inspectGreenhouse', ghId: string): void;
  (e: 'focusGreenhouse', preset: CameraPreset): void;
}>();

// Search keyword
const searchKeyword = ref('');
// Filter type
const filterCrop = ref('all');

const filteredGreenhouses = computed(() => {
  return props.greenhouses.filter((gh) => {
    const matchText =
      gh.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      gh.cropName.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      gh.shortName.toLowerCase().includes(searchKeyword.value.toLowerCase());
    return matchText;
  });
});
</script>

<template>
  <div
    v-if="visible"
    id="greenhouse-matrix-overlay"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md transition-opacity duration-300"
    @click.self="emit('close')"
  >
    <div
      id="greenhouse-matrix-container"
      class="w-full max-w-7xl max-h-[94vh] flex flex-col bg-slate-900/95 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden text-slate-100 font-sans animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Matrix Header -->
      <header class="flex items-center justify-between px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Building2 class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-bold text-white tracking-wide">
                园区8座智能温室独立面板总览矩阵
              </h2>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                8棚独立测控节点
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              每个温室均具备独立的微气候遥测、水肥管网及执行机构，支持单棚独立控盘与三维空间巡检。
            </p>
          </div>
        </div>

        <!-- Right: Summary Counters & Close -->
        <div class="flex items-center gap-3">
          <div class="hidden md:flex items-center gap-4 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
            <div>
              <span class="text-slate-400">温室总数:</span>
              <span class="ml-1.5 font-mono font-bold text-cyan-300">8座</span>
            </div>
            <div class="w-px h-3 bg-slate-800"></div>
            <div>
              <span class="text-slate-400">设备在线率:</span>
              <span class="ml-1.5 font-mono font-bold text-emerald-400">100%</span>
            </div>
            <div class="w-px h-3 bg-slate-800"></div>
            <div>
              <span class="text-slate-400">平均适生度:</span>
              <span class="ml-1.5 font-mono font-bold text-emerald-300">97.8% (优)</span>
            </div>
          </div>

          <button
            id="btn-matrix-close"
            @click="emit('close')"
            class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="关闭面板"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </header>

      <!-- Matrix Search & Filters Bar -->
      <div class="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-2 flex-1 max-w-sm">
          <div class="relative w-full">
            <Search class="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索温室名称或作物品种..."
              class="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
            />
          </div>
        </div>

        <div class="flex items-center gap-2 text-xs text-slate-400">
          <span>室外大环境基准:</span>
          <span class="font-mono text-slate-200">{{ outdoorWeather?.temperature ?? 23.8 }}℃</span>
          <span>/</span>
          <span class="font-mono text-slate-200">{{ outdoorWeather?.humidity ?? 54.2 }}% RH</span>
          <span>(与棚内自动隔离调控)</span>
        </div>
      </div>

      <!-- 8 Greenhouse Grid (2 cols on md, 4 cols on xl) -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="gh in filteredGreenhouses"
            :key="gh.id"
            :id="`matrix-card-${gh.id}`"
            class="bg-slate-850/90 rounded-xl border border-slate-750 hover:border-cyan-500/50 transition-all p-3.5 flex flex-col justify-between shadow-md hover:shadow-cyan-950/30 group"
          >
            <!-- Card Header -->
            <div>
              <div class="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <h3 class="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {{ gh.shortName }}
                    </h3>
                  </div>
                  <div class="text-[11px] text-slate-400 truncate max-w-[190px]">
                    {{ gh.name }}
                  </div>
                </div>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                  {{ gh.agronomy?.healthIndex ?? 98.2 }}%
                </span>
              </div>

              <!-- Crop & Structure badge -->
              <div class="flex items-center gap-1.5 mb-3 flex-wrap">
                <span class="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 text-[10px] font-medium">
                  {{ gh.cropName }}
                </span>
                <span class="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[10px]">
                  {{ gh.structureType.split(' ')[0] }}
                </span>
              </div>

              <!-- 4 Telemetry Metrics Grid -->
              <div class="grid grid-cols-2 gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 text-xs mb-3">
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Thermometer class="w-3 h-3 text-amber-400" />
                    气温
                  </span>
                  <span class="font-mono font-bold text-white">{{ gh.airTemp }}℃</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Droplets class="w-3 h-3 text-cyan-400" />
                    湿度
                  </span>
                  <span class="font-mono font-bold text-white">{{ gh.airHumidity }}%</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Gauge class="w-3 h-3 text-emerald-400" />
                    CO₂
                  </span>
                  <span class="font-mono font-bold text-white">{{ gh.co2 }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Sun class="w-3 h-3 text-yellow-400" />
                    光照
                  </span>
                  <span class="font-mono font-bold text-white">{{ gh.lightLux }}k</span>
                </div>
              </div>

              <!-- Special Metric Feature for this specific greenhouse -->
              <div class="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between mb-3">
                <span class="text-slate-400">{{ gh.specialMetric?.label ?? '生境特异指标' }}:</span>
                <span class="font-mono font-bold text-cyan-300">{{ gh.specialMetric?.value ?? '正常' }}</span>
              </div>
            </div>

            <!-- Card Bottom Action Buttons -->
            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <!-- Open Dedicated Station Panel -->
              <button
                :id="`btn-inspect-${gh.id}`"
                @click="emit('inspectGreenhouse', gh.id)"
                class="py-1.5 px-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Sliders class="w-3.5 h-3.5" />
                <span>独立面板</span>
              </button>

              <!-- 3D Focus Camera -->
              <button
                :id="`btn-focus-${gh.id}`"
                @click="emit('focusGreenhouse', gh.presetKey)"
                class="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Crosshair class="w-3.5 h-3.5" />
                <span>3D聚焦</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
