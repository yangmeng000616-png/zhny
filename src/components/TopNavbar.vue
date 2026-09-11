<script setup lang="ts">
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
} from 'lucide-vue-next';

defineProps<{
  currentPreset: CameraPreset;
  displayMode: ViewDisplayMode;
  timeString: string;
  showSpatialTags?: boolean;
  dataSourceMode?: 'local' | 'api';
}>();

defineEmits<{
  (e: 'presetChange', preset: CameraPreset): void;
  (e: 'displayModeChange', mode: ViewDisplayMode): void;
  (e: 'toggleGuide'): void;
  (e: 'resetCamera'): void;
  (e: 'toggleSpatialTags'): void;
  (e: 'toggleDataSource'): void;
}>();
</script>

<template>
  <header class="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
    <!-- Brand & Greenhouse Title Card -->
    <div class="pointer-events-auto flex items-center gap-3 bg-slate-950/80 hover:bg-slate-950/90 backdrop-blur-2xl px-4 py-2 rounded-2xl border border-cyan-500/30 shadow-[0_12px_36px_rgba(0,0,0,0.7)] ring-1 ring-white/10 transition-all duration-300">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30">
        <Sparkles class="w-5 h-5 text-cyan-100" />
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-sm font-bold text-slate-100 tracking-wide">
            智慧现代农业示范园数字孪生系统
          </h1>
          <span class="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-md">
            4区温室基地 · 生态河塘水质水网
          </span>
        </div>
        <div class="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-0.5">
          <span class="flex items-center gap-1 text-emerald-400 font-semibold">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
            MQTT 5.0 在线
          </span>
          <span class="text-slate-700">|</span>
          <button
            @click="$emit('toggleDataSource')"
            class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900/90 hover:bg-slate-800 text-cyan-300 font-medium border border-cyan-500/40 shadow-xs transition-colors cursor-pointer"
            :title="`当前数据接入架构: DataService -> ${dataSourceMode === 'api' ? 'ApiAdapter (/api)' : 'LocalAdapter (public/data/greenhouse/)'}`"
          >
            <Database class="w-3 h-3 text-cyan-400" />
            <span>{{ dataSourceMode === 'api' ? '后端API接口' : '本地模拟 (public/data)' }}</span>
          </button>
          <span class="text-slate-700">|</span>
          <span class="flex items-center gap-1 text-slate-300">
            <Sun class="w-3 h-3 text-amber-400" /> 31℃ 晴 · 东南风 2级
          </span>
          <span class="text-slate-700">|</span>
          <span class="text-slate-300 font-mono">{{ timeString }}</span>
        </div>
      </div>
    </div>

    <!-- Camera View Switcher Bar -->
    <div class="pointer-events-auto flex items-center bg-slate-950/80 hover:bg-slate-950/90 backdrop-blur-2xl px-2 py-1.5 rounded-2xl border border-cyan-500/30 shadow-[0_12px_36px_rgba(0,0,0,0.7)] ring-1 ring-white/10 gap-1 text-xs transition-all duration-300">
      <span class="text-slate-400 px-2 flex items-center gap-1 font-semibold text-[11px]">
        <CameraIcon class="w-3.5 h-3.5 text-cyan-400" /> 视角聚焦:
      </span>
      <button
        @click="$emit('presetChange', 'park_panorama')"
        :class="[
          'px-2.5 py-1 rounded-lg font-semibold transition-all',
          currentPreset === 'park_panorama'
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
        ]"
        title="全园区鸟瞰全貌"
      >
        园区全景
      </button>
      <button
        @click="$emit('presetChange', 'pond')"
        :class="[
          'px-2.5 py-1 rounded-lg font-semibold transition-all',
          currentPreset === 'pond'
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]'
            : 'text-cyan-300 hover:text-white hover:bg-slate-800/80'
        ]"
        title="生态河塘水质与水位智能浮标站"
      >
        生态河塘
      </button>
      <div class="w-[1px] h-4 bg-slate-800 mx-0.5"></div>
      <button
        @click="$emit('presetChange', 'aerial')"
        :class="[
          'px-2.5 py-1 rounded-lg font-semibold transition-all',
          currentPreset === 'aerial'
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
        ]"
        title="1号主示范温室"
      >
        1#示范棚
      </button>
      <button
        @click="$emit('presetChange', 'gh2')"
        :class="[
          'px-2.5 py-1 rounded-lg font-semibold transition-all',
          currentPreset === 'gh2'
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
        ]"
        title="2号连栋玻璃温室 (立体草莓)"
      >
        2#玻璃棚
      </button>
      <button
        @click="$emit('presetChange', 'gh3')"
        :class="[
          'px-2.5 py-1 rounded-lg font-semibold transition-all',
          currentPreset === 'gh3'
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
        ]"
        title="3号现代连栋圆拱温室 (水培叶菜)"
      >
        3#圆拱棚
      </button>
      <button
        @click="$emit('presetChange', 'gh4')"
        :class="[
          'px-2.5 py-1 rounded-lg font-semibold transition-all',
          currentPreset === 'gh4'
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
        ]"
        title="4号数字化育苗中心 (植物工厂)"
      >
        4#育苗厂
      </button>
      <div class="w-[1px] h-4 bg-slate-800 mx-0.5"></div>
      <button
        @click="$emit('presetChange', 'interior')"
        :class="[
          'px-2.5 py-1 rounded-lg font-semibold transition-all',
          currentPreset === 'interior'
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
        ]"
        title="主通道漫游"
      >
        室内漫游
      </button>
    </div>

    <!-- Display & Mode Tools -->
    <div class="pointer-events-auto flex items-center gap-1.5 bg-slate-950/80 hover:bg-slate-950/90 backdrop-blur-2xl px-2.5 py-1.5 rounded-2xl border border-cyan-500/30 shadow-[0_12px_36px_rgba(0,0,0,0.7)] ring-1 ring-white/10 text-xs transition-all duration-300">
      <button
        @click="$emit('toggleSpatialTags')"
        :class="[
          'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors font-semibold',
          showSpatialTags
            ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
            : 'bg-slate-900/80 border-slate-750 text-slate-300 hover:bg-slate-800'
        ]"
        title="开启/隐藏三维全景空间标识"
      >
        <MapPin class="w-3.5 h-3.5 text-cyan-400" />
        <span>3D 标牌</span>
      </button>

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
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 text-cyan-300 hover:bg-slate-800 border border-slate-700/80 transition-colors font-semibold"
        title="切换覆盖层透视/X-Ray/实体模式"
      >
        <Layers class="w-3.5 h-3.5 text-cyan-400" />
        <span>
          <template v-if="displayMode === 'standard'">标准外观</template>
          <template v-else-if="displayMode === 'xray'">X-Ray透视</template>
          <template v-else-if="displayMode === 'structure_only'">隐藏覆盖层</template>
          <template v-else-if="displayMode === 'thermal'">热力分布</template>
        </span>
      </button>

      <button
        @click="$emit('resetCamera')"
        class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        title="重置镜头中心"
      >
        <RotateCcw class="w-4 h-4" />
      </button>

      <button
        @click="$emit('toggleGuide')"
        class="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
        title="操作手势指引"
      >
        <HelpCircle class="w-4 h-4" />
      </button>
    </div>
  </header>
</template>
