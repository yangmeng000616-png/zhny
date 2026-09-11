<script setup lang="ts">
import type { PickedObjectInfo } from '../three/GreenhouseScene';

defineProps<{
  info: PickedObjectInfo | null;
  screenPos: { x: number; y: number } | null;
}>();
</script>

<template>
  <div
    v-if="info && screenPos"
    class="fixed z-40 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
    :style="{ left: `${screenPos.x}px`, top: `${screenPos.y}px` }"
  >
    <div class="bg-white/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/90 shadow-xl shadow-slate-300/60 text-xs flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
      <span class="font-bold text-slate-800 tracking-wide">{{ info.name }}</span>
      <span class="text-[10px] text-cyan-700 font-semibold font-mono">点击查看</span>
    </div>
    <!-- Down arrow marker -->
    <div class="w-2 h-2 bg-white/85 border-r border-b border-slate-200 transform rotate-45 mx-auto -mt-1 shadow-xs"></div>
  </div>
</template>
