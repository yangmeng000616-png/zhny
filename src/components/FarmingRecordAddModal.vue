<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  X,
  Plus,
  Droplets,
  FlaskConical,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  Clock,
  Sparkles,
  Scissors,
  PackageCheck,
} from 'lucide-vue-next';
import type {
  FarmingRecord,
  FarmingOperationType,
  GreenhouseMicroclimate,
} from '../types/digitalTwin';

const props = defineProps<{
  visible: boolean;
  greenhouses: GreenhouseMicroclimate[];
  defaultGreenhouseId?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saveRecord', record: FarmingRecord): void;
}>();

// Form Fields
const selectedGhId = ref<string>(props.defaultGreenhouseId || 'gh_001');
const opType = ref<FarmingOperationType>('irrigation');
const title = ref('');
const operator = ref('张工 (现场农艺组)');
const notes = ref('');

// Irrigation Specific
const irrMethod = ref<'微喷灌' | '滴灌' | '潮汐灌溉' | 'NFT营养液循环' | '气雾喷施'>('滴灌');
const irrVolumeL = ref<number>(2000);
const irrDurationMin = ref<number>(30);
const irrMoistureBefore = ref<number>(31.5);
const irrMoistureAfter = ref<number>(36.8);
const irrTriggerMode = ref<'AI自动智能诱发' | '定时计划轮灌' | '人工手动指令'>('人工手动指令');

// Fertilization Specific
const fertFormula = ref('A/B高钾水溶膨果配方 (15-8-30+TE)');
const fertAmountKg = ref<number>(12.5);
const fertTargetEc = ref<number>(1.5);
const fertMeasuredEc = ref<number>(1.48);
const fertTargetPh = ref<number>(6.2);
const fertMeasuredPh = ref<number>(6.2);
const fertDilution = ref('1:120');

// Pesticide Specific
const pestAgentName = ref('枯草芽孢杆菌微囊生物悬浮剂');
const pestTarget = ref('白粉病预防');
const pestMethod = ref<'超低容量弥雾' | '常温恒压喷雾' | '高架轨道喷药机' | '烟雾熏蒸' | '生物天敌释放'>('超低容量弥雾');
const pestConcentration = ref('1000倍液');
const pestDosageL = ref<number>(80);
const pestSafetyDays = ref<number>(0);
const pestIsBiocontrol = ref<boolean>(true);

// Harvest Specific
const harvBatch = ref(`HARV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-B01`);
const harvWeightKg = ref<number>(150);
const harvGrade = ref<'特级精品果' | '一级品' | '特级无公害'>('特级精品果');
const harvBrix = ref<number>(12.8);

// Error message
const formError = ref('');

// Selected Greenhouse Object
const currentGh = computed(() => {
  return props.greenhouses.find((g) => g.id === selectedGhId.value) || props.greenhouses[0];
});

// Auto-fill title based on type
const setDefaultTitle = () => {
  const ghName = currentGh.value?.shortName || '温室';
  const crop = currentGh.value?.cropName || '作物';
  if (opType.value === 'irrigation') {
    title.value = `${ghName}${crop}${irrMethod.value}补墒注水`;
  } else if (opType.value === 'fertilization') {
    title.value = `${ghName}${crop}水肥一体化配方施肥`;
  } else if (opType.value === 'pesticide') {
    title.value = `${ghName}${crop}生物绿色植保巡防喷施`;
  } else if (opType.value === 'pruning') {
    title.value = `${ghName}${crop}田间打杈整枝落蔓`;
  } else if (opType.value === 'harvest') {
    title.value = `${ghName}${crop}当季鲜采质检验收入库`;
  }
};

const handleTypeChange = (type: FarmingOperationType) => {
  opType.value = type;
  setDefaultTitle();
};

