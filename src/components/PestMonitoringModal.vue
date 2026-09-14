<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PestMonitoringRecord, PestWeeklyTrendItem } from '../types/digitalTwin';
import { exportPestMonitoringCsv } from '../utils/excelExport';
import {
  Bug,
  ShieldCheck,
  AlertTriangle,
  Flame,
  FileSpreadsheet,
  Plus,
  X,
  Radio,
  Sparkles,
  Search,
  Filter,
  TrendingUp,
  Cpu,
  CheckCircle2,
  Clock,
  Thermometer,
  Droplets,
  Calendar,
} from 'lucide-vue-next';

const props = defineProps<{
  records: PestMonitoringRecord[];
  weeklyTrend: PestWeeklyTrendItem[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'addRecord', record: PestMonitoringRecord): void;
}>();

// Filter states
const selectedLocation = ref<string>('all');
const selectedPest = ref<string>('all');
const selectedLevel = ref<string>('all');
const searchQuery = ref<string>('');
const showAddModal = ref<boolean>(false);
const activeChartTab = ref<'total' | 'whitefly' | 'armyworm' | 'thrips' | 'aphid'>('total');

// Locations list
const locations = [
  '1# Venlo核心示范玻璃大棚',
  '2# 高架草莓立体栽培棚',
  '3# 密刺水果黄瓜棚',
  '4# 高产彩色甜椒实验棚',
  '5# 樱桃小番茄棚',
  '6# 鱼菜共生多层水培棚',
  '7# 新疆特种哈密瓜甜瓜棚',
  '8# 高架蓝莓有机基质棚',
  '生态鱼塘外围风障绿化带',
];

// Pests list
const pestTypes: Array<PestMonitoringRecord['targetPest']> = [
  '白粉虱',
  '斜纹夜蛾',
  '西花蓟马',
  '甜菜夜蛾',
  '蚜虫',
  '棉铃虫',
  '茶黄螨',
];

