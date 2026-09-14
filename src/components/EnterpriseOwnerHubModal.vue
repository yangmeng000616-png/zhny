<script setup lang="ts">
import { ref, computed } from 'vue';
import type {
  PondFeedingRecord,
  EnvironmentalHistoryLog,
  FarmingRecord,
  FarmEnergyRecord,
  FarmInventoryItem,
  FarmLaborRecord,
  FarmHarvestSalesRecord,
  PestMonitoringRecord,
} from '../types/digitalTwin';
import {
  exportMasterEnterpriseReportCsv,
  exportPestMonitoringCsv,
  exportFishPondFeedingCsv,
  exportEnvironmentalHistoryCsv,
  exportFarmingRecordsCsv,
  exportFarmEnergyCsv,
  exportFarmInventoryCsv,
  exportFarmLaborCsv,
  exportFarmHarvestSalesCsv,
} from '../utils/excelExport';
import {
  Briefcase,
  FileSpreadsheet,
  Download,
  X,
  Bug,
  Waves,
  Thermometer,
  Zap,
  Package,
  Users,
  DollarSign,
  Sprout,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Truck,
} from 'lucide-vue-next';

const props = defineProps<{
  pestRecords: PestMonitoringRecord[];
  feedingRecords: PondFeedingRecord[];
  historyLogs: EnvironmentalHistoryLog[];
  farmingRecords: FarmingRecord[];
  energyRecords: FarmEnergyRecord[];
  inventoryItems: FarmInventoryItem[];
  laborRecords: FarmLaborRecord[];
  salesRecords: FarmHarvestSalesRecord[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'openPestModal'): void;
  (e: 'openFeedingModal'): void;
  (e: 'openTempModal'): void;
  (e: 'openFarmingModal'): void;
  (e: 'openLogisticsModal'): void;
}>();

const activeTab = ref<'summary' | 'energy' | 'inventory' | 'labor' | 'sales'>('summary');

// High level summary metrics
const totalSalesRevenue = computed(() => {
  return props.salesRecords.reduce((sum, s) => sum + s.totalRevenueYuan, 0);
});

const totalInventoryValue = computed(() => {
  return props.inventoryItems.reduce((sum, item) => sum + item.currentStock * item.unitCostYuan, 0);
});

const lowStockCount = computed(() => {
  return props.inventoryItems.filter((item) => item.currentStock <= item.safetyStock).length;
});

const totalCleanEnergyRatio = computed(() => {
  const totalSolar = props.energyRecords.reduce((sum, e) => sum + e.solarGreenElectricityKwh, 0);
  const totalGrid = props.energyRecords.reduce((sum, e) => sum + e.gridElectricityKwh, 0);
  const total = totalSolar + totalGrid;
  if (total === 0) return '0%';
  return `${((totalSolar / total) * 100).toFixed(1)}%`;
});

