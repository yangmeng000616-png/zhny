<script setup lang="ts">
import { computed } from 'vue';
import type { PickedObjectInfo } from '../three/GreenhouseScene';
import type {
  SensorData,
  ActuatorDevice,
  CropZone,
  AGVRobot,
  PondWaterQuality,
} from '../types/digitalTwin';
import {
  X,
  Crosshair,
  Activity,
  CheckCircle2,
  Sliders,
  Power,
  Layers,
  MapPin,
  Cpu,
  Bot,
  Droplets,
  Waves,
  Building2,
} from 'lucide-vue-next';

const props = defineProps<{
  info: PickedObjectInfo | null;
  sensors: SensorData[];
  actuators: ActuatorDevice[];
  crops: CropZone[];
  agv: AGVRobot;
  pondWater?: PondWaterQuality;
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'toggleActuator', id: string, power: boolean): void;
  (e: 'updateActuatorValue', id: string, value: number): void;
  (e: 'focusCamera'): void;
}>();

const sensor = computed(() => {
  if (!props.info) return null;
  return props.sensors.find((s) => s.id === props.info!.id) || null;
});

const actuator = computed(() => {
  if (!props.info) return null;
  return props.actuators.find((a) => a.id === props.info!.id) || null;
});

const crop = computed(() => {
  if (!props.info) return null;
  return props.crops.find((c) => c.id === props.info!.id) || null;
});

const isAGV = computed(() => {
  if (!props.info) return false;
  return props.info.id === props.agv.id || props.info.type === 'agv';
});

const isPondBuoy = computed(() => props.info?.type === 'pond_buoy');
const isWaterPump = computed(() => props.info?.type === 'water_pump_station');
const isGreenhouse = computed(() => props.info?.type === 'greenhouse');
</script>

