<script setup lang="ts">
import { ref, computed } from 'vue';
import type {
  EnvironmentSnapshot,
  SensorData,
  PondWaterQuality,
  GreenhouseMicroclimate,
  OutdoorWeatherSnapshot,
} from '../types/digitalTwin';
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Waves,
  ArrowRight,
  Building2,
  CloudSun,
  AlertTriangle,
  Camera,
  CheckSquare,
  Square,
  ListTodo,
  Plus,
  Check,
  Sliders,
  LayoutGrid,
  LayoutDashboard,
  ShieldAlert,
  Clock,
  CloudRain,
  ShieldCheck,
  Sparkles,
  Cloud,
  CloudLightning,
  Umbrella,
} from 'lucide-vue-next';
import LiveSurveillanceCard from './LiveSurveillanceCard.vue';

const props = withDefaults(
  defineProps<{
    environment?: EnvironmentSnapshot;
    greenhousesMicroclimates?: GreenhouseMicroclimate[];
    selectedGreenhouseId?: string;
    outdoorWeather?: OutdoorWeatherSnapshot;
    sensors: SensorData[];
    pondWater: PondWaterQuality;
    collapsed?: boolean;
    isDemoMode?: boolean;
    lastUpdateTime?: string;
    dataSourceMode?: 'local' | 'api';
    isSurveillanceFovActive?: boolean;
  }>(),
  {
    collapsed: false,
    selectedGreenhouseId: 'gh_001',
    isDemoMode: false,
    isSurveillanceFovActive: true,
  }
);

const emit = defineEmits<{
  (e: 'selectSensor', sensorId: string): void;
  (e: 'focusPond'): void;
  (e: 'selectGreenhouse', ghId: string): void;
  (e: 'update:collapsed', val: boolean): void;
  (e: 'toggleDemoJitter', val?: boolean): void;
  (e: 'openStation', ghId: string): void;
  (e: 'openMatrix'): void;
  (e: 'openFeedingModal'): void;
  (e: 'openTempModal'): void;
  (e: 'openPestModal'): void;
  (e: 'openOwnerHubModal'): void;
  (e: 'openLogisticsModal'): void;
  (e: 'openWeatherModal'): void;
  (e: 'openAdminPortal', tab?: string): void;
  (e: 'flyToCameraView', ghId: string): void;
  (e: 'toggleFovVisible', visible: boolean): void;
  (e: 'toggleAllFovs', showAll: boolean): void;
}>();

const localCollapsed = ref(false);
const isCollapsed = computed({
  get: () => props.collapsed ?? localCollapsed.value,
  set: (val: boolean) => {
    localCollapsed.value = val;
    emit('update:collapsed', val);
  },
});

// Primary Tab Navigation: Microclimate, Warnings, To-Dos, Live Surveillance
const activeTab = ref<'microclimate' | 'warnings' | 'todos' | 'surveillance'>('microclimate');
const showGhSelector = ref(false);

const greenhousesMicroclimatesRecord = computed<Record<string, GreenhouseMicroclimate>>(() => {
  const map: Record<string, GreenhouseMicroclimate> = {};
  if (props.greenhousesMicroclimates) {
    props.greenhousesMicroclimates.forEach((g) => {
      map[g.id] = g;
    });
  }
  return map;
});

const isOutdoorMode = computed(() => props.selectedGreenhouseId === 'outdoor');

const currentGh = computed<GreenhouseMicroclimate | undefined>(() => {
  if (!props.greenhousesMicroclimates || props.greenhousesMicroclimates.length === 0) {
    return undefined;
  }
  return (
    props.greenhousesMicroclimates.find((g) => g.id === props.selectedGreenhouseId) ||
    props.greenhousesMicroclimates[0]
  );
});

const tempDelta = computed(() => {
  if (!currentGh.value || !props.outdoorWeather) return 0;
  return +(currentGh.value.airTemp - props.outdoorWeather.temperature).toFixed(1);
});

const humidityDelta = computed(() => {
  if (!currentGh.value || !props.outdoorWeather) return 0;
  return +(currentGh.value.airHumidity - props.outdoorWeather.humidity).toFixed(1);
});

const selectGreenhouse = (ghId: string) => {
  emit('selectGreenhouse', ghId);
  showGhSelector.value = false;
};

// -------------------------------------------------------------
// 1. WARNINGS & ANOMALY ALERTS (预警信息)
// -------------------------------------------------------------
export interface AlertWarningItem {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  badge: string;
  time: string;
  target: string;
  desc: string;
  isMitigated: boolean;
  actionText: string;
}

const alertWarnings = ref<AlertWarningItem[]>([
  {
    id: 'warn_1',
    title: '短临强降水防汛闭锁预警',
    severity: 'critical',
    badge: '紧急防汛',
    time: '30m内 28mm/h',
    target: '1#~8# 温室顶窗',
    desc: '降雨入园在即，天窗未闭将直接冲淋番茄花穗致落花',
    isMitigated: false,
    actionText: '一键闭合天窗',
  },
  {
    id: 'warn_2',
    title: '7级强阵风外遮阳过载预警',
    severity: 'warning',
    badge: '防风保护',
    time: '阵风 18.2m/s',
    target: '全园外遮阳拉幕',
    desc: '强风荷载超过安全阈值，需收拢铝箔拉幕防桁架拉伤',
    isMitigated: false,
    actionText: '一键收拢拉幕',
  },
  {
    id: 'warn_3',
    title: '夜间高湿灰霉病诱发提示',
    severity: 'info',
    badge: '生境提示',
    time: '降雨后 2h',
    target: '4# 高架草莓温室',
    desc: '相对湿度预计达88%，建议提前预约开启环流风机排湿',
    isMitigated: true,
    actionText: '预约夜间排湿',
  },
]);

