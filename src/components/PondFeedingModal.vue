<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PondFeedingRecord } from '../types/digitalTwin';
import { exportFishPondFeedingCsv } from '../utils/excelExport';
import {
  Waves,
  Plus,
  X,
  FileSpreadsheet,
  Droplets,
  Thermometer,
  Activity,
  CheckCircle2,
  Fish,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertCircle,
} from 'lucide-vue-next';

const props = defineProps<{
  records: PondFeedingRecord[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'addRecord', record: PondFeedingRecord): void;
}>();

const showAddForm = ref<boolean>(false);
const filterPond = ref<string>('all');
const filterSpecies = ref<string>('all');

// Ponds & species
const pondZones = [
  '生态循环主鱼塘 (生态河塘)',
  '6# 鱼菜共生微藻养殖槽',
  '生态循环主鱼塘 (西区浅水湾)',
];

const speciesList = ['加州鲈鱼', '优质草鱼', '红罗非鱼', '中华绒螯蟹'];

// Filtered records
const filteredRecords = computed(() => {
  return props.records.filter((r) => {
    if (filterPond.value !== 'all' && r.pondZone !== filterPond.value) return false;
    if (filterSpecies.value !== 'all' && r.species !== filterSpecies.value) return false;
    return true;
  });
});

// Aggregate stats
const totalFeedTodayKg = computed(() => {
  return props.records
    .filter((r) => r.timestamp.startsWith('2026-09-13'))
    .reduce((sum, r) => sum + r.feedAmountKg, 0);
});

const avgWaterTemp = computed(() => {
  if (props.records.length === 0) return 0;
  const sum = props.records.reduce((acc, r) => acc + r.waterTemp, 0);
  return (sum / props.records.length).toFixed(1);
});

const avgDissolvedOxygen = computed(() => {
  if (props.records.length === 0) return 0;
  const sum = props.records.reduce((acc, r) => acc + r.dissolvedOxygen, 0);
  return (sum / props.records.length).toFixed(1);
});

// New Feed Record Form
const newFeed = ref<Partial<PondFeedingRecord>>({
  pondZone: '生态循环主鱼塘 (生态河塘)',
  species: '加州鲈鱼',
  feedType: '42%粗蛋白膨化浮水配合颗粒饲料',
  feedAmountKg: 40.0,
  feedingMethod: '自动投饵机定时投射',
  appetiteRating: '旺盛 (10分钟内摄食完毕)',
  waterTemp: 23.5,
  dissolvedOxygen: 7.1,
  ammoniaNitrogen: 0.08,
  ph: 7.6,
  feedRemainingStatus: '无残饵 (水质清澈)',
  operator: '老王 (水产养殖工)',
  notes: '鱼群游动欢快抢食积极，水质指标优良。',
});

