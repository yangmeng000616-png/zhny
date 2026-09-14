import type { VehicleAccessRecord, PreRegisteredPlate, GateControlStatus } from '../types/gate';

const LOCAL_STORAGE_PLATES_KEY = 'smart_greenhouse_registered_plates_v1';
const LOCAL_STORAGE_RECORDS_KEY = 'smart_greenhouse_vehicle_access_records_v1';
const LOCAL_STORAGE_GATE_MODE_KEY = 'smart_greenhouse_gate_mode_v1';

export const INITIAL_PRE_REGISTERED_PLATES: PreRegisteredPlate[] = [
  {
    id: 'REG-001',
    plateNumber: '苏E·A886F',
    plateColor: 'green',
    vehicleCategory: 'reefer',
    driverName: '陈志强',
    driverPhone: '138-1234-5678',
    company: '盒马鲜生华东冷链直运车队',
    defaultMission: '高品质番茄/草莓鲜果温控冷链采收提货',
    authorizedUntil: '长期有效',
    autoPass: true,
    registeredAt: '2026-03-10',
    notes: '定点冷链合作车辆，免检自动放行',
  },
  {
    id: 'REG-002',
    plateNumber: '苏B·6890N',
    plateColor: 'green',
    vehicleCategory: 'reefer',
    driverName: '王建国',
    driverPhone: '139-8877-6655',
    company: '山姆会员店苏南生鲜配送专线',
    defaultMission: '精品温室串番茄与有机叶菜直供装箱',
    authorizedUntil: '2027-06-30',
    autoPass: true,
    registeredAt: '2026-04-15',
    notes: '定期装运，车厢温控设定0~4℃',
  },
  {
    id: 'REG-003',
    plateNumber: '苏E·3398D',
    plateColor: 'yellow',
    vehicleCategory: 'supplies',
    driverName: '李广财',
    driverPhone: '136-5544-3322',
    company: '中化现代农业特种水溶肥配送',
    defaultMission: '硝酸钾、高纯水溶肥及有机基质原料送货',
    authorizedUntil: '2026-12-31',
    autoPass: true,
    registeredAt: '2026-02-20',
    notes: '重载农资卡车，卸货地点1#配肥中心',
  },
  {
    id: 'REG-004',
    plateNumber: '苏E·9912A',
    plateColor: 'blue',
    vehicleCategory: 'visitor',
    driverName: '张敏博',
    driverPhone: '137-9988-1122',
    company: '省农科院农业数字化工程实验室',
    defaultMission: '智慧农业物联网传感器与无人机多光谱巡检研学',
    authorizedUntil: '2026-10-30',
    autoPass: true,
    registeredAt: '2026-08-01',
    notes: '特邀科研院校专家车，允许进入主楼及大棚通道',
  },
  {
    id: 'REG-005',
    plateNumber: '苏E·F0116',
    plateColor: 'green',
    vehicleCategory: 'utility',
    driverName: '赵海峰',
    driverPhone: '135-2233-4455',
    company: '园区内部生产运维班组',
    defaultMission: '果蔬转运与熊蜂授粉箱/生物农药换装配送',
    authorizedUntil: '长期有效',
    autoPass: true,
    registeredAt: '2026-01-05',
    notes: '园区自营电瓶平板车，全天候全区域通行',
  },
];

