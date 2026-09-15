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
  Crosshair,
  Layers,
} from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    actuators: ActuatorDevice[];
    autoMode: boolean;
    collapsed?: boolean;
  }>(),
  {
    collapsed: false,
  }
);

const emit = defineEmits<{
  (e: 'toggleActuator', id: string, power: boolean): void;
  (e: 'updateActuatorValue', id: string, value: number): void;
  (e: 'toggleAutoMode'): void;
  (e: 'focusDevice', deviceId: string): void;
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

// Category filtering for clear subsystem organization
const selectedCategory = ref<'all' | 'ventilation' | 'shading' | 'irrigation' | 'light_heat'>('all');

const filteredActuators = computed(() => {
  if (selectedCategory.value === 'all') return props.actuators;
  if (selectedCategory.value === 'ventilation') {
    return props.actuators.filter((a) => ['fan', 'roof_vent', 'wet_curtain'].includes(a.type));
  }
  if (selectedCategory.value === 'shading') {
    return props.actuators.filter((a) => ['shade_curtain'].includes(a.type));
  }
  if (selectedCategory.value === 'irrigation') {
    return props.actuators.filter((a) => ['irrigation_pump'].includes(a.type));
  }
  if (selectedCategory.value === 'light_heat') {
    return props.actuators.filter((a) => ['grow_light', 'heater'].includes(a.type));
  }
  return props.actuators;
});

const totalPowerKw = computed(() => {
  return props.actuators
    .filter((a) => a.power)
    .reduce((acc, curr) => acc + curr.powerConsumptionKw, 0);
});

const activeCount = computed(() => props.actuators.filter((a) => a.power).length);

const handleBatchPreset = (preset: 'cooling' | 'all_off') => {
  if (preset === 'all_off') {
    props.actuators.forEach((a) => {
      if (a.power) emit('toggleActuator', a.id, false);
    });
  } else if (preset === 'cooling') {
    props.actuators.forEach((a) => {
      if (['fan', 'roof_vent', 'wet_curtain'].includes(a.type)) {
        if (!a.power) emit('toggleActuator', a.id, true);
        emit('updateActuatorValue', a.id, 80);
      }
    });
  }
};
</script>

<template>
  <div
    :class="[
      'absolute top-[64px] right-3 bottom-5 z-20 transition-all duration-300 pointer-events-none flex items-start select-none',
      isCollapsed ? 'translate-x-[calc(100%-12px)]' : 'translate-x-0'
    ]"
  >
    <!-- Collapse/Expand Handle Button on Left Edge of Right Panel -->
    <button
      @click="isCollapsed = !isCollapsed"
      class="pointer-events-auto mt-6 -mr-1 bg-slate-950/70 hover:bg-slate-900/90 text-cyan-400 hover:text-cyan-200 p-1.5 rounded-l-xl border-y border-l border-white/10 shadow-lg backdrop-blur-xl transition-colors cursor-pointer"
      :title="isCollapsed ? '展开右侧控制面板' : '折叠右侧控制面板'"
    >
      <ChevronLeft v-if="isCollapsed" class="w-4 h-4" />
      <ChevronRight v-else class="w-4 h-4" />
    </button>

    <!-- Main Panel Box: Translucent Frosted Glass Cockpit -->
    <div
      class="pointer-events-auto w-76 sm:w-82 h-full max-h-[calc(100vh-88px)] flex flex-col bg-slate-950/65 hover:bg-slate-950/75 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.65)] ring-1 ring-white/5 overflow-hidden transition-all duration-300 text-xs"
    >
      <!-- Zone 2: Clear Functional Zone Identifier Header -->
      <div class="px-3 py-2 border-b border-white/10 bg-slate-900/40 backdrop-blur-md flex items-center justify-between">
        <div class="flex items-center gap-2 min-w-0">
          <span class="px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 shrink-0">
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            右区 · 大屏控制
          </span>
          <h2 class="text-[11px] font-semibold text-slate-200 truncate">
            执行机构遥控调度
          </h2>
        </div>
        <div class="flex items-center gap-1 text-[9px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold shrink-0">
          <Zap class="w-2.5 h-2.5 text-amber-400" />
          {{ totalPowerKw.toFixed(1) }} kW
        </div>
      </div>

      <!-- AI Strategy / Manual Dispatch Mode Bar -->
      <div class="px-3 py-2 bg-slate-950/30 border-b border-white/10 flex items-center justify-between text-xs">
        <div class="flex items-center gap-2">
          <Bot :class="['w-3.5 h-3.5', autoMode ? 'text-emerald-400' : 'text-slate-400']" />
          <div>
            <div class="text-[11px] font-medium text-slate-200">
              {{ autoMode ? 'AI 策略自主托管' : '人工手动遥控调度' }}
            </div>
            <div class="text-[9px] text-slate-400 font-mono">
              {{ autoMode ? '闭环自适应平衡' : '操作员直接下发指令' }}
            </div>
          </div>
        </div>
        <button
          @click="$emit('toggleAutoMode')"
          :class="[
            'px-2 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer border',
            autoMode
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-xs'
              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
          ]"
        >
          {{ autoMode ? '托管中' : '切为自动' }}
        </button>
      </div>

      <!-- Subsystem Category Filter Tabs -->
      <div class="p-2 border-b border-white/10 bg-slate-950/20 flex items-center gap-1 overflow-x-auto no-scrollbar text-[10px]">
        <button
          v-for="tab in [
            { id: 'all', label: '全部', count: actuators.length },
            { id: 'ventilation', label: '通风降温' },
            { id: 'shading', label: '遮阳保温' },
            { id: 'irrigation', label: '灌溉水肥' },
            { id: 'light_heat', label: '补光加热' }
          ]"
          :key="tab.id"
          @click="selectedCategory = tab.id as any"
          :class="[
            'px-2 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 border text-[10px]',
            selectedCategory === tab.id
              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200 font-medium'
              : 'bg-slate-900/40 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Quick Batch Actions Toolbar -->
      <div class="px-3 py-1.5 bg-slate-900/30 border-b border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>当前运行: <strong class="text-cyan-300 font-semibold">{{ activeCount }}</strong> / {{ actuators.length }} 台</span>
        <div class="flex items-center gap-1">
          <button
            @click="handleBatchPreset('cooling')"
            class="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 text-cyan-300 border border-white/5 text-[9px] cursor-pointer transition-colors"
            title="一键开启降温设备(风机、天窗、湿帘)"
          >
            一键降温
          </button>
          <button
            @click="handleBatchPreset('all_off')"
            class="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 text-rose-300 border border-white/5 text-[9px] cursor-pointer transition-colors"
            title="关闭当前所有开启设备"
          >
            全关复位
          </button>
        </div>
      </div>

      <!-- Actuator Cards Scrollable List -->
      <div class="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
        <div
          v-for="actuator in filteredActuators"
          :key="actuator.id"
          :class="[
            'p-2.5 rounded-xl border backdrop-blur-md transition-all',
            actuator.power
              ? 'bg-slate-900/50 hover:bg-slate-900/70 border-cyan-400/30 shadow-[0_4px_16px_rgba(6,182,212,0.1)]'
              : 'bg-slate-900/30 hover:bg-slate-900/50 border-white/5 opacity-75 hover:opacity-100'
          ]"
        >
          <!-- Title, Positioning and On/Off switch -->
          <div class="flex items-center justify-between gap-1.5">
            <div
              @click="$emit('focusDevice', actuator.id)"
              class="flex items-center gap-2 cursor-pointer group min-w-0 flex-1"
              title="点击在三维孪生场景中定位"
            >
              <div
                :class="[
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0',
                  actuator.power
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-800/60 text-slate-500 border border-white/10'
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
              <div class="min-w-0 flex-1">
                <div class="font-medium text-slate-100 group-hover:text-cyan-300 transition-colors text-xs truncate flex items-center gap-1">
                  <span>{{ actuator.name }}</span>
                </div>
                <div class="text-[10px] text-slate-400 font-mono truncate">
                  {{ actuator.zone }} · {{ actuator.powerConsumptionKw }}kW
                </div>
              </div>
            </div>

            <!-- Focus & Power Controls -->
            <div class="flex items-center gap-1 shrink-0">
              <button
                @click="$emit('focusDevice', actuator.id)"
                class="w-6 h-6 rounded-lg flex items-center justify-center bg-slate-800/60 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 border border-white/10 transition-colors cursor-pointer"
                title="3D视界定位"
              >
                <Crosshair class="w-3 h-3" />
              </button>

              <button
                @click="$emit('toggleActuator', actuator.id, !actuator.power)"
                :class="[
                  'w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer',
                  actuator.power
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                    : 'bg-slate-800/80 text-slate-500 hover:text-slate-200 hover:bg-slate-750 border border-white/10'
                ]"
                :title="actuator.power ? '关闭设备' : '开启设备'"
              >
                <Power class="w-3 h-3" />
              </button>
            </div>
          </div>

          <!-- Range Slider for devices with adjustable speed/angle/brightness -->
          <div v-if="actuator.power" class="mt-2 pt-1.5 border-t border-white/10">
            <div class="flex items-center justify-between text-[10px] mb-1 font-mono">
              <span class="text-slate-400">输出调节</span>
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
              class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      </div>

      <!-- Footer info -->
      <div class="p-2.5 bg-slate-950/40 backdrop-blur-md border-t border-white/10 text-[10px] text-slate-400 flex items-center justify-between">
        <span class="font-mono">工时累计: 6,790h</span>
        <span class="text-cyan-300 font-semibold flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          3D映射协同中
        </span>
      </div>
    </div>
  </div>
</template>
