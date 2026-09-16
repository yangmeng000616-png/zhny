<script setup lang="ts">
import { ref, computed } from 'vue';
import type {
  ActuatorDevice,
  GreenhouseMicroclimate,
  FarmingRecord,
  GreenhousePlantingCycle,
  PestMonitoringRecord,
  PestWeeklyTrendItem,
  PondFeedingRecord,
  EnvironmentalHistoryLog,
} from '../types/digitalTwin';
import { gateService } from '../services/gateService';
import {
  LayoutDashboard,
  AlertTriangle,
  ListTodo,
  Sliders,
  Sprout,
  Truck,
  Bug,
  Fish,
  Compass,
  CheckCircle2,
  Clock,
  Zap,
  CheckSquare,
  Square,
  Plus,
  Search,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Power,
  RotateCcw,
  Sparkles,
  Fan,
  Maximize2,
  SunDim,
  Droplet,
  Lightbulb,
  Building2,
  Calendar,
  User,
  Flame,
  ChevronRight,
  Trash2,
} from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    greenhouses: GreenhouseMicroclimate[];
    actuators: ActuatorDevice[];
    farmingRecords: FarmingRecord[];
    plantingCycles: Record<string, GreenhousePlantingCycle>;
    pestRecords: PestMonitoringRecord[];
    pestWeeklyTrend: PestWeeklyTrendItem[];
    feedingRecords: PondFeedingRecord[];
    historyLogs: EnvironmentalHistoryLog[];
    gateBarrierRaised: boolean;
    initialTab?: string;
  }>(),
  {
    initialTab: 'dashboard',
  }
);

const emit = defineEmits<{
  (e: 'backToTwin'): void;
  (e: 'toggleActuator', id: string, status: boolean): void;
  (e: 'updateActuatorValue', id: string, val: number): void;
  (e: 'toggleGateBarrier', open: boolean): void;
  (e: 'addFarmingRecord', record: FarmingRecord): void;
  (e: 'addPestRecord', record: PestMonitoringRecord): void;
  (e: 'addFeedingRecord', record: PondFeedingRecord): void;
  (e: 'focusGreenhouse3D', ghId: string): void;
}>();

// Navigation Tabs
export type AdminTab =
  | 'dashboard'
  | 'warnings'
  | 'todos'
  | 'actuators'
  | 'crops'
  | 'logistics'
  | 'protection'
  | 'ecology';

const currentTab = ref<AdminTab>((props.initialTab as AdminTab) || 'dashboard');

// Search & Filter state
const globalSearch = ref('');

// -------------------------------------------------------------
// 1. WARNINGS & HAZARD MITIGATION
// -------------------------------------------------------------
interface AdminRiskItem {
  id: string;
  title: string;
  level: 'critical' | 'warning' | 'info';
  category: string;
  ghId: string;
  ghName: string;
  description: string;
  measure: string;
  actionLabel: string;
  mitigated: boolean;
  timestamp: string;
  operator: string;
}

const riskList = ref<AdminRiskItem[]>([
  {
    id: 'risk_01',
    title: '短临强降水防汛闭锁响应',
    level: 'critical',
    category: '气象灾害',
    ghId: 'gh_001',
    ghName: '1# Venlo核心示范棚',
    description: '30分钟后短时强降雨将突增至 28mm/h，天窗未闭将直接冲淋番茄花穗致落花落果',
    measure: '执行温室电动天窗紧急闭锁，并启动外围排涝泵站腾空水渠',
    actionLabel: '一键闭锁联动',
    mitigated: true,
    timestamp: '10分钟前',
    operator: '系统自动防御',
  },
  {
    id: 'risk_02',
    title: '7级强阵风外遮阳过载保护',
    level: 'warning',
    category: '防风安全',
    ghId: 'all',
    ghName: '全园区 8 座温室',
    description: '瞬时阵风风速已达 18.2m/s，铝箔外遮阳拉幕承受风载过大，有撕裂拉幕及变形桁架风险',
    measure: '立即收拢外遮阳铝箔幕布，并启用内保温幕布提供抗拉支撑',
    actionLabel: '收拢外遮阳',
    mitigated: false,
    timestamp: '15分钟前',
    operator: '待人工确认',
  },
  {
    id: 'risk_03',
    title: '持续寡照高湿引发灰霉病风险',
    level: 'info',
    category: '植保生境',
    ghId: 'gh_002',
    ghName: '2# 连栋智能玻璃棚',
    description: '相对湿度持续超过 86%，叶片表面微结露，适宜灰霉病菌萌发传播',
    measure: '开启全光谱LED补光灯与顶部环流风机，进行强制空气置换排湿',
    actionLabel: '启动排湿补光',
    mitigated: false,
    timestamp: '32分钟前',
    operator: '植保模型预警',
  },
  {
    id: 'risk_04',
    title: '生态河塘暴雨溢流水位预警',
    level: 'warning',
    category: '水文防汛',
    ghId: 'facility_pond',
    ghName: '生态河塘蓄水池',
    description: '预测降水将带来 17.5mm 径流补充，河塘蓄水量逼近 92% 安全警戒线',
    measure: '启动 2# 应急防汛强排泵，将多余雨水引流至园区生态湿地蓄水沟',
    actionLabel: '开启强排泵',
    mitigated: true,
    timestamp: '45分钟前',
    operator: '防汛调度中心',
  },
]);

const riskFilter = ref<'all' | 'unmitigated' | 'mitigated'>('all');

const filteredRisks = computed(() => {
  return riskList.value.filter((r) => {
    if (riskFilter.value === 'unmitigated' && r.mitigated) return false;
    if (riskFilter.value === 'mitigated' && !r.mitigated) return false;
    if (globalSearch.value) {
      const q = globalSearch.value.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.ghName.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    }
    return true;
  });
});

