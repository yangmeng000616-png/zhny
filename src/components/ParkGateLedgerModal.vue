<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  X,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Truck,
  Car,
  Clock,
  Plus,
  Trash2,
  Check,
  Search,
  FileSpreadsheet,
  Settings,
  Power,
  ArrowUpRight,
  ArrowDownLeft,
  Camera,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Lock,
  Unlock,
  Package,
  Download,
  ExternalLink,
  Boxes,
} from 'lucide-vue-next';
import type { VehicleAccessRecord, PreRegisteredPlate, GateControlStatus } from '../types/gate';
import { gateService } from '../services/gateService';
import {
  logisticsService,
  type LogisticsRecord,
  type LogisticsSummary,
} from '../services/logisticsService';

const props = defineProps<{
  visible: boolean;
  barrierRaised: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'toggleBarrier', open: boolean): void;
  (e: 'openVehicleDetails', plateNumber: string): void;
  (e: 'openLogisticsLedger'): void;
}>();

const activeTab = ref<'records' | 'whitelist' | 'gateControl' | 'addRecord' | 'logistics'>('records');

// Records & Whitelist States from service
const records = ref<VehicleAccessRecord[]>(gateService.getRecords());
const plates = ref<PreRegisteredPlate[]>(gateService.getPlates());
const gateStatus = ref<GateControlStatus>(gateService.getGateStatus());

// Logistics Ledger States
const logisticsRecords = ref<LogisticsRecord[]>(logisticsService.getRecords());
const logisticsSummary = ref<LogisticsSummary>(logisticsService.getSummary());
const logisticsTab = ref<'all' | 'outbound' | 'inbound' | 'in_transit'>('all');
const logisticsSearch = ref('');
const logisticsCategory = ref('all');
const showAddLogisticsModal = ref(false);

const newLogisticsForm = ref({
  type: 'outbound' as 'outbound' | 'inbound',
  category: '精品果蔬出库',
  itemName: '',
  specification: '',
  sourceOrDestination: '',
  quantity: 500,
  unit: 'kg',
  unitPriceYuan: 24,
  transportPlate: '苏E·A886F 新能源冷藏货车',
  operator: '陈志强 (冷链司机)',
  inspector: '张明 (农艺质检员)',
  status: 'in_transit' as LogisticsRecord['status'],
  notes: '',
});

// Filters
const searchKeyword = ref('');
const selectedDirection = ref<'all' | 'in' | 'out'>('all');
const selectedCategory = ref<string>('all');

// New Whitelist Plate Form
const newPlate = ref({
  plateNumber: '',
  plateColor: 'green' as PreRegisteredPlate['plateColor'],
  vehicleCategory: 'reefer' as PreRegisteredPlate['vehicleCategory'],
  driverName: '',
  driverPhone: '',
  company: '',
  defaultMission: '',
  authorizedUntil: '长期有效',
  autoPass: true,
  notes: '',
});

// Manual Vehicle Entry Record Form
const newRecordForm = ref({
  plateNumber: '',
  plateColor: 'blue' as VehicleAccessRecord['plateColor'],
  vehicleCategory: 'visitor' as VehicleAccessRecord['vehicleCategory'],
  vehicleModel: '商务客车 / 轿车',
  driverName: '',
  driverPhone: '',
  company: '',
  direction: 'in' as 'in' | 'out',
  mission: '',
  targetArea: '1#玻璃连栋温室 / 中控大厅',
  clearanceType: 'manual_guard' as VehicleAccessRecord['clearanceType'],
  cargoDescription: '',
  cargoWeightKg: 0,
  notes: '',
});

// Filtered Records
const filteredRecords = computed(() => {
  return records.value.filter((r) => {
    if (selectedDirection.value !== 'all' && r.direction !== selectedDirection.value) {
      return false;
    }
    if (selectedCategory.value !== 'all' && r.vehicleCategory !== selectedCategory.value) {
      return false;
    }
    if (searchKeyword.value.trim()) {
      const q = searchKeyword.value.trim().toLowerCase();
      const matchPlate = r.plateNumber.toLowerCase().includes(q);
      const matchMission = r.mission.toLowerCase().includes(q);
      const matchDriver = r.driverName.toLowerCase().includes(q);
      const matchCompany = r.company.toLowerCase().includes(q);
      const matchTarget = r.targetArea.toLowerCase().includes(q);
      return matchPlate || matchMission || matchDriver || matchCompany || matchTarget;
    }
    return true;
  });
});

// Barrier Switch Trigger
const handleToggleBarrier = (targetOpen: boolean) => {
  emit('toggleBarrier', targetOpen);
  gateService.setBarrierState(targetOpen ? 'raised' : 'lowered');
};

// Mode switch
const handleSetGateMode = (mode: GateControlStatus['mode']) => {
  gateService.setGateMode(mode);
  gateStatus.value = { ...gateService.getGateStatus() };
  if (mode === 'always_open') {
    handleToggleBarrier(true);
  } else if (mode === 'locked') {
    handleToggleBarrier(false);
  }
};

// Toggle Whitelist auto pass
const handleToggleAutoPass = (id: string) => {
  gateService.togglePlateAutoPass(id);
  plates.value = [...gateService.getPlates()];
};

// Remove Whitelist plate
const handleRemovePlate = (id: string) => {
  gateService.removePlate(id);
  plates.value = [...gateService.getPlates()];
};

