<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  X,
  Truck,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Package,
  ShieldCheck,
  Calendar,
} from 'lucide-vue-next';
import {
  logisticsService,
  type LogisticsRecord,
  type LogisticsSummary,
} from '../services/logisticsService';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// Records & Summary
const records = ref<LogisticsRecord[]>(logisticsService.getRecords());
const summary = ref<LogisticsSummary>(logisticsService.getSummary());

const reloadData = () => {
  records.value = logisticsService.getRecords();
  summary.value = logisticsService.getSummary();
};

// Filter states
const activeTab = ref<'all' | 'outbound' | 'inbound' | 'in_transit'>('all');
const searchQuery = ref('');
const selectedCategory = ref('all');

// Form state for creating new record
const showAddModal = ref(false);
const newRecordForm = ref({
  type: 'outbound' as 'outbound' | 'inbound',
  category: '精品果蔬出库',
  itemName: '',
  specification: '',
  sourceOrDestination: '',
  quantity: 100,
  unit: 'kg',
  unitPriceYuan: 20,
  transportPlate: '苏E·87A92 新能源冷藏货车',
  operator: '王建国 (仓管组长)',
  inspector: '张明 (农艺质检员)',
  status: 'in_transit' as 'completed' | 'in_transit' | 'loading' | 'inspecting',
  notes: '',
});