const submitFeedRecord = () => {
  const record: PondFeedingRecord = {
    id: `FEED-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).replace(/\//g, '-'),
    pondZone: newFeed.value.pondZone || '生态循环主鱼塘 (生态河塘)',
    species: newFeed.value.species || '加州鲈鱼',
    feedType: newFeed.value.feedType || '优质水产配合料',
    feedAmountKg: Number(newFeed.value.feedAmountKg) || 10,
    feedingMethod: (newFeed.value.feedingMethod as PondFeedingRecord['feedingMethod']) || '自动投饵机定时投射',
    appetiteRating: (newFeed.value.appetiteRating as PondFeedingRecord['appetiteRating']) || '旺盛 (10分钟内摄食完毕)',
    waterTemp: Number(newFeed.value.waterTemp) || 23.5,
    dissolvedOxygen: Number(newFeed.value.dissolvedOxygen) || 7.0,
    ammoniaNitrogen: Number(newFeed.value.ammoniaNitrogen) || 0.08,
    ph: Number(newFeed.value.ph) || 7.5,
    feedRemainingStatus: (newFeed.value.feedRemainingStatus as PondFeedingRecord['feedRemainingStatus']) || '无残饵 (水质清澈)',
    operator: newFeed.value.operator || '水产养殖主管',
    notes: newFeed.value.notes || '投喂规范，记录留痕。',
  };

  emit('addRecord', record);
  showAddForm.value = false;
};

const handleExport = () => {
  exportFishPondFeedingCsv(props.records);
};
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
    <div
      id="pond-feeding-modal"
      class="w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden text-slate-100"
    >
      <!-- Header -->
      <header class="px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-b border-cyan-500/30 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Waves class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-bold text-white tracking-wide">
                生态鱼塘投喂台账与微生态水质测控
              </h2>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                逢喂必记 · 投前测温溶氧 · 绿色循环
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              每次投喂实时记录（饲料配方/投饵量/水温/溶氧DO/氨氮/摄食活性） · 残饵监测防富营养化 · Excel台账导出
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            id="btn-export-pond-excel"
            @click="handleExport"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-700/30 cursor-pointer"
            title="导出鱼塘喂食与水质台账为 Excel (CSV)"
          >
            <FileSpreadsheet class="w-4 h-4" />
            <span>导出Excel台账</span>
          </button>

          <button
            id="btn-add-pond-feed"
            @click="showAddForm = true"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-700/30 cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>+ 登记鱼塘投喂记录</span>
          </button>

          <button
            @click="$emit('close')"
            class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </header>

      <!-- Body Content -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        <!-- KPI Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Fish class="w-5 h-5" />
            </div>
            <div>
              <div class="text-[11px] text-slate-400">今日全园投喂量</div>
              <div class="text-xl font-bold font-mono text-cyan-300 mt-0.5">
                {{ totalFeedTodayKg }} <span class="text-xs font-normal text-slate-400">kg</span>
              </div>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Thermometer class="w-5 h-5" />
            </div>
            <div>
              <div class="text-[11px] text-slate-400">投喂时平均水温</div>
              <div class="text-xl font-bold font-mono text-amber-300 mt-0.5">
                {{ avgWaterTemp }} <span class="text-xs font-normal text-slate-400">℃</span>
              </div>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Droplets class="w-5 h-5" />
            </div>
            <div>
              <div class="text-[11px] text-slate-400">平均溶解氧 (DO)</div>
              <div class="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                {{ avgDissolvedOxygen }} <span class="text-xs font-normal text-slate-400">mg/L</span>
              </div>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <CheckCircle2 class="w-5 h-5" />
            </div>
            <div>
              <div class="text-[11px] text-slate-400">残饵达标与水质清澈率</div>
              <div class="text-xl font-bold font-mono text-purple-300 mt-0.5">
                100%
              </div>
            </div>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-slate-400">区域筛选:</span>
            <select
              v-model="filterPond"
              class="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">全部水产区域</option>
              <option v-for="p in pondZones" :key="p" :value="p">{{ p }}</option>
            </select>

            <span class="text-slate-400 ml-2">鱼种:</span>
            <select
              v-model="filterSpecies"
              class="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">全部养殖鱼种</option>
              <option v-for="s in speciesList" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>

          <div class="text-slate-400 font-mono text-[11px]">
            共收录 <strong class="text-cyan-400">{{ filteredRecords.length }}</strong> 次投喂作业留痕
          </div>
        </div>

        <!-- Records Table -->
        <div class="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/70">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th class="py-2.5 px-3">投喂时间</th>
                  <th class="py-2.5 px-3">养殖区域</th>
                  <th class="py-2.5 px-3">鱼种品系</th>
                  <th class="py-2.5 px-3">饲料品名与配方</th>
                  <th class="py-2.5 px-3">投喂量(kg)</th>
                  <th class="py-2.5 px-3">投喂方式</th>
                  <th class="py-2.5 px-3">摄食活力</th>
                  <th class="py-2.5 px-3">水温(℃)</th>
                  <th class="py-2.5 px-3">溶氧(mg/L)</th>
                  <th class="py-2.5 px-3">氨氮(mg/L)</th>
                  <th class="py-2.5 px-3">pH值</th>
                  <th class="py-2.5 px-3">残饵与水质状态</th>
                  <th class="py-2.5 px-3">操作人</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-mono">
                <tr
                  v-for="item in filteredRecords"
                  :key="item.id"
                  class="hover:bg-slate-800/40 transition-colors"
                >
                  <td class="py-2.5 px-3 text-slate-300 whitespace-nowrap">{{ item.timestamp }}</td>
                  <td class="py-2.5 px-3 text-slate-200 font-sans whitespace-nowrap">{{ item.pondZone }}</td>
                  <td class="py-2.5 px-3 whitespace-nowrap">
                    <span class="px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {{ item.species }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-slate-300 font-sans text-xs">{{ item.feedType }}</td>
                  <td class="py-2.5 px-3 font-bold text-emerald-400 whitespace-nowrap">
                    {{ item.feedAmountKg }} kg
                  </td>
                  <td class="py-2.5 px-3 text-slate-400 font-sans whitespace-nowrap">{{ item.feedingMethod }}</td>
                  <td class="py-2.5 px-3 whitespace-nowrap font-sans">
                    <span class="text-emerald-300 font-medium">{{ item.appetiteRating }}</span>
                  </td>
                  <td class="py-2.5 px-3 text-amber-300 whitespace-nowrap">{{ item.waterTemp }}℃</td>
                  <td class="py-2.5 px-3 text-emerald-400 whitespace-nowrap">{{ item.dissolvedOxygen }}</td>
                  <td class="py-2.5 px-3 text-slate-300 whitespace-nowrap">{{ item.ammoniaNitrogen }}</td>
                  <td class="py-2.5 px-3 text-purple-300 whitespace-nowrap">{{ item.ph }}</td>
                  <td class="py-2.5 px-3 text-slate-300 font-sans text-xs whitespace-nowrap">{{ item.feedRemainingStatus }}</td>
                  <td class="py-2.5 px-3 text-slate-400 font-sans whitespace-nowrap">{{ item.operator }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          🌱 鱼菜共生微生态系统 · 鱼类代谢粪便经微藻消化净化转化为高品质蔬菜液肥
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="handleExport"
            class="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline flex items-center gap-1"
          >
            <FileSpreadsheet class="w-3.5 h-3.5" /> 导出鱼塘投喂总台账Excel
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

    <!-- Modal Form for registering new feed -->
    <div
      v-if="showAddForm"
      class="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      <div class="w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl p-5 text-slate-100 ring-1 ring-white/10">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div class="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Plus class="w-4 h-4" />
            <span>登记本次鱼塘喂食与现场水质</span>
          </div>
          <button @click="showAddForm = false" class="text-slate-400 hover:text-white cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1">投喂区域</label>
            <select
              v-model="newFeed.pondZone"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option v-for="z in pondZones" :key="z" :value="z">{{ z }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-slate-400 mb-1">鱼种品系</label>
              <select
                v-model="newFeed.species"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option v-for="s in speciesList" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>

            <div>
              <label class="block text-slate-400 mb-1">本次投喂量 (kg)</label>
              <input
                v-model.number="newFeed.feedAmountKg"
                type="number"
                step="0.5"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label class="block text-slate-400 mb-1">饲料品名与配方规格</label>
            <input
              v-model="newFeed.feedType"
              type="text"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-slate-400 mb-1">水温 (℃)</label>
              <input
                v-model.number="newFeed.waterTemp"
                type="number"
                step="0.1"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label class="block text-slate-400 mb-1">溶氧 DO (mg/L)</label>
              <input
                v-model.number="newFeed.dissolvedOxygen"
                type="number"
                step="0.1"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label class="block text-slate-400 mb-1">pH酸碱度</label>
              <input
                v-model.number="newFeed.ph"
                type="number"
                step="0.1"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-slate-400 mb-1">摄食活力评定</label>
              <select
                v-model="newFeed.appetiteRating"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="旺盛 (10分钟内摄食完毕)">旺盛 (10分钟内摄食完毕)</option>
                <option value="良好 (适中摄食)">良好 (适中摄食)</option>
                <option value="偏弱 (有少许残饵)">偏弱 (有少许残饵)</option>
              </select>
            </div>

            <div>
              <label class="block text-slate-400 mb-1">操作技术员</label>
              <input
                v-model="newFeed.operator"
                type="text"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-slate-400 mb-1">巡查备注</label>
            <input
              v-model="newFeed.notes"
              type="text"
              placeholder="水面清澈度、增氧机运转状态等"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 border-t border-slate-800 pt-3 mt-4">
          <button
            @click="showAddForm = false"
            class="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer font-medium"
          >
            取消
          </button>
          <button
            @click="submitFeedRecord"
            class="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow cursor-pointer"
          >
            确认录入台账
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
