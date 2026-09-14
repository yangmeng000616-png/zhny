<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CameraPreset, ViewDisplayMode } from '../types/digitalTwin';
import {
  Video as CameraIcon,
  Layers,
  Sparkles,
  RotateCcw,
  Sun,
  HelpCircle,
  MapPin,
  Database,
  CloudRain,
  Activity,
  ShieldAlert,
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
}>();

const emit = defineEmits<{
  (e: 'presetChange', preset: CameraPreset): void;
  (e: 'displayModeChange', mode: ViewDisplayMode): void;
  (e: 'toggleGuide'): void;
  (e: 'resetCamera'): void;
  (e: 'toggleSpatialTags'): void;
  (e: 'toggleDataSource'): void;
  (e: 'toggleWeatherPanel'): void;
  (e: 'toggleFieldController'): void;
  (e: 'toggleAlertCenter'): void;
  (e: 'toggleHistoryBar'): void;
  (e: 'toggleSensors'): void;
  (e: 'openGreenhouseMatrix'): void;
}>();

const showGhMenu = ref<boolean>(false);
const showFacilityMenu = ref<boolean>(false);

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
    default: return '数字设施(6处)';
  }
});

const selectPreset = (preset: CameraPreset) => {
  emit('presetChange', preset);
  showGhMenu.value = false;
  showFacilityMenu.value = false;
};
</script>