// Filtered records
const filteredRecords = computed(() => {
  return props.records.filter((r) => {
    if (selectedLocation.value !== 'all' && r.location !== selectedLocation.value) return false;
    if (selectedPest.value !== 'all' && r.targetPest !== selectedPest.value) return false;
    if (selectedLevel.value !== 'all' && r.warningLevel !== selectedLevel.value) return false;
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const match =
        r.trapName.toLowerCase().includes(q) ||
        r.targetPest.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.controlRecommendation.toLowerCase().includes(q) ||
        r.reporter.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
});

// Summary Metrics
const totalCapturedToday = computed(() => {
  return props.records
    .filter((r) => r.date === '2026-09-13')
    .reduce((sum, r) => sum + r.capturedCount, 0);
});

const highRiskCount = computed(() => {
  return props.records.filter((r) => r.warningLevel === 'high' || r.warningLevel === 'medium').length;
});

const avgAiConfidence = computed(() => {
  if (props.records.length === 0) return 0;
  const sum = props.records.reduce((acc, r) => acc + r.aiIdentificationRate, 0);
  return (sum / props.records.length).toFixed(1);
});

// Form state for adding new pest capture record
const newForm = ref<Partial<PestMonitoringRecord>>({
  trapId: 'TRAP-GH01-N',
  trapName: '1#温室北区全光谱智能杀虫灯',
  location: '1# Venlo核心示范玻璃大棚',
  targetPest: '白粉虱',
  capturedCount: 15,
  warningLevel: 'low',
  envTemp: 22.5,
  envHumidity: 70,
  aiIdentificationRate: 98.0,
  controlRecommendation: '维持常规色板诱杀，注意老叶背面虫卵',
  reporter: '植保技术员·刘工',
  status: '处置中',
  notes: '',
});

// When location changes in form, sync default trapName
const onFormLocationChange = () => {
  if (newForm.value.location?.includes('1#')) {
    newForm.value.trapId = 'TRAP-GH01-N';
    newForm.value.trapName = '1#温室北区全光谱智能杀虫灯';
  } else if (newForm.value.location?.includes('2#')) {
    newForm.value.trapId = 'TRAP-GH02-E';
    newForm.value.trapName = '2#草莓大棚高空色板与诱捕器';
  } else if (newForm.value.location?.includes('鱼塘')) {
    newForm.value.trapId = 'TRAP-OUTDOOR-01';
    newForm.value.trapName = '园区生态河塘太阳能风吸式杀虫灯';
  } else {
    newForm.value.trapId = 'TRAP-GH-AUTO';
    newForm.value.trapName = `${newForm.value.location}智能诱虫测报仪`;
  }
};

const submitNewRecord = () => {
  const count = Number(newForm.value.capturedCount) || 1;
  let level: 'safe' | 'low' | 'medium' | 'high' = 'safe';
  if (count > 60) level = 'high';
  else if (count >= 30) level = 'medium';
  else if (count >= 10) level = 'low';

  const record: PestMonitoringRecord = {
    id: `PEST-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().slice(0, 10),
    timestamp: new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).replace(/\//g, '-'),
    trapId: newForm.value.trapId || 'TRAP-AUTO',
    trapName: newForm.value.trapName || '智能诱虫测报仪',
    location: newForm.value.location || '1# Venlo核心示范玻璃大棚',
    targetPest: (newForm.value.targetPest as PestMonitoringRecord['targetPest']) || '白粉虱',
    capturedCount: count,
    warningLevel: level,
    envTemp: Number(newForm.value.envTemp) || 22.0,
    envHumidity: Number(newForm.value.envHumidity) || 70,
    aiIdentificationRate: Number(newForm.value.aiIdentificationRate) || 98.0,
    controlRecommendation: newForm.value.controlRecommendation || '结合天敌释放与物理色板诱杀',
    reporter: newForm.value.reporter || '植保负责人',
    status: (newForm.value.status as '已处置' | '处置中' | '待处理') || '处置中',
    notes: newForm.value.notes || '今日诱虫灯自动计数与巡检核对完毕。',
  };

  emit('addRecord', record);
  showAddModal.value = false;
};

// Weekly chart calculations
const maxWeeklyVal = computed(() => {
  if (props.weeklyTrend.length === 0) return 100;
  if (activeChartTab.value === 'total') {
    return Math.max(...props.weeklyTrend.map((t) => t.total), 50) * 1.15;
  } else if (activeChartTab.value === 'whitefly') {
    return Math.max(...props.weeklyTrend.map((t) => t.whitefly), 20) * 1.2;
  } else if (activeChartTab.value === 'armyworm') {
    return Math.max(...props.weeklyTrend.map((t) => t.armyworm), 30) * 1.2;
  } else if (activeChartTab.value === 'thrips') {
    return Math.max(...props.weeklyTrend.map((t) => t.thrips), 20) * 1.2;
  } else {
    return Math.max(...props.weeklyTrend.map((t) => t.aphid), 20) * 1.2;
  }
});

const getChartValue = (item: PestWeeklyTrendItem) => {
  switch (activeChartTab.value) {
    case 'whitefly': return item.whitefly;
    case 'armyworm': return item.armyworm;
    case 'thrips': return item.thrips;
    case 'aphid': return item.aphid;
    default: return item.total;
  }
};

const handleExportExcel = () => {
  exportPestMonitoringCsv(props.records);
};
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
    <div
      id="pest-monitoring-modal"
      class="w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden text-slate-100"
    >
      <!-- Modal Header -->
      <header class="px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 border-b border-emerald-500/30 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Bug class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-bold text-white tracking-wide">
                智能诱虫灯与全园虫情测报中心
              </h2>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                绿色植保·天敌联防
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              光波诱虫联网自动计数 · AI微距害虫图像识别 · 周度动态爆发趋势 · 规范化绿色防控对策
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            id="btn-export-pest-excel"
            @click="handleExportExcel"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-700/30 cursor-pointer"
            title="将全园诱虫灯捕获与虫情测报数据导出为 Excel CSV 文件"
          >
            <FileSpreadsheet class="w-4 h-4" />
            <span>导出Excel报表</span>
          </button>

          <button
            id="btn-add-pest-record"
            @click="showAddModal = true"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-700/30 cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>+ 录入诱虫灯捕获数据</span>
          </button>

          <button
            @click="$emit('close')"
            class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </header>

      <!-- Modal Body (Scrollable) -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        <!-- Key Metrics Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bug class="w-5 h-5" />
            </div>
            <div>
              <div class="text-[11px] text-slate-400">今日诱捕总头数</div>
              <div class="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                {{ totalCapturedToday }} <span class="text-xs font-normal text-slate-400">头</span>
              </div>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle class="w-5 h-5" />
            </div>
            <div>
              <div class="text-[11px] text-slate-400">中/重度预警点位</div>
              <div class="text-xl font-bold font-mono text-rose-400 mt-0.5">
                {{ highRiskCount }} <span class="text-xs font-normal text-slate-400">处</span>
              </div>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Cpu class="w-5 h-5" />
            </div>
            <div>
              <div class="text-[11px] text-slate-400">AI图像置信度</div>
              <div class="text-xl font-bold font-mono text-cyan-300 mt-0.5">
                {{ avgAiConfidence }}%
              </div>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck class="w-5 h-5" />
            </div>
            <div>
              <div class="text-[11px] text-slate-400">智能诱虫灯在线率</div>
              <div class="text-xl font-bold font-mono text-indigo-300 mt-0.5">
                100% <span class="text-xs font-normal text-slate-400">(9/9联网)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Weekly Trend Analysis Chart Section -->
        <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800/90 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div class="flex items-center gap-2">
              <TrendingUp class="w-4 h-4 text-emerald-400" />
              <h3 class="text-sm font-bold text-slate-100">
                诱虫灯近7天周度诱捕动态走势图 (Weekly Pest Trend)
              </h3>
            </div>

            <!-- Chart metric toggle buttons -->
            <div class="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
              <button
                @click="activeChartTab = 'total'"
                :class="[
                  'px-2 py-1 rounded font-medium transition-all cursor-pointer',
                  activeChartTab === 'total' ? 'bg-emerald-500 text-white font-semibold shadow' : 'text-slate-400 hover:text-white'
                ]"
              >
                全部害虫总量
              </button>
              <button
                @click="activeChartTab = 'whitefly'"
                :class="[
                  'px-2 py-1 rounded font-medium transition-all cursor-pointer',
                  activeChartTab === 'whitefly' ? 'bg-cyan-500 text-white font-semibold shadow' : 'text-slate-400 hover:text-white'
                ]"
              >
                白粉虱
              </button>
              <button
                @click="activeChartTab = 'armyworm'"
                :class="[
                  'px-2 py-1 rounded font-medium transition-all cursor-pointer',
                  activeChartTab === 'armyworm' ? 'bg-rose-500 text-white font-semibold shadow' : 'text-slate-400 hover:text-white'
                ]"
              >
                斜纹/甜菜夜蛾
              </button>
              <button
                @click="activeChartTab = 'thrips'"
                :class="[
                  'px-2 py-1 rounded font-medium transition-all cursor-pointer',
                  activeChartTab === 'thrips' ? 'bg-amber-500 text-white font-semibold shadow' : 'text-slate-400 hover:text-white'
                ]"
              >
                西花蓟马
              </button>
              <button
                @click="activeChartTab = 'aphid'"
                :class="[
                  'px-2 py-1 rounded font-medium transition-all cursor-pointer',
                  activeChartTab === 'aphid' ? 'bg-purple-500 text-white font-semibold shadow' : 'text-slate-400 hover:text-white'
                ]"
              >
                蚜虫
              </button>
            </div>
          </div>

          <!-- SVG Visual Bar & Line Chart -->
          <div class="h-44 w-full relative flex items-end pt-5 pb-6 px-4">
            <!-- Grid Lines -->
            <div class="absolute inset-x-4 top-5 bottom-6 flex flex-col justify-between pointer-events-none opacity-20">
              <div class="border-b border-slate-600"></div>
              <div class="border-b border-slate-600"></div>
              <div class="border-b border-slate-600"></div>
              <div class="border-b border-slate-600"></div>
            </div>

            <!-- Bars Grid -->
            <div class="w-full h-full flex items-end justify-between relative z-10 gap-2 sm:gap-4">
              <div
                v-for="item in weeklyTrend"
                :key="item.date"
                class="flex-1 flex flex-col items-center h-full justify-end group relative"
              >
                <!-- Tooltip on Hover -->
                <div class="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-slate-200 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono shadow-lg whitespace-nowrap z-20 pointer-events-none">
                  {{ item.day }}: {{ getChartValue(item) }} 头
                </div>

                <!-- Animated Bar -->
                <div
                  class="w-full max-w-[36px] rounded-t-md transition-all duration-300 relative group-hover:brightness-125"
                  :style="{
                    height: `${Math.max(8, (getChartValue(item) / maxWeeklyVal) * 100)}%`,
                    backgroundColor:
                      activeChartTab === 'total' ? '#10b981' :
                      activeChartTab === 'whitefly' ? '#06b6d4' :
                      activeChartTab === 'armyworm' ? '#f43f5e' :
                      activeChartTab === 'thrips' ? '#f59e0b' : '#a855f7'
                  }"
                >
                  <div class="absolute -top-5 inset-x-0 text-center text-[10px] font-mono font-bold text-slate-300">
                    {{ getChartValue(item) }}
                  </div>
                </div>

                <!-- X-Axis Date Label -->
                <div class="text-[10px] text-slate-400 mt-2 font-mono truncate max-w-full">
                  {{ item.date.slice(5) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Trend Analysis Insight -->
          <div class="mt-2 text-xs text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>
                <strong class="text-slate-200">农艺专家研判分析：</strong>
                周三至周五因园区室外气温回升(26.5℃)并伴随间歇性降雨，外围生态河塘夜蛾成虫羽化活跃度增高；大棚内部由于严格挂设黄色及蓝色诱捕板、配合巴氏钝绥螨天敌释放，大棚内蓟马与粉虱始终被压制在经济危害阈值之下。
              </span>
            </div>
            <span class="text-emerald-400 font-mono text-[11px] shrink-0 ml-2">绿色防控达成率 98.6%</span>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <div class="flex items-center gap-1.5 text-slate-400 font-medium">
              <Filter class="w-3.5 h-3.5 text-slate-400" />
              <span>筛选:</span>
            </div>

            <!-- Location Filter -->
            <select
              v-model="selectedLocation"
              class="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500/50"
            >
              <option value="all">全部大棚与区域</option>
              <option v-for="loc in locations" :key="loc" :value="loc">{{ loc }}</option>
            </select>

            <!-- Pest Filter -->
            <select
              v-model="selectedPest"
              class="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500/50"
            >
              <option value="all">全部害虫品类</option>
              <option v-for="pest in pestTypes" :key="pest" :value="pest">{{ pest }}</option>
            </select>

            <!-- Level Filter -->
            <select
              v-model="selectedLevel"
              class="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500/50"
            >
              <option value="all">全部预警等级</option>
              <option value="safe">安全 (正常)</option>
              <option value="low">轻度 (关注)</option>
              <option value="medium">中度 (预警)</option>
              <option value="high">严重 (爆发)</option>
            </select>
          </div>

          <!-- Search Input -->
          <div class="relative w-full sm:w-60">
            <Search class="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索诱虫灯/地点/建议..."
              class="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        <!-- Pest Records Data Table -->
        <div class="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/70">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th class="py-2.5 px-3">时间戳</th>
                  <th class="py-2.5 px-3">诱虫灯编号 / 设备名称</th>
                  <th class="py-2.5 px-3">监测大棚/位置</th>
                  <th class="py-2.5 px-3">靶标害虫</th>
                  <th class="py-2.5 px-3">诱捕头数</th>
                  <th class="py-2.5 px-3">预警级别</th>
                  <th class="py-2.5 px-3">环境温湿</th>
                  <th class="py-2.5 px-3">AI识别率</th>
                  <th class="py-2.5 px-3 min-w-[220px]">绿色防控方案与天敌建议</th>
                  <th class="py-2.5 px-3">状态</th>
                  <th class="py-2.5 px-3">测报员</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-mono">
                <tr
                  v-for="record in filteredRecords"
                  :key="record.id"
                  class="hover:bg-slate-800/40 transition-colors"
                >
                  <td class="py-2.5 px-3 text-slate-300 whitespace-nowrap">{{ record.timestamp }}</td>
                  <td class="py-2.5 px-3 whitespace-nowrap">
                    <div class="text-slate-200 font-medium font-sans">{{ record.trapName }}</div>
                    <div class="text-[10px] text-slate-500">{{ record.trapId }}</div>
                  </td>
                  <td class="py-2.5 px-3 text-slate-300 font-sans whitespace-nowrap">{{ record.location }}</td>
                  <td class="py-2.5 px-3 whitespace-nowrap">
                    <span class="px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-slate-800 text-slate-200 border border-slate-700">
                      {{ record.targetPest }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 font-bold whitespace-nowrap">
                    <span
                      :class="[
                        record.capturedCount >= 60 ? 'text-rose-400' :
                        record.capturedCount >= 30 ? 'text-amber-400' : 'text-emerald-400'
                      ]"
                    >
                      {{ record.capturedCount }} 头
                    </span>
                  </td>
                  <td class="py-2.5 px-3 whitespace-nowrap font-sans">
                    <span
                      v-if="record.warningLevel === 'high'"
                      class="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-flex items-center gap-1"
                    >
                      <Flame class="w-3 h-3" /> 重度爆发
                    </span>
                    <span
                      v-else-if="record.warningLevel === 'medium'"
                      class="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    >
                      中度预警
                    </span>
                    <span
                      v-else-if="record.warningLevel === 'low'"
                      class="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    >
                      轻度关注
                    </span>
                    <span
                      v-else
                      class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    >
                      正常安全
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                    {{ record.envTemp }}℃ / {{ record.envHumidity }}%
                  </td>
                  <td class="py-2.5 px-3 text-cyan-300 whitespace-nowrap">
                    {{ record.aiIdentificationRate }}%
                  </td>
                  <td class="py-2.5 px-3 text-slate-300 font-sans text-xs">
                    {{ record.controlRecommendation }}
                  </td>
                  <td class="py-2.5 px-3 whitespace-nowrap font-sans">
                    <span
                      :class="[
                        'px-1.5 py-0.5 rounded text-[10px]',
                        record.status === '已处置' ? 'bg-emerald-500/20 text-emerald-300' :
                        record.status === '处置中' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300'
                      ]"
                    >
                      {{ record.status }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-slate-400 font-sans whitespace-nowrap">
                    {{ record.reporter }}
                  </td>
                </tr>
                <tr v-if="filteredRecords.length === 0">
                  <td colspan="11" class="py-8 text-center text-slate-500 font-sans">
                    未检索到符合条件的诱虫灯与虫情测报记录
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer Action -->
      <footer class="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div class="flex items-center gap-2">
          <ShieldCheck class="w-4 h-4 text-emerald-400" />
          <span>国家绿色食品认证标准 (NY/T 391) · 全园物理理化诱控覆盖率 100%</span>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="handleExportExcel"
            class="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline flex items-center gap-1"
          >
            <FileSpreadsheet class="w-3.5 h-3.5" /> 导出本表为Excel (CSV)
          </button>
          <button
            @click="$emit('close')"
            class="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium cursor-pointer"
          >
            关闭看板
          </button>
        </div>
      </footer>
    </div>

    <!-- Modal for adding new insect trap data -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      <div class="w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl p-5 text-slate-100 ring-1 ring-white/10">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div class="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Plus class="w-4 h-4" />
            <span>录入诱虫灯捕获数据与虫情测报</span>
          </div>
          <button @click="showAddModal = false" class="text-slate-400 hover:text-white cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1">所属温室大棚 / 监测区域</label>
            <select
              v-model="newForm.location"
              @change="onFormLocationChange"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option v-for="loc in locations" :key="loc" :value="loc">{{ loc }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-slate-400 mb-1">靶标害虫种类</label>
              <select
                v-model="newForm.targetPest"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option v-for="pest in pestTypes" :key="pest" :value="pest">{{ pest }}</option>
              </select>
            </div>

            <div>
              <label class="block text-slate-400 mb-1">本次诱捕头数 (头)</label>
              <input
                v-model.number="newForm.capturedCount"
                type="number"
                min="0"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-slate-400 mb-1">环境温度 (℃)</label>
              <input
                v-model.number="newForm.envTemp"
                type="number"
                step="0.1"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label class="block text-slate-400 mb-1">相对湿度 (%)</label>
              <input
                v-model.number="newForm.envHumidity"
                type="number"
                step="1"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label class="block text-slate-400 mb-1">绿色防控建议 / 农艺对策</label>
            <input
              v-model="newForm.controlRecommendation"
              type="text"
              placeholder="例如：补充蓝板20张，释放巴氏钝绥螨，加强通风降湿"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-slate-400 mb-1">测报记录人</label>
              <input
                v-model="newForm.reporter"
                type="text"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label class="block text-slate-400 mb-1">处置状态</label>
              <select
                v-model="newForm.status"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="处置中">处置中</option>
                <option value="已处置">已处置</option>
                <option value="待处理">待处理</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 border-t border-slate-800 pt-3 mt-4">
          <button
            @click="showAddModal = false"
            class="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer font-medium"
          >
            取消
          </button>
          <button
            @click="submitNewRecord"
            class="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow cursor-pointer"
          >
            保存并上链留痕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