const filteredRecords = computed(() => {
  return records.value.filter((r) => {
    // Tab filter
    if (activeTab.value === 'outbound' && r.type !== 'outbound') return false;
    if (activeTab.value === 'inbound' && r.type !== 'inbound') return false;
    if (activeTab.value === 'in_transit' && r.status !== 'in_transit') return false;

    // Category filter
    if (selectedCategory.value !== 'all' && r.category !== selectedCategory.value) {
      return false;
    }

    // Search query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const matchText = `${r.recordNo} ${r.itemName} ${r.sourceOrDestination} ${r.transportPlate} ${r.operator}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });
});

const handleExportExcel = () => {
  const csvContent = logisticsService.exportToCsv();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `智慧农场_进出货与冷链物流台账_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const handleSaveNewRecord = () => {
  if (!newRecordForm.value.itemName.trim()) {
    alert('请填写货品名称');
    return;
  }

  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const total = Number((newRecordForm.value.quantity * (newRecordForm.value.unitPriceYuan || 0)).toFixed(2));

  logisticsService.addRecord({
    type: newRecordForm.value.type,
    category: newRecordForm.value.category,
    itemName: newRecordForm.value.itemName,
    specification: newRecordForm.value.specification || '标准无土栽培采收规格',
    sourceOrDestination: newRecordForm.value.sourceOrDestination || (newRecordForm.value.type === 'outbound' ? '盒马生鲜冷链仓' : '农资生产总厂'),
    quantity: Number(newRecordForm.value.quantity),
    unit: newRecordForm.value.unit,
    unitPriceYuan: Number(newRecordForm.value.unitPriceYuan),
    totalAmountYuan: total,
    transportPlate: newRecordForm.value.transportPlate,
    operator: newRecordForm.value.operator,
    inspector: newRecordForm.value.inspector,
    status: newRecordForm.value.status,
    timestamp: timeStr,
    notes: newRecordForm.value.notes || '经系统人工快捷核发登记',
  });

  reloadData();
  showAddModal.value = false;

  // Reset form
  newRecordForm.value.itemName = '';
  newRecordForm.value.notes = '';
};
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md"
  >
    <div
      class="relative w-full max-w-6xl max-h-[90vh] bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col text-slate-100 overflow-hidden ring-1 ring-white/10"
    >
      <!-- Modal Header -->
      <div class="px-6 py-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-b border-emerald-500/20 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
            <Truck class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-bold text-white tracking-wide">
                园区果蔬出货与农资进货物流台账
              </h2>
              <span class="px-2 py-0.5 rounded text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                冷链溯源互联
              </span>
            </div>
            <p class="text-xs text-slate-400">
              全域果蔬采收出库销售、冷链配送在途与肥料种苗进货全程留痕
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="handleExportExcel"
            class="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download class="w-3.5 h-3.5" />
            导出 Excel 报表
          </button>
          <button
            @click="showAddModal = true"
            class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow transition-colors cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5" />
            新建进/出货登记
          </button>
          <button
            @click="$emit('close')"
            class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Top Metric Overview Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/40 border-b border-slate-800 text-xs">
        <div class="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ArrowUpRight class="w-5 h-5" />
          </div>
          <div>
            <div class="text-slate-400 text-[11px]">今日果蔬出货总量</div>
            <div class="text-base sm:text-lg font-bold text-white font-mono">
              {{ summary.todayOutboundKg.toLocaleString() }} <span class="text-xs font-normal text-slate-400">kg</span>
            </div>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <span class="text-sm font-bold font-mono">¥</span>
          </div>
          <div>
            <div class="text-slate-400 text-[11px]">今日出库销售货值</div>
            <div class="text-base sm:text-lg font-bold text-amber-300 font-mono">
              ¥{{ summary.todayOutboundAmountYuan.toLocaleString() }}
            </div>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/30 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <ArrowDownLeft class="w-5 h-5" />
          </div>
          <div>
            <div class="text-slate-400 text-[11px]">今日农资进库到货</div>
            <div class="text-base sm:text-lg font-bold text-cyan-300 font-mono">
              {{ summary.todayInboundBatches }} <span class="text-xs font-normal text-slate-400">批次 ({{ summary.todayInboundTons }} 吨)</span>
            </div>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-slate-900/80 border border-purple-500/30 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Truck class="w-5 h-5" />
          </div>
          <div>
            <div class="text-slate-400 text-[11px]">智能冷链在途车辆</div>
            <div class="text-base sm:text-lg font-bold text-purple-300 font-mono">
              {{ summary.inTransitVehicles }} <span class="text-xs font-normal text-slate-400">辆冷藏货车</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <!-- Tabs -->
        <div class="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            @click="activeTab = 'all'"
            :class="[
              'px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer',
              activeTab === 'all' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            全部单据 ({{ records.length }})
          </button>
          <button
            @click="activeTab = 'outbound'"
            :class="[
              'px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1',
              activeTab === 'outbound' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            <ArrowUpRight class="w-3.5 h-3.5" />
            出货销售
          </button>
          <button
            @click="activeTab = 'inbound'"
            :class="[
              'px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1',
              activeTab === 'inbound' ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            <ArrowDownLeft class="w-3.5 h-3.5" />
            农资进货
          </button>
          <button
            @click="activeTab = 'in_transit'"
            :class="[
              'px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1',
              activeTab === 'in_transit' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            <Truck class="w-3.5 h-3.5" />
            冷链在途
          </button>
        </div>

        <!-- Search Bar -->
        <div class="flex items-center gap-2 flex-1 sm:max-w-xs">
          <div class="relative w-full">
            <Search class="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索货品名、车牌、单号或渠道..."
              class="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>
        </div>
      </div>

      <!-- Main Ledger Table -->
      <div class="flex-1 overflow-y-auto p-4">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-slate-800 text-slate-400 font-medium">
              <th class="py-2.5 px-3">单据号 / 时间</th>
              <th class="py-2.5 px-3">类型 / 品类</th>
              <th class="py-2.5 px-3">货品品名与规格</th>
              <th class="py-2.5 px-3">收货去向 / 采购来源</th>
              <th class="py-2.5 px-3 text-right">出/入库数量</th>
              <th class="py-2.5 px-3 text-right">货值金额</th>
              <th class="py-2.5 px-3">运输车牌 / 司机</th>
              <th class="py-2.5 px-3 text-center">状态</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr
              v-for="record in filteredRecords"
              :key="record.id"
              class="hover:bg-slate-800/40 transition-colors group"
            >
              <!-- Order No & Time -->
              <td class="py-3 px-3">
                <div class="font-mono font-semibold text-slate-200">{{ record.recordNo }}</div>
                <div class="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Calendar class="w-3 h-3 text-slate-500" />
                  {{ record.timestamp }}
                </div>
              </td>

              <!-- Type & Category -->
              <td class="py-3 px-3">
                <div class="flex items-center gap-1.5">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1',
                      record.type === 'outbound'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    ]"
                  >
                    <ArrowUpRight v-if="record.type === 'outbound'" class="w-3 h-3" />
                    <ArrowDownLeft v-else class="w-3 h-3" />
                    {{ record.type === 'outbound' ? '出货' : '进货' }}
                  </span>
                </div>
                <div class="text-[10px] text-slate-400 mt-1">{{ record.category }}</div>
              </td>

              <!-- Item Name & Spec -->
              <td class="py-3 px-3 max-w-[220px]">
                <div class="font-semibold text-slate-100 truncate" :title="record.itemName">
                  {{ record.itemName }}
                </div>
                <div class="text-[10px] text-slate-400 truncate" :title="record.specification">
                  {{ record.specification }}
                </div>
                <div v-if="record.notes" class="text-[9px] text-slate-500 truncate mt-0.5" :title="record.notes">
                  说明: {{ record.notes }}
                </div>
              </td>

              <!-- Source / Destination -->
              <td class="py-3 px-3 max-w-[200px]">
                <div class="text-slate-200 truncate" :title="record.sourceOrDestination">
                  {{ record.sourceOrDestination }}
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">
                  质检: {{ record.inspector }}
                </div>
              </td>

              <!-- Quantity -->
              <td class="py-3 px-3 text-right">
                <div class="font-mono font-bold text-slate-100">
                  {{ record.quantity.toLocaleString() }}
                  <span class="text-[11px] font-normal text-slate-400">{{ record.unit }}</span>
                </div>
                <div v-if="record.unitPriceYuan" class="text-[10px] text-slate-500 font-mono">
                  @ ¥{{ record.unitPriceYuan }}/{{ record.unit }}
                </div>
              </td>

              <!-- Total Amount -->
              <td class="py-3 px-3 text-right">
                <div class="font-mono font-bold text-amber-300">
                  ¥{{ record.totalAmountYuan.toLocaleString() }}
                </div>
              </td>

              <!-- Vehicle & Operator -->
              <td class="py-3 px-3">
                <div class="font-mono text-slate-200 text-[11px] flex items-center gap-1">
                  <Truck class="w-3 h-3 text-slate-400" />
                  {{ record.transportPlate }}
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">
                  经手: {{ record.operator }}
                </div>
              </td>

              <!-- Status -->
              <td class="py-3 px-3 text-center">
                <span
                  :class="[
                    'px-2 py-0.5 rounded-full text-[10px] font-medium inline-flex items-center gap-1',
                    record.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : record.status === 'in_transit'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse'
                      : record.status === 'loading'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  ]"
                >
                  <CheckCircle2 v-if="record.status === 'completed'" class="w-3 h-3" />
                  <Truck v-else-if="record.status === 'in_transit'" class="w-3 h-3" />
                  <Clock v-else class="w-3 h-3" />
                  {{
                    record.status === 'completed'
                      ? '已完成'
                      : record.status === 'in_transit'
                      ? '冷链在途'
                      : record.status === 'loading'
                      ? '装运中'
                      : '待审核'
                  }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredRecords.length === 0" class="py-12 text-center text-slate-400 space-y-2">
          <Package class="w-8 h-8 mx-auto text-slate-600" />
          <div>暂无符合筛选条件的进出货记录</div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          当前显示 <strong>{{ filteredRecords.length }}</strong> 笔记录 · 数据与冷链分选中心实时同步
        </div>
        <button
          @click="$emit('close')"
          class="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
        >
          关闭窗口
        </button>
      </div>
    </div>

    <!-- Quick Add Record Sub-Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div class="w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl space-y-4 text-xs text-slate-200">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="font-bold text-sm text-white flex items-center gap-2">
            <Plus class="w-4 h-4 text-emerald-400" /> 新增进/出货台账登记
          </div>
          <button @click="showAddModal = false" class="text-slate-400 hover:text-white cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-400 mb-1">单据类型</label>
            <select
              v-model="newRecordForm.type"
              class="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs"
            >
              <option value="outbound">出货 (采收果蔬/水产销售)</option>
              <option value="inbound">进货 (肥料/饲料/基质采购)</option>
            </select>
          </div>

          <div>
            <label class="block text-slate-400 mb-1">品类分类</label>
            <select
              v-model="newRecordForm.category"
              class="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs"
            >
              <option value="精品果蔬出库">精品果蔬出库</option>
              <option value="生态水产出货">生态水产出货</option>
              <option value="高效水溶肥">高效水溶肥</option>
              <option value="优质水产饲料">优质水产饲料</option>
              <option value="无土基质">无土基质</option>
              <option value="包装冷链材料">包装冷链材料</option>
              <option value="生物防治天敌">生物防治天敌</option>
            </select>
          </div>

          <div class="col-span-2">
            <label class="block text-slate-400 mb-1">货品名称与品级</label>
            <input
              v-model="newRecordForm.itemName"
              type="text"
              placeholder="例如：1#棚 精品普罗旺斯高糖番茄 / 荷兰水溶肥"
              class="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs"
            />
          </div>

          <div>
            <label class="block text-slate-400 mb-1">数量</label>
            <input
              v-model.number="newRecordForm.quantity"
              type="number"
              class="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono"
            />
          </div>

          <div>
            <label class="block text-slate-400 mb-1">计量单位</label>
            <select
              v-model="newRecordForm.unit"
              class="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs"
            >
              <option value="kg">kg (公斤)</option>
              <option value="吨">吨</option>
              <option value="箱">箱</option>
              <option value="袋">袋</option>
              <option value="套">套</option>
            </select>
          </div>

          <div>
            <label class="block text-slate-400 mb-1">单价 (元)</label>
            <input
              v-model.number="newRecordForm.unitPriceYuan"
              type="number"
              class="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono"
            />
          </div>

          <div>
            <label class="block text-slate-400 mb-1">运输车牌 / 工具</label>
            <input
              v-model="newRecordForm.transportPlate"
              type="text"
              placeholder="例如：苏E·87A92 冷藏货车"
              class="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs"
            />
          </div>

          <div class="col-span-2">
            <label class="block text-slate-400 mb-1">收货目的地 / 采购供应商</label>
            <input
              v-model="newRecordForm.sourceOrDestination"
              type="text"
              placeholder="例如：盒马鲜生华东冷链仓 / 荷兰易普润公司"
              class="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs"
            />
          </div>

          <div class="col-span-2">
            <label class="block text-slate-400 mb-1">备注说明</label>
            <input
              v-model="newRecordForm.notes"
              type="text"
              placeholder="例如：带绿色食品有机溯源码，全程10-12℃冷链"
              class="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            @click="showAddModal = false"
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            取消
          </button>
          <button
            @click="handleSaveNewRecord"
            class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold shadow cursor-pointer"
          >
            保存并入账
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