const unmitigatedCount = computed(() => alertWarnings.value.filter((w) => !w.isMitigated).length);

const mitigateAlert = (id: string) => {
  const item = alertWarnings.value.find((w) => w.id === id);
  if (item) {
    item.isMitigated = true;
  }
};

// -------------------------------------------------------------
// 2. FARMING TO-DOS & CHECKLIST (待办事项)
// -------------------------------------------------------------
export interface FarmTodoItem {
  id: string;
  title: string;
  tag: string;
  priority: 'urgent' | 'normal';
  dueTime: string;
  completed: boolean;
  operator: string;
}

const farmTodos = ref<FarmTodoItem[]>([
  {
    id: 'todo_1',
    title: '全园 8 座温室电动天窗紧急联动闭合',
    tag: '气象防汛',
    priority: 'urgent',
    dueTime: '暴雨前 15m',
    completed: true,
    operator: 'AI联动下发',
  },
  {
    id: 'todo_2',
    title: '巡查主排涝渠 2# 泵站水位与止回阀',
    tag: '防汛排涝',
    priority: 'urgent',
    dueTime: '今日 10:30 前',
    completed: false,
    operator: '防汛值班员',
  },
  {
    id: 'todo_3',
    title: '植保无人机召回 RTK 机巢并锁舱防水',
    tag: '智能机库',
    priority: 'normal',
    dueTime: '已归巢锁定',
    completed: true,
    operator: '自动化系统',
  },
  {
    id: 'todo_4',
    title: '雨后 3# 蔬菜育苗温室基质测墒与通风',
    tag: '农事巡查',
    priority: 'normal',
    dueTime: '明日 08:00',
    completed: false,
    operator: '植保技术员',
  },
  {
    id: 'todo_5',
    title: '核验中心泵房 A/B 母液罐余量并补肥',
    tag: '水肥一体',
    priority: 'normal',
    dueTime: '后天 11:00',
    completed: false,
    operator: '灌溉组',
  },
]);

const completedTodoCount = computed(() => farmTodos.value.filter((t) => t.completed).length);
const totalTodoCount = computed(() => farmTodos.value.length);

const toggleTodo = (id: string) => {
  const item = farmTodos.value.find((t) => t.id === id);
  if (item) {
    item.completed = !item.completed;
  }
};

const showAddTodoInput = ref(false);
const newTodoText = ref('');
const handleAddTodo = () => {
  if (!newTodoText.value.trim()) return;
  farmTodos.value.unshift({
    id: 'todo_' + Date.now(),
    title: newTodoText.value.trim(),
    tag: '人工录入',
    priority: 'normal',
    dueTime: '今日待办',
    completed: false,
    operator: '值班操作员',
  });
  newTodoText.value = '';
  showAddTodoInput.value = false;
};

// -------------------------------------------------------------
// 3. WEATHER FORECAST & AGRO-METEOROLOGY (园区天气预报与农事气象)
// -------------------------------------------------------------
export interface HourlyWeatherItem {
  time: string;
  condition: string;
  temp: number;
  rainProb: number;
  iconType: 'sun' | 'cloud-sun' | 'cloud' | 'rain' | 'rain-heavy';
}

export interface DailyWeatherItem {
  date: string;
  dayLabel: string;
  condition: string;
  tempMin: number;
  tempMax: number;
  wind: string;
  rainProb: number;
  iconType: 'sun' | 'cloud-sun' | 'cloud' | 'rain';
  agriHint: string;
  level: 'good' | 'prime' | 'caution';
}

const weatherViewTab = ref<'hourly' | 'daily' | 'agri'>('hourly');

const hourlyForecast = ref<HourlyWeatherItem[]>([
  { time: '现在', condition: '多云', temp: 24, rainProb: 0, iconType: 'cloud-sun' },
  { time: '19:00', condition: '阴天', temp: 23, rainProb: 15, iconType: 'cloud' },
  { time: '21:00', condition: '小雨', temp: 21, rainProb: 65, iconType: 'rain' },
  { time: '23:00', condition: '中雨', temp: 19, rainProb: 85, iconType: 'rain-heavy' },
  { time: '02:00', condition: '阵雨', temp: 18, rainProb: 40, iconType: 'rain' },
  { time: '06:00', condition: '转晴', temp: 19, rainProb: 10, iconType: 'cloud-sun' },
  { time: '10:00', condition: '晴朗', temp: 25, rainProb: 0, iconType: 'sun' },
  { time: '14:00', condition: '多云', temp: 28, rainProb: 5, iconType: 'cloud-sun' },
]);

const dailyForecast = ref<DailyWeatherItem[]>([
  {
    date: '09-15',
    dayLabel: '今天',
    condition: '多云转小雨',
    tempMin: 19,
    tempMax: 28,
    wind: '东南风 3-4级',
    rainProb: 65,
    iconType: 'rain',
    agriHint: '夜间短临降水，注意闭天窗防淋花',
    level: 'caution',
  },
  {
    date: '09-16',
    dayLabel: '明天',
    condition: '雨后晴朗',
    tempMin: 18,
    tempMax: 28,
    wind: '偏南风 2级',
    rainProb: 0,
    iconType: 'sun',
    agriHint: '高光合黄金日，极佳喷药与采收期',
    level: 'prime',
  },
  {
    date: '09-17',
    dayLabel: '后天',
    condition: '多云间晴',
    tempMin: 20,
    tempMax: 27,
    wind: '西南风 2级',
    rainProb: 10,
    iconType: 'cloud-sun',
    agriHint: '温和微风，适宜水肥一体化补充',
    level: 'good',
  },
  {
    date: '09-18',
    dayLabel: '周五',
    condition: '晴朗微风',
    tempMin: 21,
    tempMax: 29,
    wind: '东南风 1-2级',
    rainProb: 0,
    iconType: 'sun',
    agriHint: '光照充足，温室蓄热蓄能良好',
    level: 'prime',
  },
]);

