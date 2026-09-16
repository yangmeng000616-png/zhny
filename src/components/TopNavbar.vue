<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CameraPreset, ViewDisplayMode } from '../types/digitalTwin';
import {
  Layers,
  RotateCcw,
  HelpCircle,
  MapPin,
  CloudRain,
  Activity,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Radio,
  ChevronDown,
  Building2,
  Plane,
  Truck,
  Warehouse,
  Waves,
  Sprout,
  LayoutGrid,
  LayoutDashboard,
  FileSpreadsheet,
  Bug,
  Thermometer,
  Briefcase,
  Eye,
  EyeOff,
  Zap,
  CheckCircle2,
} from 'lucide-vue-next';

const props = defineProps<{
  currentPreset: CameraPreset;
  displayMode: ViewDisplayMode;
  timeString: string;
  showSpatialTags?: boolean;
  dataSourceMode?: 'local' | 'api';
  showWeatherPanel?: boolean;
  showFieldController?: boolean;
  showAlertCenter?: boolean;
  showHistoryBar?: boolean;
  showSensors?: boolean;
  totalAlertCount?: number;
  zenMode?: boolean;
  isDemoMode?: boolean;
  lastUpdateTime?: string;
}>();

const emit = defineEmits<{
  (e: 'presetChange', preset: CameraPreset): void;
  (e: 'displayModeChange', mode: ViewDisplayMode): void;
  (e: 'toggleGuide'): void;
  (e: 'resetCamera'): void;
  (e: 'toggleSpatialTags'): void;
  (e: 'toggleDataSource'): void;
  (e: 'toggleDemoJitter', val?: boolean): void;
  (e: 'toggleWeatherPanel'): void;
  (e: 'toggleFieldController'): void;
  (e: 'toggleAlertCenter'): void;
  (e: 'toggleHistoryBar'): void;
  (e: 'toggleSensors'): void;
  (e: 'openGreenhouseMatrix'): void;
  (e: 'openFarmingCenter'): void;
  (e: 'openPestModal'): void;
  (e: 'openFeedingModal'): void;
  (e: 'openTempModal'): void;
  (e: 'openOwnerHubModal'): void;
  (e: 'openLogisticsModal'): void;
  (e: 'openGateModal'): void;
  (e: 'toggleZenMode'): void;
  (e: 'openAdminPortal', tab?: string): void;
}>();

const showGhMenu = ref<boolean>(false);
const showFacilityMenu = ref<boolean>(false);
const showLedgerMenu = ref<boolean>(false);

const closeAllMenus = () => {
  showGhMenu.value = false;
  showFacilityMenu.value = false;
  showLedgerMenu.value = false;
};

const isGhPreset = computed(() => {
  return ['aerial', 'gh2', 'gh3', 'gh4', 'gh5', 'gh6', 'gh7', 'gh8'].includes(props.currentPreset);
});

const isFacilityPreset = computed(() => {
  return ['drone_dock', 'coldchain', 'fertigation_tanks', 'smart_field', 'flux_tower', 'pond'].includes(props.currentPreset);
});

const currentGhLabel = computed(() => {
  switch (props.currentPreset) {
    case 'aerial': return '1# 示范棚';
    case 'gh2': return '2# 玻璃棚';
    case 'gh3': return '3# 圆拱棚';
    case 'gh4': return '4# 育苗厂';
    case 'gh5': return '5# 日光棚';
    case 'gh6': return '6# 鱼菜棚';
    case 'gh7': return '7# 气雾棚';
    case 'gh8': return '8# 光伏棚';
    default: return '温室群(8座)';
  }
});

const currentFacilityLabel = computed(() => {
  switch (props.currentPreset) {
    case 'drone_dock': return '智能机巢';
    case 'coldchain': return '冷链物流';
    case 'fertigation_tanks': return '水肥储罐';
    case 'smart_field': return '智慧大田';
    case 'flux_tower': return '通量铁塔';
    case 'pond': return '生态河塘';
    default: return '配套设施(6处)';
  }
});

const selectPreset = (preset: CameraPreset) => {
  emit('presetChange', preset);
  closeAllMenus();
};
</script>

