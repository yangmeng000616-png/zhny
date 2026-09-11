<script setup lang="ts">
import type { CameraPreset, ViewDisplayMode } from '../types/digitalTwin';
import {
  Video as CameraIcon,
  Layers,
  Sparkles,
  RotateCcw,
  Sun,
  HelpCircle,
} from 'lucide-vue-next';

defineProps<{
  currentPreset: CameraPreset;
  displayMode: ViewDisplayMode;
  timeString: string;
}>();

defineEmits<{
  (e: 'presetChange', preset: CameraPreset): void;
  (e: 'displayModeChange', mode: ViewDisplayMode): void;
  (e: 'toggleGuide'): void;
  (e: 'resetCamera'): void;
}>();
</script>

<template>
  <header className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
    <!-- Brand & Greenhouse Title Card -->
    <div className="pointer-events-auto flex items-center gap-3 bg-white/75 backdrop-blur-2xl px-4 py-2.5 rounded-xl border border-white/80 shadow-lg shadow-slate-300/40">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
        <Sparkles class="w-5 h-5 text-cyan-100" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold text-slate-800 tracking-wide">
            智慧现代农业示范园数字孪生系统
          </h1>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 rounded">
            4区温室基地 · 生态河塘水质水网
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-0.5">
          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            MQTT 5.0 全园在线
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1 text-slate-600">
            <Sun class="w-3 h-3 text-amber-500" /> 31℃ 晴朗 · 东南风 2级
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">{{ timeString }}</span>
        </div>
      </div>
    </div>

    <!-- Camera View Switcher Bar -->
    <div className="pointer-events-auto flex items-center bg-white/75 backdrop-blur-2xl px-2 py-1.5 rounded-xl border border-white/80 shadow-lg shadow-slate-300/40 gap-1 text-xs">
      <span className="text-slate-500 px-2 flex items-center gap-1 font-semibold text-[11px]">
        <CameraIcon class="w-3.5 h-3.5" /> 视角聚焦:
      </span>
      <button
        @click="$emit('presetChange', 'park_panorama')"
        :class="[
          'px-2.5 py-1 rounded-lg font-semibold transition-all',
          currentPreset === 'park_panorama'
            ? 'bg-cyan-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
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
            ? 'bg-cyan-600 text-white shadow-xs'
            : 'text-cyan-700 hover:text-cyan-900 hover:bg-slate-100/80'
        ]"
        title="生态河塘水质与水位智能浮标站"
      >
        生态河塘
      </button>
      <div className="w-[1px] h-4 bg-slate-200 mx-0.5"></div>
      <button
        @click="$emit('presetChange', 'aerial')"
        :class="[
          'px-2.5 py-1 rounded-lg font-semibold transition-all',
          currentPreset === 'aerial'
            ? 'bg-cyan-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
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
            ? 'bg-cyan-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
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
            ? 'bg-cyan-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
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
            ? 'bg-cyan-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
        ]"
        title="4号数字化育苗中心 (植物工厂)"
      >
        4#育苗厂
      </button>
      <div className="w-[1px] h-4 bg-slate-200 mx-0.5"></div>
      <button
        @click="$emit('presetChange', 'interior')"
        :class="[
          'px-2.5 py-1 rounded-lg font-semibold transition-all',
          currentPreset === 'interior'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
        ]"
        title="主通道漫游"
      >
        室内漫游
      </button>
    </div>

    <!-- Display & Mode Tools -->
    <div className="pointer-events-auto flex items-center gap-1.5 bg-white/75 backdrop-blur-2xl px-2.5 py-1.5 rounded-xl border border-white/80 shadow-lg shadow-slate-300/40 text-xs">
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
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 text-cyan-800 hover:bg-slate-200 border border-slate-200 transition-colors font-semibold"
        title="切换覆盖层透视/X-Ray/实体模式"
      >
        <Layers class="w-3.5 h-3.5 text-cyan-600" />
        <span>
          <template v-if="displayMode === 'standard'">标准外观</template>
          <template v-else-if="displayMode === 'xray'">X-Ray透视</template>
          <template v-else-if="displayMode === 'structure_only'">隐藏覆盖层</template>
          <template v-else-if="displayMode === 'thermal'">热力分布</template>
        </span>
      </button>

      <button
        @click="$emit('resetCamera')"
        class="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        title="重置镜头中心"
      >
        <RotateCcw class="w-4 h-4" />
      </button>

      <button
        @click="$emit('toggleGuide')"
        class="p-1.5 rounded-lg text-slate-600 hover:text-cyan-700 hover:bg-slate-100 transition-colors"
        title="操作手势指引"
      >
        <HelpCircle class="w-4 h-4" />
      </button>
    </div>
  </header>
</template>