<template>
  <header class="absolute top-2.5 left-2.5 right-2.5 z-30 flex items-center justify-between gap-2 pointer-events-none select-none">
    <!-- Brand & Greenhouse Title Card -->
    <div class="pointer-events-auto flex items-center gap-2 bg-slate-950/85 hover:bg-slate-950/95 backdrop-blur-2xl px-3 py-1.5 rounded-2xl border border-cyan-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.7)] ring-1 ring-white/10 shrink-0 transition-all duration-200">
      <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30 shrink-0">
        <Sparkles class="w-4 h-4 text-cyan-100" />
      </div>
      <div>
        <div class="flex items-center gap-1.5">
          <h1 class="text-xs sm:text-sm font-bold text-slate-100 tracking-wide truncate">
            智慧农业示范园数字孪生
          </h1>
          <span class="hidden xl:inline-flex px-1.5 py-0.2 text-[9px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded">
            8座温室·5大设施
          </span>
        </div>
        <div class="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
          <span class="flex items-center gap-1 text-emerald-400 font-semibold">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]"></span>
            MQTT在线
          </span>
          <span class="text-slate-700">|</span>
          <button
            @click="$emit('toggleWeatherPanel')"
            class="flex items-center gap-1 px-1 py-0.2 rounded bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 cursor-pointer"
            title="查看微气象临近预报与雷达回波"
          >
            <CloudRain class="w-2.5 h-2.5 text-cyan-400" />
            <span>气象临近报</span>
          </button>
          <span class="text-slate-700">|</span>
          <span class="text-slate-300 font-mono">{{ timeString }}</span>
        </div>
      </div>
    </div>

    <!-- Camera View Switcher Bar -->
    <div class="pointer-events-auto relative flex items-center bg-slate-950/80 hover:bg-slate-950/90 backdrop-blur-2xl px-2 py-1.5 rounded-2xl border border-cyan-500/30 shadow-[0_12px_36px_rgba(0,0,0,0.7)] ring-1 ring-white/10 gap-1 text-xs transition-all duration-300">
      <span class="text-slate-400 px-2 flex items-center gap-1 font-semibold text-[11px]">
        <CameraIcon class="w-3.5 h-3.5 text-cyan-400" /> 视角聚焦:
      </span>

      <!-- 1. Park Panorama -->
      <button
        @click="selectPreset('park_panorama')"
        :class="[
          'px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer',
          currentPreset === 'park_panorama'
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
        ]"
        title="全园区鸟瞰全貌"
      >
        园区全景
      </button>

      <!-- 2. Greenhouses Dropdown (GH1 - GH8) -->
      <div class="relative">
        <button
          @click="showGhMenu = !showGhMenu; showFacilityMenu = false;"
          :class="[
            'flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer',
            isGhPreset
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
              : 'text-emerald-300 hover:text-white hover:bg-slate-800/80'
          ]"
          title="点击展开查看 8 座现代温室大棚"
        >
          <Building2 class="w-3.5 h-3.5" />
          <span>{{ currentGhLabel }}</span>
          <ChevronDown class="w-3 h-3 transition-transform" :class="{ 'rotate-180': showGhMenu }" />
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="showGhMenu"
          class="absolute top-full left-0 mt-2 w-64 bg-slate-950/95 backdrop-blur-2xl rounded-xl border border-emerald-500/30 shadow-[0_16px_36px_rgba(0,0,0,0.85)] ring-1 ring-white/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs"
        >
          <div class="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-1 border-b border-slate-800/80 mb-1 flex items-center justify-between">
            <span>8座智能温室集群</span>
            <span class="text-slate-500">点击切换镜头</span>
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

      <!-- 3. Advanced Facilities Dropdown (6 facilities) -->
      <div class="relative">
        <button
          @click="showFacilityMenu = !showFacilityMenu; showGhMenu = false;"
          :class="[
            'flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer',
            isFacilityPreset
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
              : 'text-cyan-300 hover:text-white hover:bg-slate-800/80'
          ]"
          title="点击展开查看园区核心配套设施"
        >
          <Warehouse class="w-3.5 h-3.5" />
          <span>{{ currentFacilityLabel }}</span>
          <ChevronDown class="w-3 h-3 transition-transform" :class="{ 'rotate-180': showFacilityMenu }" />
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="showFacilityMenu"
          class="absolute top-full left-0 mt-2 w-64 bg-slate-950/95 backdrop-blur-2xl rounded-xl border border-cyan-500/30 shadow-[0_16px_36px_rgba(0,0,0,0.85)] ring-1 ring-white/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs"
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
            <span class="text-[10px] text-slate-500 font-mono">RTK起降站</span>
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
            <span class="text-[10px] text-slate-500 font-mono">母液高位罐</span>
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
        </div>
      </div>

      <div class="w-[1px] h-4 bg-slate-800 mx-0.5"></div>

      <!-- 4. Interior Roaming -->
      <button
        @click="selectPreset('interior')"
        :class="[
          'px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer',
          currentPreset === 'interior'
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
        ]"
        title="主通道漫游"
      >
        室内漫游
      </button>

      <div class="w-[1px] h-4 bg-slate-800 mx-0.5"></div>

      <!-- 5. 8-Greenhouse Independent Panels Matrix Deck -->
      <button
        id="btn-top-matrix"
        @click="$emit('openGreenhouseMatrix')"
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 hover:text-white font-semibold transition-all cursor-pointer shadow-xs text-xs"
        title="打开园区8座大棚独立监控面板矩阵"
      >
        <LayoutGrid class="w-3.5 h-3.5" />
        <span>8棚独立面板</span>
      </button>
    </div>

    <!-- Digital Twin Analysis & System Tools (Right Island) -->
    <div class="pointer-events-auto flex items-center gap-1 bg-slate-950/85 hover:bg-slate-950/95 backdrop-blur-2xl px-2 py-1 rounded-2xl border border-cyan-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.7)] ring-1 ring-white/10 text-xs shrink-0 transition-all duration-200">
      <!-- 3D Environment Field Analysis Toggle -->
      <button
        @click="$emit('toggleFieldController')"
        :class="[
          'flex items-center gap-1 px-2 py-1 rounded-lg border transition-all font-semibold cursor-pointer text-[11px]',
          showFieldController
            ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.35)]'
            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
        ]"
        title="开启三维空间温度/湿度/CO2连续场分析与水平剖切"
      >
        <Activity class="w-3 h-3 text-cyan-400" />
        <span class="hidden sm:inline">3D场</span>
      </button>

      <!-- 3D Sensors Spatial Visibility Toggle -->
      <button
        @click="$emit('toggleSensors')"
        :class="[
          'flex items-center gap-1 px-2 py-1 rounded-lg border transition-all font-semibold cursor-pointer text-[11px]',
          showSensors
            ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.35)]'
            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
        ]"
        title="显示/隐藏大棚内部三维传感器空间节点与光晕"
      >
        <Radio class="w-3 h-3 text-cyan-400" />
        <span class="hidden sm:inline">传感器</span>
      </button>

      <!-- 24H History Timeline Scrubber Toggle -->
      <button
        @click="$emit('toggleHistoryBar')"
        :class="[
          'flex items-center gap-1 px-2 py-1 rounded-lg border transition-all font-semibold cursor-pointer text-[11px]',
          showHistoryBar
            ? 'bg-amber-500/25 border-amber-400/60 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.35)]'
            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
        ]"
        title="开启24小时日照轨迹与设备运行历史推演时钟"
      >
        <Clock class="w-3 h-3 text-amber-400" />
        <span class="hidden md:inline">24H推演</span>
      </button>

      <!-- Unified Alarm & Risk Center Button with Badge -->
      <button
        @click="$emit('toggleAlertCenter')"
        :class="[
          'flex items-center gap-1 px-2 py-1 rounded-lg border transition-all font-semibold relative cursor-pointer text-[11px]',
          showAlertCenter
            ? 'bg-rose-500/25 border-rose-400/60 text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.35)]'
            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
        ]"
        title="综合异常告警与风险防控中心"
      >
        <ShieldAlert class="w-3 h-3 text-rose-400" />
        <span class="hidden lg:inline">告警</span>
        <span
          v-if="(totalAlertCount || 0) > 0"
          class="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-rose-500 text-white animate-pulse"
        >
          {{ totalAlertCount }}
        </span>
      </button>

      <div class="w-[1px] h-3.5 bg-slate-800 mx-0.5"></div>

      <!-- 3D Spatial Tags Button -->
      <button
        @click="$emit('toggleSpatialTags')"
        :class="[
          'flex items-center gap-1 px-1.5 py-1 rounded-lg border transition-colors font-semibold cursor-pointer text-[11px]',
          showSpatialTags
            ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.35)]'
            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
        ]"
        title="开启/隐藏三维全景空间标识"
      >
        <MapPin class="w-3 h-3 text-cyan-400" />
        <span class="hidden xl:inline">标牌</span>
      </button>

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
        title="切换覆盖层透视/X-Ray/实体模式"
      >
        <Layers class="w-3 h-3 text-cyan-400" />
        <span class="hidden lg:inline">
          <template v-if="displayMode === 'standard'">外观</template>
          <template v-else-if="displayMode === 'xray'">X-Ray</template>
          <template v-else-if="displayMode === 'structure_only'">骨架</template>
          <template v-else-if="displayMode === 'thermal'">热力</template>
        </span>
      </button>

      <!-- Reset Camera -->
      <button
        @click="$emit('resetCamera')"
        class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        title="重置镜头中心"
      >
        <RotateCcw class="w-3.5 h-3.5" />
      </button>

      <!-- Help Guide -->
      <button
        @click="$emit('toggleGuide')"
        class="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
        title="操作手势指引"
      >
        <HelpCircle class="w-3.5 h-3.5" />
      </button>
    </div>
  </header>
</template>
