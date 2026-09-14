<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import {
  CloudRain,
  Wind,
  AlertTriangle,
  Layers,
  CheckCircle2,
  Zap,
  X,
  Eye,
  ShieldAlert,
  ClipboardCheck,
  Building2,
  CheckSquare,
  Square,
} from 'lucide-vue-next';
import type {
  WeatherNowcastPoint,
  AgroRiskWarning,
} from '../types/digitalTwin';
import { weatherService } from '../services/weatherService';

defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'applyWeather3D', point: WeatherNowcastPoint): void;
  (e: 'focusGreenhouse', ghId: string): void;
  (e: 'mitigateRisk', warning: AgroRiskWarning): void;
  (e: 'toggleWeatherLayer', layer: 'rain' | 'wind', visible: boolean): void;
}>();

// 3D Visual Effects
const showRainIn3D = ref<boolean>(true);
const showWindIn3D = ref<boolean>(true);

const handleToggleLayer = (layer: 'rain' | 'wind') => {
  if (layer === 'rain') {
    showRainIn3D.value = !showRainIn3D.value;
    emit('toggleWeatherLayer', 'rain', showRainIn3D.value);
  } else if (layer === 'wind') {
    showWindIn3D.value = !showWindIn3D.value;
    emit('toggleWeatherLayer', 'wind', showWindIn3D.value);
  }
};

// Data States
const riskWarnings = ref<AgroRiskWarning[]>([]);
const activeTab = ref<'results' | 'checklist' | 'matrix'>('results');

// Worker Emergency Checklist (现场农工防灾核查清单)
interface WorkerCheckItem {
  id: string;
  task: string;
  area: string;
  level: 'urgent' | 'important' | 'routine';
  completed: boolean;
  operator: string;
}

const workerChecklist = ref<WorkerCheckItem[]>([
  {
    id: 'chk_1',
    task: '核查并锁闭全部8座大棚电动天窗与侧卷膜',
    area: '1#-8# 大棚全域',
    level: 'urgent',
    completed: true,
    operator: '自动联动已下发',
  },
  {
    id: 'chk_2',
    task: '紧固 3# 圆拱薄膜棚迎风面地锚与压膜拉绳',
    area: '3# 现代薄膜大棚',
    level: 'urgent',
    completed: true,
    operator: '林师傅 (已巡查紧固)',
  },
  {
    id: 'chk_3',
    task: '清理园区外围排水主渠雨篦与杂草泥沙堵塞',
    area: '园区外围环形排涝渠',
    level: 'important',
    completed: false,
    operator: '待人工巡检核销',
  },
  {
    id: 'chk_4',
    task: '鱼塘周边防溢防逃网升起就位，检查强排水泵',
    area: '生态循环鱼塘 / 6#棚',
    level: 'important',
    completed: true,
    operator: '陈工 (水产技术部)',
  },
  {
    id: 'chk_5',
    task: '检查冷链物流中心备用柴油发电机机油及预热',
    area: '冷链物流动力配电间',
    level: 'routine',
    completed: false,
    operator: '待电工班确认',
  },
]);

const toggleCheckItem = (item: WorkerCheckItem) => {
  item.completed = !item.completed;
  if (item.completed) {
    item.operator = '现场负责人已核实确认';
  } else {
    item.operator = '待人工巡检核销';
  }
};

// Greenhouse Risk Impact Matrix
interface GreenhouseRiskStatus {
  ghId: string;
  name: string;
  crop: string;
  impactResult: string;
  riskLevel: 'high' | 'medium' | 'safe';
  measure: string;
}

