<script setup lang="ts">
import { ref } from 'vue';
import {
  Layers,
  Thermometer,
  Droplets,
  Sun,
  Activity,
  Sliders,
  X,
} from 'lucide-vue-next';
import type { EnvironmentFieldType } from '../types/digitalTwin';

const props = defineProps<{
  visible: boolean;
  activeField: EnvironmentFieldType;
  sliceHeight: number;
  opacity: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updateField', type: EnvironmentFieldType): void;
  (e: 'updateHeight', height: number): void;
  (e: 'updateOpacity', opacity: number): void;
}>();

const fieldOptions: { type: EnvironmentFieldType; label: string; icon: any; colorClass: string; unit: string }[] = [
  { type: 'none', label: '关闭连续场', icon: X, colorClass: 'text-slate-400', unit: '' },
  { type: 'temp', label: '空间温度场', icon: Thermometer, colorClass: 'text-amber-400', unit: '℃' },
  { type: 'humidity', label: '空间湿度场', icon: Droplets, colorClass: 'text-cyan-400', unit: '%' },
  { type: 'co2', label: 'CO₂浓度场', icon: Activity, colorClass: 'text-emerald-400', unit: 'ppm' },
  { type: 'light', label: '光合辐射(PAR)', icon: Sun, colorClass: 'text-yellow-400', unit: 'μmol' },
  { type: 'soil_moisture', label: '土壤墒情场', icon: Layers, colorClass: 'text-teal-400', unit: '%' },
];
</script>

<template>
  <div
    v-if="visible"
    class="fixed bottom-24 left-3 sm:left-74 z-40 w-[300px] max-w-[90vw] bg-slate-950/65 hover:bg-slate-950/80 backdrop-blur-2xl rounded-2xl border border-cyan-500/30 shadow-[0_16px_48px_rgba(0,0,0,0.85)] ring-1 ring-white/10 text-slate-100 p-3 space-y-2.5 pointer-events-auto transition-all duration-300"
  >
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
          <Layers class="w-3.5 h-3.5" />
        </div>
        <h3 class="text-xs font-bold text-white tracking-wide">
          大棚三维环境连续场与剖切分析
        </h3>
      </div>
      <button
        @click="$emit('close')"
        class="text-slate-400 hover:text-white transition-colors"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Field Type Selector -->
    <div class="grid grid-cols-3 gap-1.5 text-[11px]">
      <button
        v-for="opt in fieldOptions"
        :key="opt.type"
        @click="$emit('updateField', opt.type)"
        :class="[
          'px-2 py-1.5 rounded-lg font-medium transition-all flex flex-col items-center gap-1 text-center',
          activeField === opt.type
            ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/60 font-semibold shadow-xs'
            : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
        ]"
      >
        <component :is="opt.icon" class="w-3.5 h-3.5" :class="opt.colorClass" />
        <span class="truncate w-full">{{ opt.label }}</span>
      </button>
    </div>

    <!-- Active Field Controls (Height & Opacity Sliders) -->
    <div v-if="activeField !== 'none'" class="space-y-2.5 pt-1 border-t border-slate-800/80 text-xs">
      <!-- Height Slider -->
      <div>
        <div class="flex items-center justify-between text-[10px] text-slate-400 mb-1">
          <span class="flex items-center gap-1">
            <Sliders class="w-3 h-3 text-cyan-400" /> 水平剖切面高度 (Z轴):
          </span>
          <span class="font-mono text-cyan-300 font-bold">{{ sliceHeight.toFixed(1) }} 米</span>
        </div>
        <input
          type="range"
          min="0.6"
          max="5.5"
          step="0.1"
          :value="sliceHeight"
          @input="$emit('updateHeight', +($event.target as HTMLInputElement).value)"
          class="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
        <div class="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
          <span>0.6m (根区)</span>
          <span>2.5m (冠层)</span>
          <span>5.5m (脊线)</span>
        </div>
      </div>

      <!-- Opacity Slider -->
      <div>
        <div class="flex items-center justify-between text-[10px] text-slate-400 mb-1">
          <span>透明度:</span>
          <span class="font-mono text-cyan-300 font-bold">{{ Math.round(opacity * 100) }}%</span>
        </div>
        <input
          type="range"
          min="0.2"
          max="1.0"
          step="0.05"
          :value="opacity"
          @input="$emit('updateOpacity', +($event.target as HTMLInputElement).value)"
          class="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>

      <!-- Real-time Gradient Color Scale Legend -->
      <div class="pt-1">
        <div class="text-[10px] text-slate-400 mb-1">
          场梯度标尺
          <span v-if="activeField === 'temp'">(18℃ ~ 36℃)</span>
          <span v-else-if="activeField === 'humidity'">(50% ~ 95%)</span>
          <span v-else-if="activeField === 'co2'">(450ppm ~ 1100ppm)</span>
          <span v-else-if="activeField === 'light'">(0 ~ 45 klux)</span>
          <span v-else-if="activeField === 'soil_moisture'">(40% ~ 90%)</span>:
        </div>
        <div class="h-2 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 via-emerald-400 via-amber-400 to-rose-500 shadow-inner" />
        <div class="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
          <span>低值区域</span>
          <span>适宜区</span>
          <span>高温/偏高区</span>
        </div>
      </div>
    </div>
  </div>
</template>
