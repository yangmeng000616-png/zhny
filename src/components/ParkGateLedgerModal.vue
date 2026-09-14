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
} from 'lucide-vue-next';
import type { VehicleAccessRecord, PreRegisteredPlate, GateControlStatus } from '../types/gate';
import { gateService } from '../services/gateService';

const props = defineProps<{
  visible: boolean;
  barrierRaised: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'toggleBarrier', open: boolean): void;
  (e: 'openVehicleDetails', plateNumber: string): void;
}>();

const activeTab = ref<'records' | 'whitelist' | 'gateControl' | 'addRecord'>('records');

// Records & Whitelist States from service
const records = ref<VehicleAccessRecord[]>(gateService.getRecords());
const plates = ref<PreRegisteredPlate[]>(gateService.getPlates());
const gateStatus = ref<GateControlStatus>(gateService.getGateStatus());

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
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="handleExportCsv"
            class="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <FileSpreadsheet class="w-3.5 h-3.5" />
            <span>导出车辆出入Excel</span>
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
                      <div v-if="record.cargoDescription">
                        {{ record.cargoDescription }}
                      </div>
                      <div v-if="record.cargoWeightKg" class="text-[11px] font-mono text-amber-300">
                        {{ record.cargoWeightKg }} kg
                      </div>
                      <div v-if="!record.cargoDescription && !record.cargoWeightKg" class="text-slate-500">
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
