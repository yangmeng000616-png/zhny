<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  X,
  Plus,
  Droplets,
  FlaskConical,
  ShieldCheck,
  Calendar,
  Building2,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  User,
  Scissors,
  PackageCheck,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Sliders,
  ChevronRight,
  FileSpreadsheet,
  Award,
  AlertTriangle,
} from 'lucide-vue-next';
import type {
  FarmingRecord,
  FarmingOperationType,
  GreenhouseMicroclimate,
  GreenhousePlantingCycle,
} from '../types/digitalTwin';

const props = defineProps<{
  visible: boolean;
  greenhouses: GreenhouseMicroclimate[];
  records: FarmingRecord[];
  plantingCycles: Record<string, GreenhousePlantingCycle>;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'openAddModal', defaultGhId?: string): void;
  (e: 'inspectGreenhouse', ghId: string): void;
}>();

// Active tab in this modal: 'records' | 'cycles' | 'compliance'
const activeTab = ref<'records' | 'cycles' | 'compliance'>('records');

// Filters
const filterGreenhouse = ref<string>('all');
const filterType = ref<string>('all');
const searchKeyword = ref<string>('');

// Filtered Records
const filteredRecords = computed(() => {
  return props.records.filter((rec) => {
    if (filterGreenhouse.value !== 'all' && rec.greenhouseId !== filterGreenhouse.value) {
      return false;
    }
    if (filterType.value !== 'all' && rec.type !== filterType.value) {
      return false;
    }
    if (searchKeyword.value.trim()) {
      const q = searchKeyword.value.toLowerCase();
      const matchTitle = rec.title.toLowerCase().includes(q);
      const matchCrop = rec.cropName.toLowerCase().includes(q);
      const matchOp = rec.operator.toLowerCase().includes(q);
      const matchGh = rec.greenhouseName.toLowerCase().includes(q);
      const matchNotes = (rec.notes || '').toLowerCase().includes(q);
      const matchPest = rec.pesticideDetails?.targetPest.toLowerCase().includes(q) || false;
      const matchAgent = rec.pesticideDetails?.agentName.toLowerCase().includes(q) || false;
      const matchFert = rec.fertilizationDetails?.formula.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchCrop && !matchOp && !matchGh && !matchNotes && !matchPest && !matchAgent && !matchFert) {
        return false;
      }
    }
    return true;
  });
});

// Park-wide Stats
const totalIrrigationLiters = computed(() => {
  return props.records
    .filter((r) => r.type === 'irrigation' && r.irrigationDetails)
    .reduce((sum, r) => sum + (r.irrigationDetails?.waterVolumeL || 0), 0);
});

const totalFertilizerKg = computed(() => {
  return props.records
    .filter((r) => r.type === 'fertilization' && r.fertilizationDetails)
    .reduce((sum, r) => sum + (r.fertilizationDetails?.fertilizerAmountKg || 0), 0);
});

const totalSprayCount = computed(() => {
  return props.records.filter((r) => r.type === 'pesticide').length;
});

const totalHarvestKg = computed(() => {
  return props.records
    .filter((r) => r.type === 'harvest' && r.harvestDetails)
    .reduce((sum, r) => sum + (r.harvestDetails?.harvestWeightKg || 0), 0);
});
</script>

