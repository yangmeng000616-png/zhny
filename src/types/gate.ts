export type PlateColor = 'green' | 'blue' | 'yellow' | 'white';

export type VehicleCategory =
  | 'reefer' // 冷链物流货车
  | 'utility' // 园区内部电瓶转运车
  | 'supplies' // 农资化肥配送货车
  | 'machinery' // 农机植保作业车
  | 'visitor' // 考察研学/商务访客车
  | 'emergency'; // 应急消防/供电车

export interface VehicleAccessRecord {
  id: string;
  plateNumber: string;
  plateColor: PlateColor;
  vehicleCategory: VehicleCategory;
  vehicleModel: string; // e.g. "福田智蓝 4.2米 新能源冷藏车"
  driverName: string;
  driverPhone: string;
  company: string; // e.g. "盒马鲜生华东生鲜冷链车队"
  direction: 'in' | 'out';
  timestamp: string; // e.g. "2026-09-14 09:42:18"
  mission: string; // e.g. "5#高糖番茄温室采收提货，发往盒马鲜生华东中心仓"
  targetArea: string; // e.g. "5#智能化温室 / 冷链配送中心"
  clearanceType: 'auto_whitelist' | 'manual_guard' | 'temp_permit' | 'blocked';
  status: 'in_park' | 'completed' | 'waiting_clearance';
  cargoDescription?: string;
  cargoWeightKg?: number;
  notes?: string;
}

export interface PreRegisteredPlate {
  id: string;
  plateNumber: string;
  plateColor: PlateColor;
  vehicleCategory: VehicleCategory;
  driverName: string;
  driverPhone: string;
  company: string;
  defaultMission: string;
  authorizedUntil: string; // e.g. "2027-12-31" or "长期有效"
  autoPass: boolean; // 是否免手动确认自动抬杆
  registeredAt: string;
  notes?: string;
}

export interface GateControlStatus {
  barrierState: 'lowered' | 'raised' | 'raising' | 'lowering';
  mode: 'auto_whitelist' | 'manual_approval' | 'always_open' | 'locked';
  lastPlateRecognized: string | null;
  lastPlateRecognitionTime: string | null;
  currentVehicleAtGate: VehicleAccessRecord | null;
  totalTodayIn: number;
  totalTodayOut: number;
  activeVehiclesInPark: number;
}