<template>
  <div
    v-if="info"
    class="absolute top-20 right-3 left-3 sm:left-auto sm:right-74 lg:right-78 z-30 w-auto sm:w-92 bg-slate-950/50 hover:bg-slate-950/65 backdrop-blur-2xl rounded-2xl border border-cyan-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-200 transition-all duration-300"
  >
    <!-- Modal Header -->
    <div class="p-3.5 bg-slate-900/70 backdrop-blur-sm border-b border-slate-800/80 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]">
          <Waves v-if="isPondBuoy" class="w-4 h-4 text-cyan-300" />
          <Droplets v-else-if="isWaterPump" class="w-4 h-4 text-sky-400" />
          <Building2 v-else-if="isGreenhouse" class="w-4 h-4 text-emerald-400" />
          <Sliders v-else-if="actuator" class="w-4 h-4" />
          <Activity v-else-if="sensor" class="w-4 h-4" />
          <Layers v-else-if="crop" class="w-4 h-4" />
          <Bot v-else-if="isAGV" class="w-4 h-4" />
          <Cpu v-else class="w-4 h-4" />
        </div>
        <div>
          <div class="font-bold text-slate-100 text-sm flex items-center gap-1.5">
            {{ info.name }}
          </div>
          <div class="text-[10px] font-mono text-cyan-400 font-semibold">ID: {{ info.id }}</div>
        </div>
      </div>

      <button
        @click="$emit('close')"
        class="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors cursor-pointer"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Body Content -->
    <div class="p-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
      <!-- Status and 3D coordinates -->
      <div class="flex items-center justify-between bg-slate-900/60 backdrop-blur-sm p-2.5 rounded-xl border border-slate-800/80 font-mono text-[11px]">
        <div class="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <CheckCircle2 class="w-3.5 h-3.5" />
          <span>数字孪生体已同步 (Active)</span>
        </div>
        <div class="text-slate-400 flex items-center gap-1">
          <MapPin class="w-3 h-3 text-cyan-400" />
          <span>
            [{{ info.worldPosition.x.toFixed(1) }}, {{ info.worldPosition.y.toFixed(1) }}, {{ info.worldPosition.z.toFixed(1) }}]
          </span>
        </div>
      </div>

      <!-- 1. Actuator Device controls -->
      <div v-if="actuator" class="space-y-3">
        <div class="bg-slate-900/70 p-3 rounded-xl border border-slate-800/80 shadow-xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-slate-300 font-medium">电源与启闭状态:</span>
            <button
              @click="$emit('toggleActuator', actuator.id, !actuator.power)"
              :class="[
                'px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                actuator.power
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700'
              ]"
            >
              <Power class="w-3.5 h-3.5" />
              {{ actuator.power ? '运行中 (ON)' : '已停机 (OFF)' }}
            </button>
          </div>

          <div v-if="actuator.power" class="pt-2 border-t border-slate-800/80">
            <div class="flex justify-between text-xs mb-1 font-mono">
              <span class="text-slate-400 font-medium">设定调节:</span>
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
              class="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block mb-0.5">额定功率</span>
            <span class="text-amber-300 font-bold text-sm">{{ actuator.powerConsumptionKw }} kW</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block mb-0.5">累计运行时长</span>
            <span class="text-slate-200 font-bold text-sm">{{ actuator.operatingHours }} 小时</span>
          </div>
        </div>
      </div>

      <!-- 2. Sensor Node info -->
      <div v-else-if="sensor" class="space-y-3">
        <div class="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800/80 shadow-xs flex items-center justify-between">
          <div>
            <span class="text-slate-400 block text-[11px]">当前物理实时测量值</span>
            <div class="text-3xl font-mono font-bold text-slate-100 mt-1">
              {{ sensor.value }} <span class="text-sm font-normal text-cyan-400">{{ sensor.unit }}</span>
            </div>
          </div>
          <div class="text-right font-mono text-[11px]">
            <span class="text-slate-400 block mb-1">生境阈值区间</span>
            <span class="text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
              {{ sensor.targetRange[0] }} ~ {{ sensor.targetRange[1] }} {{ sensor.unit }}
            </span>
          </div>
        </div>

        <div class="bg-slate-900/70 p-3 rounded-xl border border-slate-800/80 shadow-xs">
          <span class="text-slate-400 block mb-1">所属农业功能分区</span>
          <span class="text-slate-200 font-semibold">{{ sensor.zone }}</span>
        </div>
      </div>

      <!-- 3. Crop Zone info -->
      <div v-else-if="crop" class="space-y-2.5 font-mono">
        <div class="bg-slate-900/70 p-3 rounded-xl border border-slate-800/80 shadow-xs">
          <div class="flex justify-between items-center mb-1">
            <span class="text-slate-400">生长期生理进度:</span>
            <span class="text-emerald-400 font-bold text-sm">{{ crop.growthProgress }}%</span>
          </div>
          <div class="w-full bg-slate-800/90 h-2 rounded-full overflow-hidden border border-slate-700/60">
            <div
              class="bg-emerald-500 h-full rounded-full transition-all shadow-[0_0_6px_#10b981]"
              :style="{ width: `${crop.growthProgress}%` }"
            ></div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div class="bg-slate-900/70 p-2 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block">定植日期</span>
            <span class="text-slate-200 font-bold">{{ crop.plantingDate }}</span>
          </div>
          <div class="bg-slate-900/70 p-2 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block">预计采收</span>
            <span class="text-amber-300 font-bold">{{ crop.expectedHarvest }}</span>
          </div>
          <div class="bg-slate-900/70 p-2 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block">种植面积</span>
            <span class="text-slate-200 font-bold">{{ crop.areaSqMeters }} ㎡</span>
          </div>
          <div class="bg-slate-900/70 p-2 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block">存株量</span>
            <span class="text-cyan-300 font-bold">{{ crop.stemCount }} 株</span>
          </div>
        </div>
      </div>

      <!-- 4. AGV info -->
      <div v-else-if="isAGV" class="space-y-2.5 font-mono">
        <div class="bg-slate-900/70 p-3 rounded-xl border border-slate-800/80 shadow-xs">
          <div class="text-slate-400 text-[11px] mb-1">当前自主作业巡航任务</div>
          <div class="text-slate-200 font-semibold">{{ agv.currentTask }}</div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div class="bg-slate-900/70 p-2 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block">动力电池</span>
            <span class="text-emerald-400 font-bold text-sm">{{ agv.battery }}%</span>
          </div>
          <div class="bg-slate-900/70 p-2 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block">巡航速度</span>
            <span class="text-cyan-300 font-bold text-sm">{{ agv.speed }} m/s</span>
          </div>
        </div>
      </div>

      <!-- 5. Pond Telemetry Buoy -->
      <div v-else-if="isPondBuoy && pondWater" class="space-y-3 font-mono">
        <div class="bg-slate-900/80 p-3 rounded-xl border border-cyan-500/40 shadow-xs">
          <div class="text-slate-400 text-[11px] mb-1 flex items-center justify-between">
            <span>生态蓄水河塘实时水体监测站</span>
            <span class="text-emerald-400 font-bold bg-emerald-500/15 px-1.5 py-0.5 rounded text-[10px] border border-emerald-500/30">
              {{ pondWater.qualityGrade }}
            </span>
          </div>
          <div class="text-sm font-bold text-cyan-300">太阳能5G一体化无线监测浮标</div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">河塘水位标高</span>
            <span class="text-cyan-300 font-bold text-base">{{ pondWater.waterLevelMeters.toFixed(2) }} m</span>
            <span class="text-slate-500 block text-[9px] mt-0.5">安全上限: 3.20m</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">当前蓄水储量</span>
            <span class="text-slate-200 font-bold text-base">{{ pondWater.storageCapacityM3 }} m³</span>
            <span class="text-cyan-300 block text-[9px] mt-0.5 font-semibold">库容率: {{ pondWater.capacityPercentage.toFixed(1) }}%</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">溶解氧 (DO)</span>
            <span class="text-emerald-400 font-bold text-base">{{ pondWater.dissolvedOxygen.toFixed(1) }} mg/L</span>
            <span class="text-emerald-400 block text-[9px] mt-0.5 font-medium">Ⅰ类优质水体</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">水温 (Water Temp)</span>
            <span class="text-amber-300 font-bold text-base">{{ pondWater.waterTemp.toFixed(1) }} ℃</span>
            <span class="text-slate-500 block text-[9px] mt-0.5">灌溉温差安全</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">酸碱度 (pH)</span>
            <span class="text-cyan-300 font-bold text-base">{{ pondWater.ph.toFixed(2) }}</span>
            <span class="text-slate-500 block text-[9px] mt-0.5">微碱中性</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">浊度 (Turbidity)</span>
            <span class="text-purple-300 font-bold text-base">{{ pondWater.turbidity.toFixed(1) }} NTU</span>
            <span class="text-slate-500 block text-[9px] mt-0.5">泥沙沉淀良好</span>
          </div>
        </div>
      </div>

      <!-- 6. Water Pump Station -->
      <div v-else-if="isWaterPump" class="space-y-3 font-mono">
        <div class="bg-slate-900/80 p-3 rounded-xl border border-blue-500/40 shadow-xs">
          <div class="text-slate-400 text-[11px] mb-1 flex items-center justify-between">
            <span>河塘生态取水提水泵站</span>
            <span class="text-emerald-400 font-bold bg-emerald-500/15 px-1.5 py-0.5 rounded text-[10px] border border-emerald-500/30">
              运行中 (AUTO)
            </span>
          </div>
          <div class="text-sm font-bold text-slate-100">双联变频离心提水加压泵组</div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">实时提水流量</span>
            <span class="text-cyan-300 font-bold text-base">45 m³/h</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">管网出口压力</span>
            <span class="text-emerald-400 font-bold text-base">0.38 MPa</span>
          </div>
        </div>
      </div>

      <!-- 7. Additional Greenhouses -->
      <div v-else-if="isGreenhouse" class="space-y-3">
        <div class="bg-slate-900/80 p-3 rounded-xl border border-emerald-500/40 shadow-xs">
          <div class="text-emerald-400 font-bold text-sm mb-1">{{ info.name }}</div>
          <p class="text-slate-300 text-xs leading-relaxed">
            纳入数字孪生基地统一物联网管控。配置自动化环境控制、高精度温湿度光照微气象传感节点及独立水肥滴灌管网。
          </p>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div class="bg-slate-900/70 p-2 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block">结构类型</span>
            <span class="text-slate-200 font-bold">轻钢结构连栋</span>
          </div>
          <div class="bg-slate-900/70 p-2 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block">有效栽培区</span>
            <span class="text-cyan-300 font-bold">616 ㎡</span>
          </div>
        </div>
      </div>

      <!-- General Structure info if none of the above -->
      <div v-else class="bg-slate-900/70 p-3 rounded-xl border border-slate-800/80 shadow-xs space-y-1.5">
        <div class="text-slate-400 font-medium">大棚主体结构组成:</div>
        <p class="text-slate-300 text-xs leading-relaxed">
          采用热镀锌轻钢骨架、Venlo双坡屋脊、铝合金专用天沟与排水系统，抗风压与保温密封性能优异。
        </p>
      </div>

      <!-- Action Button: Focus 3D Camera -->
      <button
        @click="$emit('focusCamera')"
        class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer border border-cyan-400/40"
      >
        <Crosshair class="w-4 h-4" />
        <span>在三维空间中近景锁定观察 (Focus)</span>
      </button>
    </div>
  </div>
</template>