// Master Export
const handleMasterExport = () => {
  exportMasterEnterpriseReportCsv({
    feedingRecords: props.feedingRecords,
    farmingRecords: props.farmingRecords,
    historyLogs: props.historyLogs,
    energyRecords: props.energyRecords,
    salesRecords: props.salesRecords,
    pestRecords: props.pestRecords,
  });
};
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
    <div
      id="enterprise-owner-hub-modal"
      class="w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden text-slate-100"
    >
      <!-- Modal Header -->
      <header class="px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 border-b border-emerald-500/30 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Briefcase class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-bold text-white tracking-wide">
                现代农业园区负责人生产经营综合管理决策中枢
              </h2>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                老板决策视窗 · 全业务台账 · Excel汇总导出
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              不仅记录水肥与温度，更涵盖：智能虫情测报 · 鱼塘投喂水质 · 能源能耗双碳 · 农资库存预警 · 农工派工工时 · 订单销售营收
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Master Excel Export Button -->
          <button
            id="btn-master-export-excel"
            @click="handleMasterExport"
            class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-700/30 cursor-pointer"
            title="一键导出包含全部门生产经营台账的综合决策报表 (Excel CSV)"
          >
            <Download class="w-4 h-4" />
            <span>🌟 一键导出综合决策总报表</span>
          </button>

          <button
            @click="$emit('close')"
            class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </header>

      <!-- Sub Navigation Tabs -->
      <nav class="px-5 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-xs overflow-x-auto shrink-0">
        <div class="flex items-center gap-1">
          <button
            @click="activeTab = 'summary'"
            :class="[
              'px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'summary' ? 'bg-emerald-500 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            ]"
          >
            <Briefcase class="w-3.5 h-3.5" />
            <span>核心经营大盘</span>
          </button>

          <button
            @click="activeTab = 'sales'"
            :class="[
              'px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'sales' ? 'bg-emerald-500 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            ]"
          >
            <DollarSign class="w-3.5 h-3.5" />
            <span>采收出库与销售营收</span>
          </button>

          <button
            @click="activeTab = 'energy'"
            :class="[
              'px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'energy' ? 'bg-emerald-500 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            ]"
          >
            <Zap class="w-3.5 h-3.5" />
            <span>能源水电与双碳减排</span>
          </button>

          <button
            @click="activeTab = 'inventory'"
            :class="[
              'px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'inventory' ? 'bg-emerald-500 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            ]"
          >
            <Package class="w-3.5 h-3.5" />
            <span>农资与物料库存</span>
          </button>

          <button
            @click="activeTab = 'labor'"
            :class="[
              'px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'labor' ? 'bg-emerald-500 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            ]"
          >
            <Users class="w-3.5 h-3.5" />
            <span>农工派工与工时考核</span>
          </button>
        </div>

        <div class="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>园区生产运行健康度 99.4%</span>
        </div>
      </nav>

      <!-- Tab Content Area (Scrollable) -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        <!-- 1. SUMMARY TAB -->
        <div v-if="activeTab === 'summary'" class="space-y-4">
          <!-- 6 Key Direct Action Cards to Core Business Modules -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <!-- Card 1: 虫情测报与诱虫灯 -->
            <div class="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex flex-col justify-between group">
              <div>
                <div class="flex items-center justify-between">
                  <div class="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Bug class="w-5 h-5" />
                  </div>
                  <span class="text-[11px] font-mono text-emerald-400 font-semibold">9台诱虫灯在线</span>
                </div>
                <h4 class="text-sm font-bold text-slate-100 mt-2.5">智能诱虫灯与虫情测报看板</h4>
                <p class="text-xs text-slate-400 mt-1">
                  支持录入诱虫灯捕获数据，查看全光谱杀虫灯捕获走势、靶标害虫周度趋势与绿色天敌防控。
                </p>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  @click="$emit('openPestModal')"
                  class="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  打开虫情看板 &rarr;
                </button>
                <button
                  @click="exportPestMonitoringCsv(pestRecords)"
                  class="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  title="导出Excel"
                >
                  <FileSpreadsheet class="w-3.5 h-3.5" /> 导出Excel
                </button>
              </div>
            </div>

            <!-- Card 2: 鱼塘喂食台账 -->
            <div class="p-4 rounded-xl bg-slate-950/70 border border-cyan-500/30 hover:border-cyan-500/60 transition-all flex flex-col justify-between group">
              <div>
                <div class="flex items-center justify-between">
                  <div class="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Waves class="w-5 h-5" />
                  </div>
                  <span class="text-[11px] font-mono text-cyan-300 font-semibold">每次投喂详实记录</span>
                </div>
                <h4 class="text-sm font-bold text-slate-100 mt-2.5">生态鱼塘喂食与水质健康台账</h4>
                <p class="text-xs text-slate-400 mt-1">
                  严把投喂量、饲料配方、鱼群摄食活力、水温、溶氧DO、氨氮指标，杜绝富营养化与残饵。
                </p>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  @click="$emit('openFeedingModal')"
                  class="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  打开鱼塘台账 &rarr;
                </button>
                <button
                  @click="exportFishPondFeedingCsv(feedingRecords)"
                  class="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  title="导出Excel"
                >
                  <FileSpreadsheet class="w-3.5 h-3.5" /> 导出Excel
                </button>
              </div>
            </div>

            <!-- Card 3: 全区温度微气候历史 -->
            <div class="p-4 rounded-xl bg-slate-950/70 border border-amber-500/30 hover:border-amber-500/60 transition-all flex flex-col justify-between group">
              <div>
                <div class="flex items-center justify-between">
                  <div class="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Thermometer class="w-5 h-5" />
                  </div>
                  <span class="text-[11px] font-mono text-amber-300 font-semibold">8棚+鱼塘+气象+冷链</span>
                </div>
                <h4 class="text-sm font-bold text-slate-100 mt-2.5">全区域温度历史记录与微环境时序</h4>
                <p class="text-xs text-slate-400 mt-1">
                  每个地方的空气温度、根区地温、湿度、CO2、日积温历史回溯，支持逐棚逐时对比与趋势图。
                </p>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  @click="$emit('openTempModal')"
                  class="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  打开温度历史 &rarr;
                </button>
                <button
                  @click="exportEnvironmentalHistoryCsv(historyLogs)"
                  class="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  title="导出Excel"
                >
                  <FileSpreadsheet class="w-3.5 h-3.5" /> 导出Excel
                </button>
              </div>
            </div>

            <!-- Card 4: 水肥药作业台账 -->
            <div class="p-4 rounded-xl bg-slate-950/70 border border-teal-500/30 hover:border-teal-500/60 transition-all flex flex-col justify-between group">
              <div>
                <div class="flex items-center justify-between">
                  <div class="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <Sprout class="w-5 h-5" />
                  </div>
                  <span class="text-[11px] font-mono text-teal-300 font-semibold">全自动EC/pH精准配肥</span>
                </div>
                <h4 class="text-sm font-bold text-slate-100 mt-2.5">8棚水肥药精细化作业台账</h4>
                <p class="text-xs text-slate-400 mt-1">
                  涵盖浇水注水量、精准施肥配方、生物农药喷洒规程与8座温室当前种植全周期管控。
                </p>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  @click="$emit('openFarmingModal')"
                  class="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
                >
                  打开水肥药台账 &rarr;
                </button>
                <button
                  @click="exportFarmingRecordsCsv(farmingRecords)"
                  class="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  title="导出Excel"
                >
                  <FileSpreadsheet class="w-3.5 h-3.5" /> 导出Excel
                </button>
              </div>
            </div>

            <!-- Card 5: 农资库存预警 -->
            <div class="p-4 rounded-xl bg-slate-950/70 border border-indigo-500/30 hover:border-indigo-500/60 transition-all flex flex-col justify-between group">
              <div>
                <div class="flex items-center justify-between">
                  <div class="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Package class="w-5 h-5" />
                  </div>
                  <span class="text-[11px] font-mono text-indigo-300 font-semibold">库存总值 ¥{{ totalInventoryValue.toLocaleString() }}</span>
                </div>
                <h4 class="text-sm font-bold text-slate-100 mt-2.5">农资肥料/农药/饲料/基质库存</h4>
                <p class="text-xs text-slate-400 mt-1">
                  实时监控特种水溶肥、生物制剂、授粉熊蜂箱、水产鱼料现存量及安全预警红线，防生产断供。
                </p>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  @click="activeTab = 'inventory'"
                  class="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  查看库存明细 &rarr;
                </button>
                <button
                  @click="exportFarmInventoryCsv(inventoryItems)"
                  class="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  title="导出Excel"
                >
                  <FileSpreadsheet class="w-3.5 h-3.5" /> 导出Excel
                </button>
              </div>
            </div>

            <!-- Card 6: 订单销售营收 -->
            <div class="p-4 rounded-xl bg-slate-950/70 border border-rose-500/30 hover:border-rose-500/60 transition-all flex flex-col justify-between group">
              <div>
                <div class="flex items-center justify-between">
                  <div class="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <DollarSign class="w-5 h-5" />
                  </div>
                  <span class="text-[11px] font-mono text-rose-300 font-semibold">近期销售 ¥{{ totalSalesRevenue.toLocaleString() }}</span>
                </div>
                <h4 class="text-sm font-bold text-slate-100 mt-2.5">采收出库与订单销售渠道营收</h4>
                <p class="text-xs text-slate-400 mt-1">
                  直供盒马鲜生、山姆会员店、高端社区生鲜；批次一物一码追溯防伪与财务对账结算。
                </p>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  @click="activeTab = 'sales'"
                  class="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  查看营收订单 &rarr;
                </button>
                <button
                  @click="exportFarmHarvestSalesCsv(salesRecords)"
                  class="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  title="导出Excel"
                >
                  <FileSpreadsheet class="w-3.5 h-3.5" /> 导出Excel
                </button>
              </div>
            </div>

            <!-- Card 7: 果蔬出货与农资进货物流台账 -->
            <div class="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex flex-col justify-between group md:col-span-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <Truck class="w-5 h-5" />
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h4 class="text-sm font-bold text-slate-100">园区果蔬出货与农资进货物流台账 (冷链互联)</h4>
                      <span class="px-2 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                        冷链在途追踪
                      </span>
                    </div>
                    <p class="text-xs text-slate-400 mt-1 max-w-2xl">
                      果蔬采收出库至盒马/山姆冷链配送、新能源货车车牌在途跟踪、肥料基质农资入库详实留痕，支持单据新增登记与 Excel / CSV 报表实时导出。
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <button
                    @click="$emit('openLogisticsModal')"
                    class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-colors cursor-pointer"
                  >
                    <Truck class="w-3.5 h-3.5" /> 打开出入库物流台账
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. SALES TAB -->
        <div v-if="activeTab === 'sales'" class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-200">果蔬采收出库与订单客户销售台账</h3>
            <button
              @click="exportFarmHarvestSalesCsv(salesRecords)"
              class="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
            >
              <FileSpreadsheet class="w-3.5 h-3.5" /> 导出销售台账Excel
            </button>
          </div>

          <div class="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/70">
            <table class="w-full text-left text-xs font-mono">
              <thead class="bg-slate-900 text-slate-400 font-sans border-b border-slate-800">
                <tr>
                  <th class="py-2.5 px-3">采收日期</th>
                  <th class="py-2.5 px-3">产品批次号</th>
                  <th class="py-2.5 px-3">作物名称</th>
                  <th class="py-2.5 px-3">产出大棚</th>
                  <th class="py-2.5 px-3">产品品级</th>
                  <th class="py-2.5 px-3">出库重量(kg)</th>
                  <th class="py-2.5 px-3">客户销售渠道</th>
                  <th class="py-2.5 px-3">结算单价(元/kg)</th>
                  <th class="py-2.5 px-3">销售金额(元)</th>
                  <th class="py-2.5 px-3">食品安全溯源码</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                <tr v-for="s in salesRecords" :key="s.id" class="hover:bg-slate-800/40">
                  <td class="py-2.5 px-3 text-slate-300">{{ s.harvestDate }}</td>
                  <td class="py-2.5 px-3 text-slate-400">{{ s.batchNo }}</td>
                  <td class="py-2.5 px-3 text-slate-100 font-sans font-medium">{{ s.cropName }}</td>
                  <td class="py-2.5 px-3 text-slate-300 font-sans">{{ s.greenhouseName }}</td>
                  <td class="py-2.5 px-3 text-emerald-400 font-sans">{{ s.grade }}</td>
                  <td class="py-2.5 px-3 text-slate-200 font-bold">{{ s.weightKg }} kg</td>
                  <td class="py-2.5 px-3 text-cyan-300 font-sans">{{ s.buyerChannel }}</td>
                  <td class="py-2.5 px-3 text-slate-300">¥ {{ s.unitPriceYuan }}</td>
                  <td class="py-2.5 px-3 text-amber-400 font-bold">¥ {{ s.totalRevenueYuan.toLocaleString() }}</td>
                  <td class="py-2.5 px-3 text-slate-400 text-[10px]">{{ s.traceabilityCode }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. ENERGY TAB -->
        <div v-if="activeTab === 'energy'" class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-200">园区电水能耗消耗与光伏绿电双碳核算台账</h3>
            <button
              @click="exportFarmEnergyCsv(energyRecords)"
              class="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
            >
              <FileSpreadsheet class="w-3.5 h-3.5" /> 导出能耗台账Excel
            </button>
          </div>

          <div class="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/70">
            <table class="w-full text-left text-xs font-mono">
              <thead class="bg-slate-900 text-slate-400 font-sans border-b border-slate-800">
                <tr>
                  <th class="py-2.5 px-3">核算日期</th>
                  <th class="py-2.5 px-3">区域</th>
                  <th class="py-2.5 px-3">市电消耗(度)</th>
                  <th class="py-2.5 px-3">光伏自发自用绿电(度)</th>
                  <th class="py-2.5 px-3">清洁绿电占比</th>
                  <th class="py-2.5 px-3">农业耗水量(m³)</th>
                  <th class="py-2.5 px-3">碳减排量(kg)</th>
                  <th class="py-2.5 px-3">能耗支出成本(元)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                <tr v-for="e in energyRecords" :key="e.date" class="hover:bg-slate-800/40">
                  <td class="py-2.5 px-3 text-slate-300">{{ e.date }}</td>
                  <td class="py-2.5 px-3 text-slate-400 font-sans">{{ e.locationName }}</td>
                  <td class="py-2.5 px-3 text-amber-400">{{ e.gridElectricityKwh }} kWh</td>
                  <td class="py-2.5 px-3 text-emerald-400 font-bold">{{ e.solarGreenElectricityKwh }} kWh</td>
                  <td class="py-2.5 px-3 text-cyan-300">
                    {{ ((e.solarGreenElectricityKwh / (e.solarGreenElectricityKwh + e.gridElectricityKwh)) * 100).toFixed(1) }}%
                  </td>
                  <td class="py-2.5 px-3 text-blue-300">{{ e.waterUsageM3 }} m³</td>
                  <td class="py-2.5 px-3 text-emerald-300">{{ e.carbonOffsetKg }} kg</td>
                  <td class="py-2.5 px-3 text-slate-200">¥ {{ e.estimatedCostYuan }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 4. INVENTORY TAB -->
        <div v-if="activeTab === 'inventory'" class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-200">全园农资肥料、生物农药、熊蜂、饲料与包材库存</h3>
            <button
              @click="exportFarmInventoryCsv(inventoryItems)"
              class="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
            >
              <FileSpreadsheet class="w-3.5 h-3.5" /> 导出库存台账Excel
            </button>
          </div>

          <div class="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/70">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-900 text-slate-400 font-sans border-b border-slate-800">
                <tr>
                  <th class="py-2.5 px-3">物料类别</th>
                  <th class="py-2.5 px-3">物资品名</th>
                  <th class="py-2.5 px-3">规格型号</th>
                  <th class="py-2.5 px-3 font-mono">当前库存</th>
                  <th class="py-2.5 px-3 font-mono">安全库存红线</th>
                  <th class="py-2.5 px-3 font-mono">单价(元)</th>
                  <th class="py-2.5 px-3 font-mono">库存货值(元)</th>
                  <th class="py-2.5 px-3">供应商渠道</th>
                  <th class="py-2.5 px-3 font-mono">最近入库</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-mono">
                <tr v-for="item in inventoryItems" :key="item.id" class="hover:bg-slate-800/40">
                  <td class="py-2.5 px-3 font-sans">
                    <span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                      {{ item.category }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-slate-100 font-sans font-medium">{{ item.name }}</td>
                  <td class="py-2.5 px-3 text-slate-400 font-sans text-[11px]">{{ item.specification }}</td>
                  <td class="py-2.5 px-3 font-bold text-slate-200">
                    {{ item.currentStock }} {{ item.unit }}
                  </td>
                  <td class="py-2.5 px-3 text-slate-400">{{ item.safetyStock }} {{ item.unit }}</td>
                  <td class="py-2.5 px-3 text-slate-300">¥ {{ item.unitCostYuan }}</td>
                  <td class="py-2.5 px-3 text-amber-400 font-bold">
                    ¥ {{ (item.currentStock * item.unitCostYuan).toLocaleString() }}
                  </td>
                  <td class="py-2.5 px-3 text-slate-300 font-sans text-xs">{{ item.supplier }}</td>
                  <td class="py-2.5 px-3 text-slate-400">{{ item.lastRestockDate }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 5. LABOR TAB -->
        <div v-if="activeTab === 'labor'" class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-200">农工排工、考勤工时与计件绩效考核台账</h3>
            <button
              @click="exportFarmLaborCsv(laborRecords)"
              class="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
            >
              <FileSpreadsheet class="w-3.5 h-3.5" /> 导出工时台账Excel
            </button>
          </div>

          <div class="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/70">
            <table class="w-full text-left text-xs font-mono">
              <thead class="bg-slate-900 text-slate-400 font-sans border-b border-slate-800">
                <tr>
                  <th class="py-2.5 px-3">日期</th>
                  <th class="py-2.5 px-3">农工作业人员</th>
                  <th class="py-2.5 px-3">作业温室/点位</th>
                  <th class="py-2.5 px-3">作业工种</th>
                  <th class="py-2.5 px-3">耗费工时(h)</th>
                  <th class="py-2.5 px-3">完成计件工作量</th>
                  <th class="py-2.5 px-3">品控质检评级</th>
                  <th class="py-2.5 px-3">现场验收负责人</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                <tr v-for="lab in laborRecords" :key="lab.id" class="hover:bg-slate-800/40">
                  <td class="py-2.5 px-3 text-slate-300">{{ lab.date }}</td>
                  <td class="py-2.5 px-3 text-slate-100 font-sans font-medium">{{ lab.workerName }}</td>
                  <td class="py-2.5 px-3 text-slate-300 font-sans">{{ lab.greenhouseName }}</td>
                  <td class="py-2.5 px-3 text-cyan-300 font-sans">{{ lab.taskType }}</td>
                  <td class="py-2.5 px-3 text-slate-200">{{ lab.hoursSpent }} h</td>
                  <td class="py-2.5 px-3 text-emerald-400 font-sans">{{ lab.quantityCompleted }}</td>
                  <td class="py-2.5 px-3 text-amber-400 font-sans font-bold">{{ lab.efficiencyRating }}</td>
                  <td class="py-2.5 px-3 text-slate-400 font-sans">{{ lab.inspector }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          农业农村部设施农业现代化示范园区标准 · 数字赋能降本增效 · 一企一码全程留痕
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="handleMasterExport"
            class="text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer underline flex items-center gap-1"
          >
            <Download class="w-3.5 h-3.5" /> 导出全部门综合决策大表 (Excel CSV)
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
