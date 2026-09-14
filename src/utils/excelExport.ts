/**
 * Excel / CSV Data Export Utility for Smart Agricultural Digital Twin
 * Encodes CSV with UTF-8 BOM (\uFEFF) to ensure 100% compatibility with
 * Microsoft Excel, WPS Office, Apple Numbers, and OpenOffice without Chinese garbled text.
 */

import type {
  PondFeedingRecord,
  EnvironmentalHistoryLog,
  FarmingRecord,
  FarmEnergyRecord,
  FarmInventoryItem,
  FarmLaborRecord,
  FarmHarvestSalesRecord,
} from '../types/digitalTwin';

/**
 * Triggers a browser download of CSV text
 */
export function downloadCsv(filename: string, csvContent: string): void {
  // \uFEFF is UTF-8 Byte Order Mark for Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape CSV field to handle quotes, commas, and line breaks
 */
function escapeCsvField(field: unknown): string {
  if (field === null || field === undefined) {
    return '""';
  }
  const str = String(field).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}ye

/**
 * 1. 导出生态鱼塘喂食与水质监测历史台账 (Excel CSV)
 */
export function exportFishPondFeedingCsv(records: PondFeedingRecord[]): void {
  const headers = [
    '记录编号',
    '投喂时间',
    '鱼塘区域',
    '养殖鱼种',
    '饲料品名与配方',
    '投喂重量(kg)',
    '投喂方式',
    '鱼群摄食活力',
    '投喂时水温(℃)',
    '溶解氧DO(mg/L)',
    '氨氮NH3-N(mg/L)',
    '酸碱度pH',
    '残饵清理状态',
    '投喂操作人',
    '技术备注与水质巡查',
  ];

  const rows = records.map((r) => [
    escapeCsvField(r.id),
    escapeCsvField(r.timestamp),
    escapeCsvField(r.pondZone),
    escapeCsvField(r.species),
    escapeCsvField(r.feedType),
    escapeCsvField(r.feedAmountKg),
    escapeCsvField(r.feedingMethod),
    escapeCsvField(r.appetiteRating),
    escapeCsvField(r.waterTemp),
    escapeCsvField(r.dissolvedOxygen),
    escapeCsvField(r.ammoniaNitrogen),
    escapeCsvField(r.ph),
    escapeCsvField(r.feedRemainingStatus),
    escapeCsvField(r.operator),
    escapeCsvField(r.notes || '正常投喂，无异常'),
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const now = new Date().toISOString().slice(0, 10);
  downloadCsv(`现代农业园区_生态鱼塘投喂与水质监测台账_${now}.csv`, csv);
}

/**
 * 2. 导出各区域/大棚温湿度生境历史记录 (Excel CSV)
 */
export function exportEnvironmentalHistoryCsv(
  logs: EnvironmentalHistoryLog[],
  titlePrefix = '全区域生境'
): void {
  const headers = [
    '监测时间戳',
    '区域标识',
    '大棚/区域名称',
    '空气/水体温度(℃)',
    '根区基质温度(℃)',
    '空气相对湿度(%)',
    'CO2浓度(ppm)',
    '光照度/辐射量(Lux/W/m²)',
    '水汽压亏缺VPD(kPa)',
    '当日有效积温(℃·d)',
  ];

  const rows = logs.map((log) => [
    escapeCsvField(log.timestamp),
    escapeCsvField(log.locationId),
    escapeCsvField(log.locationName),
    escapeCsvField(log.airTemp),
    escapeCsvField(log.substrateTemp ?? '-'),
    escapeCsvField(log.airHumidity),
    escapeCsvField(log.co2 ?? '-'),
    escapeCsvField(log.solarRadiation ?? '-'),
    escapeCsvField(log.vpd ?? '-'),
    escapeCsvField(log.accumulatedGdd ?? '-'),
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const now = new Date().toISOString().slice(0, 10);
  downloadCsv(`现代农业园区_${titlePrefix}_温度与微气候历史数据_${now}.csv`, csv);
}

/**
 * 3. 导出全园水肥药生产农事作业台账 (Excel CSV)
 */
export function exportFarmingOperationsCsv(records: FarmingRecord[]): void {
  const headers = [
    '农事流水号',
    '执行时间',
    '所属大棚',
    '作物品种',
    '作业类别',
    '农事作业标题',
    '经办操作人员',
    '执行状态',
    '浇水灌溉方式',
    '浇水用水量(L)',
    '灌前基质墒情(%)',
    '灌后基质墒情(%)',
    '水肥配方名称',
    '施肥用量(kg)',
    '实测出流EC',
    '实测出流pH',
    '植保药剂/天敌品名',
    '防治靶标病虫害',
    '安全采收间隔期PHI(天)',
    '采收批次号',
    '采收总重(kg)',
    '品质品级',
    '糖度(°Brix)',
    '溯源追溯码',
    '农艺备注',
  ];

  const rows = records.map((r) => [
    escapeCsvField(r.id),
    escapeCsvField(r.timestamp),
    escapeCsvField(r.greenhouseName),
    escapeCsvField(r.cropName),
    escapeCsvField(
      r.type === 'irrigation' ? '浇水灌溉' :
      r.type === 'fertilization' ? '水肥配肥' :
      r.type === 'pesticide' ? '绿色植保' :
      r.type === 'harvest' ? '采收质检' : '整枝农艺'
    ),
    escapeCsvField(r.title),
    escapeCsvField(r.operator),
    escapeCsvField(r.status === 'completed' ? '已执行留痕' : '进行中'),
    escapeCsvField(r.irrigationDetails?.method || '-'),
    escapeCsvField(r.irrigationDetails?.waterVolumeL || '-'),
    escapeCsvField(r.irrigationDetails?.soilMoistureBefore || '-'),
    escapeCsvField(r.irrigationDetails?.soilMoistureAfter || '-'),
    escapeCsvField(r.fertilizationDetails?.formula || '-'),
    escapeCsvField(r.fertilizationDetails?.fertilizerAmountKg || '-'),
    escapeCsvField(r.fertilizationDetails?.measuredEc || '-'),
    escapeCsvField(r.fertilizationDetails?.measuredPh || '-'),
    escapeCsvField(r.pesticideDetails?.agentName || '-'),
    escapeCsvField(r.pesticideDetails?.targetPest || '-'),
    escapeCsvField(r.pesticideDetails?.safetyIntervalDays ?? '-'),
    escapeCsvField(r.harvestDetails?.batchNumber || '-'),
    escapeCsvField(r.harvestDetails?.harvestWeightKg || '-'),
    escapeCsvField(r.harvestDetails?.qualityGrade || '-'),
    escapeCsvField(r.harvestDetails?.sugarBrix || '-'),
    escapeCsvField(r.harvestDetails?.traceabilityCode || '-'),
    escapeCsvField(r.notes || '-'),
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const now = new Date().toISOString().slice(0, 10);
  downloadCsv(`现代农业园区_水肥药农事作业总台账_${now}.csv`, csv);
}

/**
 * 4. 导出能源能耗与水资源消耗报表
 */
export function exportFarmEnergyCsv(records: FarmEnergyRecord[]): void {
  const headers = [
    '日期',
    '大棚/设施名称',
    '市电电网消耗(度/kWh)',
    '光伏清洁绿电消纳(度/kWh)',
    '农业生产用水(m³)',
    '清洁减碳量(kg)',
    '综合能耗成本支出(元)',
  ];

  const rows = records.map((r) => [
    escapeCsvField(r.date),
    escapeCsvField(r.locationName),
    escapeCsvField(r.gridElectricityKwh),
    escapeCsvField(r.solarGreenElectricityKwh),
    escapeCsvField(r.waterUsageM3),
    escapeCsvField(r.carbonOffsetKg),
    escapeCsvField(r.estimatedCostYuan),
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const now = new Date().toISOString().slice(0, 10);
  downloadCsv(`现代农业园区_能耗水电与双碳减排报表_${now}.csv`, csv);
}

/**
 * 5. 导出农资农药肥料饲料库存台账
 */
export function exportFarmInventoryCsv(items: FarmInventoryItem[]): void {
  const headers = [
    '物品编号',
    '类别',
    '农资品名',
    '规格型号',
    '当前在库数量',
    '单位',
    '安全库存警戒线',
    '单价(元)',
    '库存总价值(元)',
    '主要供应商',
    '最近补仓日期',
  ];

  const rows = items.map((i) => [
    escapeCsvField(i.id),
    escapeCsvField(i.category),
    escapeCsvField(i.name),
    escapeCsvField(i.specification),
    escapeCsvField(i.currentStock),
    escapeCsvField(i.unit),
    escapeCsvField(i.safetyStock),
    escapeCsvField(i.unitCostYuan),
    escapeCsvField((i.currentStock * i.unitCostYuan).toFixed(2)),
    escapeCsvField(i.supplier),
    escapeCsvField(i.lastRestockDate),
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const now = new Date().toISOString().slice(0, 10);
  downloadCsv(`现代农业园区_农资肥料饲料库存台账_${now}.csv`, csv);
}

/**
 * 6. 导出农工工时工作量明细
 */
export function exportFarmLaborCsv(records: FarmLaborRecord[]): void {
  const headers = [
    '工单编号',
    '派工日期',
    '责任农工姓名',
    '作业大棚/地块',
    '农事工种类型',
    '工时(小时)',
    '完成工作量(株/盘/箱)',
    '质检考评等级',
    '带班验收人',
  ];

  const rows = records.map((r) => [
    escapeCsvField(r.id),
    escapeCsvField(r.date),
    escapeCsvField(r.workerName),
    escapeCsvField(r.greenhouseName),
    escapeCsvField(r.taskType),
    escapeCsvField(r.hoursSpent),
    escapeCsvField(r.quantityCompleted),
    escapeCsvField(r.efficiencyRating),
    escapeCsvField(r.inspector),
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const now = new Date().toISOString().slice(0, 10);
  downloadCsv(`现代农业园区_农工派工与工时台账_${now}.csv`, csv);
}

/**
 * 7. 导出采收出库与订单销售报表
 */
export function exportFarmSalesCsv(records: FarmHarvestSalesRecord[]): void {
  const headers = [
    '销售订单号',
    '采收批次号',
    '作物品名',
    '产出大棚',
    '采收出库日期',
    '品质品级',
    '出库净重(kg)',
    '采购渠道客户',
    '销售单价(元/kg)',
    '订单总金额(元)',
    '区块链溯源码',
  ];

  const rows = records.map((r) => [
    escapeCsvField(r.id),
    escapeCsvField(r.batchNo),
    escapeCsvField(r.cropName),
    escapeCsvField(r.greenhouseName),
    escapeCsvField(r.harvestDate),
    escapeCsvField(r.grade),
    escapeCsvField(r.weightKg),
    escapeCsvField(r.buyerChannel),
    escapeCsvField(r.unitPriceYuan),
    escapeCsvField(r.totalRevenueYuan),
    escapeCsvField(r.traceabilityCode),
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const now = new Date().toISOString().slice(0, 10);
  downloadCsv(`现代农业园区_采收出库与销售订单台账_${now}.csv`, csv);
}

/**
 * 8. 农场负责人综合生产经营一键总导出 (整合多表合一的高管报表)
 */
export function exportMasterEnterpriseReportCsv(options: {
  feedingRecords: PondFeedingRecord[];
  farmingRecords: FarmingRecord[];
  historyLogs: EnvironmentalHistoryLog[];
  energyRecords: FarmEnergyRecord[];
  salesRecords: FarmHarvestSalesRecord[];
}): void {
  const now = new Date().toISOString().slice(0, 10);
  const sections: string[] = [];

  // SECTION 1: 园区生产概览
  sections.push('=== 现代智能温室农业示范园区 - 生产经营综合管理决策总报表 ===');
  sections.push(`生成时间,${new Date().toLocaleString('zh-CN')}`);
  sections.push(`总大棚数,8座智能温室`);
  sections.push(`配套设施,生态河塘鱼塘 / 冷链物流分选中心 / 光伏发电站 / 智能机巢 / 水肥中控`);
  sections.push('');

  // SECTION 2: 鱼塘喂食近况
  sections.push('--- [第一部分] 生态鱼塘与水产投喂监控记录 ---');
  sections.push('时间,区域,鱼种,饲料,投喂量(kg),摄食活力,水温(℃),溶氧DO(mg/L),氨氮(mg/L),pH,操作人');
  options.feedingRecords.forEach((f) => {
    sections.push(
      [
        escapeCsvField(f.timestamp),
        escapeCsvField(f.pondZone),
        escapeCsvField(f.species),
        escapeCsvField(f.feedType),
        escapeCsvField(f.feedAmountKg),
        escapeCsvField(f.appetiteRating),
        escapeCsvField(f.waterTemp),
        escapeCsvField(f.dissolvedOxygen),
        escapeCsvField(f.ammoniaNitrogen),
        escapeCsvField(f.ph),
        escapeCsvField(f.operator),
      ].join(',')
    );
  });
  sections.push('');

  // SECTION 3: 近期农事水肥药
  sections.push('--- [第二部分] 智能温室水肥药作业台账 ---');
  sections.push('时间,大棚,作物,农事类型,作业标题,用水(L),用肥(kg),药剂品名,操作人');
  options.farmingRecords.slice(0, 30).forEach((r) => {
    sections.push(
      [
        escapeCsvField(r.timestamp),
        escapeCsvField(r.greenhouseName),
        escapeCsvField(r.cropName),
        escapeCsvField(r.type),
        escapeCsvField(r.title),
        escapeCsvField(r.irrigationDetails?.waterVolumeL ?? '-'),
        escapeCsvField(r.fertilizationDetails?.fertilizerAmountKg ?? '-'),
        escapeCsvField(r.pesticideDetails?.agentName ?? '-'),
        escapeCsvField(r.operator),
      ].join(',')
    );
  });
  sections.push('');

  // SECTION 4: 采收与销售营收
  sections.push('--- [第三部分] 采收出库与订单销售业绩 ---');
  sections.push('采收日期,批次号,作物,产出大棚,重量(kg),客户渠道,单价(元/kg),总金额(元)');
  options.salesRecords.forEach((s) => {
    sections.push(
      [
        escapeCsvField(s.harvestDate),
        escapeCsvField(s.batchNo),
        escapeCsvField(s.cropName),
        escapeCsvField(s.greenhouseName),
        escapeCsvField(s.weightKg),
        escapeCsvField(s.buyerChannel),
        escapeCsvField(s.unitPriceYuan),
        escapeCsvField(s.totalRevenueYuan),
      ].join(',')
    );
  });

  const fullCsv = sections.join('\r\n');
  downloadCsv(`现代农业园区_负责人综合生产经营决策总台账_${now}.csv`, fullCsv);
}