// Submit New Pre-registered Plate
const handleSaveNewPlate = () => {
  if (!newPlate.value.plateNumber.trim()) {
    alert('请输入车牌号码');
    return;
  }
  gateService.addPlate({
    plateNumber: newPlate.value.plateNumber.trim().toUpperCase(),
    plateColor: newPlate.value.plateColor,
    vehicleCategory: newPlate.value.vehicleCategory,
    driverName: newPlate.value.driverName.trim() || '未指定',
    driverPhone: newPlate.value.driverPhone.trim() || '—',
    company: newPlate.value.company.trim() || '合作单位',
    defaultMission: newPlate.value.defaultMission.trim() || '农产品采收转运/农资运输',
    authorizedUntil: newPlate.value.authorizedUntil || '长期有效',
    autoPass: newPlate.value.autoPass,
    notes: newPlate.value.notes.trim() || '预录入车辆',
  });

  plates.value = [...gateService.getPlates()];
  // Reset
  newPlate.value = {
    plateNumber: '',
    plateColor: 'green',
    vehicleCategory: 'reefer',
    driverName: '',
    driverPhone: '',
    company: '',
    defaultMission: '',
    authorizedUntil: '长期有效',
    autoPass: true,
    notes: '',
  };
  activeTab.value = 'whitelist';
};

// Submit Manual Access Record
const handleSaveNewRecord = () => {
  if (!newRecordForm.value.plateNumber.trim() || !newRecordForm.value.mission.trim()) {
    alert('请填写车牌号码与进园任务');
    return;
  }

  // Check if plate is already whitelisted
  const check = gateService.checkPlateWhitelist(newRecordForm.value.plateNumber);
  const clearanceType = check.isWhitelisted ? 'auto_whitelist' : newRecordForm.value.clearanceType;

  gateService.addRecord({
    plateNumber: newRecordForm.value.plateNumber.trim().toUpperCase(),
    plateColor: newRecordForm.value.plateColor,
    vehicleCategory: newRecordForm.value.vehicleCategory,
    vehicleModel: newRecordForm.value.vehicleModel,
    driverName: newRecordForm.value.driverName.trim() || '临时访客',
    driverPhone: newRecordForm.value.driverPhone.trim() || '—',
    company: newRecordForm.value.company.trim() || '外来往来单位',
    direction: newRecordForm.value.direction,
    mission: newRecordForm.value.mission.trim(),
    targetArea: newRecordForm.value.targetArea,
    clearanceType,
    status: newRecordForm.value.direction === 'in' ? 'in_park' : 'completed',
    cargoDescription: newRecordForm.value.cargoDescription,
    cargoWeightKg: newRecordForm.value.cargoWeightKg || undefined,
    notes: newRecordForm.value.notes || (check.isWhitelisted ? '匹配白名单自动放行' : '门卫人工核准放行'),
  });

  // If cargo is described, synchronize with Logistics Ledger
  if (newRecordForm.value.cargoDescription && newRecordForm.value.cargoDescription.trim()) {
    logisticsService.addRecord({
      type: newRecordForm.value.direction === 'out' ? 'outbound' : 'inbound',
      category: newRecordForm.value.direction === 'out' ? '精品果蔬出库' : '高效水溶肥',
      itemName: newRecordForm.value.cargoDescription.trim(),
      specification: '大门放行整车转运',
      sourceOrDestination: newRecordForm.value.targetArea || '园区物流冷链中心',
      quantity: newRecordForm.value.cargoWeightKg || 600,
      unit: 'kg',
      unitPriceYuan: 20,
      totalAmountYuan: (newRecordForm.value.cargoWeightKg || 600) * 20,
      transportPlate: newRecordForm.value.plateNumber,
      operator: newRecordForm.value.driverName || '现场司机',
      inspector: '闸口质检岗',
      status: newRecordForm.value.direction === 'out' ? 'in_transit' : 'completed',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      notes: `由大门出入道闸现场核验登记。承运任务: ${newRecordForm.value.mission}`,
    });
    logisticsRecords.value = [...logisticsService.getRecords()];
    logisticsSummary.value = logisticsService.getSummary();
  }

  records.value = [...gateService.getRecords()];
  gateStatus.value = { ...gateService.getGateStatus() };

  // Trigger barrier animation if entering
  if (newRecordForm.value.direction === 'in') {
    handleToggleBarrier(true);
    setTimeout(() => {
      handleToggleBarrier(false);
    }, 4000);
  }

  activeTab.value = 'records';
};

