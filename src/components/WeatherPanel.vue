<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
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
  Clock,
  Calendar,
  Sparkles,
  Sun,
  Droplets,
  Sprout,
  Truck,
  RotateCcw,
  TrendingUp,
  ShieldCheck,
} from 'lucide-vue-next';
import type {
  WeatherNowcastPoint,
  WeatherNowcastData,
  AgroRiskWarning,
} from '../types/digitalTwin';
import { weatherService } from '../services/weatherService';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'applyWeather3D', point: WeatherNowcastPoint): void;
  (e: 'focusGreenhouse', ghId: string): void;
  (e: 'mitigateRisk', warning: AgroRiskWarning): void;
  (e: 'toggleWeatherLayer', layer: 'rain' | 'wind', visible: boolean): void;
}>();

// 3D Visual Effects toggles
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

// Active View Tab:
// 1. nowcast: 0~120分钟短临推演 (分钟级推演与大棚防灾倒计时)
// 2. windows: 72小时短期农事作业黄金窗口 (喷药、蓄热、灌溉、采摘)
// 3. risks: 作物受损与应急防御
// 4. matrix: 8座温室受灾影响矩阵
// 5. checklist: 现场工人巡检清单
const activeTab = ref<'nowcast' | 'windows' | 'risks' | 'matrix' | 'checklist'>('nowcast');

// Raw Meteorological Nowcast Data
const nowcastData = ref<WeatherNowcastData | null>(null);
const currentPoint = ref<WeatherNowcastPoint | null>(null);
const selectedTimelineIndex = ref<number>(0); // 0 = current live
const isSimulatingFuture = ref<boolean>(false);

// Risk Warnings
const riskWarnings = ref<AgroRiskWarning[]>([]);

// 72-Hour Agricultural Golden Operation Windows (科学气象农事驱动)
interface AgriWindowItem {
  id: string;
  category: 'spray' | 'solar_vent' | 'irrigate' | 'harvest';
  title: string;
  badge: string;
  status: 'recommended' | 'caution' | 'forbidden';
  optimalTime: string;
  avoidTime: string;
  weatherReason: string;
  economicImpact: string;
}

const agriWindows = ref<AgriWindowItem[]>([
  {
    id: 'win_1',
    category: 'spray',
    title: '植保无人机与农药喷洒作业窗口',
    badge: '病虫害防治',
    status: 'recommended',
    optimalTime: '明日 07:00 ~ 10:30 (强烈推荐)',
    avoidTime: '今日 09:00 ~ 13:00 (暴雨冲刷禁喷)',
    weatherReason: '明日早间叶面干燥，风速 1.8m/s (无飘移)，气温 23℃，无强紫外光降解，未来24H无雨保证药效被叶肉充分吸附。',
    economicImpact: '避免雨水冲刷造成的农药流失，提高防效 38%，每亩节约药剂成本 ¥35',
  },
  {
    id: 'win_2',
    category: 'solar_vent',
    title: '温室自然光热蓄能与排湿降温窗口',
    badge: '节能降耗',
    status: 'recommended',
    optimalTime: '明日 10:00 ~ 15:30 (自然蓄热黄金期)',
    avoidTime: '今日 10:00 ~ 16:00 (冷雨强对流需闭窗锁温)',
    weatherReason: '明日天气放晴，预测太阳净辐射超 750W/m²；10:00展开内遮阳防灼伤，15:00提前闭窗锁住自然温热，夜间降温平缓。',
    economicImpact: '充分利用自然光热储热，夜间可减少地源热泵供暖 3.5 小时，单日节约电费 ¥120',
  },
  {
    id: 'win_3',
    category: 'irrigate',
    title: '露地大田与大棚水肥一体化灌溉窗口',
    badge: '水肥节约',
    status: 'caution',
    optimalTime: '后天 08:30 ~ 11:00 (重启水肥循环)',
    avoidTime: '今日全天暂停灌溉 (土壤墒情过饱和)',
    weatherReason: '今日短临强降水将补充有效降雨 17.5mm，表层及根系土壤湿度将达 88%，今日强行灌水将引发积水沤根与根腐病。',
    economicImpact: '结合天然降水减免 1 次全园大田漫灌，节水 180 吨，防止肥料被雨水淋洗流失',
  },
  {
    id: 'win_4',
    category: 'harvest',
    title: '优质果蔬采收与冷链出货保鲜窗口',
    badge: '品质保鲜',
    status: 'recommended',
    optimalTime: '明日 06:30 ~ 09:00 (露水消散后最佳采收)',
    avoidTime: '降雨期间与阴湿正午 (果实带水易腐烂)',
    weatherReason: '雨后晴天次日清晨采收，果实细胞膨压适中、糖分沉淀充分，表面无游离水膜，入冷库预冷失重率最低。',
    economicImpact: '降低采后仓储腐烂率 4.2%，延长冷链货架期 3~5 天，保障终端精品售价',
  },
]);