const greenhouseMatrix = ref<GreenhouseRiskStatus[]>([
  {
    ghId: 'gh_001',
    name: '1# Venlo核心棚',
    crop: '高糖番茄 (开花坐果期)',
    impactResult: '强降水直接冲淋花穗，将诱发大面积落花与灰霉病',
    riskLevel: 'high',
    measure: '脊顶电动排气天窗已强制闭合，内遮阳闭合防滴水',
  },
  {
    ghId: 'gh_002',
    name: '2# 日光温室',
    crop: '立体草莓 (现蕾转色期)',
    impactResult: '迎风端面受强风持续推挤，膜面易鼓包扯脱',
    riskLevel: 'medium',
    measure: '前沿卷帘保温被已固定至防风防拉卡槽',
  },
  {
    ghId: 'gh_003',
    name: '3# 现代薄膜棚',
    crop: '水培沙拉生菜与苦苣',
    impactResult: '强暴雨天沟汇水溢流，薄膜边缘受风压撕裂风险高',
    riskLevel: 'high',
    measure: '已收起外遮阳铝箔拉幕，排涝沟深水泵已启动',
  },
  {
    ghId: 'gh_004',
    name: '4# 数字种苗工厂',
    crop: '集约化穴盘苗 (幼苗脆弱期)',
    impactResult: '外界寡照阴冷导致幼苗徒长、猝倒病暴发概率提升',
    riskLevel: 'medium',
    measure: '全光谱LED植物生长补光灯已启动 (80%功率)',
  },
  {
    ghId: 'gh_006',
    name: '6# 鱼菜共生棚',
    crop: '加州鲈鱼 + 养殖水池',
    impactResult: '外部暴雨外溢，池塘水位可能快速上升越过溢水线',
    riskLevel: 'medium',
    measure: '智能防溢溢流旁通阀已处于开启待命状态',
  },
  {
    ghId: 'gh_007',
    name: '7# 气雾培温室',
    crop: '垂直柱状鲜蔬',
    impactResult: '暴雨强对流雷电若致瞬时断电，气雾喷头将停止供水',
    riskLevel: 'medium',
    measure: 'UPS备用锂电池组已激活无缝切换模式',
  },
]);

let refreshTimer: ReturnType<typeof setInterval> | null = null;

const loadWeatherData = async () => {
  try {
    const [nowcast, risks] = await Promise.all([
      weatherService.getCurrentNowcast(),
      weatherService.getRiskWarnings(),
    ]);

    riskWarnings.value = risks;
    if (nowcast) {
      emit('applyWeather3D', nowcast);
    }
  } catch (err) {
    console.warn('[WeatherPanel] Error loading risk data:', err);
  }
};

const handleMitigate = async (warning: AgroRiskWarning) => {
  await weatherService.mitigateRiskWarning(warning.id);
  warning.isMitigated = true;
  emit('mitigateRisk', warning);
};

const mitigateAllRisks = async () => {
  for (const warning of riskWarnings.value) {
    if (!warning.isMitigated) {
      await weatherService.mitigateRiskWarning(warning.id);
      warning.isMitigated = true;
      emit('mitigateRisk', warning);
    }
  }
};

onMounted(() => {
  loadWeatherData();
  refreshTimer = setInterval(loadWeatherData, 30000);
});

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer);
});
</script>