// Filtered Logistics Records
const filteredLogisticsRecords = computed(() => {
  return logisticsRecords.value.filter((r) => {
    if (logisticsTab.value === 'outbound' && r.type !== 'outbound') return false;
    if (logisticsTab.value === 'inbound' && r.type !== 'inbound') return false;
    if (logisticsTab.value === 'in_transit' && r.status !== 'in_transit') return false;

    if (logisticsCategory.value !== 'all' && r.category !== logisticsCategory.value) {
      return false;
    }

    if (logisticsSearch.value.trim()) {
      const q = logisticsSearch.value.toLowerCase().trim();
      const matchText = `${r.recordNo} ${r.itemName} ${r.sourceOrDestination} ${r.transportPlate} ${r.operator}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });
});

const openRelatedLogistics = (plateNumber: string) => {
  activeTab.value = 'logistics';
  logisticsSearch.value = plateNumber;
};

const handleExportLogisticsExcel = () => {
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

const handleSaveLogisticsRecord = () => {
  if (!newLogisticsForm.value.itemName.trim() || !newLogisticsForm.value.sourceOrDestination.trim()) {
    alert('请填写完整的货品名称与去向/来源');
    return;
  }
  const qty = Number(newLogisticsForm.value.quantity) || 100;
  const price = Number(newLogisticsForm.value.unitPriceYuan) || 20;

  logisticsService.addRecord({
    type: newLogisticsForm.value.type,
    category: newLogisticsForm.value.category,
    itemName: newLogisticsForm.value.itemName.trim(),
    specification: newLogisticsForm.value.specification.trim() || '标准箱装',
    sourceOrDestination: newLogisticsForm.value.sourceOrDestination.trim(),
    quantity: qty,
    unit: newLogisticsForm.value.unit,
    unitPriceYuan: price,
    totalAmountYuan: qty * price,
    transportPlate: newLogisticsForm.value.transportPlate.trim() || '苏E·A886F',
    operator: newLogisticsForm.value.operator.trim() || '仓储主管',
    inspector: newLogisticsForm.value.inspector.trim() || '农艺质检员',
    status: newLogisticsForm.value.status,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    notes: newLogisticsForm.value.notes.trim() || '道闸管理处录入',
  });

  logisticsRecords.value = [...logisticsService.getRecords()];
  logisticsSummary.value = logisticsService.getSummary();
  showAddLogisticsModal.value = false;

  // Reset
  newLogisticsForm.value = {
    type: 'outbound',
    category: '精品果蔬出库',
    itemName: '',
    specification: '',
    sourceOrDestination: '',
    quantity: 500,
    unit: 'kg',
    unitPriceYuan: 24,
    transportPlate: '苏E·A886F 新能源冷藏货车',
    operator: '陈志强 (冷链司机)',
    inspector: '张明 (农艺质检员)',
    status: 'in_transit',
    notes: '',
  };
};

// Export CSV
const handleExportCsv = () => {
  gateService.exportAccessRecordsCsv(filteredRecords.value);
};
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    @click.self="emit('close')"
  >
    <div
      class="relative w-full max-w-6xl max-h-[92vh] bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-bold text-slate-100">
                现代农业示范园·主出入口智能道闸与车辆管理系统
              </h2>
              <span
                class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold"
                :class="barrierRaised ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse' : 'bg-slate-800 text-slate-400 border border-slate-700'"
              >
                道闸状态: {{ barrierRaised ? '▲ 抬杆放行中' : '▼ 落杆守候' }}
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              高精度车牌抓拍识别、白名单免检自动抬杆放行、现场手动截停控制与历史往来任务台账
            </p>
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

      <!-- Quick KPI & Real-time Barrier Gate Control Bar -->
      <div class="px-6 py-3.5 bg-slate-950/90 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 items-center">
        <!-- 1. Barrier State Indicator & Switch -->
        <div class="col-span-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div
              :class="barrierRaised ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_12px_#10b981]' : 'bg-rose-500/20 text-rose-400 border-rose-500/40'"
              class="w-9 h-9 rounded-lg border flex items-center justify-center transition-all"
            >
              <Power class="w-5 h-5" />
            </div>
            <div>
              <div class="text-[11px] text-slate-400">大门道闸起落控制</div>
              <div class="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <span>{{ barrierRaised ? '道闸已升起 (畅行)' : '道闸已落下 (截停)' }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              v-if="!barrierRaised"
              @click="handleToggleBarrier(true)"
              class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <Unlock class="w-3.5 h-3.5" /> 手动抬杆
            </button>
            <button
              v-else
              @click="handleToggleBarrier(false)"
              class="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <Lock class="w-3.5 h-3.5" /> 一键落杆
            </button>
          </div>
        </div>

        <!-- 2. Gate Operating Mode Switch -->
        <div class="col-span-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div class="text-[11px] text-slate-400">大门准入控制模式</div>
            <div class="text-xs font-bold text-cyan-300">
              {{ gateStatus.mode === 'auto_whitelist' ? '全自动车牌识别放行' : gateStatus.mode === 'manual_approval' ? '门卫人工审核模式' : gateStatus.mode === 'always_open' ? '紧急常开无感模式' : '闭园封闸锁闭' }}
            </div>
          </div>
          <select
            :value="gateStatus.mode"
            @change="handleSetGateMode(($event.target as HTMLSelectElement).value as any)"
            class="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200 cursor-pointer focus:outline-none focus:border-cyan-400"
          >
            <option value="auto_whitelist">全自动识别 (白名单自动抬杆)</option>
            <option value="manual_approval">人工审核 (每辆车人工确认)</option>
            <option value="always_open">紧急常开 (演练/丰收节直行)</option>
            <option value="locked">闭园锁闸 (禁止驶入)</option>
          </select>
        </div>

        <!-- 3. In Park Active Vehicles -->
        <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div class="text-[11px] text-slate-400 flex items-center gap-1">
            <Truck class="w-3 h-3 text-emerald-400" /> 在园作业车辆
          </div>
          <div class="text-sm font-bold font-mono text-emerald-300 mt-0.5">
            {{ gateStatus.activeVehiclesInPark }} <span class="text-[10px] text-slate-400 font-sans">辆</span>
          </div>
        </div>

        <!-- 4. Registered Whitelist Plates -->
        <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div class="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck class="w-3 h-3 text-cyan-400" /> 预录入车牌
          </div>
          <div class="text-sm font-bold font-mono text-cyan-300 mt-0.5">
            {{ plates.length }} <span class="text-[10px] text-slate-400 font-sans">辆已认证</span>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs & Action Bar -->
      <div class="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            @click="activeTab = 'records'"
            :class="activeTab === 'records' ? 'bg-cyan-600 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'"
            class="px-3.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Clock class="w-3.5 h-3.5" />
            <span>历史车辆往来台账 ({{ records.length }})</span>
          </button>

          <button
            @click="activeTab = 'whitelist'"
            :class="activeTab === 'whitelist' ? 'bg-cyan-600 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'"
            class="px-3.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck class="w-3.5 h-3.5" />
            <span>提前录入车牌·白名单 ({{ plates.length }})</span>
          </button>

          <button
            @click="activeTab = 'addRecord'"
            :class="activeTab === 'addRecord' ? 'bg-cyan-600 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'"
            class="px-3.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>现场人工登记放行</span>
          </button>

          <button
            @click="activeTab = 'logistics'"
            :class="activeTab === 'logistics' ? 'bg-emerald-600 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'"
            class="px-3.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Package class="w-3.5 h-3.5" :class="activeTab === 'logistics' ? 'text-slate-950' : 'text-emerald-400'" />
            <span>出货与进货台账 ({{ logisticsRecords.length }})</span>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="activeTab !== 'logistics'"
            @click="handleExportCsv"
            class="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <FileSpreadsheet class="w-3.5 h-3.5" />
            <span>导出车辆出入Excel</span>
          </button>
          <button
            v-else
            @click="handleExportLogisticsExcel"
            class="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Download class="w-3.5 h-3.5" />
            <span>导出进出货物流Excel</span>
          </button>
        </div>
      </div>

      <!-- Main Body Container -->
      <div class="flex-1 overflow-y-auto p-6 space-y-4">
        <!-- TAB 1: 历史车辆往来记录 (Historical Records) -->
        <div v-if="activeTab === 'records'" class="space-y-4">
          <!-- Filters & Search Bar -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div class="flex items-center gap-2 flex-1">
              <div class="relative flex-1 max-w-sm">
                <Search class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  v-model="searchKeyword"
                  type="text"
                  placeholder="搜索车牌号、驾驶员、承运任务、单位..."
                  class="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div class="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs">
                <button
                  @click="selectedDirection = 'all'"
                  :class="selectedDirection === 'all' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'"
                  class="px-2.5 py-1 rounded cursor-pointer"
                >
                  全部
                </button>
                <button
                  @click="selectedDirection = 'in'"
                  :class="selectedDirection === 'in' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                  class="px-2.5 py-1 rounded cursor-pointer flex items-center gap-1"
                >
                  <ArrowDownLeft class="w-3 h-3" /> 进场
                </button>
                <button
                  @click="selectedDirection = 'out'"
                  :class="selectedDirection === 'out' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                  class="px-2.5 py-1 rounded cursor-pointer flex items-center gap-1"
                >
                  <ArrowUpRight class="w-3 h-3" /> 出场
                </button>
              </div>
            </div>

            <span class="text-xs text-slate-400 font-mono">
              共筛选出 <strong class="text-cyan-400">{{ filteredRecords.length }}</strong> 条出入通行数据
            </span>
          </div>

          <!-- Table -->
          <div class="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/70">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th class="py-3 px-3.5">出入方向</th>
                    <th class="py-3 px-3">车牌号码</th>
                    <th class="py-3 px-3">通行时间</th>
                    <th class="py-3 px-3">承载任务 (农事生产/出入库)</th>
                    <th class="py-3 px-3">目的区域</th>
                    <th class="py-3 px-3">核验放行方式</th>
                    <th class="py-3 px-3">驾驶员 / 联络电话</th>
                    <th class="py-3 px-3">货物/吨位</th>
                    <th class="py-3 px-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-sans">
                  <tr
                    v-for="record in filteredRecords"
                    :key="record.id"
                    class="hover:bg-slate-800/40 transition-colors"
                  >
                    <!-- Direction -->
                    <td class="py-3 px-3.5 whitespace-nowrap">
                      <span
                        v-if="record.direction === 'in'"
                        class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit"
                      >
                        <ArrowDownLeft class="w-3 h-3" /> 进场入园
                      </span>
                      <span
                        v-else
                        class="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 w-fit"
                      >
                        <ArrowUpRight class="w-3 h-3" /> 离场出园
                      </span>
                    </td>

                    <!-- License Plate -->
                    <td class="py-3 px-3 whitespace-nowrap">
                      <div class="flex items-center gap-2">
                        <span
                          :class="record.plateColor === 'green' ? 'bg-emerald-600 text-slate-950 font-bold border-emerald-400' : record.plateColor === 'yellow' ? 'bg-amber-400 text-slate-950 font-bold border-amber-300' : 'bg-blue-600 text-white font-bold border-blue-400'"
                          class="px-2.5 py-1 rounded text-xs font-mono border tracking-wider shadow-xs"
                        >
                          {{ record.plateNumber }}
                        </span>
                        <div class="text-[11px] text-slate-400">{{ record.vehicleModel }}</div>
                      </div>
                    </td>

                    <!-- Timestamp -->
                    <td class="py-3 px-3 whitespace-nowrap font-mono text-slate-300">
                      {{ record.timestamp }}
                    </td>

                    <!-- Mission (Core user intent) -->
                    <td class="py-3 px-3 min-w-[200px] text-slate-200 font-medium">
                      <div class="line-clamp-2" :title="record.mission">
                        {{ record.mission }}
                      </div>
                      <div v-if="record.notes" class="text-[10px] text-slate-500 mt-0.5">
                        注：{{ record.notes }}
                      </div>
                    </td>

                    <!-- Target Area -->
                    <td class="py-3 px-3 whitespace-nowrap text-slate-300">
                      {{ record.targetArea }}
                    </td>

                    <!-- Clearance Type -->
                    <td class="py-3 px-3 whitespace-nowrap">
                      <span
                        v-if="record.clearanceType === 'auto_whitelist'"
                        class="px-2 py-0.5 rounded text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit"
                      >
                        <ShieldCheck class="w-3 h-3" /> 白名单自动抬杆
                      </span>
                      <span
                        v-else-if="record.clearanceType === 'manual_guard'"
                        class="px-2 py-0.5 rounded text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit"
                      >
                        <UserCheck class="w-3 h-3" /> 门卫人工确认
                      </span>
                      <span
                        v-else
                        class="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        临时审批通行
                      </span>
                    </td>

                    <!-- Driver & Phone -->
                    <td class="py-3 px-3 whitespace-nowrap">
                      <div class="font-semibold text-slate-200">{{ record.driverName }}</div>
                      <div class="text-[11px] font-mono text-slate-400">{{ record.driverPhone }}</div>
                    </td>

                    <!-- Cargo -->
                    <td class="py-3 px-3 whitespace-nowrap text-slate-300">
                      <div v-if="record.cargoDescription" class="flex flex-col gap-1 items-start">
                        <span>{{ record.cargoDescription }}</span>
                        <div class="flex items-center gap-1.5">
                          <span v-if="record.cargoWeightKg" class="text-[11px] font-mono text-amber-300">
                            {{ record.cargoWeightKg }} kg
                          </span>
                          <button
                            @click="openRelatedLogistics(record.plateNumber)"
                            class="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                            title="查看对应进出货物流单据"
                          >
                            <Package class="w-2.5 h-2.5" /> 出进货单据
                          </button>
                        </div>
                      </div>
                      <div v-else-if="record.cargoWeightKg" class="text-[11px] font-mono text-amber-300">
                        {{ record.cargoWeightKg }} kg
                      </div>
                      <div v-else class="text-slate-500">
                        —
                      </div>
                    </td>

                    <!-- Action -->
                    <td class="py-3 px-3 whitespace-nowrap text-right">
                      <button
                        @click="emit('openVehicleDetails', record.plateNumber)"
                        class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 text-xs font-medium cursor-pointer transition-colors"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>

                  <tr v-if="filteredRecords.length === 0">
                    <td colspan="9" class="py-8 text-center text-slate-500 text-xs">
                      暂未查询到符合条件的车辆往来通行记录
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 2: 提前录入车牌·白名单管理 (Pre-registered Plates) -->
        <div v-if="activeTab === 'whitelist'" class="space-y-5">
          <!-- Add New Whitelist Plate Card -->
          <div class="p-5 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Plus class="w-4 h-4" />
                </div>
                <div>
                  <h4 class="text-sm font-bold text-slate-100">提前录入常来车辆车牌 (车来自动抬杆，无需手动确认)</h4>
                  <p class="text-xs text-slate-400">录入后，智能车牌识别抓拍机比对成功将全自动抬杆放行并记录通行日志</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <!-- Plate Number -->
              <div>
                <label class="text-[11px] font-semibold text-slate-300 block mb-1">车牌号码 *</label>
                <input
                  v-model="newPlate.plateNumber"
                  type="text"
                  placeholder="例如: 苏E·A886F"
                  class="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono uppercase"
                />
              </div>

              <!-- Plate Color -->
              <div>
                <label class="text-[11px] font-semibold text-slate-300 block mb-1">牌照类型</label>
                <select
                  v-model="newPlate.plateColor"
                  class="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                >
                  <option value="green">渐变绿 (新能源冷链车/电瓶车)</option>
                  <option value="blue">蓝色 (传统燃油客车/轻卡)</option>
                  <option value="yellow">黄色 (重型农资货运挂车)</option>
                </select>
              </div>

              <!-- Vehicle Category -->
              <div>
                <label class="text-[11px] font-semibold text-slate-300 block mb-1">车辆品类</label>
                <select
                  v-model="newPlate.vehicleCategory"
                  class="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                >
                  <option value="reefer">冷链恒温果蔬运输车</option>
                  <option value="supplies">农资特种水溶肥配送车</option>
                  <option value="utility">园区内部电瓶转运车</option>
                  <option value="visitor">农业科研交流/专家考察车</option>
                  <option value="machinery">农机与大型植保作业车</option>
                </select>
              </div>

              <!-- Driver Name -->
              <div>
                <label class="text-[11px] font-semibold text-slate-300 block mb-1">驾驶员姓名</label>
                <input
                  v-model="newPlate.driverName"
                  type="text"
                  placeholder="驾驶员姓名"
                  class="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <!-- Phone -->
              <div>
                <label class="text-[11px] font-semibold text-slate-300 block mb-1">随车电话</label>
                <input
                  v-model="newPlate.driverPhone"
                  type="text"
                  placeholder="联系手机号"
                  class="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <!-- Company -->
              <div>
                <label class="text-[11px] font-semibold text-slate-300 block mb-1">所属单位 / 供应链合作方</label>
                <input
                  v-model="newPlate.company"
                  type="text"
                  placeholder="例如: 盒马生鲜冷链车队"
                  class="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <!-- Default Mission -->
              <div class="sm:col-span-2">
                <label class="text-[11px] font-semibold text-slate-300 block mb-1">核定准入任务 / 用途</label>
                <input
                  v-model="newPlate.defaultMission"
                  type="text"
                  placeholder="例如: 5#番茄棚高糖串收番茄提货出库至华东中心仓"
                  class="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-slate-800">
              <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  v-model="newPlate.autoPass"
                  type="checkbox"
                  class="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
                />
                <span>启用车牌匹配【自动抬杆放行】(免去人工确认)</span>
              </label>

              <button
                @click="handleSaveNewPlate"
                class="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow"
              >
                <Check class="w-4 h-4" />
                <span>保存并录入白名单</span>
              </button>
            </div>
          </div>

          <!-- Existing Whitelist Table -->
          <div class="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/70">
            <div class="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <h4 class="text-xs font-bold text-slate-200 flex items-center gap-2">
                <ShieldCheck class="w-4 h-4 text-emerald-400" />
                <span>已提前录入授权车牌清单 ({{ plates.length }})</span>
              </h4>
              <span class="text-[11px] text-slate-400 font-mono">绿色标识表示来车自动识别抬杆</span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-900/50 text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th class="py-2.5 px-3">车牌号码</th>
                    <th class="py-2.5 px-3">所属单位/车队</th>
                    <th class="py-2.5 px-3">驾驶员/电话</th>
                    <th class="py-2.5 px-3">核准默认任务</th>
                    <th class="py-2.5 px-3">准入有效期</th>
                    <th class="py-2.5 px-3">自动抬杆状态</th>
                    <th class="py-2.5 px-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-sans">
                  <tr
                    v-for="p in plates"
                    :key="p.id"
                    class="hover:bg-slate-800/40 transition-colors"
                  >
                    <td class="py-2.5 px-3 whitespace-nowrap">
                      <span
                        :class="p.plateColor === 'green' ? 'bg-emerald-600 text-slate-950 font-bold border-emerald-400' : p.plateColor === 'yellow' ? 'bg-amber-400 text-slate-950 font-bold border-amber-300' : 'bg-blue-600 text-white font-bold border-blue-400'"
                        class="px-2.5 py-1 rounded text-xs font-mono border tracking-wider shadow-xs"
                      >
                        {{ p.plateNumber }}
                      </span>
                    </td>
                    <td class="py-2.5 px-3 whitespace-nowrap font-medium text-slate-200">
                      {{ p.company }}
                    </td>
                    <td class="py-2.5 px-3 whitespace-nowrap">
                      <span class="font-semibold text-slate-200">{{ p.driverName }}</span>
                      <span class="text-[11px] font-mono text-slate-400 ml-1.5">({{ p.driverPhone }})</span>
                    </td>
                    <td class="py-2.5 px-3 text-slate-300">
                      {{ p.defaultMission }}
                    </td>
                    <td class="py-2.5 px-3 whitespace-nowrap font-mono text-slate-400">
                      {{ p.authorizedUntil }}
                    </td>
                    <td class="py-2.5 px-3 whitespace-nowrap">
                      <button
                        @click="handleToggleAutoPass(p.id)"
                        :class="p.autoPass ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'"
                        class="px-2 py-0.5 rounded text-[11px] border font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span class="w-1.5 h-1.5 rounded-full" :class="p.autoPass ? 'bg-emerald-400' : 'bg-slate-500'"></span>
                        <span>{{ p.autoPass ? '免检自动抬杆' : '已暂停 (需人工)' }}</span>
                      </button>
                    </td>
                    <td class="py-2.5 px-3 whitespace-nowrap text-right">
                      <button
                        @click="handleRemovePlate(p.id)"
                        class="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer transition-colors"
                        title="删除预录车牌"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 3: 现场人工登记放行 (Manual Record & Visitor Pass) -->
        <div v-if="activeTab === 'addRecord'" class="max-w-2xl mx-auto p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
          <div class="flex items-center gap-2 pb-3 border-b border-slate-800">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Camera class="w-4 h-4" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-slate-100">现场车辆临时登记与手动抬杆放行</h4>
              <p class="text-xs text-slate-400">用于外来临时运货卡车、考察观摩商务客车现场核准入园</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[11px] font-semibold text-slate-300 block mb-1">车牌号码 *</label>
              <input
                v-model="newRecordForm.plateNumber"
                type="text"
                placeholder="例如: 沪A·88902"
                class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono uppercase focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label class="text-[11px] font-semibold text-slate-300 block mb-1">出入方向</label>
              <select
                v-model="newRecordForm.direction"
                class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value="in">驶入进场 (抬杆放行进园)</option>
                <option value="out">驶离出场 (核验放行出园)</option>
              </select>
            </div>

            <div>
              <label class="text-[11px] font-semibold text-slate-300 block mb-1">驾驶员姓名</label>
              <input
                v-model="newRecordForm.driverName"
                type="text"
                placeholder="驾驶员"
                class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label class="text-[11px] font-semibold text-slate-300 block mb-1">联系电话</label>
              <input
                v-model="newRecordForm.driverPhone"
                type="text"
                placeholder="手机号码"
                class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div class="col-span-2">
              <label class="text-[11px] font-semibold text-slate-300 block mb-1">承载具体任务 *</label>
              <textarea
                v-model="newRecordForm.mission"
                rows="2"
                placeholder="例如: 3#高糖草莓温室鲜果临时加装提货，发往苏南生鲜自提站"
                class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              ></textarea>
            </div>

            <div>
              <label class="text-[11px] font-semibold text-slate-300 block mb-1">前往区域</label>
              <input
                v-model="newRecordForm.targetArea"
                type="text"
                placeholder="例如: 3#温室 / 冷链配送仓"
                class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label class="text-[11px] font-semibold text-slate-300 block mb-1">装载货物 (如有)</label>
              <input
                v-model="newRecordForm.cargoDescription"
                type="text"
                placeholder="例如: 生物菌剂 40箱"
                class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div class="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              @click="activeTab = 'records'"
              class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
            >
              取消
            </button>
            <button
              @click="handleSaveNewRecord"
              class="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Unlock class="w-4 h-4" />
              <span>登记并手动抬杆放行</span>
            </button>
          </div>
        </div>

        <!-- TAB 4: 出货与进货记录台账 (Shipping / Receiving Logistics Ledger) -->
        <div v-if="activeTab === 'logistics'" class="space-y-4">
          <!-- Logistics Summary KPI Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <div class="text-[11px] text-slate-400">今日果蔬出库总量</div>
                <div class="text-base font-bold font-mono text-emerald-400 mt-0.5">
                  {{ logisticsSummary.todayOutboundKg.toLocaleString() }} <span class="text-xs text-slate-400 font-sans">kg</span>
                </div>
              </div>
              <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ArrowUpRight class="w-4 h-4" />
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-between">
              <div>
                <div class="text-[11px] text-slate-400">今日出货销售金额</div>
                <div class="text-base font-bold font-mono text-amber-400 mt-0.5">
                  ¥{{ logisticsSummary.todayOutboundAmountYuan.toLocaleString() }}
                </div>
              </div>
              <div class="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Boxes class="w-4 h-4" />
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-center justify-between">
              <div>
                <div class="text-[11px] text-slate-400">今日农资化肥进货</div>
                <div class="text-base font-bold font-mono text-cyan-300 mt-0.5">
                  {{ logisticsSummary.todayInboundBatches }} <span class="text-xs text-slate-400 font-sans">批次 / {{ logisticsSummary.todayInboundTons }} 吨</span>
                </div>
              </div>
              <div class="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <ArrowDownLeft class="w-4 h-4" />
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-blue-500/30 flex items-center justify-between">
              <div>
                <div class="text-[11px] text-slate-400">在途/运输中冷链车</div>
                <div class="text-base font-bold font-mono text-blue-400 mt-0.5">
                  {{ logisticsSummary.inTransitVehicles }} <span class="text-xs text-slate-400 font-sans">车次冷链在途</span>
                </div>
              </div>
              <div class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Truck class="w-4 h-4" />
              </div>
            </div>
          </div>

          <!-- Controls: Filters, Search, and Add Record Button -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div class="flex items-center gap-2 flex-1 flex-wrap">
              <!-- Search box -->
              <div class="relative flex-1 min-w-[200px] max-w-sm">
                <Search class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  v-model="logisticsSearch"
                  type="text"
                  placeholder="搜索单号、货品名称、去向、运送车牌..."
                  class="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <!-- Direction/Status Tabs -->
              <div class="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs">
                <button
                  @click="logisticsTab = 'all'"
                  :class="logisticsTab === 'all' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'"
                  class="px-2.5 py-1 rounded cursor-pointer"
                >
                  全部单据
                </button>
                <button
                  @click="logisticsTab = 'outbound'"
                  :class="logisticsTab === 'outbound' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                  class="px-2.5 py-1 rounded cursor-pointer flex items-center gap-1"
                >
                  <ArrowUpRight class="w-3 h-3" /> 仅看出货 (果蔬销售)
                </button>
                <button
                  @click="logisticsTab = 'inbound'"
                  :class="logisticsTab === 'inbound' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                  class="px-2.5 py-1 rounded cursor-pointer flex items-center gap-1"
                >
                  <ArrowDownLeft class="w-3 h-3" /> 仅看进货 (农资化肥)
                </button>
                <button
                  @click="logisticsTab = 'in_transit'"
                  :class="logisticsTab === 'in_transit' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                  class="px-2.5 py-1 rounded cursor-pointer flex items-center gap-1"
                >
                  <Truck class="w-3 h-3" /> 冷链在途
                </button>
              </div>

              <!-- Category filter -->
              <select
                v-model="logisticsCategory"
                class="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="all">全品类 (全部)</option>
                <option value="精品果蔬出库">精品果蔬出库</option>
                <option value="生态水产出货">生态水产出货</option>
                <option value="特种药材">特种药材出库</option>
                <option value="高效水溶肥">高效水溶肥进货</option>
                <option value="优质水产饲料">优质水产饲料进货</option>
                <option value="无土基质">无土基质进货</option>
                <option value="包装冷链材料">冷链包装耗材进货</option>
              </select>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-2">
              <button
                @click="showAddLogisticsModal = !showAddLogisticsModal"
                class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>{{ showAddLogisticsModal ? '收起单据表单' : '登记新出进货单' }}</span>
              </button>
            </div>
          </div>

          <!-- Optional Collapsible Inline Form to Add Record -->
          <div
            v-if="showAddLogisticsModal"
            class="p-4 rounded-xl bg-slate-950/90 border border-emerald-500/40 space-y-3 animate-in fade-in duration-150"
          >
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <div class="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Plus class="w-3.5 h-3.5" /> 快速登记园区进出货物流单据
              </div>
              <button
                @click="showAddLogisticsModal = false"
                class="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                关闭
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label class="text-[11px] text-slate-400 block mb-1">单据类型</label>
                <select
                  v-model="newLogisticsForm.type"
                  class="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-400"
                >
                  <option value="outbound">出货 (采收销售外运)</option>
                  <option value="inbound">进货 (农资耗材采购入库)</option>
                </select>
              </div>

              <div>
                <label class="text-[11px] text-slate-400 block mb-1">业务品类</label>
                <select
                  v-model="newLogisticsForm.category"
                  class="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-400"
                >
                  <option value="精品果蔬出库">精品果蔬出库</option>
                  <option value="生态水产出货">生态水产出货</option>
                  <option value="特种药材">特种药材出库</option>
                  <option value="高效水溶肥">高效水溶肥进货</option>
                  <option value="优质水产饲料">优质水产饲料进货</option>
                  <option value="无土基质">无土基质进货</option>
                  <option value="包装冷链材料">包装冷链耗材</option>
                </select>
              </div>

              <div>
                <label class="text-[11px] text-slate-400 block mb-1">货品名称 *</label>
                <input
                  v-model="newLogisticsForm.itemName"
                  placeholder="例如: 普罗旺斯水果番茄 特级果"
                  class="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label class="text-[11px] text-slate-400 block mb-1">去向 / 货源单位 *</label>
                <input
                  v-model="newLogisticsForm.sourceOrDestination"
                  placeholder="例如: 盒马鲜生华东冷链仓"
                  class="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label class="text-[11px] text-slate-400 block mb-1">数量 (kg/单位)</label>
                <input
                  v-model.number="newLogisticsForm.quantity"
                  type="number"
                  class="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label class="text-[11px] text-slate-400 block mb-1">单价 (元/单位)</label>
                <input
                  v-model.number="newLogisticsForm.unitPriceYuan"
                  type="number"
                  class="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label class="text-[11px] text-slate-400 block mb-1">承运车辆车牌</label>
                <input
                  v-model="newLogisticsForm.transportPlate"
                  placeholder="例如: 苏E·A886F"
                  class="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label class="text-[11px] text-slate-400 block mb-1">承运驾驶员/经办人</label>
                <input
                  v-model="newLogisticsForm.operator"
                  placeholder="例如: 陈志强"
                  class="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button
                @click="showAddLogisticsModal = false"
                class="px-3 py-1 rounded bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                取消
              </button>
              <button
                @click="handleSaveLogisticsRecord"
                class="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer shadow-xs"
              >
                确认创建进出货单据
              </button>
            </div>
          </div>

          <!-- Logistics Records Table -->
          <div class="rounded-xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-inner">
            <div class="overflow-x-auto max-h-[500px]">
              <table class="w-full text-left text-xs">
                <thead class="sticky top-0 bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider z-10">
                  <tr>
                    <th class="py-3 px-3.5">单据编号</th>
                    <th class="py-3 px-3">进出类型</th>
                    <th class="py-3 px-3">货品名称 / 规格</th>
                    <th class="py-3 px-3">目的地 / 货源单位</th>
                    <th class="py-3 px-3 text-right">数量 (kg)</th>
                    <th class="py-3 px-3 text-right">单价 / 金额</th>
                    <th class="py-3 px-3">承运工具 / 车牌</th>
                    <th class="py-3 px-3">经办 / 质检</th>
                    <th class="py-3 px-3">当前状态</th>
                    <th class="py-3 px-3 whitespace-nowrap">时间与备注</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-300">
                  <tr
                    v-for="log in filteredLogisticsRecords"
                    :key="log.id"
                    class="hover:bg-slate-800/40 transition-colors"
                  >
                    <!-- Record No -->
                    <td class="py-3 px-3.5 font-mono text-[11px] text-cyan-400 font-semibold whitespace-nowrap">
                      {{ log.recordNo }}
                    </td>

                    <!-- Type & Category -->
                    <td class="py-3 px-3 whitespace-nowrap">
                      <span
                        v-if="log.type === 'outbound'"
                        class="px-2 py-0.5 rounded text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold inline-flex items-center gap-1"
                      >
                        <ArrowUpRight class="w-3 h-3" /> 出货 (销售)
                      </span>
                      <span
                        v-else
                        class="px-2 py-0.5 rounded text-[11px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold inline-flex items-center gap-1"
                      >
                        <ArrowDownLeft class="w-3 h-3" /> 进货 (农资)
                      </span>
                      <div class="text-[10px] text-slate-400 mt-0.5">{{ log.category }}</div>
                    </td>

                    <!-- Item Name & Spec -->
                    <td class="py-3 px-3">
                      <div class="font-semibold text-slate-100">{{ log.itemName }}</div>
                      <div class="text-[11px] text-slate-400">{{ log.specification }}</div>
                    </td>

                    <!-- Source or Destination -->
                    <td class="py-3 px-3 text-slate-200">
                      {{ log.sourceOrDestination }}
                    </td>

                    <!-- Quantity -->
                    <td class="py-3 px-3 text-right font-mono font-bold text-slate-100 whitespace-nowrap">
                      {{ log.quantity.toLocaleString() }} <span class="text-[10px] text-slate-400 font-sans">{{ log.unit }}</span>
                    </td>

                    <!-- Unit Price & Total Amount -->
                    <td class="py-3 px-3 text-right whitespace-nowrap">
                      <div class="font-mono font-bold text-amber-400">
                        ¥{{ log.totalAmountYuan.toLocaleString() }}
                      </div>
                      <div class="text-[10px] text-slate-500 font-mono">
                        ¥{{ log.unitPriceYuan }}/{{ log.unit }}
                      </div>
                    </td>

                    <!-- Transport Plate -->
                    <td class="py-3 px-3 whitespace-nowrap">
                      <div class="flex items-center gap-1.5">
                        <span class="font-mono text-xs font-semibold text-slate-200">{{ log.transportPlate }}</span>
                        <button
                          v-if="log.transportPlate"
                          @click="emit('openVehicleDetails', log.transportPlate.split(' ')[0])"
                          class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 cursor-pointer transition-colors"
                          title="查看该车作业档案"
                        >
                          <ExternalLink class="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    <!-- Operator & Inspector -->
                    <td class="py-3 px-3 whitespace-nowrap text-[11px]">
                      <div class="text-slate-200">{{ log.operator }}</div>
                      <div class="text-slate-500">质检: {{ log.inspector }}</div>
                    </td>

                    <!-- Status -->
                    <td class="py-3 px-3 whitespace-nowrap">
                      <span
                        v-if="log.status === 'in_transit'"
                        class="px-2 py-0.5 rounded text-[11px] bg-blue-500/20 text-blue-300 border border-blue-500/30 inline-flex items-center gap-1 animate-pulse"
                      >
                        <Truck class="w-3 h-3" /> 冷链在途
                      </span>
                      <span
                        v-else-if="log.status === 'completed'"
                        class="px-2 py-0.5 rounded text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1"
                      >
                        <CheckCircle2 class="w-3 h-3" /> 已入库/已交付
                      </span>
                      <span
                        v-else-if="log.status === 'loading'"
                        class="px-2 py-0.5 rounded text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1"
                      >
                        <Clock class="w-3 h-3" /> 装车发货中
                      </span>
                      <span
                        v-else
                        class="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {{ log.status }}
                      </span>
                    </td>

                    <!-- Timestamp & Notes -->
                    <td class="py-3 px-3 text-[11px] text-slate-400 max-w-[200px]">
                      <div class="font-mono text-slate-300">{{ log.timestamp }}</div>
                      <div class="text-slate-500 truncate" :title="log.notes">{{ log.notes }}</div>
                    </td>
                  </tr>

                  <tr v-if="filteredLogisticsRecords.length === 0">
                    <td colspan="10" class="py-10 text-center text-slate-500 text-xs">
                      暂无符合条件的出货与进货记录
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>智慧道闸 ALPR 车牌识别系统全天候运行中</span>
        </div>
        <button
          @click="emit('close')"
          class="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>