export const INITIAL_VEHICLE_ACCESS_RECORDS: VehicleAccessRecord[] = [
  {
    id: 'AC-20260914-001',
    plateNumber: '苏E·A886F',
    plateColor: 'green',
    vehicleCategory: 'reefer',
    vehicleModel: '福田智蓝 4.2米 新能源恒温冷藏车',
    driverName: '陈志强',
    driverPhone: '138-1234-5678',
    company: '盒马鲜生华东冷链直运车队',
    direction: 'in',
    timestamp: '2026-09-14 09:42:15',
    mission: '5#高糖番茄温室采收提货，发往盒马鲜生华东中心仓',
    targetArea: '5#智能化温室 / 冷链配送仓',
    clearanceType: 'auto_whitelist',
    status: 'in_park',
    cargoDescription: '计划装载5#高糖串收番茄',
    cargoWeightKg: 1850,
    notes: '车牌自动识别通过，道闸自动抬杆，已进场作业',
  },
  {
    id: 'AC-20260914-002',
    plateNumber: '苏E·3398D',
    plateColor: 'yellow',
    vehicleCategory: 'supplies',
    vehicleModel: '东风天锦 6.8米 农资重型货车',
    driverName: '李广财',
    driverPhone: '136-5544-3322',
    company: '中化现代农业特种水溶肥配送',
    direction: 'in',
    timestamp: '2026-09-14 08:30:22',
    mission: '配肥站高纯水溶肥与微量元素到货卸车',
    targetArea: '水肥一体化中央配肥中心',
    clearanceType: 'auto_whitelist',
    status: 'completed',
    cargoDescription: '以色列特种水溶性复合肥',
    cargoWeightKg: 8000,
    notes: '已于 09:18 卸货完毕并离场',
  },
  {
    id: 'AC-20260914-003',
    plateNumber: '苏E·3398D',
    plateColor: 'yellow',
    vehicleCategory: 'supplies',
    vehicleModel: '东风天锦 6.8米 农资重型货车',
    driverName: '李广财',
    driverPhone: '136-5544-3322',
    company: '中化现代农业特种水溶肥配送',
    direction: 'out',
    timestamp: '2026-09-14 09:18:40',
    mission: '农资送达任务完成，空车驶离园区',
    targetArea: '主大门出入口',
    clearanceType: 'auto_whitelist',
    status: 'completed',
    notes: '地磅称重出场，核销送货单',
  },
  {
    id: 'AC-20260914-004',
    plateNumber: '浙A·9982X',
    plateColor: 'blue',
    vehicleCategory: 'visitor',
    vehicleModel: '别克GL8 商务接待车',
    driverName: '周世祥',
    driverPhone: '133-7766-5544',
    company: '长三角现代农业现代装备交流考察团',
    direction: 'in',
    timestamp: '2026-09-14 09:05:10',
    mission: '智慧农业数字孪生中控大厅观摩与产业交流',
    targetArea: '综合中控大厅与2#草莓温室',
    clearanceType: 'manual_guard',
    status: 'in_park',
    cargoDescription: '观摩人员7人',
    notes: '未提前录入白名单，门卫核实考察公函后人工按键放行',
  },
  {
    id: 'AC-20260914-005',
    plateNumber: '苏E·F0116',
    plateColor: 'green',
    vehicleCategory: 'utility',
    vehicleModel: '绿友 纯电动农业平板转运车',
    driverName: '赵海峰',
    driverPhone: '135-2233-4455',
    company: '园区内部生产运维班组',
    direction: 'in',
    timestamp: '2026-09-14 07:15:00',
    mission: '早班果蔬鲜货采收框分发与大棚工具配送',
    targetArea: '1#~8#温室主通道',
    clearanceType: 'auto_whitelist',
    status: 'in_park',
    cargoDescription: '食品级采收周转筐 120只',
    notes: '园区自有车辆，日常巡检',
  },
  {
    id: 'AC-20260913-006',
    plateNumber: '苏B·6890N',
    plateColor: 'green',
    vehicleCategory: 'reefer',
    vehicleModel: '比亚迪T5 恒温冷藏轻卡',
    driverName: '王建国',
    driverPhone: '139-8877-6655',
    company: '山姆会员店苏南生鲜配送专线',
    direction: 'out',
    timestamp: '2026-09-13 17:40:12',
    mission: '山姆冷链直发专车发货，出库优质串收番茄',
    targetArea: '主大门出场通道',
    clearanceType: 'auto_whitelist',
    status: 'completed',
    cargoDescription: '山姆高端盒装串番茄 240箱',
    cargoWeightKg: 1200,
    notes: '全程4℃打冷打码完成，签章放行',
  },
];

class GateService {
  private plates: PreRegisteredPlate[] = [];
  private records: VehicleAccessRecord[] = [];
  private gateStatus: GateControlStatus;

  constructor() {
    this.init();
    this.gateStatus = {
      barrierState: 'lowered',
      mode: this.loadGateMode(),
      lastPlateRecognized: '苏E·A886F',
      lastPlateRecognitionTime: '2026-09-14 09:42:15',
      currentVehicleAtGate: null,
      totalTodayIn: 4,
      totalTodayOut: 2,
      activeVehiclesInPark: 3,
    };
  }

  private init() {
    // Load pre-registered plates
    try {
      const savedPlates = localStorage.getItem(LOCAL_STORAGE_PLATES_KEY);
      if (savedPlates) {
        this.plates = JSON.parse(savedPlates);
      } else {
        this.plates = [...INITIAL_PRE_REGISTERED_PLATES];
        localStorage.setItem(LOCAL_STORAGE_PLATES_KEY, JSON.stringify(this.plates));
      }
    } catch {
      this.plates = [...INITIAL_PRE_REGISTERED_PLATES];
    }

    // Load access records
    try {
      const savedRecords = localStorage.getItem(LOCAL_STORAGE_RECORDS_KEY);
      if (savedRecords) {
        this.records = JSON.parse(savedRecords);
      } else {
        this.records = [...INITIAL_VEHICLE_ACCESS_RECORDS];
        localStorage.setItem(LOCAL_STORAGE_RECORDS_KEY, JSON.stringify(this.records));
      }
    } catch {
      this.records = [...INITIAL_VEHICLE_ACCESS_RECORDS];
    }
  }