// Submission
const handleSubmit = () => {
  if (!title.value.trim()) {
    formError.value = '请输入作业标题或农事摘要';
    return;
  }
  if (!operator.value.trim()) {
    formError.value = '请输入经办农艺师或作业人员姓名';
    return;
  }

  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newRecord: FarmingRecord = {
    id: `rec_${selectedGhId.value}_${Date.now()}`,
    greenhouseId: selectedGhId.value,
    greenhouseName: currentGh.value.name,
    cropName: currentGh.value.cropName,
    type: opType.value,
    title: title.value,
    timestamp: timeStr,
    operator: operator.value,
    status: 'completed',
    notes: notes.value || '日常农艺作业规范达标，记录已上链同步至数字孪生台账。',
  };

  if (opType.value === 'irrigation') {
    newRecord.irrigationDetails = {
      method: irrMethod.value,
      waterVolumeL: Number(irrVolumeL.value),
      durationMinutes: Number(irrDurationMin.value),
      soilMoistureBefore: Number(irrMoistureBefore.value),
      soilMoistureAfter: Number(irrMoistureAfter.value),
      triggerMode: irrTriggerMode.value,
    };
  } else if (opType.value === 'fertilization') {
    newRecord.fertilizationDetails = {
      formula: fertFormula.value,
      fertilizerAmountKg: Number(fertAmountKg.value),
      targetEc: Number(fertTargetEc.value),
      measuredEc: Number(fertMeasuredEc.value),
      targetPh: Number(fertTargetPh.value),
      measuredPh: Number(fertMeasuredPh.value),
      dilutionRatio: fertDilution.value,
    };
  } else if (opType.value === 'pesticide') {
    newRecord.pesticideDetails = {
      agentName: pestAgentName.value,
      targetPest: pestTarget.value,
      method: pestMethod.value,
      concentration: pestConcentration.value,
      dosageL: Number(pestDosageL.value),
      safetyIntervalDays: Number(pestSafetyDays.value),
      safetyDaysLeft: Number(pestSafetyDays.value),
      isBiocontrol: pestIsBiocontrol.value,
    };
  } else if (opType.value === 'harvest') {
    newRecord.harvestDetails = {
      batchNumber: harvBatch.value,
      harvestWeightKg: Number(harvWeightKg.value),
      qualityGrade: harvGrade.value,
      sugarBrix: Number(harvBrix.value),
      traceabilityCode: `TR-2026-${selectedGhId.value.toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    };
  }

  emit('saveRecord', newRecord);
  emit('close');
};

// Initial title set
setDefaultTitle();
</script>

<template>
  <div
    v-if="visible"
    id="farming-record-add-overlay"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md transition-opacity duration-300"
    @click.self="emit('close')"
  >
    <div
      id="farming-record-add-modal"
      class="w-full max-w-2xl bg-slate-900/98 border border-emerald-500/40 rounded-2xl shadow-2xl shadow-emerald-950/50 overflow-hidden text-slate-100 font-sans animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
    >
      <!-- Modal Header -->
      <header class="flex items-center justify-between px-5 py-3.5 bg-slate-900 border-b border-slate-800">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Plus class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>登记农事作业记录</span>
              <span class="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                实时存证
              </span>
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">
              记录浇水、配肥、植保打药与采收数据，联动种植周期与溯源台账
            </p>
          </div>
        </div>

        <button
          @click="emit('close')"
          class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </header>

      <!-- Modal Body (Form) -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
        <!-- Error Alert -->
        <div
          v-if="formError"
          class="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-2 text-xs"
        >
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ formError }}</span>
        </div>

        <!-- 1. Greenhouse & Operation Type Selector -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- Target Greenhouse -->
          <div>
            <label class="block text-slate-400 font-medium mb-1.5 flex items-center gap-1">
              <Building2 class="w-3.5 h-3.5 text-cyan-400" />
              <span>目标温室</span>
            </label>
            <select
              v-model="selectedGhId"
              @change="setDefaultTitle"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-lg text-slate-200 text-xs focus:outline-hidden focus:border-cyan-400"
            >
              <option v-for="gh in greenhouses" :key="gh.id" :value="gh.id">
                {{ gh.shortName }} ({{ gh.cropName }})
              </option>
            </select>
          </div>

          <!-- Operation Type Buttons -->
          <div>
            <label class="block text-slate-400 font-medium mb-1.5 flex items-center gap-1">
              <Sparkles class="w-3.5 h-3.5 text-emerald-400" />
              <span>作业类别</span>
            </label>
            <div class="grid grid-cols-5 gap-1">
              <button
                type="button"
                @click="handleTypeChange('irrigation')"
                class="py-1.5 px-1 rounded-lg border text-[11px] font-medium flex flex-col items-center gap-0.5 transition-all cursor-pointer"
                :class="opType === 'irrigation' ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'"
              >
                <Droplets class="w-3.5 h-3.5 text-cyan-400" />
                <span>浇水</span>
              </button>

              <button
                type="button"
                @click="handleTypeChange('fertilization')"
                class="py-1.5 px-1 rounded-lg border text-[11px] font-medium flex flex-col items-center gap-0.5 transition-all cursor-pointer"
                :class="opType === 'fertilization' ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'"
              >
                <FlaskConical class="w-3.5 h-3.5 text-emerald-400" />
                <span>施肥</span>
              </button>

              <button
                type="button"
                @click="handleTypeChange('pesticide')"
                class="py-1.5 px-1 rounded-lg border text-[11px] font-medium flex flex-col items-center gap-0.5 transition-all cursor-pointer"
                :class="opType === 'pesticide' ? 'bg-amber-500/25 border-amber-400 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'"
              >
                <ShieldCheck class="w-3.5 h-3.5 text-amber-400" />
                <span>打药</span>
              </button>

              <button
                type="button"
                @click="handleTypeChange('pruning')"
                class="py-1.5 px-1 rounded-lg border text-[11px] font-medium flex flex-col items-center gap-0.5 transition-all cursor-pointer"
                :class="opType === 'pruning' ? 'bg-purple-500/25 border-purple-400 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'"
              >
                <Scissors class="w-3.5 h-3.5 text-purple-400" />
                <span>整枝</span>
              </button>

              <button
                type="button"
                @click="handleTypeChange('harvest')"
                class="py-1.5 px-1 rounded-lg border text-[11px] font-medium flex flex-col items-center gap-0.5 transition-all cursor-pointer"
                :class="opType === 'harvest' ? 'bg-rose-500/25 border-rose-400 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'"
              >
                <PackageCheck class="w-3.5 h-3.5 text-rose-400" />
                <span>采收</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 2. Record Title & Operator -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="sm:col-span-2">
            <label class="block text-slate-400 font-medium mb-1">作业事项标题</label>
            <input
              v-model="title"
              type="text"
              placeholder="例如: 第5花序开花坐果精准滴灌补墒"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-lg text-slate-200 text-xs focus:outline-hidden focus:border-cyan-400"
            />
          </div>
          <div>
            <label class="block text-slate-400 font-medium mb-1 flex items-center gap-1">
              <User class="w-3.5 h-3.5 text-slate-400" />
              <span>经办农艺师/班组</span>
            </label>
            <input
              v-model="operator"
              type="text"
              placeholder="张工 (水肥班组)"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-lg text-slate-200 text-xs focus:outline-hidden focus:border-cyan-400"
            />
          </div>
        </div>

        <!-- 3. Dynamic Section based on Operation Type -->

        <!-- CASE A: IRRIGATION (浇水) -->
        <div v-if="opType === 'irrigation'" class="bg-cyan-950/20 p-3.5 rounded-xl border border-cyan-500/30 space-y-3">
          <div class="flex items-center gap-2 text-cyan-300 font-semibold">
            <Droplets class="w-4 h-4 text-cyan-400" />
            <span>浇水灌溉详细参数</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-slate-400 mb-1">灌溉方式</label>
              <select
                v-model="irrMethod"
                class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 text-xs"
              >
                <option value="滴灌">压力补偿式滴灌</option>
                <option value="微喷灌">高架悬挂微喷</option>
                <option value="潮汐灌溉">底部潮汐式浸灌</option>
                <option value="NFT营养液循环">NFT水培闭路循环</option>
                <option value="气雾喷施">高频超声微雾加湿</option>
              </select>
            </div>

            <div>
              <label class="block text-slate-400 mb-1">单次浇水量 (升/L)</label>
              <input
                v-model="irrVolumeL"
                type="number"
                min="50"
                step="50"
                class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 font-mono text-xs"
              />
            </div>

            <div>
              <label class="block text-slate-400 mb-1">灌溉耗时 (分钟)</label>
              <input
                v-model="irrDurationMin"
                type="number"
                min="5"
                step="5"
                class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 font-mono text-xs"
              />
            </div>

            <div>
              <label class="block text-slate-400 mb-1">灌前基质湿度 (%)</label>
              <input
                v-model="irrMoistureBefore"
                type="number"
                min="10"
                max="90"
                step="0.5"
                class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 font-mono text-xs"
              />
            </div>

            <div>
              <label class="block text-slate-400 mb-1">灌后预期湿度 (%)</label>
              <input
                v-model="irrMoistureAfter"
                type="number"
                min="20"
                max="95"
                step="0.5"
                class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 font-mono text-xs"
              />
            </div>

            <div>
              <label class="block text-slate-400 mb-1">启动诱发机制</label>
              <select
                v-model="irrTriggerMode"
                class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 text-xs"
              >
                <option value="AI自动智能诱发">AI光温积温自动模型</option>
                <option value="定时计划轮灌">定时预设轮灌计划</option>
                <option value="人工手动指令">人工即时巡检指令</option>
              </select>
            </div>
          </div>
        </div>

        <!-- CASE B: FERTILIZATION (施肥) -->
        <div v-else-if="opType === 'fertilization'" class="bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-500/30 space-y-3">
          <div class="flex items-center gap-2 text-emerald-300 font-semibold">
            <FlaskConical class="w-4 h-4 text-emerald-400" />
            <span>水肥一体化施肥配方与出流监测</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1">母液配方 / 肥料品名</label>
              <input
                v-model="fertFormula"
                type="text"
                placeholder="例如: A/B高钾膨果母液 (15-8-30+TE)"
                class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 text-xs"
              />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-slate-400 mb-1">用肥量 (kg/L)</label>
                <input
                  v-model="fertAmountKg"
                  type="number"
                  step="0.5"
                  class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 font-mono text-xs"
                />
              </div>
              <div>
                <label class="block text-slate-400 mb-1">稀释配比</label>
                <input
                  v-model="fertDilution"
                  type="text"
                  placeholder="1:120"
                  class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800">
            <div>
              <label class="block text-slate-400 mb-1">目标 EC (mS/cm)</label>
              <input
                v-model="fertTargetEc"
                type="number"
                step="0.05"
                class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 font-mono text-xs"
              />
            </div>
            <div>
              <label class="block text-slate-400 mb-1">实测出流 EC</label>
              <input
                v-model="fertMeasuredEc"
                type="number"
                step="0.05"
                class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-emerald-400 font-mono text-xs font-bold"
              />
            </div>
            <div>
              <label class="block text-slate-400 mb-1">目标 pH 值</label>
              <input
                v-model="fertTargetPh"
                type="number"
                step="0.1"
                class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 font-mono text-xs"
              />
            </div>
            <div>
              <label class="block text-slate-400 mb-1">实测出流 pH</label>
              <input
                v-model="fertMeasuredPh"
                type="number"
                step="0.1"
                class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-cyan-400 font-mono text-xs font-bold"
              />
            </div>
          </div>
        </div>

        <!-- CASE C: PESTICIDE (打药/植保) -->
        <div v-else-if="opType === 'pesticide'" class="bg-amber-950/20 p-3.5 rounded-xl border border-amber-500/30 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-amber-300 font-semibold">
              <ShieldCheck class="w-4 h-4 text-amber-400" />
              <span>绿色植保与农药打药管控 (PHI安全监控)</span>
            </div>
            <label class="flex items-center gap-1.5 text-xs text-emerald-400 cursor-pointer">
              <input
                v-model="pestIsBiocontrol"
                type="checkbox"
                class="accent-emerald-400 rounded cursor-pointer"
              />
              <span>绿色生物天敌/零农残制剂</span>
            </label>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1">药剂品名 / 生物制剂</label>
              <input
                v-model="pestAgentName"
                type="text"
                placeholder="例如: 枯草芽孢杆菌微囊悬浮剂 / 0.5%苦参碱"
                class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 text-xs"
              />
            </div>
            <div>
              <label class="block text-slate-400 mb-1">防治病虫害对象</label>
              <input
                v-model="pestTarget"
                type="text"
                placeholder="例如: 白粉病预防 / 阻断红蜘蛛螨害"
                class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 text-xs"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label class="block text-slate-400 mb-1">施药作业方式</label>
              <select
                v-model="pestMethod"
                class="w-full px-2 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 text-xs"
              >
                <option value="超低容量弥雾">超低容量弥雾</option>
                <option value="常温恒压喷雾">常温恒压喷雾</option>
                <option value="高架轨道喷药机">高架轨道喷药机</option>
                <option value="烟雾熏蒸">气相臭氧熏蒸</option>
                <option value="生物天敌释放">生物天敌释放</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-400 mb-1">药液体积 (升/L)</label>
              <input
                v-model="pestDosageL"
                type="number"
                class="w-full px-2 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 font-mono text-xs"
              />
            </div>
            <div>
              <label class="block text-slate-400 mb-1">浓度配比</label>
              <input
                v-model="pestConcentration"
                type="text"
                placeholder="1000倍液"
                class="w-full px-2 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 font-mono text-xs"
              />
            </div>
            <div>
              <label class="block text-slate-400 mb-1">安全采收间隔期 (天)</label>
              <input
                v-model="pestSafetyDays"
                type="number"
                min="0"
                max="20"
                class="w-full px-2 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-amber-300 font-mono text-xs font-bold"
              />
            </div>
          </div>
        </div>

        <!-- CASE D: HARVEST (采收) -->
        <div v-else-if="opType === 'harvest'" class="bg-rose-950/20 p-3.5 rounded-xl border border-rose-500/30 space-y-3">
          <div class="flex items-center gap-2 text-rose-300 font-semibold">
            <PackageCheck class="w-4 h-4 text-rose-400" />
            <span>采收批次入库与品质质检</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label class="block text-slate-400 mb-1">批次编号</label>
              <input
                v-model="harvBatch"
                type="text"
                class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 font-mono text-xs"
              />
            </div>
            <div>
              <label class="block text-slate-400 mb-1">采收重量 (kg)</label>
              <input
                v-model="harvWeightKg"
                type="number"
                step="1"
                class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-rose-300 font-mono text-xs font-bold"
              />
            </div>
            <div>
              <label class="block text-slate-400 mb-1">质检品级</label>
              <select
                v-model="harvGrade"
                class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 text-xs"
              >
                <option value="特级精品果">特级精品果</option>
                <option value="一级品">一级品</option>
                <option value="特级无公害">特级无公害</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-400 mb-1">糖度实测 (°Brix)</label>
              <input
                v-model="harvBrix"
                type="number"
                step="0.1"
                class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-amber-300 font-mono text-xs font-bold"
              />
            </div>
          </div>
        </div>

        <!-- 4. Notes -->
        <div>
          <label class="block text-slate-400 font-medium mb-1">田间作业备注与溯源说明</label>
          <textarea
            v-model="notes"
            rows="2"
            placeholder="填写作业规范、机械巡检状况或异常观察..."
            class="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-lg text-slate-200 text-xs focus:outline-hidden focus:border-cyan-400"
          ></textarea>
        </div>
      </div>

      <!-- Modal Footer -->
      <footer class="flex items-center justify-between px-5 py-3 bg-slate-900 border-t border-slate-800">
        <div class="text-[11px] text-slate-400 flex items-center gap-1.5">
          <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
          <span>保存后实时追加到当前温室农事账本与数字孪生全生命周期</span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="emit('close')"
            class="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            @click="handleSubmit"
            class="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 class="w-3.5 h-3.5" />
            <span>保存农事记录</span>
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>
