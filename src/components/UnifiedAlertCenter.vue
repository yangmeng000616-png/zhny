<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Eye,
  Zap,
  X,
  ShieldAlert,
  Flame,
  Droplets,
  Wind,
  Layers,
} from 'lucide-vue-next';
import type { UnifiedAlarm, AgroRiskWarning } from '../types/digitalTwin';

const props = defineProps<{
  visible: boolean;
  alarms: UnifiedAlarm[];
  riskWarnings: AgroRiskWarning[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'focusObject', targetId: string): void;
  (e: 'acknowledgeAlarm', alarmId: string): void;
  (e: 'mitigateRisk', warningId: string): void;
}>();

const filterSeverity = ref<'all' | 'critical' | 'warning' | 'info'>('all');

const filteredAlarms = computed(() => {
  if (filterSeverity.value === 'all') return props.alarms;
  return props.alarms.filter((a) => a.level === filterSeverity.value);
});

const criticalCount = computed(() => {
  return (
    props.alarms.filter((a) => a.level === 'critical' && a.status !== 'acknowledged').length +
    props.riskWarnings.filter((r) => r.severity === 'critical' && !r.isMitigated).length
  );
});

const warningCount = computed(() => {
  return (
    props.alarms.filter((a) => a.level === 'warning' && a.status !== 'acknowledged').length +
    props.riskWarnings.filter((r) => r.severity === 'warning' && !r.isMitigated).length
  );
});
</script>