<template>
  <div
    v-if="visible"
    id="unified-farming-center-overlay"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md transition-opacity duration-300"
    @click.self="emit('close')"
  >
    <div
      id="unified-farming-center-container"
      class="w-full max-w-7xl max-h-[94vh] flex flex-col bg-slate-900/95 border border-emerald-500/35 rounded-2xl shadow-2xl shadow-emerald-950/50 overflow-hidden text-slate-100 font-sans animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Header -->
      <header class="flex items-center justify-between px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <FileSpreadsheet class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-bold text-white tracking-wide">
                园区8座智能温室数字农事作业与种植周期总台账
              </h2>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                浇水·施肥·植保·物候·采收
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              记录全园各温室农事作业流水，实施水肥用量计量与绿色生物植保安全采收间隔期(PHI)全流程追溯
            </p>
          </div>
        </div>

        <!-- Right: Actions & Close -->
        <div class="flex items-center gap-3">
          <!-- + Add Farming Record Button -->
          <button
            id="btn-add-farming-record"
            @click="emit('openAddModal')"
            class="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>登记农事作业</span>
          </button>

          <button
            id="btn-farming-center-close"
            @click="emit('close')"
            class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="关闭台账"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </header>

      <!-- KPI Summary Ribbon -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-3 bg-slate-950/70 border-b border-slate-800 text-xs">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Droplets class="w-4 h-4" />
          </div>
          <div>
            <span class="text-slate-400 text-[11px] block">已记录灌溉浇水量</span>
            <span class="font-mono text-sm font-bold text-white">{{ totalIrrigationLiters.toLocaleString() }} <span class="text-xs text-cyan-400">L</span></span>
          </div>
        </div>

        <div class="flex items-center gap-3 border-l border-slate-800 pl-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FlaskConical class="w-4 h-4" />
          </div>
          <div>
            <span class="text-slate-400 text-[11px] block">已配方施肥用量</span>
            <span class="font-mono text-sm font-bold text-white">{{ totalFertilizerKg.toFixed(1) }} <span class="text-xs text-emerald-400">kg</span></span>
          </div>
        </div>

        <div class="flex items-center gap-3 border-l border-slate-800 pl-3">
          <div class="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck class="w-4 h-4" />
          </div>
          <div>
            <span class="text-slate-400 text-[11px] block">植保打药巡防次数</span>
            <span class="font-mono text-sm font-bold text-white">{{ totalSprayCount }} <span class="text-xs text-amber-400">次 (100%生物绿色)</span></span>
          </div>
        </div>

        <div class="flex items-center gap-3 border-l border-slate-800 pl-3">
          <div class="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <PackageCheck class="w-4 h-4" />
          </div>
          <div>
            <span class="text-slate-400 text-[11px] block">已采收质检出库</span>
            <span class="font-mono text-sm font-bold text-white">{{ totalHarvestKg.toLocaleString() }} <span class="text-xs text-rose-400">kg</span></span>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs & Toolbar -->
      <div class="flex items-center justify-between px-5 bg-slate-950/90 border-b border-slate-800/90 flex-wrap gap-2">
        <div class="flex items-center gap-1 sm:gap-2">
          <button
            id="tab-farm-records"
            @click="activeTab = 'records'"
            class="px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer"
            :class="activeTab === 'records' ? 'border-emerald-400 text-emerald-300 font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'"
          >
            <FileSpreadsheet class="w-4 h-4" />
            <span>农事作业流水流水账</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/50">
              {{ filteredRecords.length }}
            </span>
          </button>

          <button
            id="tab-farm-cycles"
            @click="activeTab = 'cycles'"
            class="px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer"
            :class="activeTab === 'cycles' ? 'border-emerald-400 text-emerald-300 font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'"
          >
            <Calendar class="w-4 h-4" />
            <span>8棚种植周期物候看板</span>
          </button>

          <button
            id="tab-farm-compliance"
            @click="activeTab = 'compliance'"
            class="px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer"
            :class="activeTab === 'compliance' ? 'border-emerald-400 text-emerald-300 font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'"
          >
            <Award class="w-4 h-4" />
            <span>绿色植保与安全间隔期(PHI)</span>
          </button>
        </div>

        <!-- Filter Controls (for records tab) -->
        <div v-if="activeTab === 'records'" class="flex items-center gap-2 py-1.5 flex-wrap">
          <!-- Filter Greenhouse -->
          <div class="flex items-center gap-1 text-xs">
            <span class="text-slate-400 text-[11px]">温室:</span>
            <select
              v-model="filterGreenhouse"
              class="px-2 py-1 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 text-xs focus:outline-hidden focus:border-emerald-400"
            >
              <option value="all">全部8座大棚</option>
              <option v-for="gh in greenhouses" :key="gh.id" :value="gh.id">
                {{ gh.shortName }} ({{ gh.cropName }})
              </option>
            </select>
          </div>

          <!-- Filter Operation Type -->
          <div class="flex items-center gap-1 text-xs">
            <span class="text-slate-400 text-[11px]">类别:</span>
            <select
              v-model="filterType"
              class="px-2 py-1 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 text-xs focus:outline-hidden focus:border-emerald-400"
            >
              <option value="all">全部类别</option>
              <option value="irrigation">浇水灌溉</option>
              <option value="fertilization">水肥配方施肥</option>
              <option value="pesticide">植保打药</option>
              <option value="pruning">整枝打杈</option>
              <option value="harvest">采收记录</option>
            </select>
          </div>

          <!-- Search Input -->
          <div class="relative w-44">
            <Search class="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索农事/药肥..."
              class="w-full pl-7 pr-2 py-1 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 text-xs placeholder-slate-500 focus:outline-hidden focus:border-emerald-400"
            />
          </div>
        </div>
      </div>

      <!-- Main Body Container -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5">
        <!-- ================= VIEW 1: 农事作业流水账 (Records List) ================= -->
        <div v-if="activeTab === 'records'" class="space-y-3">
          <div v-if="filteredRecords.length === 0" class="text-center py-12 text-slate-400 text-xs">
            未检索到符合条件的农事记录，点击右上角「登记农事作业」可快速录入。
          </div>

          <div
            v-for="rec in filteredRecords"
            :key="rec.id"
            :id="`rec-item-${rec.id}`"
            class="bg-slate-850/90 rounded-xl border border-slate-750 hover:border-emerald-500/40 p-4 transition-all shadow-md group"
          >
            <div class="flex items-start justify-between flex-wrap gap-2">
              <!-- Left Info -->
              <div class="flex items-start gap-3">
                <!-- Type Icon Badge -->
                <div
                  class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  :class="[
                    rec.type === 'irrigation' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' :
                    rec.type === 'fertilization' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                    rec.type === 'pesticide' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                    rec.type === 'harvest' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                    'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                  ]"
                >
                  <Droplets v-if="rec.type === 'irrigation'" class="w-4 h-4" />
                  <FlaskConical v-else-if="rec.type === 'fertilization'" class="w-4 h-4" />
                  <ShieldCheck v-else-if="rec.type === 'pesticide'" class="w-4 h-4" />
                  <PackageCheck v-else-if="rec.type === 'harvest'" class="w-4 h-4" />
                  <Scissors v-else class="w-4 h-4" />
                </div>

                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <h4 class="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {{ rec.title }}
                    </h4>
                    <!-- Greenhouse Pill -->
                    <button
                      @click="emit('inspectGreenhouse', rec.greenhouseId)"
                      class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[10px] font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Building2 class="w-3 h-3" />
                      <span>{{ rec.greenhouseName.split(' ')[0] }}</span>
                      <ChevronRight class="w-2.5 h-2.5" />
                    </button>
                    <!-- Crop badge -->
                    <span class="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 text-[10px]">
                      {{ rec.cropName }}
                    </span>
                  </div>

                  <!-- Operator & Time -->
                  <div class="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                    <span class="flex items-center gap-1 font-mono">
                      <Clock class="w-3 h-3 text-slate-500" />
                      {{ rec.timestamp }}
                    </span>
                    <span>•</span>
                    <span class="flex items-center gap-1">
                      <User class="w-3 h-3 text-slate-500" />
                      {{ rec.operator }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Right: Status Badge -->
              <span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 class="w-3 h-3 text-emerald-400" />
                已执行留痕
              </span>
            </div>

            <!-- Parameters Grid (Conditional based on Type) -->
            <!-- 1. IRRIGATION -->
            <div
              v-if="rec.type === 'irrigation' && rec.irrigationDetails"
              class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs"
            >
              <div>
                <span class="text-slate-400 text-[11px] block">灌溉方式:</span>
                <span class="text-cyan-300 font-semibold">{{ rec.irrigationDetails.method }}</span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] block">浇水用量:</span>
                <span class="text-white font-mono font-bold">{{ rec.irrigationDetails.waterVolumeL.toLocaleString() }} L</span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] block">灌水前后基质墒情:</span>
                <span class="font-mono text-emerald-400 font-bold">
                  {{ rec.irrigationDetails.soilMoistureBefore }}% → {{ rec.irrigationDetails.soilMoistureAfter }}%
                </span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] block">触发模式:</span>
                <span class="text-slate-300">{{ rec.irrigationDetails.triggerMode }}</span>
              </div>
            </div>

            <!-- 2. FERTILIZATION -->
            <div
              v-else-if="rec.type === 'fertilization' && rec.fertilizationDetails"
              class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs"
            >
              <div class="sm:col-span-2">
                <span class="text-slate-400 text-[11px] block">配方品名:</span>
                <span class="text-emerald-300 font-medium truncate block">{{ rec.fertilizationDetails.formula }}</span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] block">施肥量 / 稀释比:</span>
                <span class="text-white font-mono font-bold">{{ rec.fertilizationDetails.fertilizerAmountKg }} kg</span>
                <span class="text-slate-400 text-[10px] ml-1">({{ rec.fertilizationDetails.dilutionRatio }})</span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] block">出流 EC / pH:</span>
                <span class="font-mono text-cyan-300 font-bold">
                  EC {{ rec.fertilizationDetails.measuredEc }} / pH {{ rec.fertilizationDetails.measuredPh }}
                </span>
              </div>
            </div>

            <!-- 3. PESTICIDE -->
            <div
              v-else-if="rec.type === 'pesticide' && rec.pesticideDetails"
              class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs"
            >
              <div class="sm:col-span-2">
                <span class="text-slate-400 text-[11px] block">药剂 / 生物天敌:</span>
                <span class="text-amber-300 font-medium flex items-center gap-1">
                  <span>{{ rec.pesticideDetails.agentName }}</span>
                  <span v-if="rec.pesticideDetails.isBiocontrol" class="text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    生物绿色
                  </span>
                </span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] block">防治靶标 / 施药法:</span>
                <span class="text-slate-200">{{ rec.pesticideDetails.targetPest }} ({{ rec.pesticideDetails.method }})</span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] block">安全间隔期 (PHI):</span>
                <span class="font-mono text-emerald-400 font-bold">
                  {{ rec.pesticideDetails.safetyIntervalDays === 0 ? '0天 (无残留可即采)' : `${rec.pesticideDetails.safetyIntervalDays}天 (已达标解禁)` }}
                </span>
              </div>
            </div>

            <!-- 4. HARVEST -->
            <div
              v-else-if="rec.type === 'harvest' && rec.harvestDetails"
              class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs"
            >
              <div>
                <span class="text-slate-400 text-[11px] block">采收批次号:</span>
                <span class="font-mono text-rose-300 font-bold">{{ rec.harvestDetails.batchNumber }}</span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] block">采收重量:</span>
                <span class="font-mono text-white font-bold">{{ rec.harvestDetails.harvestWeightKg }} kg</span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] block">质检品级 / 糖度:</span>
                <span class="text-emerald-300 font-semibold">{{ rec.harvestDetails.qualityGrade }}</span>
                <span v-if="rec.harvestDetails.sugarBrix" class="text-amber-300 ml-1 font-mono">({{ rec.harvestDetails.sugarBrix }}°Bx)</span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] block">溯源码:</span>
                <span class="font-mono text-slate-400 text-[11px]">{{ rec.harvestDetails.traceabilityCode }}</span>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="rec.notes" class="mt-2 text-xs text-slate-400 leading-relaxed pl-1">
              {{ rec.notes }}
            </div>
          </div>
        </div>

        <!-- ================= VIEW 2: 8棚种植周期物候看板 (Planting Cycles Gantt) ================= -->
        <div v-else-if="activeTab === 'cycles'" class="space-y-4">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              v-for="gh in greenhouses"
              :key="gh.id"
              :id="`cycle-card-${gh.id}`"
              class="bg-slate-850/90 rounded-xl border border-slate-750 p-4 space-y-3"
            >
              <!-- Card Header -->
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <h3 class="text-sm font-bold text-white">{{ gh.name }}</h3>
                  </div>
                  <div class="text-xs text-slate-400 mt-0.5">
                    作物品种: <strong class="text-slate-200">{{ gh.cropName }}</strong> ({{ plantingCycles[gh.id]?.variety ?? '良种' }})
                  </div>
                </div>

                <button
                  @click="emit('inspectGreenhouse', gh.id)"
                  class="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-medium border border-cyan-500/40 flex items-center gap-1 cursor-pointer"
                >
                  <Sliders class="w-3 h-3" />
                  <span>单棚控盘</span>
                </button>
              </div>

              <!-- Cycle Meta Strip -->
              <div class="grid grid-cols-3 gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs">
                <div>
                  <span class="text-slate-400 text-[11px] block">批次编号</span>
                  <span class="font-mono text-cyan-300 font-bold text-[11px]">{{ plantingCycles[gh.id]?.batchCode ?? 'BATCH-2026' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 text-[11px] block">定植在田天数</span>
                  <span class="font-mono text-white font-bold">{{ plantingCycles[gh.id]?.currentCycleDay ?? 60 }} / {{ plantingCycles[gh.id]?.totalCycleDays ?? 160 }} 天</span>
                </div>
                <div>
                  <span class="text-slate-400 text-[11px] block">采收倒计时</span>
                  <span class="font-mono text-amber-300 font-bold">{{ gh.agronomy?.harvestCountdownDays ?? 15 }} 天</span>
                </div>
              </div>

              <!-- Phenology Stages Horizontal Bar -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-xs text-slate-400">
                  <span>物候生长阶段进度条</span>
                  <span class="text-emerald-400 font-semibold">{{ gh.growthStage }}</span>
                </div>

                <!-- Stage Blocks -->
                <div class="grid grid-flow-col auto-cols-fr gap-1 h-3 rounded-full overflow-hidden bg-slate-800 p-0.5">
                  <div
                    v-for="(stg, idx) in plantingCycles[gh.id]?.stages ?? []"
                    :key="idx"
                    class="h-full rounded-full transition-all"
                    :class="[
                      stg.status === 'completed' ? 'bg-emerald-500' :
                      stg.status === 'current' ? 'bg-cyan-400 animate-pulse' :
                      'bg-slate-700'
                    ]"
                    :title="`${stg.stageName} (${stg.status === 'completed' ? '已完成' : stg.status === 'current' ? '进行中' : '未开始'})`"
                  ></div>
                </div>

                <!-- Current Stage Tasks Detail -->
                <div
                  v-if="plantingCycles[gh.id]?.stages"
                  class="bg-slate-900/60 p-2 rounded-lg text-xs space-y-1"
                >
                  <div class="text-slate-300 font-medium flex items-center justify-between">
                    <span>当前阶段核心调控目标:</span>
                    <span class="text-[11px] text-cyan-400 font-mono">
                      有效积温 {{ plantingCycles[gh.id]?.stages.find(s => s.status === 'current')?.accumulatedTempDegreeDays ?? 520 }} ℃·d
                    </span>
                  </div>
                  <p class="text-slate-400 text-[11px] leading-relaxed">
                    {{ plantingCycles[gh.id]?.stages.find(s => s.status === 'current')?.stageTarget ?? '光温水气精准协调，促进果实膨大转色与营养平衡' }}
                  </p>
                </div>
              </div>

              <!-- Cumulative Stats -->
              <div class="grid grid-cols-4 gap-2 text-center text-xs pt-1 border-t border-slate-800">
                <div>
                  <span class="text-slate-500 text-[10px] block">累计浇水</span>
                  <span class="font-mono text-slate-200 font-bold">{{ plantingCycles[gh.id]?.cumulativeStats.totalWaterM3 ?? 210 }} m³</span>
                </div>
                <div>
                  <span class="text-slate-500 text-[10px] block">累计施肥</span>
                  <span class="font-mono text-slate-200 font-bold">{{ plantingCycles[gh.id]?.cumulativeStats.totalFertilizerKg ?? 240 }} kg</span>
                </div>
                <div>
                  <span class="text-slate-500 text-[10px] block">植保次数</span>
                  <span class="font-mono text-slate-200 font-bold">{{ plantingCycles[gh.id]?.cumulativeStats.sprayCount ?? 3 }} 次</span>
                </div>
                <div>
                  <span class="text-slate-500 text-[10px] block">预估总单产</span>
                  <span class="font-mono text-emerald-300 font-bold">{{ (plantingCycles[gh.id]?.cumulativeStats.expectedTotalYieldKg ?? 30000).toLocaleString() }} kg</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= VIEW 3: 绿色植保与安全间隔期 (Compliance & Biocontrol) ================= -->
        <div v-else-if="activeTab === 'compliance'" class="space-y-4">
          <!-- Policy Banner -->
          <div class="bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 p-4 rounded-xl border border-emerald-500/40 flex items-center justify-between gap-3 flex-wrap">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Award class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-white">
                  国家绿色食品 & GAP良好农业规范 植保安全合规准则
                </h3>
                <p class="text-xs text-slate-300 mt-0.5">
                  全园8座智能大棚实施100%生物天敌防控、植物源农药与物理诱捕，严禁高毒高残留农药，安全采收间隔期(PHI)零容忍红线管理。
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold">
                绿标认证通过率 100%
              </span>
            </div>
          </div>

          <!-- 8 Greenhouses PHI Status Table -->
          <div class="bg-slate-850/90 rounded-xl border border-slate-750 overflow-hidden">
            <div class="px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs font-bold text-slate-200">
              各温室植保药剂使用台账与安全采收间隔期 (PHI) 实时审核矩阵
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left">
                <thead class="bg-slate-900/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th class="py-2.5 px-4">温室及作物</th>
                    <th class="py-2.5 px-3">最近植保作业</th>
                    <th class="py-2.5 px-3">使用制剂品名</th>
                    <th class="py-2.5 px-3">防治靶标</th>
                    <th class="py-2.5 px-3">农药类别</th>
                    <th class="py-2.5 px-3">安全采收期(PHI)</th>
                    <th class="py-2.5 px-3">采收合规状态</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-300">
                  <tr v-for="gh in greenhouses" :key="gh.id" class="hover:bg-slate-800/40">
                    <td class="py-3 px-4 font-semibold text-white">
                      {{ gh.shortName }} <span class="text-slate-400 font-normal">({{ gh.cropName }})</span>
                    </td>
                    <td class="py-3 px-3 font-mono text-slate-400">
                      {{ records.find(r => r.greenhouseId === gh.id && r.type === 'pesticide')?.timestamp ?? '近7日内' }}
                    </td>
                    <td class="py-3 px-3 text-amber-300">
                      {{ records.find(r => r.greenhouseId === gh.id && r.type === 'pesticide')?.pesticideDetails?.agentName ?? '生物菌剂' }}
                    </td>
                    <td class="py-3 px-3 text-slate-300">
                      {{ records.find(r => r.greenhouseId === gh.id && r.type === 'pesticide')?.pesticideDetails?.targetPest ?? '病虫害预防' }}
                    </td>
                    <td class="py-3 px-3">
                      <span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px]">
                        生物天敌/无残留
                      </span>
                    </td>
                    <td class="py-3 px-3 font-mono font-bold text-white">
                      {{ records.find(r => r.greenhouseId === gh.id && r.type === 'pesticide')?.pesticideDetails?.safetyIntervalDays ?? 0 }} 天
                    </td>
                    <td class="py-3 px-3">
                      <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 w-fit">
                        <CheckCircle2 class="w-3 h-3 text-emerald-400" />
                        已解禁·准许采收
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