// 3-Day Short-Range Weather Summary (3天天气与农事日历)
interface DayForecastItem {
  date: string;
  dayLabel: string;
  condition: string;
  tempRange: string;
  wind: string;
  rainMm: number;
  agriSummary: string;
  level: 'danger' | 'prime' | 'good';
}

const threeDayForecast = ref<DayForecastItem[]>([
  {
    date: '09-14',
    dayLabel: '今天',
    condition: '短时雷暴大风与强降水',
    tempRange: '24℃ ~ 28℃',
    wind: '东南风 6-7级阵风',
    rainMm: 17.5,
    agriSummary: '强对流防御日 · 全园闭窗收帘 · 停止喷药施肥 · 启动排涝预案',
    level: 'danger',
  },
  {
    date: '09-15',
    dayLabel: '明天',
    condition: '晴朗无云 · 高辐射光热',
    tempRange: '18℃ ~ 28℃',
    wind: '偏南风 2-3级',
    rainMm: 0,
    agriSummary: '黄金农事日 · 极佳喷药与采收窗口 · 温室蓄热可减少夜间能耗',
    level: 'prime',
  },
  {
    date: '09-16',
    dayLabel: '后天',
    condition: '多云间晴 · 微风和煦',
    tempRange: '20℃ ~ 27℃',
    wind: '西南风 2级',
    rainMm: 0,
    agriSummary: '适宜作业日 · 墒情稳定 · 重启大田滴灌与水肥一体化补充',
    level: 'good',
  },
]);

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
  item.operator = item.completed ? '现场负责人已核实确认' : '待人工巡检核销';
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
    name: '1# Venlo核心玻璃棚',
    crop: '高糖番茄 (开花坐果期)',
    impactResult: '强降水直接冲淋花穗，将诱发大面积落花与灰霉病',
    riskLevel: 'high',
    measure: '脊顶双向天窗已强制闭合，内保温反光拉幕展开防滴水',
  },
  {
    ghId: 'gh_002',
    name: '2# 连栋日光温室',
    crop: '立体草莓 (现蕾转色期)',
    impactResult: '迎风端面受强风持续推挤，膜面易鼓包扯脱',
    riskLevel: 'medium',
    measure: '前沿卷帘保温被已固定至防风防拉卡槽',
  },
  {
    ghId: 'gh_003',
    name: '3# 现代圆拱薄膜棚',
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
      weatherService.getNowcast(),
      weatherService.getRiskWarnings(),
    ]);

    nowcastData.value = nowcast;
    if (nowcast && nowcast.currentObservation) {
      currentPoint.value = nowcast.currentObservation;
      if (!isSimulatingFuture.value) {
        emit('applyWeather3D', nowcast.currentObservation);
      }
    }
    riskWarnings.value = risks;
  } catch (err) {
    console.warn('[WeatherPanel] Error loading risk data:', err);
  }
};

// Scrub Nowcasting Timeline (0~120min forward projection)
const handleSelectTimelinePoint = (index: number, point: WeatherNowcastPoint) => {
  selectedTimelineIndex.value = index;
  isSimulatingFuture.value = index > 0;
  emit('applyWeather3D', point);
};

