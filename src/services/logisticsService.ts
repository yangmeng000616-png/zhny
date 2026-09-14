/**
 * Logistics & Shipment Management Service (进出货与仓储物流台账服务)
 * Tracks inbound supply procurements and outbound fresh produce sales
 */

export interface LogisticsRecord {
  id: string;
  recordNo: string; // e.g. 'OUT-20260914-01'
  type: 'outbound' | 'inbound'; // 出货 / 进货
  category: string; // '精品果蔬出库' | '生态水产出货' | '特种药材' | '高效水溶肥' | '优质水产饲料' | '无土基质' | '包装冷链材料' | '生物防治天敌';
  itemName: string; // e.g. '1#棚 普罗旺斯水果番茄(一级果)'
  specification: string; // e.g. '5kg 精品礼盒装'
  sourceOrDestination: string; // e.g. '盒马鲜生华东冷链中心仓'
  quantity: number;
  unit: string; // 'kg' | '吨' | '箱' | '袋' | '尾' | '套'
  unitPriceYuan?: number;
  totalAmountYuan: number;
  transportPlate: string; // e.g. '苏E·87A92 新能源冷藏货车'
  operator: string; // 经办人 / 司机 / 质检员
  inspector: string; // 质检合格员
  status: 'completed' | 'in_transit' | 'loading' | 'inspecting'; // 已完成 / 冷链在途 / 装车待发 / 质检审核中
  timestamp: string;
  notes?: string;
}

export interface LogisticsSummary {
  todayOutboundKg: number;
  todayOutboundAmountYuan: number;
  todayInboundBatches: number;
  todayInboundTons: number;
  inTransitVehicles: number;
}