const handleMitigateAdminRisk = (item: AdminRiskItem) => {
  item.mitigated = true;
  item.operator = '超级管理员（现场下发）';
};

// -------------------------------------------------------------
// 2. FARM TO-DO TASKS & WORK ORDERS
// -------------------------------------------------------------
interface AdminTaskItem {
  id: string;
  title: string;
  ghId: string;
  ghName: string;
  type: '巡检' | '水肥' | '植保' | '防汛' | '采收' | '维修';
  priority: 'urgent' | 'high' | 'normal';
  assignee: string;
  dueDate: string;
  completed: boolean;
  notes?: string;
}

const taskList = ref<AdminTaskItem[]>([
  {
    id: 'task_001',
    title: '温室 8 座电动天窗闭合到位状态逐栋核验',
    ghId: 'all',
    ghName: '1#~8# 温室群',
    type: '防汛',
    priority: 'urgent',
    assignee: '张建军 (电气主管)',
    dueDate: '今日 10:00 前',
    completed: true,
    notes: '全部 8 座天窗已由气象联动完成电控闭合，到位微动开关信号均反馈正常',
  },
  {
    id: 'task_002',
    title: '巡查园区外围主排涝渠 2# 泵站进水口与滤网',
    ghId: 'facility_pond',
    ghName: '生态排涝泵站',
    type: '防汛',
    priority: 'urgent',
    assignee: '李志国 (防汛值班员)',
    dueDate: '今日 10:30 前',
    completed: false,
    notes: '清理拦污栅杂草浮萍，确保强对流暴雨期间水流通畅无壅水',
  },
  {
    id: 'task_003',
    title: '智能植保无人机自主巡检召回并闭锁机巢防水',
    ghId: 'facility_drone',
    ghName: '智能无人机库',
    type: '巡检',
    priority: 'high',
    assignee: '自动控制系统',
    dueDate: '暴雨前 20m',
    completed: true,
    notes: '无人机已以 RTK 高精度对齐入库，顶舱电驱密封盖板已闭锁',
  },
  {
    id: 'task_004',
    title: '1# 示范棚高品质普罗旺斯番茄转色期果穗疏果',
    ghId: 'gh_001',
    ghName: '1# 核心示范棚',
    type: '采收',
    priority: 'normal',
    assignee: '王芳 (园艺技术员)',
    dueDate: '明日 08:30',
    completed: false,
    notes: '每穗留果 4-5 个，摘除畸形小果，增强通风透光及糖度累积',
  },
  {
    id: 'task_005',
    title: '3# 水培生菜营养液池 EC/pH 传感器化学探头校准',
    ghId: 'gh_003',
    ghName: '3# 圆拱大棚',
    type: '水肥',
    priority: 'normal',
    assignee: '孙伟 (水肥组)',
    dueDate: '明日 14:00',
    completed: false,
    notes: '采用标准缓冲液 pH 4.01/6.86 与 1413μS/cm 校准液',
  },
  {
    id: 'task_006',
    title: '中心泵房 A/B 母液配肥罐补液与微量元素混合',
    ghId: 'facility_fert',
    ghName: '水肥储罐区',
    type: '水肥',
    priority: 'normal',
    assignee: '陈建华 (水肥班长)',
    dueDate: '后天 09:30',
    completed: false,
    notes: '补加硝酸钙与螯合铁 EDTA-Fe，准备下一轮灌溉周期',
  },
]);

const taskFilter = ref<'all' | 'pending' | 'completed'>('all');

const filteredTasks = computed(() => {
  return taskList.value.filter((t) => {
    if (taskFilter.value === 'pending' && t.completed) return false;
    if (taskFilter.value === 'completed' && !t.completed) return false;
    if (globalSearch.value) {
      const q = globalSearch.value.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.ghName.toLowerCase().includes(q) ||
        t.assignee.toLowerCase().includes(q)
      );
    }
    return true;
  });
});

const showCreateTaskModal = ref(false);
const newTask = ref({
  title: '',
  ghId: 'gh_001',
  type: '巡检' as AdminTaskItem['type'],
  priority: 'normal' as AdminTaskItem['priority'],
  assignee: '',
  dueDate: '',
  notes: '',
});

const handleCreateTask = () => {
  if (!newTask.value.title.trim()) return;
  const ghNameMap: Record<string, string> = {
    gh_001: '1# 核心示范棚',
    gh_002: '2# 智能玻璃棚',
    gh_003: '3# 连栋圆拱棚',
    gh_004: '4# 种苗工厂',
    gh_005: '5# 日光温室',
    gh_006: '6# 鱼菜共生棚',
    gh_007: '7# 气雾培温室',
    gh_008: '8# 光伏农业棚',
    all: '全园区温室群',
  };

  taskList.value.unshift({
    id: 'task_' + Date.now(),
    title: newTask.value.title.trim(),
    ghId: newTask.value.ghId,
    ghName: ghNameMap[newTask.value.ghId] || '园区管理区',
    type: newTask.value.type,
    priority: newTask.value.priority,
    assignee: newTask.value.assignee || '现场值班员',
    dueDate: newTask.value.dueDate || '今日待办',
    completed: false,
    notes: newTask.value.notes,
  });

  newTask.value = {
    title: '',
    ghId: 'gh_001',
    type: '巡检',
    priority: 'normal',
    assignee: '',
    dueDate: '',
    notes: '',
  };
  showCreateTaskModal.value = false;
};

// -------------------------------------------------------------
// 3. ACTUATOR & FACILITY INVENTORY
// -------------------------------------------------------------
const actuatorCategory = ref<'all' | 'ventilation' | 'shading' | 'irrigation' | 'light_heat'>('all');

