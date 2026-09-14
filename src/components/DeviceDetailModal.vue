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
  Plane,
  Truck,
  Warehouse,
  Sun,
  Zap,
  Gauge,
  ThermometerSnowflake,
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
  (e: 'openStation', id: string): void;
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
const isDroneDock = computed(() => props.info?.type === 'facility_drone_dock' || props.info?.id === 'facility_drone_dock');
const isColdChain = computed(() => props.info?.type === 'facility_coldchain' || props.info?.id === 'facility_coldchain');
const isFertigation = computed(() => props.info?.type === 'facility_fertigation' || props.info?.id === 'facility_fertigation_tanks');
const isSmartField = computed(() => props.info?.type === 'facility_smart_field' || props.info?.id === 'facility_smart_field');
const isFluxTower = computed(() => props.info?.type === 'facility_flux_tower' || props.info?.id === 'facility_flux_tower');
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
          <Plane v-if="isDroneDock" class="w-4 h-4 text-cyan-300" />
          <Truck v-else-if="isColdChain" class="w-4 h-4 text-sky-400" />
          <Warehouse v-else-if="isFertigation" class="w-4 h-4 text-amber-400" />
          <Sun v-else-if="isSmartField" class="w-4 h-4 text-lime-400" />
          <Activity v-else-if="isFluxTower" class="w-4 h-4 text-violet-400" />
          <Waves v-else-if="isPondBuoy" class="w-4 h-4 text-cyan-300" />
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

      <!-- 7. Autonomous Drone Docking Station -->
      <div v-else-if="isDroneDock" class="space-y-3 font-mono">
        <div class="bg-slate-900/80 p-3 rounded-xl border border-cyan-500/40 shadow-xs">
          <div class="text-slate-400 text-[11px] mb-1 flex items-center justify-between">
            <span>全自主无人机巡检机巢</span>
            <span class="text-emerald-400 font-bold bg-emerald-500/15 px-1.5 py-0.5 rounded text-[10px] border border-emerald-500/30">
              就绪待命 (STANDBY)
            </span>
          </div>
          <div class="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
            <Plane class="w-4 h-4 text-cyan-400" />
            <span>DJI Matrice 350 RTK + 多光谱相机</span>
          </div>
          <p class="text-slate-300 text-xs mt-1.5 font-sans leading-relaxed">
            支持全园区空中正射多光谱巡检、作物长势NDVI反演、病虫害热红外预警与温室屋面巡查。
          </p>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">机载电池电量</span>
            <span class="text-emerald-400 font-bold text-base">100%</span>
            <span class="text-slate-500 block text-[9px] mt-0.5">快充对接中</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">RTK差分基站</span>
            <span class="text-cyan-300 font-bold text-base">FIX 定位</span>
            <span class="text-emerald-400 block text-[9px] mt-0.5">定位精度 ±1.5cm</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">舱门状态</span>
            <span class="text-slate-200 font-bold text-base">闭合防尘</span>
            <span class="text-slate-500 block text-[9px] mt-0.5">温控除湿正常</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">气象适航判定</span>
            <span class="text-emerald-400 font-bold text-base">优良适飞</span>
            <span class="text-slate-500 block text-[9px] mt-0.5">风速&lt;6.5m/s</span>
          </div>
        </div>
      </div>

      <!-- 8. Cold Chain Logistics Center -->
      <div v-else-if="isColdChain" class="space-y-3 font-mono">
        <div class="bg-slate-900/80 p-3 rounded-xl border border-sky-500/40 shadow-xs">
          <div class="text-slate-400 text-[11px] mb-1 flex items-center justify-between">
            <span>农产品冷链物流与采后分选中心</span>
            <span class="text-sky-400 font-bold bg-sky-500/15 px-1.5 py-0.5 rounded text-[10px] border border-sky-500/30">
              保鲜中
            </span>
          </div>
          <div class="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            <Truck class="w-4 h-4 text-sky-400" />
            <span>气调冷库 + 光电果蔬分选流水线</span>
          </div>
          <p class="text-slate-300 text-xs mt-1.5 font-sans leading-relaxed">
            自动化糖度/果径双通道光电分级机运行中，采后预冷4小时降至休眠温区，保鲜期延长3.5倍。
          </p>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">气调库温</span>
            <span class="text-cyan-300 font-bold text-base">2.8 ℃</span>
            <span class="text-slate-500 block text-[9px] mt-0.5">设定范围: 1.5~4.0℃</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">相对湿度 (RH)</span>
            <span class="text-emerald-400 font-bold text-base">92 %</span>
            <span class="text-emerald-400 block text-[9px] mt-0.5">超声雾化抑蒸腾</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">日分选产能</span>
            <span class="text-slate-200 font-bold text-base">15.0 吨/天</span>
            <span class="text-slate-500 block text-[9px] mt-0.5">今日已完成 8.4吨</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">装卸泊位</span>
            <span class="text-amber-400 font-bold text-base">1号车装载中</span>
            <span class="text-slate-500 block text-[9px] mt-0.5">苏A·89K25 (冷藏)</span>
          </div>
        </div>
      </div>

      <!-- 9. Central Fertigation Storage Tanks -->
      <div v-else-if="isFertigation" class="space-y-3 font-mono">
        <div class="bg-slate-900/80 p-3 rounded-xl border border-amber-500/40 shadow-xs">
          <div class="text-slate-400 text-[11px] mb-1 flex items-center justify-between">
            <span>水肥一体化中央母液储罐群</span>
            <span class="text-emerald-400 font-bold bg-emerald-500/15 px-1.5 py-0.5 rounded text-[10px] border border-emerald-500/30">
              精确配液中
            </span>
          </div>
          <div class="text-sm font-bold text-amber-300 flex items-center gap-1.5">
            <Warehouse class="w-4 h-4 text-amber-400" />
            <span>3联装高位母液储罐 (A/B/C) + 原水罐</span>
          </div>
          <p class="text-slate-300 text-xs mt-1.5 font-sans leading-relaxed">
            独立微机控制文丘里比例注肥器，依据各温室作物品种动态下发EC与pH目标曲线。
          </p>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">A罐(钙/硝态氮)</span>
            <span class="text-cyan-300 font-bold text-base">82 % 液位</span>
            <span class="text-slate-500 block text-[9px] mt-0.5">储量: 16.4 m³</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">B罐(磷钾微量)</span>
            <span class="text-emerald-400 font-bold text-base">78 % 液位</span>
            <span class="text-slate-500 block text-[9px] mt-0.5">储量: 15.6 m³</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">在线电导率 (EC)</span>
            <span class="text-amber-400 font-bold text-base">2.20 mS/cm</span>
            <span class="text-slate-500 block text-[9px] mt-0.5">目标: 2.20 ±0.05</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">酸碱度 (pH)</span>
            <span class="text-purple-300 font-bold text-base">6.25</span>
            <span class="text-emerald-400 block text-[9px] mt-0.5">最佳微酸吸收域</span>
          </div>
        </div>
      </div>

      <!-- 10. Smart Field Trial Zone -->
      <div v-else-if="isSmartField" class="space-y-3 font-mono">
        <div class="bg-slate-900/80 p-3 rounded-xl border border-lime-500/40 shadow-xs">
          <div class="text-slate-400 text-[11px] mb-1 flex items-center justify-between">
            <span>智慧大田物联网试验区 (50亩)</span>
            <span class="text-lime-400 font-bold bg-lime-500/15 px-1.5 py-0.5 rounded text-[10px] border border-lime-500/30">
              墒情正常
            </span>
          </div>
          <div class="text-sm font-bold text-lime-300 flex items-center gap-1.5">
            <Sun class="w-4 h-4 text-lime-400" />
            <span>智能杀虫灯 + 多层墒情管 + 水肥地埋管</span>
          </div>
          <p class="text-slate-300 text-xs mt-1.5 font-sans leading-relaxed">
            布设4通道分层管式土壤温湿度传感器，联动太阳能风吸式杀虫灯与虫情测报仪，绿色防控覆盖率100%。
          </p>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">表层20cm土壤墒情</span>
            <span class="text-cyan-300 font-bold text-base">24.5 %</span>
            <span class="text-slate-500 block text-[9px] mt-0.5">适宜田间持水量</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">地温 (Soil Temp)</span>
            <span class="text-emerald-400 font-bold text-base">21.8 ℃</span>
            <span class="text-slate-500 block text-[9px] mt-0.5">根系生理活性高</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">绿色杀虫灯</span>
            <span class="text-lime-400 font-bold text-base">2台 待机</span>
            <span class="text-slate-500 block text-[9px] mt-0.5">光控夜间自启</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">智能水肥分区</span>
            <span class="text-slate-200 font-bold text-base">3个 轮灌组</span>
            <span class="text-slate-500 block text-[9px] mt-0.5">电磁阀LoRa无线受控</span>
          </div>
        </div>
      </div>

      <!-- 11. Agro-Ecological Flux Tower -->
      <div v-else-if="isFluxTower" class="space-y-3 font-mono">
        <div class="bg-slate-900/80 p-3 rounded-xl border border-violet-500/40 shadow-xs">
          <div class="text-slate-400 text-[11px] mb-1 flex items-center justify-between">
            <span>园区微气象与碳通量观测铁塔 (18m)</span>
            <span class="text-violet-400 font-bold bg-violet-500/15 px-1.5 py-0.5 rounded text-[10px] border border-violet-500/30">
              高频采样 10Hz
            </span>
          </div>
          <div class="text-sm font-bold text-violet-300 flex items-center gap-1.5">
            <Activity class="w-4 h-4 text-violet-400" />
            <span>三维超声测风 + 涡度相关系统 (EC)</span>
          </div>
          <p class="text-slate-300 text-xs mt-1.5 font-sans leading-relaxed">
            观测园区近地层地气交换通量、光合有效辐射(PAR)、净辐射通量及农田生态系统碳汇固碳量。
          </p>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">净碳交换量 (NEE)</span>
            <span class="text-emerald-400 font-bold text-base">-14.2 µmol</span>
            <span class="text-emerald-400 block text-[9px] mt-0.5">强碳汇吸收态</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">光合辐射 (PAR)</span>
            <span class="text-amber-400 font-bold text-base">1450 µmol</span>
            <span class="text-slate-500 block text-[9px] mt-0.5">m⁻²·s⁻¹</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">18m层风速/风向</span>
            <span class="text-cyan-300 font-bold text-base">3.4 m/s · 东南</span>
            <span class="text-slate-500 block text-[9px] mt-0.5">三维超声波矩阵</span>
          </div>
          <div class="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">潜热通量 (LE)</span>
            <span class="text-slate-200 font-bold text-base">285 W/m²</span>
            <span class="text-slate-500 block text-[9px] mt-0.5">作物蒸腾强盛</span>
          </div>
        </div>
      </div>

      <!-- 12. Greenhouses (GH1 - GH8) -->
      <div v-else-if="isGreenhouse" class="space-y-3">
        <div class="bg-slate-900/80 p-3 rounded-xl border border-emerald-500/40 shadow-xs">
          <div class="text-emerald-400 font-bold text-sm mb-1 flex items-center justify-between">
            <span>{{ info.name }}</span>
            <span class="text-xs font-mono font-normal text-slate-400">ID: {{ info.id }}</span>
          </div>
          <p class="text-slate-300 text-xs leading-relaxed">
            <template v-if="info.id === 'greenhouse_01' || info.id === 'gh_001'">
              核心示范主温室。Venlo型三联栋超白散射钢化玻璃温室，配备高压微雾降温、双层外遮阳网、智能水肥滴灌机及双轨吊架番茄栽培系统。
            </template>
            <template v-else-if="info.id === 'greenhouse_02' || info.id === 'gh_002'">
              2号连栋智能玻璃温室。高架草莓基质立体无土栽培，配置电动可升降栽培槽与自动化水肥回收消毒循环系统。
            </template>
            <template v-else-if="info.id === 'greenhouse_03' || info.id === 'gh_003'">
              3号现代连栋圆拱温室。双层充气薄膜保温，NFT深液流循环水培生菜与羽衣甘蓝，年产茬数高达14茬。
            </template>
            <template v-else-if="info.id === 'greenhouse_04' || info.id === 'gh_004'">
              4号数字化种苗繁育中心。全人工光植物工厂密闭立体多层育苗架，十万级净化车间，种苗成活率99.6%。
            </template>
            <template v-else-if="info.id === 'greenhouse_05' || info.id === 'gh_005'">
              5号智能蓄热高效日光温室。重型复合相变蓄热后墙+自动化外保温电动卷帘被，全冬季零煤耗零碳供暖。
            </template>
            <template v-else-if="info.id === 'greenhouse_06' || info.id === 'gh_006'">
              6号鱼菜共生生态循环温室。圆柱形高密度水产养殖池+微滤硝化菌床+浮板水耕种植，实现“养鱼不换水，种菜不施肥”。
            </template>
            <template v-else-if="info.id === 'greenhouse_07' || info.id === 'gh_007'">
              7号垂直气雾培高密农业温室。A字型立体气雾喷柱+360°间隙脉冲雾化营养液，根系富氧悬浮，节水95%。
            </template>
            <template v-else-if="info.id === 'greenhouse_08' || info.id === 'gh_008'">
              8号光伏农业一体化温室 (BIPV)。屋面铺设透光碲化镉薄膜太阳能组件，棚下立体栽培喜阴食用菌(灵芝/香菇)及名贵中药材。
            </template>
            <template v-else>
              纳入数字孪生基地统一物联网管控。配置自动化环境控制、高精度微气象传感节点及独立水肥管网。
            </template>
          </p>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div class="bg-slate-900/70 p-2 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">结构形态</span>
            <span class="text-slate-200 font-bold">
              <template v-if="info.id.includes('05')">相变蓄热日光温室</template>
              <template v-else-if="info.id.includes('06')">生态鱼菜共生复合</template>
              <template v-else-if="info.id.includes('07')">垂直立体气雾培</template>
              <template v-else-if="info.id.includes('08')">BIPV双玻光伏一体</template>
              <template v-else-if="info.id.includes('03')">双层连栋圆拱薄膜</template>
              <template v-else-if="info.id.includes('04')">垂直密闭植物工厂</template>
              <template v-else>热镀锌轻钢连栋玻璃</template>
            </span>
          </div>
          <div class="bg-slate-900/70 p-2 rounded-xl border border-slate-800/80 shadow-xs">
            <span class="text-slate-400 block text-[10px]">物联网测控状态</span>
            <span class="text-cyan-300 font-bold">LoRaWAN · 正常</span>
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

      <!-- Action Button: Open Dedicated Station Panel for Greenhouses -->
      <button
        v-if="isGreenhouse"
        id="btn-modal-open-station"
        @click="$emit('openStation', info.id)"
        class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer border border-emerald-400/40"
      >
        <Sliders class="w-4 h-4" />
        <span>打开该棚专属独立测控面板 (Station)</span>
      </button>

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