class LogisticsService {
  private records: LogisticsRecord[] = [
    // ----------------- 出货记录 (Outbound Fresh Produce) -----------------
    {
      id: 'log_out_001',
      recordNo: 'OUT-20260914-01',
      type: 'outbound',
      category: '精品果蔬出库',
      itemName: '1# Venlo核心棚 普罗旺斯高糖水果番茄 (特级果)',
      specification: '2.5kg 定制通气保鲜礼盒 (糖度≥9.5°)',
      sourceOrDestination: '盒马鲜生华东冷链枢纽中心仓 (昆山)',
      quantity: 1600,
      unit: 'kg',
      unitPriceYuan: 28.0,
      totalAmountYuan: 44800,
      transportPlate: '苏E·87A92 新能源冷藏货车',
      operator: '李建军 (冷链特运组)',
      inspector: '张明 (农艺质检高级工程师)',
      status: 'in_transit',
      timestamp: '2026-09-14 07:45',
      notes: '全程温控 10-12℃，乙烯吸收保鲜垫，附带国家绿色有机溯源码。',
    },
    {
      id: 'log_out_002',
      recordNo: 'OUT-20260914-02',
      type: 'outbound',
      category: '精品果蔬出库',
      itemName: '2# 日光温室 高架红颜草莓 (头茬特等大果)',
      specification: '500g 独立气泡减震装 (单果重>32g)',
      sourceOrDestination: '百果园上海区域精品果品直配专柜',
      quantity: 480,
      unit: 'kg',
      unitPriceYuan: 76.0,
      totalAmountYuan: 36480,
      transportPlate: '苏E·3N281 恒温厢式货车',
      operator: '王海 (专车快运)',
      inspector: '林淑芬 (采摘品控员)',
      status: 'in_transit',
      timestamp: '2026-09-14 08:15',
      notes: '晨间低温带露采摘，未打防腐蜡，2小时直达前置仓。',
    },
    {
      id: 'log_out_003',
      recordNo: 'OUT-20260914-03',
      type: 'outbound',
      category: '精品果蔬出库',
      itemName: '3# 现代薄膜棚 活体带根水培奶油生菜与苦苣',
      specification: '根系保水杯装 (40株/箱)',
      sourceOrDestination: '海底捞华东生鲜加工与中央厨房中心',
      quantity: 950,
      unit: 'kg',
      unitPriceYuan: 14.5,
      totalAmountYuan: 13775,
      transportPlate: '园区02号 电动轻卡货车',
      operator: '陈明远 (园区物流)',
      inspector: '张明 (农艺质检高级工程师)',
      status: 'completed',
      timestamp: '2026-09-14 06:30',
      notes: '已于早晨08:00完成入库初验，无黄叶无农药残留。',
    },
    {
      id: 'log_out_004',
      recordNo: 'OUT-20260914-04',
      type: 'outbound',
      category: '生态水产出货',
      itemName: '6# 鱼菜共生生态棚 富硒加州鲈鱼 (活体标准级)',
      specification: '活体充氧保活车 (单条规格 500-650g)',
      sourceOrDestination: '叮咚买菜生鲜自营大仓 (苏州直供网点)',
      quantity: 650,
      unit: 'kg',
      unitPriceYuan: 34.0,
      totalAmountYuan: 22100,
      transportPlate: '苏E·91K08 专业活水增氧运输车',
      operator: '周师傅 (水产特运车队)',
      inspector: '赵工 (水质与水产检疫师)',
      status: 'loading',
      timestamp: '2026-09-14 09:10',
      notes: '车体车载水溶氧维持在 9.2mg/L，已出具产地水产检疫合格证。',
    },
    {
      id: 'log_out_005',
      recordNo: 'OUT-20260914-05',
      type: 'outbound',
      category: '特种药材',
      itemName: '8# 仿野生石斛棚 仿野生铁皮石斛鲜条 (含胶量高)',
      specification: '真空密封保鲜盒 (500g/盒)',
      sourceOrDestination: '北京同仁堂大健康药业专供基地',
      quantity: 85,
      unit: 'kg',
      unitPriceYuan: 380.0,
      totalAmountYuan: 32300,
      transportPlate: '顺丰冷链特快专递 SF1492049102',
      operator: '孙主管 (高附加值仓管)',
      inspector: '林博士 (中药生化研究员)',
      status: 'completed',
      timestamp: '2026-09-13 16:30',
      notes: '已由顺丰冷运专机送抵北京质检验收，多糖含量达到42.8%。',
    },

    // ----------------- 进货记录 (Inbound Supplies & Materials) -----------------
    {
      id: 'log_in_001',
      recordNo: 'IN-20260914-01',
      type: 'inbound',
      category: '高效水溶肥',
      itemName: '荷兰进口高纯度全水溶性复合肥 (高钾型 15-5-30+TE)',
      specification: '25kg/多层防潮铝箔复合袋 (EC导电率平稳)',
      sourceOrDestination: '荷兰易普润农业科技中国供销仓储库',
      quantity: 5000,
      unit: 'kg',
      unitPriceYuan: 13.8,
      totalAmountYuan: 69000,
      transportPlate: '鲁Q·63B81 重型仓栅半挂车',
      operator: '王建国 (仓储主管)',
      inspector: '刘农艺师 (肥效化验员)',
      status: 'completed',
      timestamp: '2026-09-14 08:30',
      notes: '批次检测水溶性达99.98%，重金属指标远低于国家限定，已入库水肥一体配肥库。',
    },
    {
      id: 'log_in_002',
      recordNo: 'IN-20260914-02',
      type: 'inbound',
      category: '优质水产饲料',
      itemName: '水产无公害高蛋白膨化浮水配合饲料 (粗蛋白≥44%)',
      specification: '20kg/防霉透气编织袋 (粒径2.5mm)',
      sourceOrDestination: '通威农牧水产饲料智能制造无锡厂',
      quantity: 3500,
      unit: 'kg',
      unitPriceYuan: 8.6,
      totalAmountYuan: 30100,
      transportPlate: '苏B·29F11 封闭式厢式货车',
      operator: '陈工 (水产技术部)',
      inspector: '赵工 (水质安全质检员)',
      status: 'completed',
      timestamp: '2026-09-14 07:10',
      notes: '含丰富免疫多糖与虾青素，已转移至生态循环鱼塘智能自动投饵机料塔。',
    },
    {
      id: 'log_in_003',
      recordNo: 'IN-20260914-03',
      type: 'inbound',
      category: '无土基质',
      itemName: '丹麦品氏托普进口脱盐泥炭椰糠复合无土栽培基质',
      specification: '70L 高压压缩包 (EC值<0.4, pH 5.8-6.2)',
      sourceOrDestination: '品氏托普(Pindstrup)青岛保税分拨中心',
      quantity: 600,
      unit: '袋',
      unitPriceYuan: 85.0,
      totalAmountYuan: 51000,
      transportPlate: '鲁U·58172 重型半挂牵引车',
      operator: '王建国 (仓储主管)',
      inspector: '张明 (农艺质检高级工程师)',
      status: 'completed',
      timestamp: '2026-09-13 14:20',
      notes: '供 4# 智能种苗繁育中心及 2# 草莓立体换茬基质更新使用。',
    },
    {
      id: 'log_in_004',
      recordNo: 'IN-20260914-04',
      type: 'inbound',
      category: '生物防治天敌',
      itemName: '荷兰科伯特授粉欧洲熊蜂标准群 (带智能糖水箱)',
      specification: '标准纸木复合蜂箱 (含工蜂60-80头)',
      sourceOrDestination: '科伯特(Koppert)生物技术中国繁育基地',
      quantity: 24,
      unit: '箱',
      unitPriceYuan: 420.0,
      totalAmountYuan: 10080,
      transportPlate: '顺丰航空专递 SF3981029411',
      operator: '林淑芬 (大棚班长)',
      inspector: '张明 (农艺质检高级工程师)',
      status: 'completed',
      timestamp: '2026-09-13 10:00',
      notes: '已平稳分置于 1# 番茄棚 (16箱) 和 2# 草莓棚 (8箱)，蜂群活力旺盛。',
    },
    {
      id: 'log_in_005',
      recordNo: 'IN-20260914-05',
      type: 'inbound',
      category: '包装冷链材料',
      itemName: '食品级生物降解玉米淀粉吸塑托盘与加厚瓦楞冷链外箱',
      specification: '番茄专用 500g 6孔托盘 + 5kg 加强瓦楞外箱',
      sourceOrDestination: '昆山绿源环保包装实业有限公司',
      quantity: 12000,
      unit: '套',
      unitPriceYuan: 2.1,
      totalAmountYuan: 25200,
      transportPlate: '苏E·45G28 货车',
      operator: '孙主管 (包装组)',
      inspector: '刘质检员',
      status: 'completed',
      timestamp: '2026-09-12 15:40',
      notes: '全部通过SGS食品级迁移检测，存放于冷链分选车间包材干燥恒温区。',
    },
    {
      id: 'log_in_006',
      recordNo: 'IN-20260914-06',
      type: 'inbound',
      category: '温室备品备件',
      itemName: '以色列耐特菲姆压力补偿式滴箭与抗堵微喷头总成',
      specification: '流量 2.0L/h (防滴漏附带承插锁扣)',
      sourceOrDestination: '耐特菲姆(Netafim)华东售后技术配件库',
      quantity: 1500,
      unit: '套',
      unitPriceYuan: 4.8,
      totalAmountYuan: 7200,
      transportPlate: '中通快运 7829104820',
      operator: '钱工 (设备电气工程师)',
      inspector: '钱工 (自检合格)',
      status: 'completed',
      timestamp: '2026-09-11 11:20',
      notes: '用于秋季灌溉管路日常预防性维护更换，留存仓库备用。',
    },
  ];