const isActuatorInCategory = (act: ActuatorDevice, cat: string) => {
  if (cat === 'all') return true;
  if (cat === 'ventilation') return act.type === 'fan' || act.type === 'roof_vent';
  if (cat === 'shading') return act.type === 'shade_curtain' || act.type === 'wet_curtain';
  if (cat === 'irrigation') return act.type === 'irrigation_pump';
  if (cat === 'light_heat') return act.type === 'grow_light' || act.type === 'heater';
  return true;
};

const filteredActuators = computed(() => {
  return props.actuators.filter((a) => {
    if (!isActuatorInCategory(a, actuatorCategory.value)) return false;
    if (globalSearch.value) {
      const q = globalSearch.value.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.zone.toLowerCase().includes(q);
    }
    return true;
  });
});

const totalKw = computed(() => {
  return props.actuators
    .filter((a) => a.power)
    .reduce((sum, a) => sum + a.powerConsumptionKw, 0);
});

const runningCount = computed(() => props.actuators.filter((a) => a.power).length);

// -------------------------------------------------------------
// 4. LOGISTICS & VEHICLE GATE LEDGER
// -------------------------------------------------------------
const gateRecords = computed(() => gateService.getRecords());

// -------------------------------------------------------------
// 5. CROPS & GREENHOUSE PROFILES
// -------------------------------------------------------------
const selectedGhProfile = ref<string>('gh_001');
const currentGhDetail = computed(() => {
  return props.greenhouses.find((g) => g.id === selectedGhProfile.value) || props.greenhouses[0];
});
const currentGhCycle = computed(() => {
  return props.plantingCycles[selectedGhProfile.value] || props.plantingCycles['gh_001'];
});

// Quick KPIs for Dashboard
const totalParkArea = '120 亩';
const totalCropYieldExpected = '168.5 吨';
const todayEnergyKwh = '382.4 kWh';
const todayWaterM3 = '56.2 m³';
</script>

