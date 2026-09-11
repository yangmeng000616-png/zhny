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
    <div class="bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/50 shadow-[0_10px_25px_rgba(0,0,0,0.8)] text-xs flex items-center gap-2 ring-1 ring-white/10">
      <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]"></span>
      <span class="font-bold text-slate-100 tracking-wide">{{ info.name }}</span>
      <span class="text-[10px] text-cyan-300 font-semibold font-mono">点击查看</span>
    </div>
    <!-- Down arrow marker -->
    <div class="w-2 h-2 bg-slate-950/90 border-r border-b border-cyan-500/50 transform rotate-45 mx-auto -mt-1 shadow-xs"></div>
  </div>
</template>