  public getRecords(): LogisticsRecord[] {
    return [...this.records];
  }

  public addRecord(record: Omit<LogisticsRecord, 'id' | 'recordNo'>): LogisticsRecord {
    const isOut = record.type === 'outbound';
    const prefix = isOut ? 'OUT' : 'IN';
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(this.records.length + 1).padStart(2, '0');
    const newRecord: LogisticsRecord = {
      ...record,
      id: `log_${Date.now()}`,
      recordNo: `${prefix}-${dateStr}-${seq}`,
    };
    this.records.unshift(newRecord);
    return newRecord;
  }

  public getSummary(): LogisticsSummary {
    const outboundList = this.records.filter((r) => r.type === 'outbound');
    const inboundList = this.records.filter((r) => r.type === 'inbound');

    const todayOutboundKg = outboundList
      .filter((r) => r.timestamp.startsWith('2026-09-14') && r.unit === 'kg')
      .reduce((sum, r) => sum + r.quantity, 0);

    const todayOutboundAmountYuan = outboundList
      .filter((r) => r.timestamp.startsWith('2026-09-14'))
      .reduce((sum, r) => sum + r.totalAmountYuan, 0);

    const todayInbound = inboundList.filter((r) => r.timestamp.startsWith('2026-09-14'));
    const todayInboundBatches = todayInbound.length;
    const todayInboundTons = Number(
      (
        todayInbound
          .filter((r) => r.unit === 'kg')
          .reduce((sum, r) => sum + r.quantity, 0) / 1000
      ).toFixed(1)
    );

    const inTransitVehicles = this.records.filter((r) => r.status === 'in_transit').length;

    return {
      todayOutboundKg,
      todayOutboundAmountYuan,
      todayInboundBatches,
      todayInboundTons,
      inTransitVehicles,
    };
  }

  /**
   * Export records to CSV / Excel readable string
   */
  public exportToCsv(): string {
    const headers = [
      '单据编号',
      '类型',
      '品类分类',
      '货品名称与品级',
      '包装规格',
      '来源/收货目的地',
      '数量',
      '单位',
      '单价(元)',
      '总金额(元)',
      '运送工具/车牌号',
      '经办人/司机',
      '质检员',
      '状态',
      '记录时间',
      '备注说明',
    ];

    const rows = this.records.map((r) => [
      `"${r.recordNo}"`,
      `"${r.type === 'outbound' ? '出货(销售)' : '进货(农资采购)'}"`,
      `"${r.category}"`,
      `"${r.itemName}"`,
      `"${r.specification}"`,
      `"${r.sourceOrDestination}"`,
      r.quantity,
      `"${r.unit}"`,
      r.unitPriceYuan || '-',
      r.totalAmountYuan,
      `"${r.transportPlate}"`,
      `"${r.operator}"`,
      `"${r.inspector}"`,
      `"${
        r.status === 'completed'
          ? '已完成/入库'
          : r.status === 'in_transit'
          ? '冷链在途'
          : r.status === 'loading'
          ? '装车待发'
          : '质检审核中'
      }"`,
      `"${r.timestamp}"`,
      `"${r.notes || ''}"`,
    ]);

    // Add BOM for UTF-8 Excel Chinese character support
    return '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
  }
}

export const logisticsService = new LogisticsService();
export default logisticsService;