<template>
  <div
    v-if="visible"
    class="fixed top-16 right-3 sm:right-74 z-40 w-[360px] max-w-[92vw] bg-slate-950/65 hover:bg-slate-950/80 backdrop-blur-2xl rounded-2xl border border-rose-500/35 shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 text-slate-100 overflow-hidden flex flex-col max-h-[82vh] transition-all duration-300 pointer-events-auto"
  >
    <!-- Header -->
    <div class="px-4 py-3 bg-gradient-to-r from-rose-950/40 via-slate-900/80 to-slate-900/90 border-b border-rose-500/20 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-md shadow-rose-500/20">
          <ShieldAlert class="w-4 h-4" />
        </div>
        <div>
          <h2 class="text-sm font-bold tracking-wide text-white flex items-center gap-2">
            全园综合异常告警与应急中心
          </h2>
          <div class="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span v-if="criticalCount > 0" class="text-rose-400 font-semibold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              {{ criticalCount }}项严重
            </span>
            <span v-if="warningCount > 0" class="text-amber-400 font-semibold">
              {{ warningCount }}项警告
            </span>
            <span v-if="criticalCount === 0 && warningCount === 0" class="text-emerald-400">
              园区运行全部正常
            </span>
          </div>
        </div>
      </div>
      <button
        @click="$emit('close')"
        class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Severity Filter Tabs -->
    <div class="flex items-center gap-1.5 px-3 py-2 border-b border-slate-800/80 bg-slate-950/60 text-xs">
      <button
        @click="filterSeverity = 'all'"
        :class="[
          'px-2.5 py-1 rounded-lg transition-all font-medium',
          filterSeverity === 'all'
            ? 'bg-slate-800 text-white font-semibold'
            : 'text-slate-400 hover:text-slate-200'
        ]"
      >
        全部 ({{ alarms.length + riskWarnings.length }})
      </button>
      <button
        @click="filterSeverity = 'critical'"
        :class="[
          'px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1',
          filterSeverity === 'critical'
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold'
            : 'text-rose-400/70 hover:text-rose-300'
        ]"
      >
        <span class="w-2 h-2 rounded-full bg-rose-500"></span>
        严重告警
      </button>
      <button
        @click="filterSeverity = 'warning'"
        :class="[
          'px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1',
          filterSeverity === 'warning'
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
            : 'text-amber-400/70 hover:text-amber-300'
        ]"
      >
        <span class="w-2 h-2 rounded-full bg-amber-500"></span>
        中度预警
      </button>
    </div>

    <!-- Alarm List -->
    <div class="p-3 overflow-y-auto space-y-3 text-xs flex-1">
      <!-- Agro-Risk Warnings Section -->
      <div v-for="risk in riskWarnings" :key="risk.id" class="p-3 rounded-xl border bg-slate-900/60 border-slate-800 space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span
              :class="[
                'px-1.5 py-0.5 rounded text-[10px] font-mono font-bold',
                risk.severity === 'critical'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              ]"
            >
              微气象预警
            </span>
            <span class="font-bold text-slate-100">{{ risk.title }}</span>
          </div>
          <button
            @click="$emit('focusObject', risk.impactedGreenhouses[0] || 'gh_001')"
            class="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-200"
          >
            <Eye class="w-3.5 h-3.5" /> 三维定位
          </button>
        </div>

        <p class="text-[11px] text-slate-300">{{ risk.impactDescription || risk.summary }}</p>

        <div class="p-2 rounded bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-400">
          <strong>预案动作:</strong> {{ risk.aiRecommendation }}
        </div>

        <div class="flex items-center justify-between pt-1 border-t border-slate-800">
          <span class="text-[10px] font-mono text-slate-500">
            涉及温室: {{ risk.impactedGreenhouses.join(', ') }}
          </span>
          <button
            v-if="!risk.isMitigated"
            @click="$emit('mitigateRisk', risk.id)"
            class="px-2.5 py-1 rounded bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold text-[10px] flex items-center gap-1 hover:brightness-110 cursor-pointer"
          >
            <Zap class="w-3 h-3 fill-current" /> 应急联动
          </button>
          <span v-else class="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
            <CheckCircle2 class="w-3 h-3" /> 已处置消除
          </span>
        </div>
      </div>

      <!-- Environment & Device Alarms -->
      <div
        v-for="alarm in filteredAlarms"
        :key="alarm.id"
        :class="[
          'p-3 rounded-xl border transition-all space-y-2',
          alarm.status === 'acknowledged'
            ? 'bg-slate-900/30 border-slate-800 opacity-60'
            : alarm.level === 'critical'
            ? 'bg-rose-950/20 border-rose-500/50 shadow-[0_0_16px_rgba(244,63,94,0.1)]'
            : 'bg-amber-950/20 border-amber-500/40'
        ]"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span
              :class="[
                'px-1.5 py-0.5 rounded text-[10px] font-mono font-bold',
                alarm.level === 'critical'
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                  : 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
              ]"
            >
              {{ alarm.sourceType === 'sensor' ? '传感器越限' : alarm.sourceType === 'device' ? '设备异常' : '农艺生境' }}
            </span>
            <span class="font-bold text-slate-100">{{ alarm.metricName || alarm.sourceName }}</span>
          </div>
          <button
            @click="$emit('focusObject', alarm.sourceId)"
            class="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-200 cursor-pointer"
          >
            <Eye class="w-3.5 h-3.5" /> 空间聚焦
          </button>
        </div>

        <p class="text-[11px] text-slate-300">{{ alarm.message }}</p>

        <!-- Current Value vs Threshold -->
        <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono bg-slate-950/60 px-2 py-1 rounded">
          <span>
            当前遥测: <strong class="text-rose-400">{{ alarm.currentValue }} {{ alarm.unit }}</strong> / 预设阈值: {{ alarm.thresholdValue }} {{ alarm.unit }}
          </span>
          <span>{{ alarm.timestamp.slice(11, 19) }}</span>
        </div>

        <!-- Action Bar -->
        <div class="flex items-center justify-between pt-1 border-t border-slate-800/80">
          <span class="text-[10px] text-slate-500 font-mono">
            对象ID: {{ alarm.sourceId }} ({{ alarm.location }})
          </span>
          <button
            v-if="alarm.status !== 'acknowledged'"
            @click="$emit('acknowledgeAlarm', alarm.id)"
            class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium border border-slate-700 cursor-pointer"
          >
            确认已知悉
          </button>
          <span v-else class="text-[10px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 class="w-3 h-3 text-emerald-400" /> 已确认
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
