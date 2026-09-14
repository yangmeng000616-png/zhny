<script setup lang="ts">
import { ref, onBeforeUnmount, computed } from 'vue';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  Sun,
  Moon,
  ChevronRight,
  Zap,
  FastForward,
  X,
} from 'lucide-vue-next';
import type { HistoryPlaybackState } from '../types/digitalTwin';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'timeChange', hourFraction: number): void;
}>();

const isPlaying = ref<boolean>(false);
const playbackSpeed = ref<number>(2); // 1x, 2x, 5x, 10x
const currentHourFraction = ref<number>(9.5); // Default to 09:30 AM
let playInterval: ReturnType<typeof setInterval> | null = null;

const formattedTime = computed(() => {
  const totalMinutes = Math.floor(currentHourFraction.value * 60);
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
});

const isDaytime = computed(() => {
  return currentHourFraction.value >= 6 && currentHourFraction.value <= 18;
});

const milestones = [
  { hour: 6.0, label: '06:00', title: '日出晨光·自然通风', icon: Sun },
  { hour: 9.5, label: '09:30', title: '水肥一体化精量灌溉', icon: Zap },
  { hour: 13.0, label: '13:00', title: '强日照顶帘降温', icon: Sun },
  { hour: 17.5, label: '17:30', title: '补光灯阶段启动', icon: Sun },
  { hour: 21.0, label: '21:00', title: 'AGV巡检机器人夜巡', icon: Moon },
];

const togglePlay = () => {
  isPlaying.value = !isPlaying.value;
  if (isPlaying.value) {
    playInterval = setInterval(() => {
      // Step forward: at 1x speed, 0.05 hours (3 mins) per 200ms
      const step = (0.04 * playbackSpeed.value);
      let next = currentHourFraction.value + step;
      if (next >= 24) next = 0;
      currentHourFraction.value = +next.toFixed(2);
      emit('timeChange', currentHourFraction.value);
    }, 200);
  } else if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
  }
};

const handleSliderInput = (e: Event) => {
  const val = +((e.target as HTMLInputElement).value);
  currentHourFraction.value = val;
  emit('timeChange', val);
};

const handleJumpToMilestone = (hour: number) => {
  currentHourFraction.value = hour;
  emit('timeChange', hour);
};

const handleReset = () => {
  currentHourFraction.value = 9.5;
  emit('timeChange', 9.5);
};

onBeforeUnmount(() => {
  if (playInterval) clearInterval(playInterval);
});
</script>

<template>
  <div
    v-if="visible"
    class="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[640px] max-w-[94vw] bg-slate-950/65 hover:bg-slate-950/80 backdrop-blur-2xl rounded-2xl border border-cyan-500/35 shadow-[0_20px_60px_rgba(0,0,0,0.9)] ring-1 ring-white/10 text-slate-100 p-3 pointer-events-auto transition-all duration-300 space-y-2.5"
  >
    <!-- Top Row: Status, Play Controls & Time Display -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
          <Clock class="w-4 h-4" />
        </div>
        <div>
          <h3 class="text-xs font-bold text-white flex items-center gap-1.5">
            24小时数字孪生时空全景推演
            <span
              :class="[
                'px-1.5 py-0.2 rounded text-[10px] font-mono flex items-center gap-1 font-semibold',
                isDaytime ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              ]"
            >
              <Sun v-if="isDaytime" class="w-3 h-3" />
              <Moon v-else class="w-3 h-3" />
              {{ isDaytime ? '日间运行模态' : '夜间休眠/补光模态' }}
            </span>
          </h3>
        </div>
      </div>

      <!-- Playback Controls -->
      <div class="flex items-center gap-2">
        <!-- Play / Pause -->
        <button
          @click="togglePlay"
          class="w-7 h-7 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center hover:bg-cyan-400 transition-colors shadow-sm cursor-pointer"
          :title="isPlaying ? '暂停回放' : '开始时空推演'"
        >
          <Pause v-if="isPlaying" class="w-3.5 h-3.5 fill-current" />
          <Play v-else class="w-3.5 h-3.5 fill-current ml-0.5" />
        </button>

        <!-- Speed Selector -->
        <div class="flex items-center bg-slate-900/80 rounded-lg p-0.5 border border-slate-800 text-[10px] font-mono">
          <button
            v-for="s in [1, 2, 5, 10]"
            :key="s"
            @click="playbackSpeed = s"
            :class="[
              'px-1.5 py-0.5 rounded transition-colors',
              playbackSpeed === s ? 'bg-cyan-500/30 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
            ]"
          >
            {{ s }}x
          </button>
        </div>

        <!-- Reset Button -->
        <button
          @click="handleReset"
          class="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-800 cursor-pointer"
          title="重置到实时"
        >
          <RotateCcw class="w-3.5 h-3.5" />
        </button>

        <!-- Time Clock Digital Indicator -->
        <div class="px-2.5 py-1 rounded-lg bg-slate-900 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs tracking-wider">
          {{ formattedTime }}
        </div>

        <button
          @click="$emit('close')"
          class="text-slate-400 hover:text-white transition-colors p-1"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Timeline Scrubber Bar -->
    <div class="relative pt-1">
      <input
        type="range"
        min="0"
        max="23.9"
        step="0.1"
        :value="currentHourFraction"
        @input="handleSliderInput"
        class="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
      />

      <!-- Milestone Labels -->
      <div class="flex justify-between items-center pt-1.5 text-[10px] text-slate-400 font-mono">
        <button
          v-for="ms in milestones"
          :key="ms.label"
          @click="handleJumpToMilestone(ms.hour)"
          :class="[
            'flex items-center gap-1 transition-colors hover:text-cyan-300 cursor-pointer',
            Math.abs(currentHourFraction - ms.hour) < 0.6 ? 'text-cyan-300 font-bold' : 'text-slate-400'
          ]"
        >
          <component :is="ms.icon" class="w-3 h-3" />
          <span>{{ ms.label }}</span>
          <span class="hidden sm:inline text-[9px] text-slate-400 font-sans">({{ ms.title }})</span>
        </button>
      </div>
    </div>
  </div>
</template>