const agroIndices = ref([
  {
    id: 'spray',
    name: '植保喷药指数',
    status: '适宜',
    statusLevel: 'prime',
    desc: '明日早间无风无雨，叶面无水膜，药效附着最佳',
  },
  {
    id: 'irrigation',
    name: '水肥灌溉指数',
    status: '暂缓',
    statusLevel: 'caution',
    desc: '夜间降水补充有效雨量12mm，暂停大田漫灌防渍根',
  },
  {
    id: 'ventilation',
    name: '通风排湿指数',
    status: '推荐',
    statusLevel: 'prime',
    desc: '午后温湿度适宜，建议开启顶窗环流排湿',
  },
  {
    id: 'machinery',
    name: '农机作业指数',
    status: '优良',
    statusLevel: 'good',
    desc: '地面承压强度高，适宜物流车与无人机自主作业',
  },
]);
</script>

<template>
  <div
    :class="[
      'absolute top-[64px] left-3 bottom-5 z-20 transition-all duration-300 pointer-events-none flex items-start select-none',
      isCollapsed ? '-translate-x-[calc(100%-12px)]' : 'translate-x-0'
    ]"
  >
    <!-- Main Panel: Ultra-Clean Glassmorphism Cockpit -->
    <div
      class="pointer-events-auto w-80 sm:w-88 h-full max-h-[calc(100vh-88px)] flex flex-col bg-slate-950/80 hover:bg-slate-950/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_24px_54px_rgba(0,0,0,0.75)] ring-1 ring-white/5 overflow-hidden transition-all duration-300 text-xs"
    >
      <!-- Top Zone Header -->
      <div class="px-3.5 py-2.5 border-b border-white/10 bg-slate-900/60 backdrop-blur-md flex items-center justify-between">
        <div class="flex items-center gap-2 min-w-0">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
          <span class="font-bold text-sm text-slate-100 tracking-tight">数字孪生·态势中心</span>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <!-- Simulation/Realtime toggle pill -->
          <button
            id="btn-left-demo-badge"
            @click="emit('toggleDemoJitter')"
            :class="[
              'text-[10px] px-2 py-0.5 rounded-full border font-mono transition-all cursor-pointer flex items-center gap-1',
              isDemoMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
            ]"
            :title="isDemoMode ? '模拟数据运行中，点击切换为真实硬件数据' : '真实物联轮询中，点击开启模拟波动'"
          >
            <span :class="['w-1.5 h-1.5 rounded-full', isDemoMode ? 'bg-amber-400' : 'bg-emerald-400']"></span>
            <span>{{ isDemoMode ? '模拟' : '实测' }}</span>
          </button>
        </div>
      </div>

      <!-- Target Selection Bar (8 Greenhouses or Outdoor Benchmark) -->
      <div class="p-2 border-b border-white/10 bg-slate-950/40 flex items-center gap-1.5">
        <div class="relative flex-1 min-w-0">
          <button
            @click="showGhSelector = !showGhSelector"
            class="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/10 shadow-inner transition-colors cursor-pointer"
          >
            <div class="flex items-center gap-2 truncate">
              <Building2 v-if="!isOutdoorMode" class="w-4 h-4 text-emerald-400 shrink-0" />
              <CloudSun v-else class="w-4 h-4 text-cyan-400" />
              <span class="font-bold text-xs truncate">
                {{ isOutdoorMode ? '园区室外综合气象站' : currentGh?.name || '1# Venlo核心玻璃大棚' }}
              </span>
            </div>
            <ChevronDown
              class="w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ml-1"
              :class="{ 'rotate-180': showGhSelector }"
            />
          </button>

          <!-- Dropdown List -->
          <div
            v-if="showGhSelector"
            class="absolute top-full left-0 right-0 mt-1.5 max-h-64 overflow-y-auto bg-slate-950/95 backdrop-blur-2xl rounded-xl border border-emerald-500/30 shadow-[0_16px_36px_rgba(0,0,0,0.9)] ring-1 ring-white/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1"
          >
            <div class="text-[9px] font-mono text-emerald-400 font-semibold px-2 py-0.5 flex justify-between">
              <span>选择大棚或室外基准</span>
              <span class="text-slate-500">点击切换数据与视角</span>
            </div>

            <!-- 8 Greenhouses -->
            <button
              v-for="gh in greenhousesMicroclimates"
              :key="gh.id"
              @click="selectGreenhouse(gh.id)"
              :class="[
                'w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer text-xs',
                selectedGreenhouseId === gh.id
                  ? 'bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'text-slate-300 hover:bg-slate-900'
              ]"
            >
              <div class="truncate mr-1">
                <div class="font-semibold">{{ gh.name }}</div>
                <div class="text-[10px] text-slate-400 font-normal">
                  {{ gh.cropName }} · {{ gh.growthStage }}
                </div>
              </div>
              <span class="text-[9px] text-emerald-400 font-mono shrink-0">
                {{ gh.airTemp }}℃ / {{ gh.airHumidity }}%
              </span>
            </button>

            <!-- Outdoor Base Station -->
            <button
              @click="selectGreenhouse('outdoor')"
              :class="[
                'w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer text-xs border-t border-slate-800/80 pt-1.5',
                selectedGreenhouseId === 'outdoor'
                  ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-cyan-400 hover:bg-slate-900'
              ]"
            >
              <div>
                <div class="font-semibold flex items-center gap-1">
                  <CloudSun class="w-3.5 h-3.5 text-cyan-400" />
                  <span>园区室外气象观测站</span>
                </div>
                <div class="text-[10px] text-slate-400 font-normal">
                  通量铁塔·宏观天气基准
                </div>
              </div>
              <span class="text-[9px] text-cyan-300 font-mono shrink-0">
                {{ outdoorWeather?.temperature ?? 23.8 }}℃
              </span>
            </button>
          </div>
        </div>

        <!-- Fast Actions: Single Station & Matrix -->
        <button
          v-if="!isOutdoorMode"
          id="btn-open-single-station"
          @click="emit('openStation', currentGh?.id || 'gh_001')"
          class="h-7 px-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 hover:text-white border border-cyan-500/30 text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer shrink-0"
          title="打开当前大棚专属独立测控看板"
        >
          <Sliders class="w-3.5 h-3.5" />
          <span>专属</span>
        </button>
        <button
          id="btn-open-cluster-matrix"
          @click="emit('openMatrix')"
          class="h-7 px-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-white/10 text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer shrink-0"
          title="以矩阵形式查看全园8座大棚"
        >
          <LayoutGrid class="w-3.5 h-3.5 text-cyan-400" />
          <span>矩阵</span>
        </button>
      </div>

      <!-- Primary Tabs Navigation (4 Clean High-Contrast Tabs) -->
      <div class="grid grid-cols-4 border-b border-white/10 bg-slate-950/60 text-[11px] font-medium">
        <!-- 1. Microclimate -->
        <button
          @click="activeTab = 'microclimate'"
          :class="[
            'py-2 px-1 text-center transition-colors border-b-2 flex items-center justify-center gap-1 cursor-pointer truncate',
            activeTab === 'microclimate'
              ? 'text-cyan-300 border-cyan-400 bg-cyan-500/15 font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
          ]"
        >
          <Activity class="w-3.5 h-3.5 text-cyan-400" />
          <span>生境指标</span>
        </button>

        <!-- 2. Warnings (预警信息) -->
        <button
          @click="activeTab = 'warnings'"
          :class="[
            'py-2 px-1 text-center transition-colors border-b-2 flex items-center justify-center gap-1 cursor-pointer truncate relative',
            activeTab === 'warnings'
              ? 'text-rose-300 border-rose-400 bg-rose-500/15 font-bold shadow-[0_0_12px_rgba(244,63,94,0.25)]'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
          ]"
        >
          <AlertTriangle class="w-3.5 h-3.5 text-rose-400" />
          <span>预警信息</span>
          <span
            v-if="unmitigatedCount > 0"
            class="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[8px] font-mono font-bold leading-none animate-pulse"
          >
            {{ unmitigatedCount }}
          </span>
        </button>

        <!-- 3. To-Dos (待办事项) -->
        <button
          @click="activeTab = 'todos'"
          :class="[
            'py-2 px-1 text-center transition-colors border-b-2 flex items-center justify-center gap-1 cursor-pointer truncate',
            activeTab === 'todos'
              ? 'text-emerald-300 border-emerald-400 bg-emerald-500/15 font-bold shadow-[0_0_12px_rgba(16,185,129,0.25)]'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
          ]"
        >
          <ListTodo class="w-3.5 h-3.5 text-emerald-400" />
          <span>待办事项</span>
          <span class="text-[8px] font-mono text-emerald-300 bg-emerald-500/20 px-1 rounded-full">
            {{ completedTodoCount }}/{{ totalTodoCount }}
          </span>
        </button>

        <!-- 4. Surveillance -->
        <button
          @click="activeTab = 'surveillance'"
          :class="[
            'py-2 px-1 text-center transition-colors border-b-2 flex items-center justify-center gap-1 cursor-pointer truncate',
            activeTab === 'surveillance'
              ? 'text-cyan-300 border-cyan-400 bg-cyan-500/15 font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
          ]"
        >
          <Camera class="w-3.5 h-3.5 text-cyan-400" />
          <span>实时监控</span>
          <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="flex-1 overflow-y-auto p-3 space-y-2.5 text-slate-300">
        <!-- ============================================================= -->
        <!-- TAB 1: 生境指标 (Visual, clean, spacious cards, no walls of text) -->
        <!-- ============================================================= -->
        <template v-if="activeTab === 'microclimate'">
          <!-- A: Indoor Greenhouse -->
          <template v-if="!isOutdoorMode && currentGh">
            <!-- Crop summary bar -->
            <div class="px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between text-xs">
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"></span>
                <span class="font-bold text-slate-100 truncate">{{ currentGh.cropName }}</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-medium">
                  {{ currentGh.growthStage }}
                </span>
              </div>
              <div class="text-[11px] font-mono text-slate-400">
                室外基准 <span class="text-slate-200 font-semibold">{{ outdoorWeather?.temperature ?? 23.8 }}℃</span>
              </div>
            </div>

            <!-- 4 Clean Graphical Metric Instruments -->
            <div class="grid grid-cols-2 gap-2.5">
              <!-- Air Temp -->
              <div class="bg-slate-900/50 hover:bg-slate-900/70 p-3 rounded-xl border border-white/10 transition-all shadow-sm">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                    <Thermometer class="w-4 h-4" /> 室内气温
                  </span>
                  <span class="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                    适宜
                  </span>
                </div>
                <div class="flex items-baseline justify-between">
                  <span class="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                    {{ currentGh.airTemp }}<span class="text-xs font-normal text-slate-400 ml-0.5">℃</span>
                  </span>
                  <span class="text-[10px] font-mono font-semibold text-amber-300">
                    {{ tempDelta >= 0 ? `+${tempDelta}` : tempDelta }}℃
                  </span>
                </div>
                <!-- Visual Level Bar -->
                <div class="w-full h-1.5 bg-slate-800 rounded-full mt-2.5 overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 rounded-full"
                    :style="{ width: `${Math.min(100, (currentGh.airTemp / 40) * 100)}%` }"
                  ></div>
                </div>
              </div>

              <!-- Air Humidity -->
              <div class="bg-slate-900/50 hover:bg-slate-900/70 p-3 rounded-xl border border-white/10 transition-all shadow-sm">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="flex items-center gap-1.5 text-sky-400 font-bold text-xs">
                    <Droplets class="w-4 h-4" /> 空气湿度
                  </span>
                  <span class="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 font-semibold">
                    舒适
                  </span>
                </div>
                <div class="flex items-baseline justify-between">
                  <span class="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                    {{ currentGh.airHumidity }}<span class="text-xs font-normal text-slate-400 ml-0.5">%</span>
                  </span>
                  <span class="text-[10px] font-mono font-semibold text-sky-300">
                    {{ humidityDelta >= 0 ? `+${humidityDelta}` : humidityDelta }}%
                  </span>
                </div>
                <!-- Visual Level Bar -->
                <div class="w-full h-1.5 bg-slate-800 rounded-full mt-2.5 overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                    :style="{ width: `${currentGh.airHumidity}%` }"
                  ></div>
                </div>
              </div>

              <!-- CO2 -->
              <div class="bg-slate-900/50 hover:bg-slate-900/70 p-3 rounded-xl border border-white/10 transition-all shadow-sm">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                    <Activity class="w-4 h-4" /> 二氧化碳
                  </span>
                  <span class="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                    达标
                  </span>
                </div>
                <div class="flex items-baseline justify-between">
                  <span class="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                    {{ currentGh.co2 }}<span class="text-xs font-normal text-slate-400 ml-0.5">ppm</span>
                  </span>
                </div>
                <!-- Visual Level Bar -->
                <div class="w-full h-1.5 bg-slate-800 rounded-full mt-2.5 overflow-hidden">
                  <div
                    class="h-full bg-emerald-400 rounded-full"
                    :style="{ width: `${Math.min(100, (currentGh.co2 / 1200) * 100)}%` }"
                  ></div>
                </div>
              </div>

              <!-- Light Lux -->
              <div class="bg-slate-900/50 hover:bg-slate-900/70 p-3 rounded-xl border border-white/10 transition-all shadow-sm">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                    <Sun class="w-4 h-4" /> 光照强度
                  </span>
                  <span class="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                    充足
                  </span>
                </div>
                <div class="flex items-baseline justify-between">
                  <span class="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                    {{ currentGh.lightLux }}<span class="text-xs font-normal text-slate-400 ml-0.5">klx</span>
                  </span>
                </div>
                <!-- Visual Level Bar -->
                <div class="w-full h-1.5 bg-slate-800 rounded-full mt-2.5 overflow-hidden">
                  <div
                    class="h-full bg-amber-400 rounded-full"
                    :style="{ width: `${Math.min(100, (currentGh.lightLux / 60) * 100)}%` }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- ========================================================= -->
            <!-- 园区天气预报与农事气象模块 (Weather Forecast & Agro-Advisory) -->
            <!-- ========================================================= -->
            <div class="mt-2 space-y-2 rounded-2xl bg-slate-900/60 border border-white/10 p-3 shadow-md">
              <!-- Forecast Header with 3 Sub-tabs -->
              <div class="flex items-center justify-between pb-2 border-b border-white/10">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                    <CloudSun class="w-4 h-4 text-cyan-400" />
                  </div>
                  <div class="min-w-0">
                    <div class="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                      <span>园区宏观气象预报</span>
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    </div>
                    <div class="text-[10px] text-slate-400 font-mono truncate">
                      室外基准 {{ outdoorWeather?.temperature ?? 23.8 }}℃ · {{ outdoorWeather?.windDirection ?? '东南风' }} {{ outdoorWeather?.windSpeed ?? 3.2 }}m/s
                    </div>
                  </div>
                </div>

                <!-- Sub-tab pills -->
                <div class="flex items-center gap-0.5 bg-slate-950/80 p-0.5 rounded-lg border border-white/10 text-[10px] shrink-0">
                  <button
                    @click="weatherViewTab = 'hourly'"
                    :class="[
                      'px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer',
                      weatherViewTab === 'hourly'
                        ? 'bg-cyan-500/25 text-cyan-200 font-bold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    ]"
                  >
                    逐时
                  </button>
                  <button
                    @click="weatherViewTab = 'daily'"
                    :class="[
                      'px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer',
                      weatherViewTab === 'daily'
                        ? 'bg-cyan-500/25 text-cyan-200 font-bold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    ]"
                  >
                    3日
                  </button>
                  <button
                    @click="weatherViewTab = 'agri'"
                    :class="[
                      'px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer',
                      weatherViewTab === 'agri'
                        ? 'bg-emerald-500/25 text-emerald-200 font-bold border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    ]"
                  >
                    农事
                  </button>
                </div>
              </div>

              <!-- Current Weather Glance Row -->
              <div class="grid grid-cols-4 gap-1.5 text-center py-0.5">
                <div class="p-1.5 rounded-xl bg-slate-950/50 border border-white/5">
                  <div class="text-[9px] text-slate-400">相对湿度</div>
                  <div class="text-xs font-mono font-bold text-sky-300 mt-0.5">
                    {{ outdoorWeather?.humidity ?? 54.2 }}%
                  </div>
                </div>
                <div class="p-1.5 rounded-xl bg-slate-950/50 border border-white/5">
                  <div class="text-[9px] text-slate-400">风力等级</div>
                  <div class="text-xs font-mono font-bold text-cyan-300 mt-0.5">
                    2级微风
                  </div>
                </div>
                <div class="p-1.5 rounded-xl bg-slate-950/50 border border-white/5">
                  <div class="text-[9px] text-slate-400">光合辐射</div>
                  <div class="text-xs font-mono font-bold text-amber-300 mt-0.5">
                    820<span class="text-[8px] font-normal text-slate-400">W/㎡</span>
                  </div>
                </div>
                <div class="p-1.5 rounded-xl bg-slate-950/50 border border-white/5">
                  <div class="text-[9px] text-slate-400">空气质量</div>
                  <div class="text-xs font-mono font-bold text-emerald-300 mt-0.5">
                    28 优
                  </div>
                </div>
              </div>

              <!-- 1. HOURLY FORECAST (24 Hours Horizontal Scroll) -->
              <div v-if="weatherViewTab === 'hourly'" class="space-y-2 pt-1">
                <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>未来24小时气温走势</span>
                  <span class="text-sky-300 flex items-center gap-1 font-medium">
                    <CloudRain class="w-3 h-3 text-sky-400" />
                    <span>夜间降水概率 85%</span>
                  </span>
                </div>

                <!-- Hourly Cards Carousel/Grid -->
                <div class="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth">
                  <div
                    v-for="(hour, idx) in hourlyForecast"
                    :key="idx"
                    class="flex flex-col items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-white/10 shrink-0 w-16 text-center hover:border-cyan-400/40 transition-colors"
                  >
                    <span class="text-[10px] text-slate-400 font-mono">{{ hour.time }}</span>
                    
                    <div class="my-1.5">
                      <Sun v-if="hour.iconType === 'sun'" class="w-5 h-5 text-amber-400" />
                      <CloudSun v-else-if="hour.iconType === 'cloud-sun'" class="w-5 h-5 text-amber-300" />
                      <Cloud v-else-if="hour.iconType === 'cloud'" class="w-5 h-5 text-slate-400" />
                      <CloudRain v-else-if="hour.iconType === 'rain'" class="w-5 h-5 text-sky-400 animate-pulse" />
                      <CloudLightning v-else class="w-5 h-5 text-rose-400 animate-pulse" />
                    </div>

                    <span class="text-xs font-bold font-mono text-slate-100">{{ hour.temp }}℃</span>

                    <span
                      :class="[
                        'text-[9px] font-mono px-1 rounded-full mt-1 font-medium',
                        hour.rainProb > 50
                          ? 'bg-sky-500/25 text-sky-300 border border-sky-500/30'
                          : 'text-slate-500'
                      ]"
                    >
                      {{ hour.rainProb > 0 ? `${hour.rainProb}%` : '无雨' }}
                    </span>
                  </div>
                </div>

                <!-- Short weather notice -->
                <div class="px-2.5 py-1.5 rounded-xl bg-sky-950/30 border border-sky-500/25 flex items-center gap-2 text-[10px] text-sky-200">
                  <Umbrella class="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span class="truncate">预警提醒：今晚21:00起迎阵雨降水，系统已联动自动闭锁顶窗</span>
                </div>
              </div>

              <!-- 2. DAILY FORECAST (3-4 Days) -->
              <div v-else-if="weatherViewTab === 'daily'" class="space-y-1.5 pt-1">
                <div
                  v-for="(day, idx) in dailyForecast"
                  :key="idx"
                  class="p-2 rounded-xl bg-slate-950/60 border border-white/10 hover:border-white/20 transition-all text-xs"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-slate-200 font-mono">{{ day.dayLabel }}</span>
                      <span class="text-[10px] text-slate-400 font-mono">{{ day.date }}</span>
                      
                      <div class="flex items-center gap-1 text-[11px] text-slate-300 ml-1">
                        <Sun v-if="day.iconType === 'sun'" class="w-3.5 h-3.5 text-amber-400" />
                        <CloudSun v-else-if="day.iconType === 'cloud-sun'" class="w-3.5 h-3.5 text-amber-300" />
                        <CloudRain v-else-if="day.iconType === 'rain'" class="w-3.5 h-3.5 text-sky-400" />
                        <span>{{ day.condition }}</span>
                      </div>
                    </div>

                    <!-- Temperature range -->
                    <div class="flex items-center gap-1.5 font-mono text-[11px]">
                      <span class="text-sky-300">{{ day.tempMin }}℃</span>
                      <div class="w-10 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-sky-400 to-amber-400 rounded-full" style="width: 100%"></div>
                      </div>
                      <span class="text-amber-300 font-bold">{{ day.tempMax }}℃</span>
                    </div>
                  </div>

                  <!-- Agri advice line -->
                  <div class="mt-1 flex items-center justify-between text-[10px]">
                    <span class="text-slate-400 truncate flex-1 mr-2 font-sans">
                      💡 {{ day.agriHint }}
                    </span>
                    <span
                      :class="[
                        'px-1.5 py-0.2 rounded font-mono text-[9px] shrink-0 font-medium',
                        day.level === 'prime'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : day.level === 'caution'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300'
                      ]"
                    >
                      {{ day.level === 'prime' ? '黄金作业日' : day.level === 'caution' ? '防汛警惕' : '适宜作业' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 3. AGRO INDICES -->
              <div v-else-if="weatherViewTab === 'agri'" class="space-y-1.5 pt-1">
                <div class="grid grid-cols-2 gap-1.5">
                  <div
                    v-for="idx in agroIndices"
                    :key="idx.id"
                    class="p-2 rounded-xl bg-slate-950/60 border border-white/10 space-y-1"
                  >
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="font-bold text-slate-200">{{ idx.name }}</span>
                      <span
                        :class="[
                          'px-1.5 py-0.2 rounded font-mono text-[9px] font-semibold',
                          idx.statusLevel === 'prime'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : idx.statusLevel === 'caution'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        ]"
                      >
                        {{ idx.status }}
                      </span>
                    </div>
                    <div class="text-[9px] text-slate-400 leading-tight">
                      {{ idx.desc }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Shortcut Button: Open Radar Nowcast Modal -->
              <button
                id="btn-open-radar-weather-modal"
                @click="$emit('openWeatherModal')"
                class="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-sky-950/70 hover:from-cyan-900/80 hover:to-sky-900/80 text-cyan-300 hover:text-white border border-cyan-500/30 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs group"
              >
                <CloudRain class="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>展开短临气象推演与防灾雷达 (0~120m)</span>
                <ArrowRight class="w-3 h-3 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </template>

          <!-- B: Outdoor Mode -->
          <template v-else-if="isOutdoorMode">
            <div class="space-y-2">
              <div class="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <div class="font-bold text-cyan-300 text-sm flex items-center gap-1.5">
                    <CloudSun class="w-4 h-4 text-cyan-400" />
                    <span>室外气象综合观测站</span>
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5">
                    碳通量18m高空铁塔 · 宏观气象基准
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px]">
                  在线
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div class="bg-slate-900/50 p-2.5 rounded-xl border border-white/10">
                  <div class="text-[10px] text-slate-400">室外气温</div>
                  <div class="text-xl font-bold font-mono text-slate-100 mt-0.5">
                    {{ outdoorWeather?.temperature ?? 23.8 }}℃
                  </div>
                </div>
                <div class="bg-slate-900/50 p-2.5 rounded-xl border border-white/10">
                  <div class="text-[10px] text-slate-400">相对湿度</div>
                  <div class="text-xl font-bold font-mono text-slate-100 mt-0.5">
                    {{ outdoorWeather?.humidity ?? 54.2 }}%
                  </div>
                </div>
                <div class="bg-slate-900/50 p-2.5 rounded-xl border border-white/10">
                  <div class="text-[10px] text-slate-400">风速与风向</div>
                  <div class="text-base font-bold font-mono text-cyan-300 mt-0.5">
                    {{ outdoorWeather?.windSpeed ?? 3.2 }} m/s
                  </div>
                  <div class="text-[9px] text-slate-400">{{ outdoorWeather?.windDirection ?? '东南风' }}</div>
                </div>
                <div class="bg-slate-900/50 p-2.5 rounded-xl border border-white/10">
                  <div class="text-[10px] text-slate-400">太阳辐射</div>
                  <div class="text-base font-bold font-mono text-amber-300 mt-0.5">
                    {{ outdoorWeather?.solarRadiation ?? 820 }} W/㎡
                  </div>
                </div>
              </div>

              <button
                @click="selectGreenhouse('gh_001')"
                class="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Building2 class="w-3.5 h-3.5" />
                <span>返回 1# Venlo核心示范大棚</span>
              </button>
            </div>
          </template>
        </template>

        <!-- ============================================================= -->
        <!-- TAB 2: 预警信息 (Warnings - Prominent, Actionable, Clean) -->
        <!-- ============================================================= -->
        <template v-else-if="activeTab === 'warnings'">
          <div class="space-y-2.5">
            <!-- Header Summary Status -->
            <div class="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]"></span>
                <span class="font-bold text-slate-200">气象与生境预警</span>
              </div>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                待闭环: {{ unmitigatedCount }} 项
              </span>
            </div>

            <!-- Warning Cards List -->
            <div class="space-y-2">
              <div
                v-for="warn in alertWarnings"
                :key="warn.id"
                :class="[
                  'p-3 rounded-xl border transition-all',
                  warn.isMitigated
                    ? 'bg-slate-900/40 border-white/5 opacity-70'
                    : warn.severity === 'critical'
                    ? 'bg-rose-950/30 border-rose-500/40 shadow-sm'
                    : warn.severity === 'warning'
                    ? 'bg-amber-950/25 border-amber-500/40 shadow-sm'
                    : 'bg-blue-950/25 border-blue-500/40'
                ]"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span
                      :class="[
                        'px-1.5 py-0.5 rounded text-[9px] font-bold font-mono shrink-0',
                        warn.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : warn.severity === 'warning'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      ]"
                    >
                      {{ warn.badge }}
                    </span>
                    <span class="font-bold text-xs text-slate-100 truncate">{{ warn.title }}</span>
                  </div>

                  <span class="text-[9px] font-mono text-slate-400 shrink-0">{{ warn.time }}</span>
                </div>

                <div class="mt-1.5 text-[11px] text-slate-300 leading-relaxed">
                  {{ warn.desc }}
                </div>

                <div class="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between">
                  <span class="text-[10px] text-slate-400 font-mono">影响: {{ warn.target }}</span>

                  <button
                    v-if="!warn.isMitigated"
                    @click="mitigateAlert(warn.id)"
                    class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[10px] transition-all cursor-pointer shadow-md shadow-rose-950/40 flex items-center gap-1"
                  >
                    <ShieldAlert class="w-3 h-3" />
                    <span>{{ warn.actionText }}</span>
                  </button>
                  <span
                    v-else
                    class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono flex items-center gap-1"
                  >
                    <Check class="w-3 h-3 text-emerald-400" />
                    <span>已闭环联动</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Link to Admin Portal Warnings tab -->
            <button
              @click="emit('openAdminPortal', 'warnings')"
              class="w-full py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>查看后台预警研判与应急预案</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </template>

        <!-- ============================================================= -->
        <!-- TAB 3: 待办事项 (To-Dos - Interactive, Clean, Focused) -->
        <!-- ============================================================= -->
        <template v-else-if="activeTab === 'todos'">
          <div class="space-y-2.5">
            <!-- Header Progress -->
            <div class="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-200 flex items-center gap-1.5">
                  <ListTodo class="w-4 h-4 text-emerald-400" />
                  <span>今日作业待办</span>
                </span>
                <div class="flex items-center gap-1.5">
                  <span class="font-mono text-[11px] text-emerald-300 font-bold">
                    {{ completedTodoCount }} / {{ totalTodoCount }} 已完成
                  </span>
                  <button
                    @click="showAddTodoInput = !showAddTodoInput"
                    class="p-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition-colors cursor-pointer"
                    title="添加待办"
                  >
                    <Plus class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Progress bar -->
              <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                  :style="{ width: `${totalTodoCount > 0 ? (completedTodoCount / totalTodoCount) * 100 : 0}%` }"
                />
              </div>
            </div>

            <!-- Quick Add Input -->
            <div v-if="showAddTodoInput" class="flex items-center gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-emerald-500/40">
              <input
                v-model="newTodoText"
                @keyup.enter="handleAddTodo"
                placeholder="输入农事待办内容，回车确认..."
                class="flex-1 bg-transparent px-2 py-1 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              <button
                @click="handleAddTodo"
                class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer shrink-0"
              >
                添加
              </button>
            </div>

            <!-- Todo Items List -->
            <div class="space-y-1.5">
              <div
                v-for="todo in farmTodos"
                :key="todo.id"
                @click="toggleTodo(todo.id)"
                :class="[
                  'p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all cursor-pointer text-xs',
                  todo.completed
                    ? 'bg-slate-900/30 border-white/5 opacity-60 hover:opacity-80'
                    : 'bg-slate-900/70 border-white/10 hover:border-emerald-500/40'
                ]"
              >
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <component
                    :is="todo.completed ? CheckSquare : Square"
                    :class="[
                      'w-4 h-4 shrink-0 transition-colors',
                      todo.completed ? 'text-emerald-400' : 'text-slate-500'
                    ]"
                  />
                  <span
                    :class="[
                      'truncate text-xs transition-colors',
                      todo.completed ? 'line-through text-slate-500' : 'text-slate-200 font-medium'
                    ]"
                  >
                    {{ todo.title }}
                  </span>
                </div>

                <div class="flex items-center gap-1.5 shrink-0 font-mono text-[9px]">
                  <span
                    :class="[
                      'px-1.5 py-0.5 rounded',
                      todo.priority === 'urgent'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400'
                    ]"
                  >
                    {{ todo.tag }}
                  </span>
                  <span class="text-slate-500">{{ todo.dueTime }}</span>
                </div>
              </div>
            </div>

            <!-- Link to Admin Portal To-Dos tab -->
            <button
              @click="emit('openAdminPortal', 'todos')"
              class="w-full py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>进入后台工单与农事作业中心</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </template>

        <!-- ============================================================= -->
        <!-- TAB 4: 实时监控 (Surveillance Camera Stream) -->
        <!-- ============================================================= -->
        <template v-else-if="activeTab === 'surveillance'">
          <LiveSurveillanceCard
            :selected-greenhouse-id="selectedGreenhouseId"
            :greenhouses-microclimates="greenhousesMicroclimatesRecord"
            :outdoor-weather="outdoorWeather"
            :pond-water="pondWater"
            :is-surveillance-fov-active="isSurveillanceFovActive"
            @select-greenhouse="$emit('selectGreenhouse', $event)"
            @fly-to-camera-view="$emit('flyToCameraView', $event)"
            @toggle-fov-visible="$emit('toggleFovVisible', $event)"
            @toggle-all-fovs="$emit('toggleAllFovs', $event)"
            @open-station="$emit('openStation', $event)"
          />
        </template>
      </div>

      <!-- Prominent Universal Admin Entrance Button at Bottom -->
      <div class="p-2.5 border-t border-white/10 bg-slate-950/80 backdrop-blur-md">
        <button
          id="btn-open-admin-portal-footer"
          @click="emit('openAdminPortal', 'dashboard')"
          class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer text-xs group ring-1 ring-white/20"
        >
          <LayoutDashboard class="w-4 h-4 text-emerald-200 group-hover:rotate-12 transition-transform" />
          <span>进入智慧农场综合后台管理系统</span>
          <ArrowRight class="w-3.5 h-3.5 text-cyan-200 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>

    <!-- Collapse/Expand Handle Button -->
    <button
      @click="isCollapsed = !isCollapsed"
      class="pointer-events-auto mt-6 -ml-1 bg-slate-950/80 hover:bg-slate-900 text-cyan-400 hover:text-cyan-200 p-1.5 rounded-r-xl border-y border-r border-cyan-500/30 shadow-lg backdrop-blur-xl transition-colors cursor-pointer"
      :title="isCollapsed ? '展开态势监测面板' : '折叠态势监测面板'"
    >
      <ChevronRight v-if="isCollapsed" class="w-4 h-4" />
      <ChevronLeft v-else class="w-4 h-4" />
    </button>
  </div>
</template>
