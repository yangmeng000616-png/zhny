<script setup lang="ts">
import type { ProjectedTag } from '../types/digitalTwin';
import {
  CloudSun,
  Fan,
  Lightbulb,
  Cpu,
  Monitor,
  Droplets,
  Waves,
  Bot,
  ChevronRight,
} from 'lucide-vue-next';

defineProps<{
  tags: ProjectedTag[];
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'selectTag', tag: ProjectedTag): void;
}>();

const getCategoryColor = (cat: string) => {
  switch (cat) {
    case 'weather':
      return {
        bg: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
        dot: 'bg-amber-400 shadow-[0_0_6px_#f59e0b]',
      };
    case 'fan':
      return {
        bg: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
        dot: 'bg-sky-400 shadow-[0_0_6px_#38bdf8]',
      };
    case 'light':
      return {
        bg: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
        dot: 'bg-yellow-400 shadow-[0_0_6px_#facc15]',
      };
    case 'sensor':
      return {
        bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
        dot: 'bg-emerald-400 shadow-[0_0_6px_#34d399]',
      };
    case 'control':
      return {
        bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
        dot: 'bg-indigo-400 shadow-[0_0_6px_#818cf8]',
      };
    case 'irrigation':
      return {
        bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
        dot: 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]',
      };
    case 'pond':
      return {
        bg: 'bg-teal-500/15 text-teal-300 border-teal-500/40',
        dot: 'bg-teal-400 shadow-[0_0_6px_#2dd4bf]',
      };
    case 'agv':
      return {
        bg: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
        dot: 'bg-purple-400 shadow-[0_0_6px_#c084fc]',
      };
    default:
      return {
        bg: 'bg-slate-500/15 text-slate-300 border-slate-500/40',
        dot: 'bg-slate-400',
      };
  }
};
</script>

<template>
  <div v-if="visible" class="absolute inset-0 pointer-events-none z-15 overflow-hidden">
    <template v-for="tag in tags" :key="tag.id">
      <div
        v-if="tag.isVisible && tag.screenX > 20 && tag.screenY > 20"
        :style="{
          transform: `translate3d(${tag.screenX}px, ${tag.screenY}px, 0) translate(-50%, -100%) scale(${Math.max(0.7, Math.min(1.0, 45 / (tag.distance || 45)))})`,
          opacity: (tag.distance && tag.distance > 180) ? 0.35 : (tag.distance && tag.distance > 120) ? 0.75 : 1,
        }"
        class="absolute will-change-transform pointer-events-auto select-none group cursor-pointer transition-opacity duration-300"
        @click="emit('selectTag', tag)"
      >
        <!-- Card Container -->
        <div
          class="relative flex items-center gap-1.5 px-2 py-1 bg-slate-950/85 hover:bg-slate-900/95 backdrop-blur-xl rounded-lg border border-slate-700/80 shadow-[0_6px_20px_rgba(0,0,0,0.7)] hover:border-cyan-400/60 hover:scale-105 transition-all duration-150 ring-1 ring-white/5"
        >
          <!-- Category Icon with animated pulsing status dot -->
          <div class="relative flex-shrink-0">
            <div
              :class="[
                'w-6 h-6 rounded-md flex items-center justify-center border',
                getCategoryColor(tag.category).bg,
              ]"
            >
              <CloudSun v-if="tag.icon === 'CloudSun'" class="w-3.5 h-3.5 text-amber-400" />
              <Fan v-else-if="tag.icon === 'Fan'" class="w-3.5 h-3.5 text-sky-400 animate-spin" />
              <Lightbulb v-else-if="tag.icon === 'Lightbulb'" class="w-3.5 h-3.5 text-yellow-300" />
              <Cpu v-else-if="tag.icon === 'Cpu'" class="w-3.5 h-3.5 text-emerald-400" />
              <Monitor v-else-if="tag.icon === 'Monitor'" class="w-3.5 h-3.5 text-indigo-400" />
              <Droplets v-else-if="tag.icon === 'Droplets'" class="w-3.5 h-3.5 text-cyan-400" />
              <Waves v-else-if="tag.icon === 'Waves'" class="w-3.5 h-3.5 text-teal-400" />
              <Bot v-else-if="tag.icon === 'Bot'" class="w-3.5 h-3.5 text-purple-400" />
              <Cpu v-else class="w-3.5 h-3.5 text-slate-400" />
            </div>

            <!-- Pulsing Active Dot -->
            <span class="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span
                :class="[
                  'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                  getCategoryColor(tag.category).dot,
                ]"
              />
              <span
                :class="[
                  'relative inline-flex rounded-full h-2 w-2',
                  getCategoryColor(tag.category).dot,
                ]"
              />
            </span>
          </div>

          <!-- Label & Status Subtext -->
          <div class="flex flex-col text-left whitespace-nowrap pr-0.5">
            <div class="flex items-center gap-1">
              <span class="font-bold text-slate-100 text-[11px] tracking-tight group-hover:text-cyan-300 transition-colors">
                {{ tag.name }}
              </span>
              <span class="text-[8px] font-mono text-cyan-300 bg-cyan-950/70 px-1 py-0.2 rounded border border-cyan-500/30">
                {{ tag.statusText }}
              </span>
            </div>
            <div v-if="tag.subtext" class="text-[9px] text-slate-400 font-medium font-mono tracking-tight">
              {{ tag.subtext }}
            </div>
          </div>

          <!-- Click Arrow hint -->
          <ChevronRight class="w-3 h-3 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>

        <!-- Stem Pin / Anchor Dot pointing to 3D position -->
        <div class="flex flex-col items-center">
          <div class="w-0.5 h-2 bg-gradient-to-b from-cyan-400 to-transparent" />
          <div class="w-1.5 h-1.5 rounded-full bg-cyan-400 border border-slate-900 ring-1 ring-cyan-400/50 shadow-[0_0_6px_#22d3ee]" />
        </div>
      </div>
    </template>
  </div>
</template>