<template>
  <div class="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 font-sans select-none overflow-hidden animate-in fade-in duration-200">
    <!-- Top System Management Header -->
    <header class="h-14 border-b border-white/10 bg-slate-900/90 backdrop-blur-xl px-4 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-3 min-w-0">
        <!-- Logo & Title -->
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40">
            <Sprout class="w-4 h-4" />
          </div>
          <div>
            <h1 class="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              智慧农业数字孪生园区 · 综合运营管理后台
            </h1>
            <p class="text-[10px] text-slate-400 font-mono hidden sm:block">
              Smart Agro-Park Digital Twin Management Console · 8 Clusters Central Operating System
            </p>
          </div>
        </div>

        <div class="h-4 w-px bg-white/10 mx-2 hidden md:block" />

        <!-- Status Pills -->
        <div class="hidden lg:flex items-center gap-2 text-[10px]">
          <span class="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            8座大棚全在线
          </span>
          <span class="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
            设备负荷 {{ totalKw.toFixed(1) }} kW
          </span>
        </div>
      </div>

      <!-- Right Actions -->
      <div class="flex items-center gap-3">
        <!-- Return to 3D Digital Twin Button (Prominent) -->
        <button
          @click="$emit('backToTwin')"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/40 hover:shadow-cyan-500/30 border border-cyan-400/40 transition-all cursor-pointer group"
        >
          <Compass class="w-4 h-4 text-cyan-200 group-hover:rotate-45 transition-transform" />
          <span>返回数字孪生 3D 大屏</span>
        </button>

        <!-- User profile badge -->
        <div class="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10 text-xs">
          <div class="w-7 h-7 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300">
            <User class="w-3.5 h-3.5" />
          </div>
          <div class="text-left leading-tight hidden md:block">
            <div class="text-[11px] font-semibold text-slate-200">系统总工程师</div>
            <div class="text-[9px] text-slate-400 font-mono">农业技术指挥中心</div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Body with Sidebar Navigation -->
    <div class="flex-1 flex min-h-0 overflow-hidden">
      <!-- Left Admin Sidebar Navigation -->
      <aside class="w-56 sm:w-64 border-r border-white/10 bg-slate-900/60 backdrop-blur-md flex flex-col shrink-0">
        <!-- Quick Search in Admin -->
        <div class="p-3 border-b border-white/5">
          <div class="relative">
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="globalSearch"
              placeholder="搜索设备、大棚、工单..."
              class="w-full bg-slate-950/80 border border-white/10 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        <!-- Navigation Menu Items -->
        <nav class="flex-1 p-2 space-y-1 overflow-y-auto">
          <button
            v-for="item in [
              { id: 'dashboard', label: '园区综合态势看板', icon: LayoutDashboard, badge: '概览' },
              { id: 'warnings', label: '预警联动与应急处置', icon: AlertTriangle, count: riskList.filter(r => !r.mitigated).length, badgeColor: 'bg-rose-500' },
              { id: 'todos', label: '农事待办与工单协同', icon: ListTodo, count: taskList.filter(t => !t.completed).length, badgeColor: 'bg-amber-500' },
              { id: 'actuators', label: '设施设备台账与调度', icon: Sliders, count: runningCount + '/' + actuators.length },
              { id: 'crops', label: '大棚生境与作物档案', icon: Sprout, count: '8座温室' },
              { id: 'logistics', label: '物流冷链与道闸门禁', icon: Truck },
              { id: 'protection', label: '绿色植保与诱虫测报', icon: Bug },
              { id: 'ecology', label: '生态渔业与水质投喂', icon: Fish },
            ]"
            :key="item.id"
            @click="currentTab = item.id as AdminTab"
            :class="[
              'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer group text-left',
              currentTab === item.id
                ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-200 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
            ]"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <component
                :is="item.icon"
                :class="[
                  'w-4 h-4 shrink-0 transition-colors',
                  currentTab === item.id ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                ]"
              />
              <span class="truncate">{{ item.label }}</span>
            </div>

            <!-- Badge or Count -->
            <span
              v-if="item.count !== undefined"
              :class="[
                'px-1.5 py-0.2 rounded-full text-[9px] font-mono shrink-0',
                item.badgeColor
                  ? `${item.badgeColor} text-white font-bold`
                  : 'bg-slate-800 text-slate-400'
              ]"
            >
              {{ item.count }}
            </span>
            <span
              v-else-if="item.badge"
              class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-800/80 text-slate-400 border border-white/5"
            >
              {{ item.badge }}
            </span>
          </button>
        </nav>

        <!-- Sidebar Footer Status -->
        <div class="p-3 border-t border-white/10 bg-slate-950/40 text-[10px] text-slate-400 flex items-center justify-between font-mono">
          <span>安全守护: 7×24H</span>
          <span class="text-emerald-400 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            正常运行
          </span>
        </div>
      </aside>

      <!-- Main Workspace Area -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/90 text-slate-100">
        <!-- ============================================================== -->
        <!-- TAB 1: DASHBOARD OVERVIEW (园区综合态势看板) -->
        <!-- ============================================================== -->
        <div v-if="currentTab === 'dashboard'" class="space-y-6 max-w-7xl mx-auto">
          <!-- Welcome & Summary Banner -->
          <div class="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold">
                  运营监控中心
                </span>
                <h2 class="text-lg font-bold text-white">智慧农业核心示范基地综合运行态势</h2>
              </div>
              <p class="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                全天候自动化感知 8 座现代温室大棚微气候、水肥一体化循环灌溉、绿色植保测报及出入冷链物流，各项指标处于适生生长区间。
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="currentTab = 'todos'; showCreateTaskModal = true"
                class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>新建农事工单</span>
              </button>
              <button
                @click="$emit('backToTwin')"
                class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Compass class="w-3.5 h-3.5" />
                <span>全景3D孪生</span>
              </button>
            </div>
          </div>

          <!-- 4 Core Metric KPI Cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div class="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
              <div class="text-[11px] text-slate-400 flex items-center justify-between">
                <span>总种植规划面积</span>
                <Sprout class="w-4 h-4 text-emerald-400" />
              </div>
              <div class="text-2xl font-bold font-mono text-white">{{ totalParkArea }}</div>
              <div class="text-[10px] text-emerald-400 font-mono">8座连栋现代智能温室</div>
            </div>

            <div class="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
              <div class="text-[11px] text-slate-400 flex items-center justify-between">
                <span>本季预计蔬果产值</span>
                <Sparkles class="w-4 h-4 text-amber-400" />
              </div>
              <div class="text-2xl font-bold font-mono text-amber-300">{{ totalCropYieldExpected }}</div>
              <div class="text-[10px] text-slate-400 font-mono">高品质番茄/草莓/水培生菜</div>
            </div>

            <div class="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
              <div class="text-[11px] text-slate-400 flex items-center justify-between">
                <span>今日设备总用电</span>
                <Zap class="w-4 h-4 text-cyan-400" />
              </div>
              <div class="text-2xl font-bold font-mono text-cyan-300">{{ todayEnergyKwh }}</div>
              <div class="text-[10px] text-slate-400 font-mono">当前负荷 {{ totalKw.toFixed(1) }} kW · 8#光伏消纳 45%</div>
            </div>

            <div class="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
              <div class="text-[11px] text-slate-400 flex items-center justify-between">
                <span>水肥循环回用水</span>
                <Droplet class="w-4 h-4 text-blue-400" />
              </div>
              <div class="text-2xl font-bold font-mono text-blue-300">{{ todayWaterM3 }}</div>
              <div class="text-[10px] text-emerald-400 font-mono">节水率 62% · 雨水收集已就绪</div>
            </div>
          </div>

          <!-- 8 Greenhouse Microclimates Quick Cards -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Building2 class="w-4 h-4 text-cyan-400" />
                <span>全园 8 座智能温室微生境矩阵概况</span>
              </h3>
              <button
                @click="currentTab = 'crops'"
                class="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <span>查看完整作物档案</span>
                <ArrowRight class="w-3 h-3" />
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div
                v-for="gh in greenhouses"
                :key="gh.id"
                @click="selectedGhProfile = gh.id; currentTab = 'crops'"
                class="p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 border border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer group space-y-2"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors text-xs">
                    {{ gh.name }}
                  </span>
                  <span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {{ gh.cropName }}
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div class="bg-slate-950/60 p-1.5 rounded-lg border border-white/5">
                    <div class="text-[9px] text-slate-400">室内温度</div>
                    <div class="font-bold text-slate-200">{{ gh.airTemp }} ℃</div>
                  </div>
                  <div class="bg-slate-950/60 p-1.5 rounded-lg border border-white/5">
                    <div class="text-[9px] text-slate-400">空气湿度</div>
                    <div class="font-bold text-cyan-300">{{ gh.airHumidity }} %</div>
                  </div>
                  <div class="bg-slate-950/60 p-1.5 rounded-lg border border-white/5">
                    <div class="text-[9px] text-slate-400">CO₂浓度</div>
                    <div class="font-bold text-emerald-300">{{ gh.co2 }} ppm</div>
                  </div>
                  <div class="bg-slate-950/60 p-1.5 rounded-lg border border-white/5">
                    <div class="text-[9px] text-slate-400">光照辐射</div>
                    <div class="font-bold text-amber-300">{{ gh.lightLux }} klx</div>
                  </div>
                </div>

                <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                  <span>{{ gh.growthStage }}</span>
                  <span class="text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    详情 <ChevronRight class="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- TAB 2: RISK & WARNING MITIGATION CENTER (预警联动与应急处置) -->
        <!-- ============================================================== -->
        <div v-if="currentTab === 'warnings'" class="space-y-4 max-w-7xl mx-auto">
          <!-- Header & Controls -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-white/10">
            <div>
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle class="w-5 h-5 text-amber-400" />
                <span>设施安全预警与灾害联动处置中心</span>
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">
                结合短临微气象与设施生境感知，自动匹配应急预案与执行机构闭环处置
              </p>
            </div>

            <!-- Filter Buttons -->
            <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-white/10 text-xs">
              <button
                @click="riskFilter = 'all'"
                :class="['px-2.5 py-1 rounded transition-colors cursor-pointer', riskFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400']"
              >
                全部 ({{ riskList.length }})
              </button>
              <button
                @click="riskFilter = 'unmitigated'"
                :class="['px-2.5 py-1 rounded transition-colors cursor-pointer', riskFilter === 'unmitigated' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-slate-400']"
              >
                待响应 ({{ riskList.filter(r => !r.mitigated).length }})
              </button>
              <button
                @click="riskFilter = 'mitigated'"
                :class="['px-2.5 py-1 rounded transition-colors cursor-pointer', riskFilter === 'mitigated' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400']"
              >
                已闭环 ({{ riskList.filter(r => r.mitigated).length }})
              </button>
            </div>
          </div>

          <!-- Risk Items Table -->
          <div class="space-y-2.5">
            <div
              v-for="item in filteredRisks"
              :key="item.id"
              :class="[
                'p-4 rounded-xl border transition-all text-xs space-y-2',
                item.mitigated
                  ? 'bg-slate-900/30 border-white/10 text-slate-300'
                  : item.level === 'critical'
                  ? 'bg-rose-950/30 border-rose-500/40 text-slate-100 shadow-md'
                  : 'bg-amber-950/25 border-amber-500/35 text-slate-100 shadow-sm'
              ]"
            >
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <span
                    :class="[
                      'w-2 h-2 rounded-full shrink-0',
                      item.mitigated ? 'bg-emerald-400' : item.level === 'critical' ? 'bg-rose-400 animate-ping' : 'bg-amber-400'
                    ]"
                  />
                  <span class="font-bold text-sm text-white">{{ item.title }}</span>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-mono font-semibold',
                      item.level === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    ]"
                  >
                    {{ item.category }}
                  </span>
                  <span class="text-slate-400 font-mono text-[11px]">| {{ item.ghName }}</span>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-[10px] text-slate-400 font-mono">{{ item.timestamp }}</span>
                  <button
                    v-if="!item.mitigated"
                    @click="handleMitigateAdminRisk(item)"
                    class="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <ShieldAlert class="w-3.5 h-3.5" />
                    <span>{{ item.actionLabel }}</span>
                  </button>
                  <span
                    v-else
                    class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1 font-mono text-[11px]"
                  >
                    <CheckCircle2 class="w-3.5 h-3.5" /> 已闭环联动
                  </span>
                </div>
              </div>

              <div class="p-2.5 rounded-lg bg-slate-950/60 border border-white/5 space-y-1">
                <div class="text-slate-300 leading-relaxed">{{ item.description }}</div>
                <div class="text-[11px] text-cyan-300 font-mono flex items-center gap-1">
                  <span>💡 防御措施:</span>
                  <span>{{ item.measure }}</span>
                </div>
              </div>

              <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                <span>处理责任: {{ item.operator }}</span>
                <span>ID: {{ item.id }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- TAB 3: FARM TO-DOS & WORK ORDERS (农事待办与工单协同) -->
        <!-- ============================================================== -->
        <div v-if="currentTab === 'todos'" class="space-y-4 max-w-7xl mx-auto">
          <!-- Header Bar -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-white/10">
            <div>
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <ListTodo class="w-5 h-5 text-cyan-400" />
                <span>农事作业工单与任务协同中心</span>
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">
                记录施肥、排湿、巡检、采收及设施维保等工单进度，支持现场勾选闭环
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="showCreateTaskModal = true"
                class="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>新建农事工单</span>
              </button>

              <!-- Filter -->
              <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-white/10 text-xs">
                <button
                  @click="taskFilter = 'all'"
                  :class="['px-2 py-1 rounded transition-colors cursor-pointer', taskFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400']"
                >
                  全部
                </button>
                <button
                  @click="taskFilter = 'pending'"
                  :class="['px-2 py-1 rounded transition-colors cursor-pointer', taskFilter === 'pending' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400']"
                >
                  待办 ({{ taskList.filter(t => !t.completed).length }})
                </button>
                <button
                  @click="taskFilter = 'completed'"
                  :class="['px-2 py-1 rounded transition-colors cursor-pointer', taskFilter === 'completed' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400']"
                >
                  已完成 ({{ taskList.filter(t => t.completed).length }})
                </button>
              </div>
            </div>
          </div>

          <!-- Task Card List -->
          <div class="space-y-2">
            <div
              v-for="task in filteredTasks"
              :key="task.id"
              class="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
            >
              <div class="flex items-start gap-3 min-w-0 flex-1">
                <button
                  @click="task.completed = !task.completed"
                  class="mt-0.5 cursor-pointer text-slate-500 hover:text-cyan-400 transition-colors shrink-0"
                >
                  <component
                    :is="task.completed ? CheckSquare : Square"
                    :class="['w-4 h-4', task.completed ? 'text-emerald-400' : 'text-slate-500']"
                  />
                </button>

                <div class="space-y-1 min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      :class="[
                        'font-bold text-sm transition-colors',
                        task.completed ? 'line-through text-slate-500' : 'text-white'
                      ]"
                    >
                      {{ task.title }}
                    </span>
                    <span
                      :class="[
                        'px-1.5 py-0.2 rounded text-[9px] font-mono',
                        task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-300'
                      ]"
                    >
                      {{ task.priority === 'urgent' ? '紧急' : '常规' }}
                    </span>
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {{ task.type }}
                    </span>
                    <span class="text-slate-400 font-mono text-[10px]">
                      {{ task.ghName }}
                    </span>
                  </div>

                  <p v-if="task.notes" class="text-slate-400 text-[11px] leading-relaxed">
                    {{ task.notes }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3 shrink-0 text-[11px] font-mono text-slate-400">
                <div class="flex items-center gap-1">
                  <User class="w-3.5 h-3.5 text-slate-400" />
                  <span>{{ task.assignee }}</span>
                </div>
                <div class="flex items-center gap-1 text-amber-300">
                  <Clock class="w-3.5 h-3.5 text-amber-400" />
                  <span>{{ task.dueDate }}</span>
                </div>
                <button
                  @click="taskList = taskList.filter(t => t.id !== task.id)"
                  class="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="删除工单"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- TAB 4: ACTUATOR INVENTORY & CONTROL (设施设备台账与远程调度) -->
        <!-- ============================================================== -->
        <div v-if="currentTab === 'actuators'" class="space-y-4 max-w-7xl mx-auto">
          <!-- Top Stats & Controls -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-white/10">
            <div>
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <Sliders class="w-5 h-5 text-cyan-400" />
                <span>全园区设施设备台账与远程调度中心</span>
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">
                实时总能耗: <strong class="text-amber-300 font-mono">{{ totalKw.toFixed(1) }} kW</strong> · 运行设备: <strong class="text-cyan-300 font-mono">{{ runningCount }}</strong> / {{ actuators.length }} 台
              </p>
            </div>

            <!-- Subsystem Filters -->
            <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-white/10 text-xs overflow-x-auto no-scrollbar">
              <button
                v-for="sub in [
                  { id: 'all', label: '全部' },
                  { id: 'ventilation', label: '通风' },
                  { id: 'shading', label: '遮阳' },
                  { id: 'irrigation', label: '灌溉' },
                  { id: 'light_heat', label: '温控补光' },
                ]"
                :key="sub.id"
                @click="actuatorCategory = sub.id as any"
                :class="[
                  'px-2.5 py-1 rounded transition-colors cursor-pointer whitespace-nowrap',
                  actuatorCategory === sub.id ? 'bg-cyan-500/20 text-cyan-200 font-semibold' : 'text-slate-400'
                ]"
              >
                {{ sub.label }}
              </button>
            </div>
          </div>

          <!-- Actuators Table / Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="act in filteredActuators"
              :key="act.id"
              :class="[
                'p-3.5 rounded-xl border transition-all text-xs space-y-2.5',
                act.power
                  ? 'bg-slate-900/70 border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900/30 border-white/5 opacity-80 hover:opacity-100'
              ]"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div
                    :class="[
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                      act.power ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-500'
                    ]"
                  >
                    <Fan v-if="act.type === 'fan'" :class="['w-4 h-4', act.power ? 'animate-spin' : '']" />
                    <Maximize2 v-else-if="act.type === 'roof_vent'" class="w-4 h-4" />
                    <SunDim v-else-if="act.type === 'shade_curtain'" class="w-4 h-4" />
                    <Droplet v-else-if="act.type === 'irrigation_pump'" class="w-4 h-4" />
                    <Lightbulb v-else-if="act.type === 'grow_light'" class="w-4 h-4 text-amber-300" />
                    <RotateCcw v-else-if="act.type === 'wet_curtain'" class="w-4 h-4" />
                    <Flame v-else class="w-4 h-4 text-amber-400" />
                  </div>

                  <div class="min-w-0">
                    <div class="font-bold text-white truncate">{{ act.name }}</div>
                    <div class="text-[10px] text-slate-400 font-mono truncate">
                      {{ act.zone }} · 额定 {{ act.powerConsumptionKw }}kW
                    </div>
                  </div>
                </div>

                <!-- Toggle Switch -->
                <button
                  @click="$emit('toggleActuator', act.id, !act.power)"
                  :class="[
                    'w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer',
                    act.power
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-500 hover:text-slate-200'
                  ]"
                  :title="act.power ? '关闭设备' : '开启设备'"
                >
                  <Power class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Output Level Slider -->
              <div v-if="act.power" class="space-y-1 pt-1 border-t border-white/5">
                <div class="flex items-center justify-between text-[10px] font-mono">
                  <span class="text-slate-400">输出开度/频率</span>
                  <span class="text-cyan-300 font-bold">{{ act.value }} {{ act.metricUnit }}</span>
                </div>
                <input
                  type="range"
                  :min="0"
                  :max="act.type === 'roof_vent' ? 60 : 100"
                  :value="act.value"
                  @input="(e) => $emit('updateActuatorValue', act.id, Number((e.target as HTMLInputElement).value))"
                  class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- TAB 5: CROPS & GREENHOUSE PROFILES (大棚生境与作物种植档案) -->
        <!-- ============================================================== -->
        <div v-if="currentTab === 'crops'" class="space-y-4 max-w-7xl mx-auto">
          <!-- Greenhouse Selector Tabs -->
          <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 bg-slate-900/60 rounded-xl border border-white/10 text-xs">
            <button
              v-for="gh in greenhouses"
              :key="gh.id"
              @click="selectedGhProfile = gh.id"
              :class="[
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap font-medium border text-xs',
                selectedGhProfile === gh.id
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
              ]"
            >
              {{ gh.name }}
            </button>
          </div>

          <!-- Detail Card of Selected Greenhouse -->
          <div class="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-bold text-white">{{ currentGhDetail.name }}</h3>
                  <span class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                    {{ currentGhDetail.cropName }}
                  </span>
                </div>
                <p class="text-xs text-slate-400 mt-1">
                  种植周期: {{ currentGhCycle?.sowingDate }} ~ {{ currentGhCycle?.expectedHarvestDate }} · 当前周期第 {{ currentGhCycle?.currentCycleDay ?? 42 }} 天
                </p>
              </div>

              <div class="flex items-center gap-2">
                <button
                  @click="$emit('focusGreenhouse3D', currentGhDetail.id); $emit('backToTwin')"
                  class="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Compass class="w-3.5 h-3.5" />
                  <span>3D视界定位此棚</span>
                </button>
              </div>
            </div>

            <!-- Parameters Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div class="bg-slate-950/60 p-3 rounded-xl border border-white/5 space-y-1">
                <div class="text-[10px] text-slate-400">室内空气温度</div>
                <div class="text-base font-bold text-white">{{ currentGhDetail.airTemp }} ℃</div>
                <div class="text-[10px] text-emerald-400">昼夜温差平衡</div>
              </div>
              <div class="bg-slate-950/60 p-3 rounded-xl border border-white/5 space-y-1">
                <div class="text-[10px] text-slate-400">相对空气湿度</div>
                <div class="text-base font-bold text-cyan-300">{{ currentGhDetail.airHumidity }} %</div>
                <div class="text-[10px] text-slate-400">基质水分 {{ currentGhDetail.rootMoisture }}%</div>
              </div>
              <div class="bg-slate-950/60 p-3 rounded-xl border border-white/5 space-y-1">
                <div class="text-[10px] text-slate-400">CO₂碳肥施加</div>
                <div class="text-base font-bold text-emerald-300">{{ currentGhDetail.co2 }} ppm</div>
                <div class="text-[10px] text-emerald-400">光合作用增强期</div>
              </div>
              <div class="bg-slate-950/60 p-3 rounded-xl border border-white/5 space-y-1">
                <div class="text-[10px] text-slate-400">光照辐射</div>
                <div class="text-base font-bold text-amber-300">{{ currentGhDetail.lightLux }} klx</div>
                <div class="text-[10px] text-slate-400">{{ currentGhDetail.lightStatus }}</div>
              </div>
            </div>

            <!-- Farming Records History for this GH -->
            <div class="space-y-2 pt-2">
              <h4 class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Calendar class="w-3.5 h-3.5 text-cyan-400" />
                <span>近期待办与农事留痕记录</span>
              </h4>
              <div class="space-y-1.5 max-h-56 overflow-y-auto">
                <div
                  v-for="rec in farmingRecords.filter(r => r.greenhouseId === currentGhDetail.id).slice(0, 5)"
                  :key="rec.id"
                  class="p-2.5 rounded-lg bg-slate-950/40 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div class="flex items-center gap-2">
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {{ rec.type }}
                    </span>
                    <span class="text-slate-200">{{ rec.title }}</span>
                  </div>
                  <div class="text-[10px] font-mono text-slate-400 flex items-center gap-2">
                    <span>{{ rec.operator }}</span>
                    <span>{{ rec.timestamp }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- TAB 6: LOGISTICS & GATE ACCESS (物流冷链与门禁通行) -->
        <!-- ============================================================== -->
        <div v-if="currentTab === 'logistics'" class="space-y-4 max-w-7xl mx-auto">
          <!-- Gate Control Header -->
          <div class="p-4 rounded-xl bg-slate-900/60 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <Truck class="w-5 h-5 text-cyan-400" />
                <span>园区主大门道闸与冷链物流通行台账</span>
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">
                支持车牌识别、自动抬杆放行、冷链货车运输任务追踪
              </p>
            </div>

            <!-- Gate barrier toggle -->
            <div class="flex items-center gap-2">
              <button
                @click="$emit('toggleGateBarrier', !gateBarrierRaised)"
                :class="[
                  'px-3 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md',
                  gateBarrierRaised
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                ]"
              >
                <ShieldCheck class="w-3.5 h-3.5" />
                <span>{{ gateBarrierRaised ? '道闸落杆 (关闭)' : '一键远程抬杆 (放行)' }}</span>
              </button>
            </div>
          </div>

          <!-- Vehicle Records Table -->
          <div class="space-y-2">
            <h3 class="text-xs font-bold text-slate-300">入园车辆进出流水记录 (实时同步)</h3>
            <div class="space-y-1.5">
              <div
                v-for="rec in gateRecords"
                :key="rec.id"
                class="p-3 rounded-xl bg-slate-900/50 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
              >
                <div class="flex items-center gap-2.5">
                  <span class="px-2 py-1 rounded bg-slate-800 text-cyan-300 font-mono font-bold text-xs border border-white/10">
                    {{ rec.plateNumber }}
                  </span>
                  <div>
                    <div class="font-semibold text-slate-200">{{ rec.company }}</div>
                    <div class="text-[10px] text-slate-400 font-mono">
                      {{ rec.driverName }} · {{ rec.driverPhone }} · 目的地: {{ rec.targetArea }}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2 font-mono text-[11px] shrink-0">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px]',
                      rec.clearanceType === 'auto_whitelist'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    ]"
                  >
                    {{ rec.clearanceType === 'auto_whitelist' ? '白名单自动放行' : '人工核验' }}
                  </span>
                  <span class="text-slate-400">{{ rec.timestamp }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- TAB 7: PEST MONITORING (绿色植保与诱虫测报) -->
        <!-- ============================================================== -->
        <div v-if="currentTab === 'protection'" class="space-y-4 max-w-7xl mx-auto">
          <div class="p-4 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <Bug class="w-5 h-5 text-emerald-400" />
                <span>智能诱虫灯与绿色生物植保台账</span>
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">
                实时统计诱捕昆虫种类及周度消长动态，指导天敌昆虫释放与物理防治
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Weekly trend overview -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
              <h3 class="text-xs font-bold text-slate-200">近 7 天主要害虫消长趋势</h3>
              <div class="space-y-2">
                <div v-for="w in pestWeeklyTrend" :key="w.day" class="flex items-center gap-3 text-xs font-mono">
                  <span class="w-16 text-slate-400 text-[11px] truncate">{{ w.day }}</span>
                  <div class="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      class="bg-rose-500 transition-all"
                      :style="{ width: `${(w.aphid / (w.total || 1)) * 100}%` }"
                      title="蚜虫"
                    />
                    <div
                      class="bg-amber-400 transition-all"
                      :style="{ width: `${(w.whitefly / (w.total || 1)) * 100}%` }"
                      title="粉虱"
                    />
                    <div
                      class="bg-cyan-400 transition-all"
                      :style="{ width: `${(w.thrips / (w.total || 1)) * 100}%` }"
                      title="蓟马"
                    />
                  </div>
                  <span class="w-12 text-right font-bold text-emerald-300">{{ w.total }} 头</span>
                </div>
              </div>
            </div>

            <!-- Recent pest inspections -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
              <h3 class="text-xs font-bold text-slate-200">诱捕器现场清点留痕</h3>
              <div class="space-y-2 max-h-64 overflow-y-auto">
                <div
                  v-for="p in pestRecords"
                  :key="p.id"
                  class="p-2.5 rounded-lg bg-slate-950/40 border border-white/5 flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <div class="font-semibold text-slate-200">{{ p.location }} · {{ p.trapName }}</div>
                    <div class="text-[10px] text-slate-400">
                      目标害虫: {{ p.targetPest }} · 识别率: {{ p.aiIdentificationRate }}%
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-bold text-amber-300">{{ p.capturedCount }} 头</div>
                    <div class="text-[10px] text-slate-500">{{ p.timestamp }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- TAB 8: AQUAPONICS & WATER QUALITY (生态渔业与水质投喂) -->
        <!-- ============================================================== -->
        <div v-if="currentTab === 'ecology'" class="space-y-4 max-w-7xl mx-auto">
          <div class="p-4 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <Fish class="w-5 h-5 text-cyan-400" />
                <span>生态河塘水质与加州鲈鱼精准投喂中心</span>
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">
                实时浮标水质指标闭环监测，防止水体富营养化并保持生态平衡
              </p>
            </div>
          </div>

          <!-- Feeding Records Table -->
          <div class="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
            <h3 class="text-xs font-bold text-slate-200">每次投喂批次台账与水体微生态响应</h3>
            <div class="space-y-2">
              <div
                v-for="f in feedingRecords"
                :key="f.id"
                class="p-3 rounded-xl bg-slate-950/50 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono"
              >
                <div>
                  <div class="font-bold text-cyan-300 text-sm">
                    {{ f.pondZone }} · {{ f.species }}
                  </div>
                  <div class="text-[10px] text-slate-400">
                    饲料: {{ f.feedType }} · 投喂量: {{ f.feedAmountKg }} kg · 摄食评价: {{ f.appetiteRating }}
                  </div>
                </div>

                <div class="text-right text-[11px] text-slate-400">
                  <div>责任饲养员: {{ f.operator }}</div>
                  <div class="text-emerald-400">{{ f.timestamp }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Modal: Create New Work Order Task -->
    <div
      v-if="showCreateTaskModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div class="w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 class="font-bold text-white text-sm flex items-center gap-2">
            <ListTodo class="w-4 h-4 text-cyan-400" />
            <span>派发新农事工单</span>
          </h3>
          <button
            @click="showCreateTaskModal = false"
            class="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1">工单任务名称 *</label>
            <input
              v-model="newTask.title"
              placeholder="例如：3#棚水培叶菜采收前硝酸盐抽检"
              class="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-slate-400 mb-1">关联温室/区域</label>
              <select
                v-model="newTask.ghId"
                class="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="gh_001">1# 核心示范棚</option>
                <option value="gh_002">2# 智能玻璃棚</option>
                <option value="gh_003">3# 连栋圆拱棚</option>
                <option value="gh_004">4# 种苗工厂</option>
                <option value="gh_005">5# 日光温室</option>
                <option value="gh_006">6# 鱼菜共生棚</option>
                <option value="gh_007">7# 气雾培温室</option>
                <option value="gh_008">8# 光伏农业棚</option>
                <option value="all">全园区温室群</option>
              </select>
            </div>

            <div>
              <label class="block text-slate-400 mb-1">工单类型</label>
              <select
                v-model="newTask.type"
                class="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="巡检">日常巡检</option>
                <option value="水肥">水肥一体</option>
                <option value="植保">绿色植保</option>
                <option value="防汛">防汛应急</option>
                <option value="采收">果蔬采收</option>
                <option value="维修">设施维保</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-slate-400 mb-1">指定责任人</label>
              <input
                v-model="newTask.assignee"
                placeholder="技术员姓名"
                class="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label class="block text-slate-400 mb-1">截止要求</label>
              <input
                v-model="newTask.dueDate"
                placeholder="例如：今日 16:00 前"
                class="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label class="block text-slate-400 mb-1">操作技术标准与注意事项</label>
            <textarea
              v-model="newTask.notes"
              rows="2"
              placeholder="填写注意事项或技术要点..."
              class="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            @click="showCreateTaskModal = false"
            class="px-4 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            取消
          </button>
          <button
            @click="handleCreateTask"
            class="px-4 py-1.5 rounded-lg text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-semibold cursor-pointer shadow-md"
          >
            立即派发
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
