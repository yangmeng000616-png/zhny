<script setup lang="ts">
import { computed } from 'vue';
import {
  X,
  Truck,
  ShieldCheck,
  User,
  Phone,
  Building,
  Clock,
  MapPin,
  Package,
  ArrowRight,
  ClipboardList,
} from 'lucide-vue-next';
import type { VehicleAccessRecord } from '../types/gate';

const props = defineProps<{
  visible: boolean;
  vehicle: {
    plateNumber: string;
    plateColor?: 'green' | 'blue' | 'yellow' | 'white';
    categoryName: string;
    model: string;
    driverName: string;
    driverPhone: string;
    company: string;
    mission: string;
    destination: string;
    entryTime: string;
    status: string;
    cargo: string;
    isWhitelisted: boolean;
  } | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'openGateLedger'): void;
  (e: 'openLogisticsLedger'): void;
}>();

const plateBadgeStyle = computed(() => {
  const color = props.vehicle?.plateColor || 'green';
  if (color === 'green') {
    return 'bg-gradient-to-r from-emerald-500 to-green-600 text-slate-950 font-bold border-2 border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]';
  } else if (color === 'yellow') {
    return 'bg-amber-400 text-slate-950 font-bold border-2 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]';
  }
  return 'bg-blue-600 text-white font-bold border-2 border-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.4)]';
});
</script>

<template>
  <div
    v-if="visible && vehicle"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
    @click.self="emit('close')"
  >
    <div
      class="relative w-full max-w-lg bg-slate-900/95 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10"
      @click.stop
    >
      <!-- Header Banner -->
      <div class="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <Truck class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-400">在园作业车辆智能身份档案</span>
              <span
                v-if="vehicle.isWhitelisted"
                class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono"
              >
                <ShieldCheck class="w-3 h-3" /> 白名单预录入·免检放行
              </span>
              <span
                v-else
                class="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono"
              >
                临时审批入园
              </span>
            </div>
            <h3 class="text-base font-bold text-slate-100 flex items-center gap-2 mt-0.5">
              <span>{{ vehicle.categoryName }}</span>
              <span class="text-xs text-slate-400 font-normal">({{ vehicle.model }})</span>
            </h3>
          </div>
        </div>

        <button
          @click="emit('close')"
          class="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          title="关闭"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Content Body -->
      <div class="p-5 space-y-4">
        <!-- License Plate & Verification Highlight -->
        <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              :class="plateBadgeStyle"
              class="px-3.5 py-1.5 rounded-lg text-sm tracking-widest font-mono text-center select-none"
            >
              {{ vehicle.plateNumber }}
            </div>
            <div>
              <div class="text-xs font-semibold text-slate-200">{{ vehicle.company }}</div>
              <div class="text-[11px] text-slate-400 font-mono">核验放行时间：{{ vehicle.entryTime }}</div>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            {{ vehicle.status }}
          </span>
        </div>

        <!-- Current Mission Details (The core user request) -->
        <div class="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-500/30">
          <div class="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1.5">
            <ClipboardList class="w-4 h-4" />
            <span>当前承载农事生产与配送任务</span>
          </div>
          <p class="text-sm text-slate-100 font-medium leading-relaxed">
            {{ vehicle.mission }}
          </p>

          <div class="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span class="text-slate-400 flex items-center gap-1">
                <MapPin class="w-3.5 h-3.5 text-cyan-400" /> 作业目的区域
              </span>
              <span class="font-semibold text-slate-200 mt-0.5 block">{{ vehicle.destination }}</span>
            </div>
            <div>
              <span class="text-slate-400 flex items-center gap-1">
                <Package class="w-3.5 h-3.5 text-amber-400" /> 装载货物 / 状态
              </span>
              <span class="font-semibold text-slate-200 mt-0.5 block">{{ vehicle.cargo }}</span>
            </div>
          </div>
        </div>

        <!-- Driver & Security Contact -->
        <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-2 gap-3 text-xs">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
              <User class="w-4 h-4" />
            </div>
            <div>
              <div class="text-[11px] text-slate-400">核定驾驶员</div>
              <div class="font-bold text-slate-200">{{ vehicle.driverName }}</div>
            </div>
          </div>
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
              <Phone class="w-4 h-4" />
            </div>
            <div>
              <div class="text-[11px] text-slate-400">随车联络电话</div>
              <div class="font-mono text-cyan-300 font-semibold">{{ vehicle.driverPhone }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="px-5 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3">
        <button
          @click="emit('openLogisticsLedger')"
          class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Package class="w-3.5 h-3.5 text-emerald-400" /> 查看果蔬物流台账
        </button>

        <button
          @click="emit('openGateLedger')"
          class="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)]"
        >
          <span>查看大门出入往来记录</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
