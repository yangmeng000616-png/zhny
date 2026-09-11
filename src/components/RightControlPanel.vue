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
      class="pointer-events-auto mt-6 -mr-1 bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 p-1 rounded-l-lg border-y border-l border-white/80 shadow-md backdrop-blur-md transition-colors"
      :title="collapsed ? '展开控制面板' : '折叠控制面板'"
    >
      <ChevronLeft v-if="collapsed" class="w-4 h-4" />
      <ChevronRight v-else class="w-4 h-4" />
    </button>

    <!-- Main Panel Box -->
    <div class="pointer-events-auto w-72 sm:w-84 h-full max-h-[calc(100vh-140px)] flex flex-col bg-white/75 backdrop-blur-2xl rounded-2xl border border-white/80 shadow-2xl shadow-slate-300/40 overflow-hidden">
      <!-- Header -->
      <div class="p-3.5 border-b border-slate-200/70 bg-white/40 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <SlidersHorizontal class="w-4 h-4 text-cyan-600" />
          <h2 class="text-xs font-bold text-slate-800 tracking-wider uppercase">
            智能执行机构动态映射 (Actuators)
          </h2>
        </div>
        <div class="flex items-center gap-1.5 text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-semibold">
          <Zap class="w-3 h-3" />
          {{ totalPowerKw.toFixed(1) }} kW
        </div>
      </div>

      <!-- Mode Toggle Banner -->
      <div class="px-3 py-2 bg-slate-100/40 border-b border-slate-200/70 flex items-center justify-between text-xs">
        <div class="flex items-center gap-1.5 text-slate-700 font-semibold">
          <Bot :class="['w-4 h-4', autoMode ? 'text-emerald-600' : 'text-slate-400']" />
          <span>{{ autoMode ? 'AI 策略自适应托管' : '人工直接手动遥控' }}</span>
        </div>
        <button
          @click="$emit('toggleAutoMode')"
          :class="[
            'px-2 py-1 rounded-lg text-[11px] font-semibold transition-all',
            autoMode
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
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
              ? 'bg-white/80 border-cyan-300/80 shadow-xs'
              : 'bg-white/40 border-slate-200/60 opacity-80'
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
                    ? 'bg-cyan-50 text-cyan-600 border border-cyan-200'
                    : 'bg-slate-100 text-slate-400'
                ]"
              >
                <Fan v-if="actuator.type === 'fan'" :class="['w-4 h-4', actuator.power ? 'animate-spin' : '']" />
                <Maximize2 v-else-if="actuator.type === 'roof_vent'" class="w-4 h-4" />
                <SunDim v-else-if="actuator.type === 'shade_curtain'" class="w-4 h-4" />
                <Droplet v-else-if="actuator.type === 'irrigation_pump'" class="w-4 h-4" />
                <Lightbulb v-else-if="actuator.type === 'grow_light'" class="w-4 h-4" />
                <RotateCw v-else-if="actuator.type === 'wet_curtain'" class="w-4 h-4" />
              </div>
              <div>
                <div class="font-semibold text-slate-800 group-hover:text-cyan-600 transition-colors flex items-center gap-1">
                  {{ actuator.name }}
                </div>
                <div class="text-[10px] text-slate-500 font-mono">
                  {{ actuator.zone }} · {{ actuator.powerConsumptionKw }}kW
                </div>
              </div>
            </div>

            <!-- Power Button -->
            <button
              @click="$emit('toggleActuator', actuator.id, !actuator.power)"
              :class="[
                'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                actuator.power
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200'
              ]"
              :title="actuator.power ? '关闭设备' : '开启设备'"
            >
              <Power class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Range Slider for devices with adjustable speed/angle/brightness -->
          <div v-if="actuator.power" class="mt-2 pt-2 border-t border-slate-200/70">
            <div class="flex items-center justify-between text-[11px] mb-1 font-mono">
              <span class="text-slate-500 font-medium">输出调节</span>
              <span class="text-cyan-700 font-bold">
                {{ actuator.value }} {{ actuator.metricUnit }}
              </span>
            </div>
            <input
              type="range"
              :min="0"
              :max="actuator.type === 'roof_vent' ? 60 : 100"
              :value="actuator.value"
              @input="(e) => $emit('updateActuatorValue', actuator.id, Number((e.target as HTMLInputElement).value))"
              class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
          </div>
        </div>
      </div>

      <!-- Footer info -->
      <div class="p-2.5 bg-slate-50/70 border-t border-slate-200/80 text-[10px] text-slate-500 flex items-center justify-between">
        <span>总运行工时累计: 6,790 h</span>
        <span class="text-cyan-700 font-medium">设备闭环映射中</span>
      </div>
    </div>
  </div>
</template>