const handleResetToCurrentObservation = () => {
  selectedTimelineIndex.value = 0;
  isSimulatingFuture.value = false;
  if (nowcastData.value?.currentObservation) {
    emit('applyWeather3D', nowcastData.value.currentObservation);
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
  <!-- Modal Backdrop & Window -->
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
  >
    <div
      class="relative w-[880px] max-w-[96vw] max-h-[90vh] bg-slate-950/95 backdrop-blur-2xl rounded-2xl border border-cyan-500/40 shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/10 text-slate-100 overflow-hidden flex flex-col pointer-events-auto"
    >
      <!-- 1. Header: Highlight Professional Meteorology to Actionable Agri-Empowerment -->
      <div class="px-4 py-3 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border-b border-cyan-500/30 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/25 to-blue-500/25 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-md">
            <CloudRain class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-sm sm:text-base font-bold tracking-wide text-white flex items-center gap-2">
                微气象短临与短期预测 · 农事赋能中枢
              </h2>
              <span class="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
                0~120m短临外推 + 72H农事窗口
              </span>
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5">
              全息气象演变推演 · 园区防灾联动与农事作业决策
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="$emit('close')"
            class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="关闭面板"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- 2. High-Impact Meteorological Value Ribbon (气象经济效益与实时态势) -->
      <div class="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        <div class="flex items-center gap-3">
          <!-- Live Weather Pill -->
          <div class="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px]">
            <Sun class="w-3.5 h-3.5 text-amber-400" />
            <span class="text-slate-400">实况:</span>
            <span class="font-mono text-slate-200 font-bold">
              {{ currentPoint?.temperature ?? 28.6 }}℃ · {{ currentPoint?.relativeHumidity ?? 72.3 }}% · 东南风 3.2m/s
            </span>
          </div>

          <!-- Nowcast Urgent Notice -->
          <div class="flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/40 px-2.5 py-1 rounded-lg text-[11px]">
            <span class="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span class="text-rose-300 font-bold">短临预警:</span>
            <span class="text-rose-200 font-medium">未来30分钟有短时强降雨 (28mm/h) · 自动防御已激活</span>
          </div>
        </div>

        <!-- Economic Benefits (气象为园区创造的真金白银价值) -->
        <div class="flex items-center gap-2 text-[11px] font-mono">
          <span class="text-slate-400 flex items-center gap-1">
            <TrendingUp class="w-3.5 h-3.5 text-emerald-400" />
            <span>本周气象赋能增效:</span>
          </span>
          <span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
            节省电费 ¥420
          </span>
          <span class="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
            挽回产值 ¥35,000+
          </span>
        </div>
      </div>

      <!-- 3. Navigation Tabs -->
      <div class="flex items-center justify-between px-4 pt-2 border-b border-slate-800 bg-slate-950/60 text-xs shrink-0">
        <div class="flex items-center gap-1">
          <!-- Tab 1: Nowcast (0~120m) -->
          <button
            @click="activeTab = 'nowcast'"
            :class="[
              'px-3.5 py-2 rounded-t-xl font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer text-xs',
              activeTab === 'nowcast'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            ]"
          >
            <Clock class="w-4 h-4 text-cyan-400" />
            <span>0~120分钟短临演变</span>
            <span class="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-mono animate-pulse">
              雷暴逼近
            </span>
          </button>

          <!-- Tab 2: 72H Agri-Windows -->
          <button
            @click="activeTab = 'windows'"
            :class="[
              'px-3.5 py-2 rounded-t-xl font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer text-xs',
              activeTab === 'windows'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            ]"
          >
            <Calendar class="w-4 h-4 text-emerald-400" />
            <span>未来72小时农事作业黄金窗口</span>
            <span class="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
              明日宜喷药
            </span>
          </button>

          <!-- Tab 3: Crop Risks -->
          <button
            @click="activeTab = 'risks'"
            :class="[
              'px-3 py-2 rounded-t-xl font-medium transition-all flex items-center gap-1.5 border-b-2 cursor-pointer text-xs',
              activeTab === 'risks'
                ? 'border-amber-400 text-amber-300 bg-amber-950/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            ]"
          >
            <AlertTriangle class="w-3.5 h-3.5 text-amber-400" />
            <span>作物受损预警</span>
          </button>

          <!-- Tab 4: 8-Greenhouse Matrix -->
          <button
            @click="activeTab = 'matrix'"
            :class="[
              'px-3 py-2 rounded-t-xl font-medium transition-all flex items-center gap-1.5 border-b-2 cursor-pointer text-xs',
              activeTab === 'matrix'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            ]"
          >
            <Building2 class="w-3.5 h-3.5 text-cyan-400" />
            <span>各棚耐灾矩阵</span>
          </button>

          <!-- Tab 5: Worker Checklist -->
          <button
            @click="activeTab = 'checklist'"
            :class="[
              'px-3 py-2 rounded-t-xl font-medium transition-all flex items-center gap-1.5 border-b-2 cursor-pointer text-xs',
              activeTab === 'checklist'
                ? 'border-teal-400 text-teal-300 bg-teal-950/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            ]"
          >
            <ClipboardCheck class="w-3.5 h-3.5 text-teal-400" />
            <span>现场防灾核查清单</span>
          </button>
        </div>

        <!-- 3D Weather Layers Toggles -->
        <div class="hidden sm:flex items-center gap-1.5 pb-1 text-[11px]">
          <button
            @click="handleToggleLayer('rain')"
            :class="[
              'px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer border flex items-center gap-1',
              showRainIn3D
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-xs'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            ]"
          >
            <CloudRain class="w-3 h-3" />
            <span>雨滴粒子: {{ showRainIn3D ? '开' : '关' }}</span>
          </button>
          <button
            @click="handleToggleLayer('wind')"
            :class="[
              'px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer border flex items-center gap-1',
              showWindIn3D
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-xs'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            ]"
          >
            <Wind class="w-3 h-3" />
            <span>风场流线: {{ showWindIn3D ? '开' : '关' }}</span>
          </button>
        </div>
      </div>

      <!-- 4. Main Scrollable Content Body -->
      <div class="p-4 overflow-y-auto space-y-4 text-xs flex-1">
        <!-- ============================================================== -->
        <!-- TAB 1: 0~120 MIN NOWCASTING (分钟级短临推进与大棚防灾倒计时) -->
        <!-- ============================================================== -->
        <div v-if="activeTab === 'nowcast'" class="space-y-4">
          <!-- Simulation Status Bar (当用户点击未来节点推演三维天气时) -->
          <div
            v-if="isSimulatingFuture"
            class="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-slate-900 border border-amber-400/50 flex items-center justify-between text-xs animate-in fade-in"
          >
            <div class="flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-amber-400 animate-spin" />
              <span class="text-amber-200 font-bold">
                正在三维实景中快进推演未来气象:
                <span class="underline ml-1 text-white">
                  {{ nowcastData?.timeline[selectedTimelineIndex]?.displayTime }} - {{ nowcastData?.timeline[selectedTimelineIndex]?.conditionText }}
                </span>
              </span>
            </div>
            <button
              @click="handleResetToCurrentObservation"
              class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
            >
              <RotateCcw class="w-3 h-3" /> 恢复当前实况
            </button>
          </div>

          <!-- Section A: 0~120 Minutes Progression Gantt / Steps -->
          <div class="bg-slate-900/70 p-3.5 rounded-xl border border-cyan-500/30 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Clock class="w-4 h-4 text-cyan-400" />
                <h3 class="font-bold text-slate-100 text-xs sm:text-sm">
                  未来 0~120 分钟分钟级降雨与大风推进演变轴
                </h3>
              </div>
              <span class="text-[10px] text-slate-400">点击任意时间卡可将三维场景“快进”至该时刻</span>
            </div>

            <!-- Timeline Cards Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              <div
                v-for="(pt, idx) in nowcastData?.timeline || []"
                :key="pt.isoTime"
                @click="handleSelectTimelinePoint(idx, pt)"
                :class="[
                  'p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left relative overflow-hidden',
                  selectedTimelineIndex === idx
                    ? 'ring-2 ring-cyan-400 border-cyan-300 bg-cyan-950/60 shadow-lg scale-[1.02]'
                    : pt.precipitationMmPerHour >= 20
                    ? 'bg-rose-950/30 border-rose-500/50 hover:border-rose-400'
                    : pt.precipitationMmPerHour >= 10
                    ? 'bg-amber-950/30 border-amber-500/50 hover:border-amber-400'
                    : pt.precipitationMmPerHour > 0
                    ? 'bg-sky-950/30 border-sky-500/40 hover:border-sky-300'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                ]"
              >
                <!-- Top Indicator Badge -->
                <div class="flex items-center justify-between text-[10px] mb-1">
                  <span class="font-mono font-bold text-slate-200">
                    {{ pt.timeOffsetMinutes === 0 ? '09:00 (实况)' : `+${pt.timeOffsetMinutes}m` }}
                  </span>
                  <span
                    :class="[
                      'w-2 h-2 rounded-full',
                      pt.precipitationMmPerHour >= 20
                        ? 'bg-rose-500 animate-ping'
                        : pt.precipitationMmPerHour >= 10
                        ? 'bg-amber-400'
                        : pt.precipitationMmPerHour > 0
                        ? 'bg-sky-400'
                        : 'bg-emerald-400'
                    ]"
                  />
                </div>

                <!-- Precipitation & Rain Rate -->
                <div class="my-1 space-y-0.5">
                  <div class="text-xs font-bold font-mono" :class="pt.precipitationMmPerHour >= 20 ? 'text-rose-300' : pt.precipitationMmPerHour > 0 ? 'text-sky-300' : 'text-slate-300'">
                    {{ pt.precipitationMmPerHour.toFixed(1) }} <span class="text-[9px] font-normal text-slate-400">mm/h</span>
                  </div>
                  <div class="text-[10px] text-slate-300 truncate font-semibold" :title="pt.conditionText">
                    {{ pt.conditionText }}
                  </div>
                </div>

                <!-- Wind & Temperature footer -->
                <div class="text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                  <span>{{ pt.windSpeed.toFixed(1) }}m/s</span>
                  <span class="text-amber-300">{{ pt.temperature.toFixed(0) }}℃</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Section B: Impact-to-Action Countdown (防灾与自动化设备安全倒计时) -->
          <div class="bg-gradient-to-br from-slate-900 via-rose-950/25 to-slate-900 p-3.5 rounded-xl border border-rose-500/40 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <ShieldAlert class="w-4 h-4 text-rose-400" />
                <h3 class="font-bold text-rose-200 text-xs sm:text-sm">
                  气象灾害影响倒计时与园区防灾联动清单
                </h3>
              </div>
              <button
                @click="mitigateAllRisks"
                class="px-3 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                <Zap class="w-3.5 h-3.5 fill-current" />
                <span>一键全园紧急防灾响应</span>
              </button>
            </div>

            <!-- Action Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <!-- Item 1: Roof Vent Lock -->
              <div class="bg-slate-950/70 p-3 rounded-xl border border-rose-500/30 space-y-1.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-100 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-rose-400" />
                    倒计时 15 分钟 · 温室电动天窗紧急闭锁
                  </span>
                  <span class="px-1.5 py-0.2 text-[9px] rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                    已闭合 8/8 座
                  </span>
                </div>
                <p class="text-[11px] text-slate-300 leading-relaxed">
                  短临预测 30 分钟后降雨强度将突增至 28mm/h。天窗未关将造成雨水直接冲刷番茄花穗并诱发落花灰霉病。
                </p>
                <div class="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 class="w-3 h-3" />
                  已通过气象联动服务自动下发电机闭合指令
                </div>
              </div>

              <!-- Item 2: Shade Curtain Retract -->
              <div class="bg-slate-950/70 p-3 rounded-xl border border-amber-500/30 space-y-1.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-100 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-amber-400" />
                    倒计时 20 分钟 · 外遮阳收拢与内保温布防
                  </span>
                  <span class="px-1.5 py-0.2 text-[9px] rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                    已就绪
                  </span>
                </div>
                <p class="text-[11px] text-slate-300 leading-relaxed">
                  大风阵风预计达 18.2m/s (7级)。收拢外遮阳铝箔拉幕以防止狂风撕裂桁架；展开内反光膜防天沟凝结水冷滴。
                </p>
                <div class="text-[10px] text-amber-300 font-mono flex items-center gap-1">
                  <ShieldCheck class="w-3 h-3" />
                  已切换为强阵风保护阻尼状态
                </div>
              </div>

              <!-- Item 3: Drone Return to Nest -->
              <div class="bg-slate-950/70 p-3 rounded-xl border border-sky-500/30 space-y-1.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-100 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-sky-400" />
                    倒计时 25 分钟 · 植保无人机召回与机巢闭锁
                  </span>
                  <span class="px-1.5 py-0.2 text-[9px] rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 font-mono">
                    已归巢锁定
                  </span>
                </div>
                <p class="text-[11px] text-slate-300 leading-relaxed">
                  空中风切变加大。智慧大田巡检与打药无人机已提前终止外场巡查任务，RTK自动降落智能机巢并盖舱防水。
                </p>
                <div class="text-[10px] text-sky-300 font-mono flex items-center gap-1">
                  <CheckCircle2 class="w-3 h-3" />
                  电驱顶舱已关闭，机载电池进入恒温保养
                </div>
              </div>

              <!-- Item 4: Water Drainage Pump Stations -->
              <div class="bg-slate-950/70 p-3 rounded-xl border border-cyan-500/30 space-y-1.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-100 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-cyan-400" />
                    倒计时 30 分钟 · 外围主排水渠与防汛泵预排
                  </span>
                  <span class="px-1.5 py-0.2 text-[9px] rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                    预排水位 -35cm
                  </span>
                </div>
                <p class="text-[11px] text-slate-300 leading-relaxed">
                  短时雨量预计累积 17.5mm。生态河塘及主排水渠已提前腾空库容，防止降雨顶托致使温室底层苗床反水。
                </p>
                <div class="text-[10px] text-cyan-300 font-mono flex items-center gap-1">
                  <CheckCircle2 class="w-3 h-3" />
                  强排泵站 2# 机组已处在备用水位待命
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- TAB 2: 72-HOUR SHORT-RANGE AGRI-WINDOWS (农事作业黄金窗口) -->
        <!-- ============================================================== -->
        <div v-if="activeTab === 'windows'" class="space-y-4">
          <!-- Summary Banner -->
          <div class="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-cyan-950/50 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 class="font-bold text-emerald-200 text-sm flex items-center gap-2">
                <Calendar class="w-4 h-4 text-emerald-400" />
                基于数值预报的未来 72 小时农事作业红黄绿灯决策
              </h3>
              <p class="text-[11px] text-slate-300 mt-0.5">
                将复杂的气压、辐射、露点、风场计算，转化为大棚技术员与农工看得懂的「作业黄金窗口期」
              </p>
            </div>
            <div class="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold shrink-0">
              明日建议农事综合指数: 98分 (极佳)
            </div>
          </div>

          <!-- The 4 Core Agri-Windows Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="win in agriWindows"
              :key="win.id"
              class="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 space-y-2.5 transition-all shadow-xs"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span
                    :class="[
                      'w-2.5 h-2.5 rounded-full',
                      win.status === 'recommended' ? 'bg-emerald-400' : win.status === 'caution' ? 'bg-amber-400' : 'bg-rose-400'
                    ]"
                  />
                  <h4 class="font-bold text-slate-100 text-xs sm:text-sm">{{ win.title }}</h4>
                </div>
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-[10px] font-bold font-mono',
                    win.status === 'recommended'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  ]"
                >
                  {{ win.badge }}
                </span>
              </div>

              <!-- Optimal & Avoid Windows -->
              <div class="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div class="bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/30">
                  <div class="text-emerald-400 font-bold flex items-center gap-1 mb-0.5">
                    <CheckCircle2 class="w-3 h-3" />
                    <span>黄金适宜窗口:</span>
                  </div>
                  <div class="text-slate-100 font-semibold">{{ win.optimalTime }}</div>
                </div>

                <div class="bg-rose-950/20 p-2 rounded-lg border border-rose-500/30">
                  <div class="text-rose-400 font-bold flex items-center gap-1 mb-0.5">
                    <AlertTriangle class="w-3 h-3" />
                    <span>绝对禁忌时段:</span>
                  </div>
                  <div class="text-slate-200">{{ win.avoidTime }}</div>
                </div>
              </div>

              <!-- Weather Scientific Logic (气象科学依据) -->
              <div class="text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 leading-relaxed">
                <strong class="text-cyan-300">气象依据：</strong> {{ win.weatherReason }}
              </div>

              <!-- Economic / Farming Value -->
              <div class="text-[10px] text-emerald-300/90 font-mono flex items-center gap-1">
                <TrendingUp class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>预期成效: {{ win.economicImpact }}</span>
              </div>
            </div>
          </div>

          <!-- Section B: 3-Day Short-Range Weather Calendar -->
          <div class="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <h4 class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sun class="w-4 h-4 text-amber-400" />
              <span>园区未来 3 天短期气象与农事日历</span>
            </h4>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div
                v-for="day in threeDayForecast"
                :key="day.date"
                :class="[
                  'p-3 rounded-xl border text-xs space-y-1.5',
                  day.level === 'danger'
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : day.level === 'prime'
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-slate-950/50 border-slate-800'
                ]"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-100">{{ day.dayLabel }} ({{ day.date }})</span>
                  <span
                    :class="[
                      'px-1.5 py-0.2 rounded text-[9px] font-mono font-bold',
                      day.level === 'danger'
                        ? 'bg-rose-500/30 text-rose-300'
                        : day.level === 'prime'
                        ? 'bg-emerald-500/30 text-emerald-300'
                        : 'bg-slate-800 text-slate-300'
                    ]"
                  >
                    {{ day.rainMm > 0 ? `降雨 ${day.rainMm}mm` : '无降水' }}
                  </span>
                </div>
                <div class="font-semibold text-slate-200 text-[11px]">{{ day.condition }}</div>
                <div class="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>{{ day.tempRange }}</span>
                  <span>{{ day.wind }}</span>
                </div>
                <div class="text-[10px] text-slate-300 pt-1 border-t border-slate-800/80 leading-relaxed">
                  {{ day.agriSummary }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- TAB 3: CROP DAMAGE & DEFENSE (原有作物受损与防灾结果) -->
        <!-- ============================================================== -->
        <div v-if="activeTab === 'risks'" class="space-y-3">
          <div class="p-3 rounded-xl bg-gradient-to-br from-rose-950/40 via-slate-900/80 to-amber-950/30 border border-rose-500/40 space-y-2 shadow-inner">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span class="font-bold text-rose-300 text-xs sm:text-sm">当前处于：强阵风与暴雨双重防灾期</span>
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
              气象预测显示短时强降雨云系即将在30分钟内笼罩园区。系统已根据气象影响模型自动测算出对各棚可能造成的直接危害：
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
                  <h3 class="font-bold text-slate-100 text-xs sm:text-sm">{{ warning.title }}</h3>
                </div>
                <div class="text-[10px] text-slate-400 font-mono">
                  预计到达时间: 未来 {{ warning.forecastLeadMinutes }} 分钟内到达大棚全域
                </div>
              </div>

              <button
                v-if="warning.impactedGreenhouses.length"
                @click="$emit('focusGreenhouse', warning.impactedGreenhouses[0])"
                class="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-200 transition-colors cursor-pointer px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30"
              >
                <Eye class="w-3 h-3" /> 定位大棚
              </button>
            </div>

            <!-- Impact Result -->
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

        <!-- ============================================================== -->
        <!-- TAB 4: 8-GREENHOUSE IMPACT MATRIX (各棚耐灾矩阵) -->
        <!-- ============================================================== -->
        <div v-if="activeTab === 'matrix'" class="space-y-3">
          <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300">
            针对 8 座不同温室结构与不同作物品种的定制化气象耐受与防御方案：
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div
              v-for="item in greenhouseMatrix"
              :key="item.ghId"
              class="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5 hover:border-slate-700 transition-colors"
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
                  <Eye class="w-3 h-3" /> 定位
                </button>
              </div>

              <div class="text-[10px] text-rose-200/90 bg-rose-950/20 px-2 py-1 rounded border border-rose-500/20">
                <strong>潜在后果:</strong> {{ item.impactResult }}
              </div>

              <div class="text-[10px] text-slate-400 flex items-center gap-1">
                <strong class="text-emerald-400">防御举措:</strong> {{ item.measure }}
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- TAB 5: WORKER CHECKLIST (现场巡检清单) -->
        <!-- ============================================================== -->
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
      </div>
    </div>
  </div>
</template>