<template>
  <header class="absolute top-2.5 left-2.5 right-2.5 z-30 flex items-center justify-between gap-2 pointer-events-none select-none">
    <!-- Click outside overlay to close dropdowns cleanly -->
    <div
      v-if="showGhMenu || showFacilityMenu || showLedgerMenu"
      class="fixed inset-0 z-30 pointer-events-auto cursor-default"
      @click="closeAllMenus"
    />

    <!-- 1. LEFT: Brand & Quick Status Badge -->
    <div class="pointer-events-auto flex items-center gap-2 bg-slate-950/85 hover:bg-slate-950/95 backdrop-blur-xl px-2.5 py-1.5 rounded-xl border border-slate-800/80 shadow-[0_8px_24px_rgba(0,0,0,0.6)] ring-1 ring-white/10 shrink-0 transition-all">
      <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
        <Sprout class="w-3.5 h-3.5" />
      </div>
      <div class="flex items-center gap-1.5">
        <h1 class="text-xs sm:text-sm font-bold text-slate-100 tracking-wide truncate">
          智慧农业大屏
        </h1>
        <span class="inline-flex items-center gap-1 px-1.5 py-0.2 text-[9px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-md">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]"></span>
          在线
        </span>
      </div>

      <span class="text-slate-600 mx-0.5">|</span>
      <span class="text-slate-300 font-mono text-[11px]">{{ timeString }}</span>

      <!-- Compact Source & Simulation Toggle Group -->
      <div class="flex items-center gap-1 ml-0.5">
        <button
          id="btn-top-datasource-toggle"
          @click="$emit('toggleDataSource')"
          class="px-1.5 py-0.5 rounded bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/60 font-sans text-[9px] cursor-pointer transition-colors"
          :title="'数据接入模式: ' + (dataSourceMode === 'api' ? '远程后端API接口' : '本地数据文件') + ' (点击切换)'"
        >
          {{ dataSourceMode === 'api' ? 'API' : '本地' }}
        </button>

        <button
          id="btn-top-demo-jitter-toggle"
          @click="$emit('toggleDemoJitter')"
          :class="[
            'px-1.5 py-0.5 rounded border font-sans text-[9px] cursor-pointer transition-all flex items-center gap-1',
            isDemoMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-900/90 text-slate-400 border-slate-700/60 hover:text-slate-300'
          ]"
          :title="isDemoMode ? '【演示模式】模拟波动中，点击切回实测' : '【实测模式】点击开启模拟波动'"
        >
          <span :class="['w-1.5 h-1.5 rounded-full', isDemoMode ? 'bg-amber-400' : 'bg-emerald-400']"></span>
          <span>{{ isDemoMode ? '模拟' : '实测' }}</span>
        </button>
      </div>

      <span class="text-slate-700 mx-0.5">|</span>

      <!-- Refined, Calm Weather Safety Pill -->
      <button
        id="top-weather-safety-shield"
        @click="$emit('toggleWeatherPanel')"
        :class="[
          'px-2 py-0.5 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all text-xs shadow-xs',
          showWeatherPanel
            ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
            : 'bg-slate-900/80 hover:bg-slate-800/90 border-amber-500/30 text-amber-300'
        ]"
        title="点击展开微气象短临推演(0~120m)与72小时农事决策中枢"
      >
        <CloudRain class="w-3.5 h-3.5 text-amber-400" />
        <span class="text-[11px] font-medium hidden sm:inline">气象短临</span>
        <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
      </button>
    </div>

    <!-- 2. CENTER: Unified Perspectives & Business Ledgers Control -->
    <div class="pointer-events-auto relative z-40 flex items-center bg-slate-950/85 hover:bg-slate-950/95 backdrop-blur-xl px-1.5 py-1 rounded-xl border border-slate-800/90 shadow-[0_10px_30px_rgba(0,0,0,0.7)] ring-1 ring-white/10 gap-1.5 text-xs transition-all">
      <!-- 2.1 View Switcher Segment -->
      <div class="flex items-center gap-1 bg-slate-900/60 p-0.5 rounded-lg border border-slate-800/80">
        <!-- Panorama Button -->
        <button
          @click="selectPreset('park_panorama')"
          :class="[
            'px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer text-xs',
            currentPreset === 'park_panorama'
              ? 'bg-cyan-500/25 border border-cyan-400/60 text-cyan-200 shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
          ]"
          title="全园区鸟瞰全貌"
        >
          全景
        </button>

        <!-- Greenhouses Dropdown (GH1 - GH8) -->
        <div class="relative">
          <button
            @click="showGhMenu = !showGhMenu; showFacilityMenu = false; showLedgerMenu = false;"
            :class="[
              'flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer text-xs',
              isGhPreset
                ? 'bg-emerald-500/25 border border-emerald-400/60 text-emerald-200 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
            ]"
            title="点击展开查看 8 座现代温室大棚"
          >
            <Building2 class="w-3.5 h-3.5 text-emerald-400" />
            <span>{{ currentGhLabel }}</span>
            <ChevronDown class="w-3 h-3 transition-transform text-slate-400" :class="{ 'rotate-180': showGhMenu }" />
          </button>

          <!-- Dropdown Menu -->
          <div
            v-if="showGhMenu"
            class="absolute top-full left-0 mt-1.5 w-60 bg-slate-950/95 backdrop-blur-2xl rounded-xl border border-emerald-500/30 shadow-2xl ring-1 ring-white/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs"
          >
            <div class="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-1 border-b border-slate-800/80 mb-1 flex items-center justify-between">
              <span>8座智能温室集群</span>
              <span class="text-slate-500">点击聚焦</span>
            </div>
            <button
              @click="selectPreset('aerial')"
              :class="['w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer', currentPreset === 'aerial' ? 'bg-emerald-500/25 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-900']"
            >
              <span>1# Venlo核心玻璃大棚</span>
              <span class="text-[10px] text-slate-500 font-mono">示范主棚</span>
            </button>
            <button
              @click="selectPreset('gh2')"
              :class="['w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer', currentPreset === 'gh2' ? 'bg-emerald-500/25 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-900']"
            >
              <span>2# 连栋智能玻璃棚</span>
              <span class="text-[10px] text-slate-500 font-mono">立体草莓</span>
            </button>
            <button
              @click="selectPreset('gh3')"
              :class="['w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer', currentPreset === 'gh3' ? 'bg-emerald-500/25 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-900']"
            >
              <span>3# 现代连栋圆拱棚</span>
              <span class="text-[10px] text-slate-500 font-mono">水培叶菜</span>
            </button>
            <button
              @click="selectPreset('gh4')"
              :class="['w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer', currentPreset === 'gh4' ? 'bg-emerald-500/25 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-900']"
            >
              <span>4# 数字化种苗工厂</span>
              <span class="text-[10px] text-slate-500 font-mono">植物工厂</span>
            </button>
            <button
              @click="selectPreset('gh5')"
              :class="['w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer', currentPreset === 'gh5' ? 'bg-emerald-500/25 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-900']"
            >
              <span>5# 智能蓄热日光棚</span>
              <span class="text-[10px] text-amber-400 font-mono">相变蓄能</span>
            </button>
            <button
              @click="selectPreset('gh6')"
              :class="['w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer', currentPreset === 'gh6' ? 'bg-emerald-500/25 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-900']"
            >
              <span>6# 鱼菜共生生态棚</span>
              <span class="text-[10px] text-cyan-400 font-mono">循环生态</span>
            </button>
            <button
              @click="selectPreset('gh7')"
              :class="['w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer', currentPreset === 'gh7' ? 'bg-emerald-500/25 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-900']"
            >
              <span>7# 垂直气雾培农业棚</span>
              <span class="text-[10px] text-sky-400 font-mono">立体悬浮</span>
            </button>
            <button
              @click="selectPreset('gh8')"
              :class="['w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer', currentPreset === 'gh8' ? 'bg-emerald-500/25 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-900']"
            >
              <span>8# 光伏农业一体棚</span>
              <span class="text-[10px] text-lime-400 font-mono">BIPV光伏</span>
            </button>
          </div>
        </div>

        <!-- Facilities Dropdown (6 facilities) -->
        <div class="relative">
          <button
            @click="showFacilityMenu = !showFacilityMenu; showGhMenu = false; showLedgerMenu = false;"
            :class="[
              'flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer text-xs',
              isFacilityPreset
                ? 'bg-blue-500/25 border border-blue-400/60 text-blue-200 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
            ]"
            title="点击展开查看园区核心配套设施"
          >
            <Warehouse class="w-3.5 h-3.5 text-cyan-400" />
            <span>{{ currentFacilityLabel }}</span>
            <ChevronDown class="w-3 h-3 transition-transform text-slate-400" :class="{ 'rotate-180': showFacilityMenu }" />
          </button>

          <!-- Dropdown Menu -->
          <div
            v-if="showFacilityMenu"
            class="absolute top-full left-0 mt-1.5 w-60 bg-slate-950/95 backdrop-blur-2xl rounded-xl border border-cyan-500/30 shadow-2xl ring-1 ring-white/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs"
          >
            <div class="text-[10px] font-mono text-cyan-400 font-semibold px-2 py-1 border-b border-slate-800/80 mb-1 flex items-center justify-between">
              <span>园区核心配套设施</span>
              <span class="text-slate-500">点击切换镜头</span>
            </div>
            <button
              @click="selectPreset('drone_dock')"
              :class="['w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer', currentPreset === 'drone_dock' ? 'bg-cyan-500/25 text-cyan-300 font-bold' : 'text-slate-300 hover:bg-slate-900']"
            >
              <div class="flex items-center gap-1.5">
                <Plane class="w-3.5 h-3.5 text-cyan-400" />
                <span>无人机智能机巢</span>
              </div>
              <span class="text-[10px] text-slate-500 font-mono">RTK起降</span>
            </button>
            <button
              @click="selectPreset('coldchain')"
              :class="['w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer', currentPreset === 'coldchain' ? 'bg-cyan-500/25 text-cyan-300 font-bold' : 'text-slate-300 hover:bg-slate-900']"
            >
              <div class="flex items-center gap-1.5">
                <Truck class="w-3.5 h-3.5 text-sky-400" />
                <span>冷链物流与采后分选</span>
              </div>
              <span class="text-[10px] text-slate-500 font-mono">气调冷库</span>
            </button>
            <button
              @click="selectPreset('fertigation_tanks')"
              :class="['w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer', currentPreset === 'fertigation_tanks' ? 'bg-cyan-500/25 text-cyan-300 font-bold' : 'text-slate-300 hover:bg-slate-900']"
            >
              <div class="flex items-center gap-1.5">
                <Layers class="w-3.5 h-3.5 text-amber-400" />
                <span>水肥一体储罐群</span>
              </div>
              <span class="text-[10px] text-slate-500 font-mono">母液罐</span>
            </button>
            <button
              @click="selectPreset('smart_field')"
              :class="['w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer', currentPreset === 'smart_field' ? 'bg-cyan-500/25 text-cyan-300 font-bold' : 'text-slate-300 hover:bg-slate-900']"
            >
              <div class="flex items-center gap-1.5">
                <Sprout class="w-3.5 h-3.5 text-lime-400" />
                <span>智慧大田试验区</span>
              </div>
              <span class="text-[10px] text-slate-500 font-mono">50亩大田</span>
            </button>
            <button
              @click="selectPreset('flux_tower')"
              :class="['w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer', currentPreset === 'flux_tower' ? 'bg-cyan-500/25 text-cyan-300 font-bold' : 'text-slate-300 hover:bg-slate-900']"
            >
              <div class="flex items-center gap-1.5">
                <Activity class="w-3.5 h-3.5 text-violet-400" />
                <span>生态碳通量微气象塔</span>
              </div>
              <span class="text-[10px] text-slate-500 font-mono">18m测风塔</span>
            </button>
            <button
              @click="selectPreset('pond')"
              :class="['w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer', currentPreset === 'pond' ? 'bg-cyan-500/25 text-cyan-300 font-bold' : 'text-slate-300 hover:bg-slate-900']"
            >
              <div class="flex items-center gap-1.5">
                <Waves class="w-3.5 h-3.5 text-cyan-300" />
                <span>生态河塘与泵站</span>
              </div>
              <span class="text-[10px] text-slate-500 font-mono">水质浮标</span>
            </button>
            <button
              id="btn-top-facility-gate"
              @click="$emit('openGateModal'); showFacilityMenu = false;"
              class="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-300 hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <div class="flex items-center gap-1.5">
                <ShieldCheck class="w-3.5 h-3.5 text-amber-400" />
                <span>园区主大门·车牌道闸</span>
              </div>
              <span class="text-[10px] text-amber-400/80 font-mono">出入口</span>
            </button>
          </div>
        </div>

        <!-- Interior Roaming -->
        <button
          @click="selectPreset('interior')"
          :class="[
            'px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer text-xs',
            currentPreset === 'interior'
              ? 'bg-emerald-500/25 border border-emerald-400/60 text-emerald-200 shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
          ]"
          title="主通道漫游"
        >
          室内漫游
        </button>
      </div>

      <!-- Divider line -->
      <div class="w-[1px] h-5 bg-slate-800 mx-0.5"></div>

      <!-- 2.2 Production Ledgers & Operations Dropdown (Integrated & Organized) -->
      <div class="relative">
        <button
          id="btn-top-ledgers-menu"
          @click="showLedgerMenu = !showLedgerMenu; showGhMenu = false; showFacilityMenu = false;"
          :class="[
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all font-semibold cursor-pointer text-xs',
            showLedgerMenu
              ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200 shadow-xs'
              : 'bg-slate-900/80 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:text-white'
          ]"
          title="点击展开查看生产台账、诱虫测报、鱼塘喂食、温度历史与8棚独立矩阵"
        >
          <FileSpreadsheet class="w-3.5 h-3.5 text-cyan-400" />
          <span>生产台账与看板</span>
          <ChevronDown class="w-3 h-3 transition-transform text-slate-400" :class="{ 'rotate-180': showLedgerMenu }" />
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="showLedgerMenu"
          class="absolute top-full left-0 mt-1.5 w-64 bg-slate-950/95 backdrop-blur-2xl rounded-xl border border-cyan-500/30 shadow-2xl ring-1 ring-white/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs divide-y divide-slate-800/80"
        >
          <div class="py-1">
            <button
              id="btn-top-matrix"
              @click="$emit('openGreenhouseMatrix'); showLedgerMenu = false;"
              class="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-200 hover:bg-cyan-500/15 hover:text-cyan-200 transition-colors cursor-pointer group"
              title="8座大棚独立监控面板矩阵"
            >
              <div class="flex items-center gap-2">
                <LayoutGrid class="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span class="font-medium">8座大棚独立面板</span>
              </div>
              <span class="text-[9px] text-slate-500 font-mono">矩阵监控</span>
            </button>

            <button
              id="btn-top-farming-center"
              @click="$emit('openFarmingCenter'); showLedgerMenu = false;"
              class="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-200 hover:bg-cyan-500/15 hover:text-cyan-200 transition-colors cursor-pointer group"
              title="全园8座大棚农事作业台账与种植周期"
            >
              <div class="flex items-center gap-2">
                <FileSpreadsheet class="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span class="font-medium">8棚农事作业台账</span>
              </div>
              <span class="text-[9px] text-slate-500 font-mono">水肥/采收</span>
            </button>
          </div>

          <div class="py-1">
            <button
              id="btn-top-pest-modal"
              @click="$emit('openPestModal'); showLedgerMenu = false;"
              class="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-200 transition-colors cursor-pointer group"
              title="智能诱虫灯与虫情测报看板（录入数据与周趋势图）"
            >
              <div class="flex items-center gap-2">
                <Bug class="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span class="font-medium">智能诱虫灯虫情测报</span>
              </div>
              <span class="text-[9px] text-emerald-400/80 font-mono">周度趋势</span>
            </button>

            <button
              id="btn-top-feeding-modal"
              @click="$emit('openFeedingModal'); showLedgerMenu = false;"
              class="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-200 hover:bg-teal-500/15 hover:text-teal-200 transition-colors cursor-pointer group"
              title="生态鱼塘喂食留痕台账（每次投喂记录与Excel导出）"
            >
              <div class="flex items-center gap-2">
                <Waves class="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
                <span class="font-medium">生态鱼塘喂食台账</span>
              </div>
              <span class="text-[9px] text-teal-400/80 font-mono">水质留痕</span>
            </button>

            <button
              id="btn-top-temp-history"
              @click="$emit('openTempModal'); showLedgerMenu = false;"
              class="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-200 hover:bg-amber-500/15 hover:text-amber-200 transition-colors cursor-pointer group"
              title="全区域温度历史记录与微环境时序台账（Excel导出）"
            >
              <div class="flex items-center gap-2">
                <Thermometer class="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span class="font-medium">全区域温度历史时序</span>
              </div>
              <span class="text-[9px] text-amber-400/80 font-mono">时序曲线</span>
            </button>

            <button
              id="btn-top-logistics-ledger"
              @click="$emit('openLogisticsModal'); showLedgerMenu = false;"
              class="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-200 transition-colors cursor-pointer group"
              title="果蔬出货与农资进货物流台账（冷链在途跟踪与Excel导出）"
            >
              <div class="flex items-center gap-2">
                <Truck class="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span class="font-medium">果蔬出货/农资进货台账</span>
              </div>
              <span class="text-[9px] text-emerald-400/80 font-mono">冷链物流</span>
            </button>

            <button
              id="btn-top-gate-ledger"
              @click="$emit('openGateModal'); showLedgerMenu = false;"
              class="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-200 hover:bg-amber-500/15 hover:text-amber-200 transition-colors cursor-pointer group"
              title="园区大门出入道闸控制与车辆往来台账（白名单自动放行与车牌记录）"
            >
              <div class="flex items-center gap-2">
                <ShieldCheck class="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span class="font-medium">大门出入与车牌道闸</span>
              </div>
              <span class="text-[9px] text-amber-400/80 font-mono">车辆道闸</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 2.3 Standalone Priority Button: Enterprise Owner Hub (负责人中枢) -->
      <button
        id="btn-top-owner-hub"
        @click="$emit('openOwnerHubModal'); closeAllMenus();"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white font-medium transition-all cursor-pointer text-xs shrink-0"
        title="农业企业负责人与园区经营决策中枢（六大命脉台账与综合Master Excel总导出）"
      >
        <Briefcase class="w-3.5 h-3.5 text-emerald-400" />
        <span class="hidden sm:inline">负责人中枢</span>
      </button>

      <!-- 2.4 Standalone Primary Entrance: Admin Management Portal (后台管理) -->
      <button
        id="btn-top-admin-portal"
        @click="$emit('openAdminPortal', 'dashboard'); closeAllMenus();"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold transition-all cursor-pointer shadow-md shadow-emerald-950/40 text-xs shrink-0 ring-1 ring-white/20 group"
        title="进入园区综合运营与后台管理（预警处置、工单协同、设备调度、作物档案、冷链门禁等）"
      >
        <LayoutDashboard class="w-3.5 h-3.5 text-emerald-200 group-hover:rotate-12 transition-transform" />
        <span>后台管理</span>
        <span class="px-1 py-0.2 rounded bg-white/20 text-white text-[9px] font-mono font-semibold hidden md:inline">
          运营中心
        </span>
      </button>
    </div>

    <!-- 3. RIGHT: Digital Twin Analysis & System Tools -->
    <div class="pointer-events-auto flex items-center gap-1 bg-slate-950/85 hover:bg-slate-950/95 backdrop-blur-xl px-2 py-1 rounded-xl border border-slate-800/90 shadow-[0_8px_24px_rgba(0,0,0,0.6)] ring-1 ring-white/10 text-xs shrink-0 transition-all">
      <!-- 3D Environment Field Analysis Toggle -->
      <button
        @click="$emit('toggleFieldController')"
        :class="[
          'flex items-center gap-1 px-2 py-1 rounded-lg border transition-all font-semibold cursor-pointer text-[11px]',
          showFieldController
            ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-200 shadow-xs'
            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
        ]"
        title="开启三维空间连续场剖切分析"
      >
        <Activity class="w-3 h-3 text-cyan-400" />
        <span class="hidden lg:inline">3D场</span>
      </button>

      <!-- 3D Sensors Spatial Visibility Toggle -->
      <button
        @click="$emit('toggleSensors')"
        :class="[
          'flex items-center gap-1 px-2 py-1 rounded-lg border transition-all font-semibold cursor-pointer text-[11px]',
          showSensors
            ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-200 shadow-xs'
            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
        ]"
        title="显示/隐藏空间传感器光晕节点"
      >
        <Radio class="w-3 h-3 text-cyan-400" />
        <span class="hidden lg:inline">传感</span>
      </button>

      <!-- 3D Spatial Tags Button -->
      <button
        @click="$emit('toggleSpatialTags')"
        :class="[
          'flex items-center gap-1 px-2 py-1 rounded-lg border transition-all font-semibold cursor-pointer text-[11px]',
          showSpatialTags
            ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-300 shadow-xs'
            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
        ]"
        title="显示/隐藏三维空间标牌"
      >
        <MapPin class="w-3 h-3 text-cyan-400" />
        <span class="hidden lg:inline">标牌</span>
      </button>

      <!-- 24H History Timeline Scrubber Toggle -->
      <button
        @click="$emit('toggleHistoryBar')"
        :class="[
          'flex items-center gap-1 px-2 py-1 rounded-lg border transition-all font-semibold cursor-pointer text-[11px]',
          showHistoryBar
            ? 'bg-amber-500/25 border-amber-400/60 text-amber-200 shadow-xs'
            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
        ]"
        title="24H推演日照与设备状态"
      >
        <Clock class="w-3 h-3 text-amber-400" />
        <span class="hidden lg:inline">24H推演</span>
      </button>

      <!-- Unified Alarm & Risk Center Button with Badge -->
      <button
        @click="$emit('toggleAlertCenter')"
        :class="[
          'flex items-center gap-1 px-2 py-1 rounded-lg border transition-all font-semibold relative cursor-pointer text-[11px]',
          showAlertCenter
            ? 'bg-rose-500/25 border-rose-400/60 text-rose-200 shadow-xs'
            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
        ]"
        title="异常告警中心"
      >
        <ShieldAlert class="w-3 h-3 text-rose-400" />
        <span class="hidden sm:inline">告警</span>
        <span
          v-if="(totalAlertCount || 0) > 0"
          class="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-rose-500 text-white animate-pulse"
        >
          {{ totalAlertCount }}
        </span>
      </button>

      <div class="w-[1px] h-4 bg-slate-800 mx-0.5"></div>

      <!-- Glass / X-Ray Display Modes -->
      <button
        @click="
          $emit(
            'displayModeChange',
            displayMode === 'standard'
              ? 'xray'
              : displayMode === 'xray'
              ? 'structure_only'
              : 'standard'
          )
        "
        class="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-slate-900/80 text-cyan-300 hover:bg-slate-800 border border-slate-700/80 transition-colors font-semibold cursor-pointer text-[11px]"
        title="切换外观/X-Ray/骨架模式"
      >
        <Layers class="w-3 h-3 text-cyan-400" />
        <span class="hidden xl:inline">
          <template v-if="displayMode === 'standard'">外观</template>
          <template v-else-if="displayMode === 'xray'">X-Ray</template>
          <template v-else-if="displayMode === 'structure_only'">骨架</template>
        </span>
      </button>

      <!-- Zen / Clean Screen Mode Toggle -->
      <button
        @click="$emit('toggleZenMode')"
        :class="[
          'p-1.5 rounded-lg border transition-colors cursor-pointer text-[11px]',
          zenMode
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
        ]"
        :title="zenMode ? '退出沉浸模式(展开两侧面板)' : '极简沉浸模式(收起所有边栏浮窗)'"
      >
        <EyeOff v-if="zenMode" class="w-3.5 h-3.5 text-emerald-400" />
        <Eye v-else class="w-3.5 h-3.5" />
      </button>

      <!-- Reset Camera -->
      <button
        @click="$emit('resetCamera')"
        class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        title="重置镜头中心"
      >
        <RotateCcw class="w-3.5 h-3.5" />
      </button>

      <!-- Help Guide -->
      <button
        @click="$emit('toggleGuide')"
        class="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
        title="操作手势指引"
      >
        <HelpCircle class="w-3.5 h-3.5" />
      </button>
    </div>
  </header>
</template>