  private loadGateMode(): GateControlStatus['mode'] {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_GATE_MODE_KEY);
      if (saved && ['auto_whitelist', 'manual_approval', 'always_open', 'locked'].includes(saved)) {
        return saved as GateControlStatus['mode'];
      }
    } catch {
      // ignore
    }
    return 'auto_whitelist'; // Default to intelligent automated ALPR mode
  }

  public getPlates(): PreRegisteredPlate[] {
    return this.plates;
  }

  public addPlate(plate: Omit<PreRegisteredPlate, 'id' | 'registeredAt'>): PreRegisteredPlate {
    const newPlate: PreRegisteredPlate = {
      ...plate,
      id: `REG-${Date.now().toString().slice(-4)}`,
      registeredAt: new Date().toISOString().split('T')[0],
    };
    this.plates.unshift(newPlate);
    this.savePlates();
    return newPlate;
  }

  public removePlate(id: string): void {
    this.plates = this.plates.filter((p) => p.id !== id);
    this.savePlates();
  }

  public togglePlateAutoPass(id: string): void {
    const p = this.plates.find((item) => item.id === id);
    if (p) {
      p.autoPass = !p.autoPass;
      this.savePlates();
    }
  }

  private savePlates() {
    try {
      localStorage.setItem(LOCAL_STORAGE_PLATES_KEY, JSON.stringify(this.plates));
    } catch {
      // ignore
    }
  }

  public getRecords(): VehicleAccessRecord[] {
    return this.records;
  }

  public addRecord(record: Omit<VehicleAccessRecord, 'id' | 'timestamp'>): VehicleAccessRecord {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestampStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const newRecord: VehicleAccessRecord = {
      ...record,
      id: `AC-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${String(Math.floor(Math.random() * 900) + 100)}`,
      timestamp: timestampStr,
    };

    this.records.unshift(newRecord);
    if (record.direction === 'in') {
      this.gateStatus.totalTodayIn += 1;
      this.gateStatus.activeVehiclesInPark += 1;
    } else {
      this.gateStatus.totalTodayOut += 1;
      this.gateStatus.activeVehiclesInPark = Math.max(0, this.gateStatus.activeVehiclesInPark - 1);
    }
    this.gateStatus.lastPlateRecognized = record.plateNumber;
    this.gateStatus.lastPlateRecognitionTime = timestampStr;

    this.saveRecords();
    return newRecord;
  }

  private saveRecords() {
    try {
      localStorage.setItem(LOCAL_STORAGE_RECORDS_KEY, JSON.stringify(this.records));
    } catch {
      // ignore
    }
  }

  public checkPlateWhitelist(plateNumber: string): { isWhitelisted: boolean; plate?: PreRegisteredPlate } {
    const cleanPlate = plateNumber.trim().toUpperCase().replace(/·/g, '').replace(/\./g, '');
    const found = this.plates.find((p) => {
      const targetClean = p.plateNumber.trim().toUpperCase().replace(/·/g, '').replace(/\./g, '');
      return targetClean === cleanPlate;
    });

    if (found && found.autoPass) {
      return { isWhitelisted: true, plate: found };
    }
    return { isWhitelisted: false, plate: found };
  }

  public getGateStatus(): GateControlStatus {
    return this.gateStatus;
  }

  public setGateMode(mode: GateControlStatus['mode']): void {
    this.gateStatus.mode = mode;
    try {
      localStorage.setItem(LOCAL_STORAGE_GATE_MODE_KEY, mode);
    } catch {
      // ignore
    }
  }

  public setBarrierState(state: GateControlStatus['barrierState']): void {
    this.gateStatus.barrierState = state;
  }

  public exportAccessRecordsCsv(records: VehicleAccessRecord[]): void {
    const headers = [
      '记录流水号',
      '车牌号码',
      '出入方向',
      '通行时间',
      '承运任务',
      '目的区域',
      '车型品类',
      '核验放行方式',
      '驾驶员',
      '联系电话',
      '所属单位',
      '在园状态',
      '载货描述',
      '重量(kg)',
      '备注信息',
    ];

    const directionMap: Record<string, string> = {
      in: '入园驶入',
      out: '出园驶离',
    };

    const clearanceMap: Record<string, string> = {
      auto_whitelist: '白名单自动识别放行',
      manual_guard: '门卫人工审核放行',
      temp_permit: '临时访客报备放行',
      blocked: '黑名单/未授权拦截',
    };

    const statusMap: Record<string, string> = {
      in_park: '在园作业中',
      completed: '已完成离场',
      waiting_clearance: '闸口待放行',
    };

    const categoryMap: Record<string, string> = {
      reefer: '冷链物流车',
      utility: '园区电瓶转运车',
      supplies: '农资化肥送货车',
      machinery: '农机作业车',
      visitor: '考察访客车',
      emergency: '特种应急车',
    };

    const rows = records.map((r) => [
      r.id,
      r.plateNumber,
      directionMap[r.direction] || r.direction,
      r.timestamp,
      `"${(r.mission || '').replace(/"/g, '""')}"`,
      `"${(r.targetArea || '').replace(/"/g, '""')}"`,
      categoryMap[r.vehicleCategory] || r.vehicleCategory,
      clearanceMap[r.clearanceType] || r.clearanceType,
      r.driverName,
      r.driverPhone,
      `"${(r.company || '').replace(/"/g, '""')}"`,
      statusMap[r.status] || r.status,
      `"${(r.cargoDescription || '').replace(/"/g, '""')}"`,
      r.cargoWeightKg || '',
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `园区大门车辆出入通行台账_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const gateService = new GateService();