<template>
  <div
    v-if="visible"
    class="fixed top-16 right-3 sm:right-74 z-40 w-[380px] max-w-[94vw] bg-slate-950/90 backdrop-blur-2xl rounded-2xl border border-amber-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 text-slate-100 overflow-hidden flex flex-col max-h-[84vh] transition-all duration-300 pointer-events-auto"
  >
    <!-- Header: Explicitly highlights agricultural result impacts, no jargon -->
    <div class="px-4 py-3 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-900/90 border-b border-amber-500/20 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-sm">
          <ShieldAlert class="w-4 h-4" />
        </div>
        <div>
          <h2 class="text-sm font-bold tracking-wide text-white flex items-center gap-2">
            气象农事影响与灾害预警
            <span class="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
              结果预警
            </span>
          </h2>
          <p class="text-[10px] text-amber-200/80">只看防灾行动与作物后果 · 拒绝复杂气象术语</p>
        </div>
      </div>
      <button
        @click="$emit('close')"
        class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        title="关闭面板"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center gap-1 px-3 pt-2 border-b border-slate-800 bg-slate-950/60 text-xs">
      <button
        @click="activeTab = 'results'"
        :class="[
          'px-3 py-1.5 rounded-t-lg font-medium transition-all flex items-center gap-1.5 border-b-2 cursor-pointer',
          activeTab === 'results'
            ? 'border-amber-400 text-amber-300 bg-amber-950/30'
            : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
      >
        <AlertTriangle class="w-3.5 h-3.5" />
        作物受损预警
        <span
          v-if="riskWarnings.filter(r => !r.isMitigated).length"
          class="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-bold animate-pulse"
        >
          {{ riskWarnings.filter(r => !r.isMitigated).length }}
        </span>
      </button>
      <button
        @click="activeTab = 'checklist'"
        :class="[
          'px-3 py-1.5 rounded-t-lg font-medium transition-all flex items-center gap-1.5 border-b-2 cursor-pointer',
          activeTab === 'checklist'
            ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
            : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
      >
        <ClipboardCheck class="w-3.5 h-3.5" />
        工人防灾核查
      </button>
      <button
        @click="activeTab = 'matrix'"
        :class="[
          'px-3 py-1.5 rounded-t-lg font-medium transition-all flex items-center gap-1.5 border-b-2 cursor-pointer',
          activeTab === 'matrix'
            ? 'border-emerald-400 text-emerald-300 bg-emerald-950/30'
            : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
      >
        <Building2 class="w-3.5 h-3.5" />
        各棚受灾矩阵
      </button>
    </div>

    <!-- 3D Weather Layers Quick Controls (Simple Rain & Wind visual particles) -->
    <div class="px-3 py-2 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between text-[11px]">
      <span class="text-slate-400 flex items-center gap-1.5 font-medium">
        <Layers class="w-3.5 h-3.5 text-cyan-400" />
        园区3D实景天气呈现
      </span>
      <div class="flex items-center gap-1.5">
        <button
          @click="handleToggleLayer('rain')"
          :class="[
            'px-2.5 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer border flex items-center gap-1',
            showRainIn3D
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
              : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
          ]"
        >
          <CloudRain class="w-3 h-3" />
          降雨视效: {{ showRainIn3D ? '开' : '关' }}
        </button>
        <button
          @click="handleToggleLayer('wind')"
          :class="[
            'px-2.5 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer border flex items-center gap-1',
            showWindIn3D
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
              : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
          ]"
        >
          <Wind class="w-3 h-3" />
          风力流线: {{ showWindIn3D ? '开' : '关' }}
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="p-3.5 overflow-y-auto space-y-3.5 text-xs flex-1">
      <!-- 1. RESULTS TAB: Actionable Agricultural Consequences -->
      <div v-if="activeTab === 'results'" class="space-y-3">
        <!-- Prominent Emergency Summary Card -->
        <div class="p-3 rounded-xl bg-gradient-to-br from-rose-950/40 via-slate-900/80 to-amber-950/30 border border-rose-500/40 space-y-2 shadow-inner">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span class="font-bold text-rose-300 text-[13px]">当前处于：强阵风与暴雨双重防灾期</span>
            </div>
            <button
              @click="mitigateAllRisks"
              class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 shadow transition-all cursor-pointer"
            >
              <Zap class="w-3 h-3 fill-current" />
              一键全棚应急防御
            </button>
          </div>
          <p class="text-[11px] text-slate-200 leading-relaxed">
            外场已出现短时强阵风及暴雨威胁。系统已根据气象影响模型，自动测算出可能对作物品相、温室玻璃骨架造成的直接损害，请一线作业人员立即按预案处置。
          </p>
        </div>

        <!-- Risk Warning Cards -->
        <div
          v-for="warning in riskWarnings"
          :key="warning.id"
          :class="[
            'p-3 rounded-xl border transition-all space-y-2.5',
            warning.isMitigated
              ? 'bg-slate-900/40 border-slate-800 opacity-70'
              : warning.severity === 'critical'
              ? 'bg-rose-950/20 border-rose-500/50 shadow-[0_0_16px_rgba(244,63,94,0.15)]'
              : 'bg-amber-950/20 border-amber-500/40'
          ]"
        >
          <!-- Warning Title & Status -->
          <div class="flex items-start justify-between gap-2">
            <div class="space-y-0.5">
              <div class="flex items-center gap-2">
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-[10px] font-bold',
                    warning.isMitigated
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : warning.severity === 'critical'
                      ? 'bg-rose-500/30 text-rose-200 border border-rose-500/50'
                      : 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                  ]"
                >
                  {{ warning.isMitigated ? '已执行防御' : warning.severity === 'critical' ? '破坏性高危预警' : '中度破坏预警' }}
                </span>
                <h3 class="font-bold text-slate-100 text-[12px]">{{ warning.title }}</h3>
              </div>
              <div class="text-[10px] text-slate-400 font-mono">
                预计影响时间: 未来 {{ warning.forecastLeadMinutes }} 分钟内到达大棚
              </div>
            </div>

            <button
              v-if="warning.impactedGreenhouses.length"
              @click="$emit('focusGreenhouse', warning.impactedGreenhouses[0])"
              class="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-200 transition-colors cursor-pointer px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30"
            >
              <Eye class="w-3 h-3" /> 定位大棚
            </button>
          </div>

          <!-- Impact Result (Highlighted for farm workers) -->
          <div class="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 space-y-1">
            <div class="text-[10px] font-bold text-amber-300 flex items-center gap-1">
              <span>⚠️ 对大棚与作物的直接破坏结果：</span>
            </div>
            <p class="text-[11px] text-slate-200 leading-relaxed">
              {{ warning.impactDescription || warning.summary }}
            </p>
          </div>

          <!-- Actionable Guide -->
          <div class="text-[11px] text-cyan-200/90 bg-cyan-950/20 p-2 rounded-lg border border-cyan-500/20">
            <strong class="text-cyan-300">工作人员动作：</strong> {{ warning.aiRecommendation }}
          </div>

          <!-- Defense Button -->
          <div class="pt-1 flex items-center justify-between border-t border-slate-800/80">
            <span class="text-[10px] text-slate-400">
              波及棚区: <strong>{{ warning.impactedGreenhouses.join(', ') }}</strong>
            </span>

            <button
              v-if="!warning.isMitigated"
              @click="handleMitigate(warning)"
              class="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow cursor-pointer transition-transform active:scale-95"
            >
              <Zap class="w-3 h-3 fill-current" /> 一键下发防御指令
            </button>
            <span v-else class="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 class="w-3.5 h-3.5" /> 保护策略已就绪
            </span>
          </div>
        </div>
      </div>

      <!-- 2. CHECKLIST TAB: Practical On-site Tasks for Farm Staff -->
      <div v-if="activeTab === 'checklist'" class="space-y-3">
        <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
          现场工人和大棚负责人可逐项核查现场实体防灾举措，点击方框可直接勾选核销。
        </div>

        <div class="space-y-2">
          <div
            v-for="item in workerChecklist"
            :key="item.id"
            @click="toggleCheckItem(item)"
            :class="[
              'p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all',
              item.completed
                ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-300'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-100'
            ]"
          >
            <button class="mt-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer">
              <CheckSquare v-if="item.completed" class="w-4 h-4 text-emerald-400" />
              <Square v-else class="w-4 h-4 text-slate-500" />
            </button>

            <div class="flex-1 space-y-1">
              <div class="flex items-center justify-between gap-2">
                <span
                  :class="[
                    'font-medium text-[11px]',
                    item.completed ? 'line-through text-slate-400' : 'text-slate-100'
                  ]"
                >
                  {{ item.task }}
                </span>
                <span
                  :class="[
                    'px-1.5 py-0.2 rounded text-[9px] shrink-0 font-bold',
                    item.level === 'urgent'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : item.level === 'important'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  ]"
                >
                  {{ item.level === 'urgent' ? '紧急必办' : item.level === 'important' ? '重点核查' : '日常备勤' }}
                </span>
              </div>
              <div class="flex items-center justify-between text-[10px] text-slate-400">
                <span>区域: {{ item.area }}</span>
                <span :class="item.completed ? 'text-emerald-400' : 'text-amber-300'">
                  {{ item.operator }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. MATRIX TAB: 8 Greenhouses & Pond Impact Matrix -->
      <div v-if="activeTab === 'matrix'" class="space-y-2.5">
        <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300">
          全园区温室与养殖区当前极端天气影响后果一览：
        </div>

        <div
          v-for="item in greenhouseMatrix"
          :key="item.ghId"
          class="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5 hover:border-slate-700 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'w-2 h-2 rounded-full',
                  item.riskLevel === 'high'
                    ? 'bg-rose-500'
                    : item.riskLevel === 'medium'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                ]"
              />
              <strong class="text-slate-100 font-semibold">{{ item.name }}</strong>
              <span class="text-slate-400 text-[10px]">({{ item.crop }})</span>
            </div>

            <button
              @click="$emit('focusGreenhouse', item.ghId)"
              class="text-[10px] text-cyan-400 hover:text-cyan-200 transition-colors cursor-pointer flex items-center gap-0.5"
            >
              <Eye class="w-3 h-3" /> 查看
            </button>
          </div>

          <div class="text-[10px] text-rose-200/90 bg-rose-950/20 px-2 py-1 rounded border border-rose-500/20">
            <strong>可能后果:</strong> {{ item.impactResult }}
          </div>

          <div class="text-[10px] text-slate-400 flex items-center gap-1">
            <strong class="text-emerald-400">已配防御:</strong> {{ item.measure }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
