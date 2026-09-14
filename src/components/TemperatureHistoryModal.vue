<script setup lang="ts">
import { ref, computed } from 'vue';
import type { EnvironmentalHistoryLog } from '../types/digitalTwin';
import { exportEnvironmentalHistoryCsv } from '../utils/excelExport';
import {
  Thermometer,
  FileSpreadsheet,
  X,
  Filter,
  Calendar,
  Sun,
  Droplets,
  Wind,
  TrendingUp,
  MapPin,
  Sparkles,
} from 'lucide-vue-next';

const props = defineProps<{
  logs: EnvironmentalHistoryLog[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const selectedLocation = ref<string>('all');
const activeMetric = ref<'airTemp' | 'substrateTemp' | 'airHumidity' | 'co2'>('airTemp');

const locationOptions = [
  { id: 'all', name: '全园区所有地点汇总' },
  { id: 'gh_001', name: '1# Venlo核心番茄示范棚' },
  { id: 'gh_002', name: '2# 高架草莓立体栽培棚' },
  { id: 'gh_003', name: '3# 密刺水果黄瓜棚' },
  { id: 'gh_004', name: '4# 高产彩色甜椒实验棚' },
  { id: 'gh_005', name: '5# 樱桃小番茄棚' },
  { id: 'gh_006', name: '6# 鱼菜共生多层水培棚' },
  { id: 'gh_007', name: '7# 新疆特种哈密瓜甜瓜棚' },
  { id: 'gh_008', name: '8# 高架蓝莓有机基质棚' },
  { id: 'pond', name: '生态循环鱼塘水体生境' },
  { id: 'outdoor', name: '园区室外综合气象站' },
  { id: 'coldchain', name: '冷链分选与气调预冷库' },
];

const filteredLogs = computed(() => {
  if (selectedLocation.value === 'all') return props.logs;
  return props.logs.filter(
    (log) =>
      log.locationId === selectedLocation.value ||
      log.locationName.includes(selectedLocation.value)
  );
});

// Chart calculations
const chartData = computed(() => {
  return filteredLogs.value.map((item) => {
    let val = item.airTemp;
    if (activeMetric.value === 'substrateTemp') val = item.substrateTemp ?? item.airTemp;
    if (activeMetric.value === 'airHumidity') val = item.airHumidity;
    if (activeMetric.value === 'co2') val = item.co2;
    return {
      timestamp: item.timestamp,
      locationName: item.locationName,
      val,
    };
  });
});

const maxVal = computed(() => {
  if (chartData.value.length === 0) return 50;
  const max = Math.max(...chartData.value.map((d) => d.val));
  return max * 1.15;
});

const handleExport = () => {
  exportEnvironmentalHistoryCsv(filteredLogs.value, selectedLocation.value !== 'all' ? selectedLocation.value : undefined);
};
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
    <div
      id="temp-history-modal"
      class="w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-amber-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden text-slate-100"
    >
      <!-- Header -->
      <header class="px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-b border-amber-500/30 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Thermometer class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-bold text-white tracking-wide">
                全园区各点位温度与微气候全景历史台账
              </h2>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                8棚·鱼塘·气象·冷链全覆盖
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              空气温度 / 根区地温 / 相对湿度 / 光照辐射 / CO2 浓度 逐时历史记录与 Excel 批量导出
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            id="btn-export-temp-excel"
            @click="handleExport"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-700/30 cursor-pointer"
            title="将当前筛选的各地点温度历史记录导出为 Excel (CSV)"
          >
            <FileSpreadsheet class="w-4 h-4" />
            <span>导出Excel温度历史台账</span>
          </button>

          <button
            @click="$emit('close')"
            class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </header>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        <!-- Filter & Chart Metric Toggle -->
        <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2">
            <MapPin class="w-4 h-4 text-amber-400" />
            <span class="text-slate-300 font-medium">选择监测区域:</span>
            <select
              v-model="selectedLocation"
              class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option v-for="loc in locationOptions" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
            </select>
          </div>

          <div class="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
            <button
              @click="activeMetric = 'airTemp'"
              :class="[
                'px-2.5 py-1 rounded transition-all cursor-pointer font-medium',
                activeMetric === 'airTemp' ? 'bg-amber-500 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
              ]"
            >
              空气温度 (℃)
            </button>
            <button
              @click="activeMetric = 'substrateTemp'"
              :class="[
                'px-2.5 py-1 rounded transition-all cursor-pointer font-medium',
                activeMetric === 'substrateTemp' ? 'bg-amber-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
              ]"
            >
              基质地温 (℃)
            </button>
            <button
              @click="activeMetric = 'airHumidity'"
              :class="[
                'px-2.5 py-1 rounded transition-all cursor-pointer font-medium',
                activeMetric === 'airHumidity' ? 'bg-cyan-500 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
              ]"
            >
              相对湿度 (%)
            </button>
            <button
              @click="activeMetric = 'co2'"
              :class="[
                'px-2.5 py-1 rounded transition-all cursor-pointer font-medium',
                activeMetric === 'co2' ? 'bg-purple-500 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
              ]"
            >
              CO2浓度 (ppm)
            </button>
          </div>
        </div>

        <!-- History Trend Visualization -->
        <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div class="flex items-center justify-between mb-3 text-xs">
            <div class="flex items-center gap-2 text-slate-200 font-bold">
              <TrendingUp class="w-4 h-4 text-amber-400" />
              <span>历史趋势时序回溯 (Historical Time Series Curve)</span>
            </div>
            <div class="text-[11px] text-slate-400 font-mono">
              采样频率: 逐3小时整点监测 · 传感器校准等级: 工业一级
            </div>
          </div>

          <!-- Trend Bars -->
          <div class="h-40 w-full relative flex items-end pt-4 pb-6 px-3">
            <div class="w-full h-full flex items-end justify-between relative z-10 gap-2">
              <div
                v-for="(item, idx) in chartData"
                :key="idx"
                class="flex-1 flex flex-col items-center h-full justify-end group relative"
              >
                <!-- Tooltip -->
                <div class="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-slate-200 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono shadow-lg whitespace-nowrap z-20 pointer-events-none">
                  {{ item.locationName }} ({{ item.timestamp.slice(11) }}): {{ item.val }}
                </div>

                <!-- Bar -->
                <div
                  class="w-full max-w-[28px] rounded-t-sm transition-all duration-300 relative group-hover:brightness-125"
                  :style="{
                    height: `${Math.max(10, (item.val / maxVal) * 100)}%`,
                    backgroundColor:
                      activeMetric === 'airTemp' ? '#f59e0b' :
                      activeMetric === 'substrateTemp' ? '#d97706' :
                      activeMetric === 'airHumidity' ? '#06b6d4' : '#a855f7'
                  }"
                >
                  <div class="absolute -top-4 inset-x-0 text-center text-[9px] font-mono font-bold text-slate-300">
                    {{ item.val }}
                  </div>
                </div>

                <div class="text-[9px] text-slate-400 mt-2 font-mono truncate max-w-full">
                  {{ item.timestamp.slice(11) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Historical Records Table -->
        <div class="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/70">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 font-sans">
                <tr>
                  <th class="py-2.5 px-3">记录时间</th>
                  <th class="py-2.5 px-3">监测区域名称</th>
                  <th class="py-2.5 px-3">空气温度(℃)</th>
                  <th class="py-2.5 px-3">根区/水质地温(℃)</th>
                  <th class="py-2.5 px-3">相对湿度(%)</th>
                  <th class="py-2.5 px-3">CO2浓度(ppm)</th>
                  <th class="py-2.5 px-3">光照辐射(W/m²)</th>
                  <th class="py-2.5 px-3">饱和水汽压差VPD(kPa)</th>
                  <th class="py-2.5 px-3">当日积温(℃·d)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-mono">
                <tr
                  v-for="(row, idx) in filteredLogs"
                  :key="idx"
                  class="hover:bg-slate-800/40 transition-colors"
                >
                  <td class="py-2.5 px-3 text-slate-300 whitespace-nowrap">{{ row.timestamp }}</td>
                  <td class="py-2.5 px-3 text-slate-100 font-sans font-medium whitespace-nowrap">{{ row.locationName }}</td>
                  <td class="py-2.5 px-3 text-amber-400 font-bold whitespace-nowrap">{{ row.airTemp }} ℃</td>
                  <td class="py-2.5 px-3 text-amber-300 whitespace-nowrap">{{ row.substrateTemp ? `${row.substrateTemp} ℃` : '-' }}</td>
                  <td class="py-2.5 px-3 text-cyan-300 whitespace-nowrap">{{ row.airHumidity }} %</td>
                  <td class="py-2.5 px-3 text-purple-300 whitespace-nowrap">{{ row.co2 }} ppm</td>
                  <td class="py-2.5 px-3 text-yellow-300 whitespace-nowrap">{{ row.solarRadiation ?? '-' }}</td>
                  <td class="py-2.5 px-3 text-slate-300 whitespace-nowrap">{{ row.vpd ? `${row.vpd} kPa` : '-' }}</td>
                  <td class="py-2.5 px-3 text-emerald-400 whitespace-nowrap">{{ row.accumulatedGdd ? `${row.accumulatedGdd} ℃·d` : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          数据由园区无线LoRaWAN物联网微气象网络全时自动采撷回传并加密归档
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="handleExport"
            class="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline flex items-center gap-1"
          >
            <FileSpreadsheet class="w-3.5 h-3.5" /> 导出当前所选温度历史Excel
          </button>
          <button
            @click="$emit('close')"
            class="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium cursor-pointer"
          >
            关闭
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>
