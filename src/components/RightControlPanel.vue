<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ActuatorDevice } from '../types/digitalTwin';
import {
  Fan,
  Droplet,
  SunDim,
  Lightbulb,
  Maximize2,
  Power,
  ChevronRight,
  ChevronLeft,
  Bot,
  SlidersHorizontal,
  Zap,
  RotateCw,
  Flame,
} from 'lucide-vue-next';

const props = defineProps<{
  actuators: ActuatorDevice[];
  autoMode: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggleActuator', id: string, power: boolean): void;
  (e: 'updateActuatorValue', id: string, value: number): void;
  (e: 'toggleAutoMode'): void;
  (e: 'focusDevice', deviceId: string): void;
}>();

const collapsed = ref(false);

const totalPowerKw = computed(() => {
  return props.actuators
    .filter((a) => a.power)
    .reduce((acc, curr) => acc + curr.powerConsumptionKw, 0);
});
</script>

<template>
  <div
    :class="[
      'absolute top-20 right-3 bottom-12 z-20 transition-all duration-300 pointer-events-none flex items-start',
      collapsed ? 'translate-x-[calc(100%-12px)]' : 'translate-x-0'
    ]"
  >
    <!-- Collapse/Expand Handle Button -->
    <button
      @click="collapsed = !collapsed"
      class="pointer-events-auto mt-6 -mr-1 bg-slate-900/90 hover:bg-slate-850 text-cyan-400 hover:text-cyan-200 p-1 rounded-l-lg border-y border-l border-cyan-500/30 shadow-lg backdrop-blur-md transition-colors cursor-pointer"
      :title="collapsed ? '展开控制面板' : '折叠控制面板'"
    >
      <ChevronLeft v-if="collapsed" class="w-4 h-4" />
      <ChevronRight v-else class="w-4 h-4" />
    </button>

    <!-- Main Panel Box -->
    <div class="pointer-events-auto w-72 sm:w-84 h-full max-h-[calc(100vh-140px)] flex flex-col bg-slate-950/80 hover:bg-slate-950/90 backdrop-blur-2xl rounded-2xl border border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10 overflow-hidden transition-all duration-300">
      <!-- Header -->
      <div class="p-3.5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm flex items-center justify-between">
        <div class="flex items-center gap-2">
          <SlidersHorizontal class="w-4 h-4 text-cyan-400" />
          <h2 class="text-xs font-bold text-slate-100 tracking-wider uppercase">
            智能执行机构动态映射 (Actuators)
          </h2>
        </div>
        <div class="flex items-center gap-1.5 text-[10px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold backdrop-blur-xs">
          <Zap class="w-3 h-3 text-amber-400" />
          {{ totalPowerKw.toFixed(1) }} kW
        </div>
      </div>

      <!-- Mode Toggle Banner -->
      <div class="px-3 py-2 bg-slate-900/40 backdrop-blur-sm border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div class="flex items-center gap-1.5 text-slate-300 font-semibold">
          <Bot :class="['w-4 h-4', autoMode ? 'text-emerald-400' : 'text-slate-500']" />
          <span>{{ autoMode ? 'AI 策略自适应托管' : '人工直接手动遥控' }}</span>
        </div>
        <button
          @click="$emit('toggleAutoMode')"
          :class="[
            'px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer',
            autoMode
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          ]"
        >
          {{ autoMode ? '托管中' : '切为自动' }}
        </button>
      </div>

      <!-- Actuator Cards List -->
      <div class="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
        <div
          v-for="actuator in actuators"
          :key="actuator.id"
          :class="[
            'p-3 rounded-xl border transition-all',
            actuator.power
              ? 'bg-slate-900/80 hover:bg-slate-900 border-cyan-500/40 shadow-[0_0_16px_rgba(6,182,212,0.15)]'
              : 'bg-slate-900/40 hover:bg-slate-900/60 border-slate-800/80 opacity-75'
          ]"
        >
          <!-- Title and On/Off switch -->
          <div class="flex items-center justify-between mb-2">
            <div
              @click="$emit('focusDevice', actuator.id)"
              class="flex items-center gap-2 cursor-pointer group"
              title="点击在三维模型中定位"
            >
              <div
                :class="[
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                  actuator.power
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/60'
                ]"
              >
                <Fan v-if="actuator.type === 'fan'" :class="['w-4 h-4', actuator.power ? 'animate-spin' : '']" />
                <Maximize2 v-else-if="actuator.type === 'roof_vent'" class="w-4 h-4" />
                <SunDim v-else-if="actuator.type === 'shade_curtain'" class="w-4 h-4" />
                <Droplet v-else-if="actuator.type === 'irrigation_pump'" class="w-4 h-4" />
                <Lightbulb v-else-if="actuator.type === 'grow_light'" class="w-4 h-4 text-amber-300" />
                <RotateCw v-else-if="actuator.type === 'wet_curtain'" class="w-4 h-4" />
                <Flame v-else-if="actuator.type === 'heater'" class="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div class="font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                  {{ actuator.name }}
                </div>
                <div class="text-[10px] text-slate-400 font-mono">
                  {{ actuator.zone }} · {{ actuator.powerConsumptionKw }}kW
                </div>
              </div>
            </div>

            <!-- Power Button -->
            <button
              @click="$emit('toggleActuator', actuator.id, !actuator.power)"
              :class="[
                'w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer',
                actuator.power
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                  : 'bg-slate-800 text-slate-500 hover:text-slate-200 hover:bg-slate-700 border border-slate-700'
              ]"
              :title="actuator.power ? '关闭设备' : '开启设备'"
            >
              <Power class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Range Slider for devices with adjustable speed/angle/brightness -->
          <div v-if="actuator.power" class="mt-2 pt-2 border-t border-slate-800/80">
            <div class="flex items-center justify-between text-[11px] mb-1 font-mono">
              <span class="text-slate-400 font-medium">输出调节</span>
              <span class="text-cyan-300 font-bold">
                {{ actuator.value }} {{ actuator.metricUnit }}
              </span>
            </div>
            <input
              type="range"
              :min="0"
              :max="actuator.type === 'roof_vent' ? 60 : 100"
              :value="actuator.value"
              @input="(e) => $emit('updateActuatorValue', actuator.id, Number((e.target as HTMLInputElement).value))"
              class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      </div>

      <!-- Footer info -->
      <div class="p-2.5 bg-slate-950/80 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
        <span>总运行工时累计: 6,790 h</span>
        <span class="text-cyan-300 font-semibold">● 设备闭环映射中</span>
      </div>
    </div>
  </div>
</template>
