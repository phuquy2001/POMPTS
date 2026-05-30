import { promises as fs } from 'fs';
import path from 'path';
import { 
  Product, 
  WorkCenter, 
  ProductionOrder, 
  DefectReport, 
  AndonAlarm, 
  MaterialIssue, 
  RPASimulationLog,
  BOMItem,
  RoutingStep,
  OrderStatus,
  DashboardStats
} from '../types';

interface DatabaseSchema {
  products: Product[];
  workCenters: WorkCenter[];
  productionOrders: ProductionOrder[];
  defectReports: DefectReport[];
  andonAlarms: AndonAlarm[];
  materialIssues: MaterialIssue[];
  rpaSimulationLogs: RPASimulationLog[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'database.json');

// Real industrial initial data matching Wanek Furniture's workflow
const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', code: 'SP-SOFA-LUX', name: 'Sofa Góc Luxury Da Bò sành điệu (WS-01)', sku: 'WN-SOFA-001', category: 'Sofa' },
  { id: 'p2', code: 'SP-TABLE-OAK', name: 'Bàn Ăn Gỗ Sồi Chun Wanek (WT-02)', sku: 'WN-TABL-002', category: 'Bàn ăn' },
  { id: 'p3', code: 'SP-ARM-ITALY', name: 'Ghế Armchair Da Ý cao cấp (WA-03)', sku: 'WN-ARMC-003', category: 'Ghế bọc nệm' },
  { id: 'p4', code: 'SP-BED-PINE', name: 'Giường Ngủ Gỗ Thông Hàn Quốc (WB-04)', sku: 'WN-BEDS-004', category: 'Giường ngủ' }
];

const INITIAL_WORK_CENTERS: WorkCenter[] = [
  { id: 'wc1', code: 'WC001-CUT', name: 'Tổ 1: Cắt & Tạo Phôi Gỗ', status: 'ACTIVE', operatorName: 'Nguyễn Văn Hùng' },
  { id: 'wc2', code: 'WC002-DRI', name: 'Tổ 2: Gia Công Khoan Chi Tiết', status: 'IDLE', operatorName: 'Trần Thanh Hải' },
  { id: 'wc3', code: 'WC003-ASM', name: 'Tổ 3: Lắp Ráp Khung Sườn', status: 'ACTIVE', operatorName: 'Phạm Minh Quân' },
  { id: 'wc4', code: 'WC004-UPH', name: 'Tổ 4: May May & May May & May May & May May & May May', status: 'ACTIVE', operatorName: 'Lê Tuấn Anh' }, // May vỏ & Bọc nệm
  { id: 'wc5', code: 'WC005-FIN', name: 'Tổ 5: Sơn Phủ bóng PU', status: 'ACTIVE', operatorName: 'Hoàng Văn Đức' },
  { id: 'wc6', code: 'WC006-PKG', name: 'Tổ 6: Kiểm Tra QA & Đóng Gói', status: 'ACTIVE', operatorName: 'Đỗ Minh Khải' }
];

// Seed standard BOM materials template per single unit
const BOM_TEMPLATE: Record<string, { materialName: string; unit: string; qtyPerUnit: number }[]> = {
  'SP-SOFA-LUX': [
    { materialName: 'Gỗ thông tấm tự nhiên', unit: 'm3', qtyPerUnit: 0.12 },
    { materialName: 'Vải nỉ dệt/Da mỏng cao cấp', unit: 'm2', qtyPerUnit: 7.5 },
    { materialName: 'Vít xoắn xoắn thép mạ kẽm', unit: 'Cái', qtyPerUnit: 35 },
    { materialName: 'Sơn PU chống trầy xước', unit: 'Lít', qtyPerUnit: 1.2 },
    { materialName: 'Keo sữa lắp ráp WoodGlue', unit: 'Lít', qtyPerUnit: 0.5 }
  ],
  'SP-TABLE-OAK': [
    { materialName: 'Gỗ sồi khối nhập khẩu', unit: 'm3', qtyPerUnit: 0.22 },
    { materialName: 'Vít xoắn xoắn thép mạ kẽm', unit: 'Cái', qtyPerUnit: 24 },
    { materialName: 'Sơn PU chống trầy xước', unit: 'Lít', qtyPerUnit: 1.8 },
    { materialName: 'Keo sữa lắp ráp WoodGlue', unit: 'Lít', qtyPerUnit: 0.8 }
  ],
  'SP-ARM-ITALY': [
    { materialName: 'Gỗ sồi tấm xẻ sấy', unit: 'm3', qtyPerUnit: 0.05 },
    { materialName: 'May vỏ bọc da Ý cao cấp', unit: 'm2', qtyPerUnit: 4.8 },
    { materialName: 'Vít xoắn xoắn thép mạ kẽm', unit: 'Cái', qtyPerUnit: 18 },
    { materialName: 'Sơn PU chống trầy xước', unit: 'Lít', qtyPerUnit: 0.6 },
    { materialName: 'Keo sữa lắp ráp WoodGlue', unit: 'Lít', qtyPerUnit: 0.3 }
  ],
  'SP-BED-PINE': [
    { materialName: 'Gỗ thông tấm tự nhiên', unit: 'm3', qtyPerUnit: 0.18 },
    { materialName: 'Vít xoắn xoắn thép mạ kẽm', unit: 'Cái', qtyPerUnit: 28 },
    { materialName: 'Sơn PU chống trầy xước', unit: 'Lít', qtyPerUnit: 1.0 },
    { materialName: 'Keo sữa lắp ráp WoodGlue', unit: 'Lít', qtyPerUnit: 0.4 }
  ]
};

// Generate full BOM standard lines based on product code and batch quantity
export function generateBOMForOrder(productCode: string, qty: number): BOMItem[] {
  const templates = BOM_TEMPLATE[productCode] || BOM_TEMPLATE['SP-SOFA-LUX'];
  return templates.map((t, idx) => ({
    id: `bom-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
    materialName: t.materialName,
    unit: t.unit,
    plannedQty: Number((t.qtyPerUnit * qty).toFixed(2)),
    actualQtyUsed: 0
  }));
}

// Generate the standard industrial routing for a product
export function generateRoutingForOrder(qty: number): RoutingStep[] {
  return [
    { workCenterCode: 'WC001-CUT', stepName: 'Cắt Phôi & Xẻ Gỗ', stepOrder: 1, status: 'PENDING', completedQty: 0, targetQty: qty },
    { workCenterCode: 'WC002-DRI', stepName: 'Khoan định hình chi tiết', stepOrder: 2, status: 'PENDING', completedQty: 0, targetQty: qty },
    { workCenterCode: 'WC003-ASM', stepName: 'Ráp khung sườn chịu lực', stepOrder: 3, status: 'PENDING', completedQty: 0, targetQty: qty },
    { workCenterCode: 'WC004-UPH', stepName: 'Bọc đệm, nệm & May bọc', stepOrder: 4, status: 'PENDING', completedQty: 0, targetQty: qty },
    { workCenterCode: 'WC005-FIN', stepName: 'Sơn phủ bảo vệ PU nhám', stepOrder: 5, status: 'PENDING', completedQty: 0, targetQty: qty },
    { workCenterCode: 'WC006-PKG', stepName: 'KCS, Kiểm Tra QC & Đóng thùng', stepOrder: 6, status: 'PENDING', completedQty: 0, targetQty: qty }
  ];
}

const DEFAULT_DB: DatabaseSchema = {
  products: INITIAL_PRODUCTS,
  workCenters: INITIAL_WORK_CENTERS,
  productionOrders: [
    {
      id: 'ord-101',
      orderNumber: 'LSX-2026-001',
      productCode: 'SP-SOFA-LUX',
      productName: 'Sofa Góc Luxury Da Bò sành điệu (WS-01)',
      qtyOrdered: 100,
      status: 'IN_PROGRESS',
      plannedStartDate: '2026-05-20',
      plannedEndDate: '2026-06-05',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      routing: [
        { workCenterCode: 'WC001-CUT', stepName: 'Cắt Phôi & Xẻ Gỗ', stepOrder: 1, status: 'COMPLETED', completedQty: 100, targetQty: 100, operatorName: 'Nguyễn Văn Hùng', updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
        { workCenterCode: 'WC002-DRI', stepName: 'Khoan định hình chi tiết', stepOrder: 2, status: 'COMPLETED', completedQty: 100, targetQty: 100, operatorName: 'Trần Thanh Hải', updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        { workCenterCode: 'WC003-ASM', stepName: 'Ráp khung sườn chịu lực', stepOrder: 3, status: 'IN_PROGRESS', completedQty: 45, targetQty: 100, operatorName: 'Phạm Minh Quân', updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
        { workCenterCode: 'WC004-UPH', stepName: 'Bọc đệm, nệm & May bọc', stepOrder: 4, status: 'PENDING', completedQty: 0, targetQty: 100 },
        { workCenterCode: 'WC005-FIN', stepName: 'Sơn phủ bảo vệ PU nhám', stepOrder: 5, status: 'PENDING', completedQty: 0, targetQty: 100 },
        { workCenterCode: 'WC006-PKG', stepName: 'KCS, Kiểm Tra QC & Đóng thùng', stepOrder: 6, status: 'PENDING', completedQty: 0, targetQty: 100 }
      ],
      bom: [
        { id: 'b1', materialName: 'Gỗ thông tấm tự nhiên', unit: 'm3', plannedQty: 12.0, actualQtyUsed: 12.5 }, // 0.5 m3 excess waste logged (Issue)
        { id: 'b2', materialName: 'Vải nỉ dệt/Da mỏng cao cấp', unit: 'm2', plannedQty: 750.0, actualQtyUsed: 400.0 }, // partially used
        { id: 'b3', materialName: 'Vít xoắn xoắn thép mạ kẽm', unit: 'Cái', plannedQty: 3500, actualQtyUsed: 3550 }, // 50 excess defects
        { id: 'b4', materialName: 'Sơn PU chống trầy xước', unit: 'Lít', plannedQty: 120.0, actualQtyUsed: 60.0 },
        { id: 'b5', materialName: 'Keo sữa lắp ráp WoodGlue', unit: 'Lít', plannedQty: 50.0, actualQtyUsed: 35.0 }
      ]
    },
    {
      id: 'ord-102',
      orderNumber: 'LSX-2026-002',
      productCode: 'SP-TABLE-OAK',
      productName: 'Bàn Ăn Gỗ Sồi Chun Wanek (WT-02)',
      qtyOrdered: 40,
      status: 'RELEASED',
      plannedStartDate: '2026-05-28',
      plannedEndDate: '2026-06-12',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      routing: [
        { workCenterCode: 'WC001-CUT', stepName: 'Cắt Phôi & Xẻ Gỗ', stepOrder: 1, status: 'IN_PROGRESS', completedQty: 15, targetQty: 40, operatorName: 'Nguyễn Văn Hùng', updatedAt: new Date().toISOString() },
        { workCenterCode: 'WC002-DRI', stepName: 'Khoan định hình chi tiết', stepOrder: 2, status: 'PENDING', completedQty: 0, targetQty: 40 },
        { workCenterCode: 'WC003-ASM', stepName: 'Ráp khung sườn chịu lực', stepOrder: 3, status: 'PENDING', completedQty: 0, targetQty: 40 },
        { workCenterCode: 'WC004-UPH', stepName: 'Bọc đệm, nệm & May bọc', stepOrder: 4, status: 'PENDING', completedQty: 0, targetQty: 40 },
        { workCenterCode: 'WC005-FIN', stepName: 'Sơn phủ bảo vệ PU nhám', stepOrder: 5, status: 'PENDING', completedQty: 0, targetQty: 40 },
        { workCenterCode: 'WC006-PKG', stepName: 'KCS, Kiểm Tra QC & Đóng thùng', stepOrder: 6, status: 'PENDING', completedQty: 0, targetQty: 40 }
      ],
      bom: [
        { id: 'b6', materialName: 'Gỗ sồi khối nhập khẩu', unit: 'm3', plannedQty: 8.8, actualQtyUsed: 3.5 },
        { id: 'b7', materialName: 'Vít xoắn xoắn thép mạ kẽm', unit: 'Cái', plannedQty: 960, actualQtyUsed: 300 },
        { id: 'b8', materialName: 'Sơn PU chống trầy xước', unit: 'Lít', plannedQty: 72.0, actualQtyUsed: 0 },
        { id: 'b9', materialName: 'Keo sữa lắp ráp WoodGlue', unit: 'Lít', plannedQty: 32.0, actualQtyUsed: 2.0 }
      ]
    },
    {
      id: 'ord-103',
      orderNumber: 'LSX-2026-003',
      productCode: 'SP-ARM-ITALY',
      productName: 'Ghế Armchair Da Ý cao cấp (WA-03)',
      qtyOrdered: 150,
      status: 'COMPLETED',
      plannedStartDate: '2026-05-10',
      plannedEndDate: '2026-05-25',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      routing: [
        { workCenterCode: 'WC001-CUT', stepName: 'Cắt Phôi & Xẻ Gỗ', stepOrder: 1, status: 'COMPLETED', completedQty: 150, targetQty: 150, operatorName: 'Nguyễn Văn Hùng', updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
        { workCenterCode: 'WC002-DRI', stepName: 'Khoan định hình chi tiết', stepOrder: 2, status: 'COMPLETED', completedQty: 150, targetQty: 150, operatorName: 'Trần Thanh Hải', updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
        { workCenterCode: 'WC003-ASM', stepName: 'Ráp khung sườn chịu lực', stepOrder: 3, status: 'COMPLETED', completedQty: 150, targetQty: 150, operatorName: 'Phạm Minh Quân', updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
        { workCenterCode: 'WC004-UPH', stepName: 'Bọc đệm, nệm & May bọc', stepOrder: 4, status: 'COMPLETED', completedQty: 150, targetQty: 150, operatorName: 'Lê Tuấn Anh', updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
        { workCenterCode: 'WC005-FIN', stepName: 'Sơn phủ bảo vệ PU nhám', stepOrder: 5, status: 'COMPLETED', completedQty: 150, targetQty: 150, operatorName: 'Hoàng Văn Đức', updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
        { workCenterCode: 'WC006-PKG', stepName: 'KCS, Kiểm Tra QC & Đóng thùng', stepOrder: 6, status: 'COMPLETED', completedQty: 150, targetQty: 150, operatorName: 'Đỗ Minh Khải', updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
      ],
      bom: [
        { id: 'b10', materialName: 'Gỗ sồi tấm xẻ sấy', unit: 'm3', plannedQty: 7.5, actualQtyUsed: 7.6 }, // 0.1 excess
        { id: 'b11', materialName: 'May vỏ bọc da Ý cao cấp', unit: 'm2', plannedQty: 720.0, actualQtyUsed: 742.0 }, // 22 m2 excess due to leather stitching scrap
        { id: 'b12', materialName: 'Vít xoắn xoắn thép mạ kẽm', unit: 'Cái', plannedQty: 2700, actualQtyUsed: 2720 },
        { id: 'b13', materialName: 'Sơn PU chống trầy xước', unit: 'Lít', plannedQty: 90.0, actualQtyUsed: 88.5 }, // saved paint!
        { id: 'b14', materialName: 'Keo sữa lắp ráp WoodGlue', unit: 'Lít', plannedQty: 45.0, actualQtyUsed: 46.0 }
      ]
    }
  ],
  defectReports: [
    { id: 'def-01', orderId: 'ord-101', orderNumber: 'LSX-2026-001', workCenterCode: 'WC001-CUT', defectType: 'Gỗ nứt nẹp mắt sâu', quantity: 2, reportedBy: 'Nguyễn Văn Hùng', reportedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), resolved: true, notes: 'Đã loại bỏ phôi nứt, cấp xẻ bù phôi mới.' },
    { id: 'def-02', orderId: 'ord-101', orderNumber: 'LSX-2026-001', workCenterCode: 'WC003-ASM', defectType: 'Lệch góc sườn ráp 3mm', quantity: 1, reportedBy: 'Phạm Minh Quân', reportedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), resolved: false, notes: 'Đang mở vít ráp căn chỉnh lại lề góc vuông.' }
  ],
  andonAlarms: [
    {
      id: 'alarm-01',
      orderId: 'ord-101',
      orderNumber: 'LSX-2026-001',
      workCenterCode: 'WC003-ASM',
      workCenterName: 'Tổ 3: Lắp Ráp Khung Sườn',
      alarmType: 'MATERIAL',
      severity: 'CRITICAL',
      message: 'Thiếu gỗ thông ván ráp vách tựa đầu, xin cấp kho gấp để tổ lắp ráp tiếp tiến độ!',
      status: 'ACTIVE',
      triggeredAt: new Date(Date.now() - 4 * 60 * 1000).toISOString()
    }
  ],
  materialIssues: [
    { id: 'iss-01', orderId: 'ord-101', orderNumber: 'LSX-2026-001', materialName: 'Gỗ thông tấm tự nhiên', issuedQty: 12.0, unit: 'm3', issuedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), operatorName: 'Kho chính - Lê Minh', note: 'Cấp đợt 1 khởi tạo lệnh' },
    { id: 'iss-02', orderId: 'ord-101', orderNumber: 'LSX-2026-001', materialName: 'Gỗ thông tấm tự nhiên', issuedQty: 0.5, unit: 'm3', issuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), operatorName: 'Kho bổ sung', note: 'Bù trừ do gỗ nứt xẻ xéo phôi hỏng' }
  ],
  rpaSimulationLogs: [
    {
      id: 'rpa-01',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      fileName: 'Wanek_WeeklyPlan_Q2_Week21.xlsx',
      ordersCreated: 3,
      logMessage: 'RPA Workflow hoàn tất: Đọc file Excel thành công, tính toán định mức chuẩn và gọi API của hệ thống tạo thành công 3 Lệnh Sản xuất: LSX-2026-001, LSX-2026-002, LSX-2026-003.',
      status: 'SUCCESS'
    }
  ]
};

// Low-db style JSON database controller
class DBContext {
  private data: DatabaseSchema | null = null;

  async init() {
    if (this.data) return;
    try {
      const exists = await fs.access(DB_FILE_PATH).then(() => true).catch(() => false);
      if (exists) {
        const fileContent = await fs.readFile(DB_FILE_PATH, 'utf-8');
        this.data = JSON.parse(fileContent);
        console.log('Database loaded successfully from file.');
      } else {
        this.data = JSON.parse(JSON.stringify(DEFAULT_DB));
        await this.save();
        console.log('New database initialized and seeded successfully.');
      }
    } catch (err) {
      console.error('Failed to init database, falling back to in-memory state.', err);
      this.data = JSON.parse(JSON.stringify(DEFAULT_DB));
    }
  }

  private ensureLoaded(): DatabaseSchema {
    if (!this.data) {
      throw new Error('Database context not initialized yet.');
    }
    return this.data;
  }

  async save() {
    if (!this.data) return;
    try {
      await fs.writeFile(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database to disk.', err);
    }
  }

  // Gets
  getProducts(): Product[] {
    return this.ensureLoaded().products;
  }

  getWorkCenters(): WorkCenter[] {
    return this.ensureLoaded().workCenters;
  }

  getOrders(): ProductionOrder[] {
    return this.ensureLoaded().productionOrders;
  }

  getDefects(): DefectReport[] {
    return this.ensureLoaded().defectReports;
  }

  getAlarms(): AndonAlarm[] {
    return this.ensureLoaded().andonAlarms;
  }

  getMaterialIssues(): MaterialIssue[] {
    return this.ensureLoaded().materialIssues;
  }

  getRPALogs(): RPASimulationLog[] {
    return this.ensureLoaded().rpaSimulationLogs;
  }

  // Actions
  async createOrder(order: Omit<ProductionOrder, 'id' | 'createdAt' | 'updatedAt' | 'bom' | 'routing'>) {
    const db = this.ensureLoaded();
    const id = `ord-${Date.now()}`;
    const bom = generateBOMForOrder(order.productCode, order.qtyOrdered);
    const routing = generateRoutingForOrder(order.qtyOrdered);

    const newOrder: ProductionOrder = {
      ...order,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      bom,
      routing
    };

    db.productionOrders.unshift(newOrder); // Add to head
    await this.save();
    return newOrder;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const db = this.ensureLoaded();
    const order = db.productionOrders.find(o => o.id === orderId);
    if (!order) throw new Error('Không tìm thấy lệnh sản xuất cần cập nhật.');
    order.status = status;
    order.updatedAt = new Date().toISOString();
    await this.save();
    return order;
  }

  async deleteOrder(orderId: string) {
    const db = this.ensureLoaded();
    const index = db.productionOrders.findIndex(o => o.id === orderId);
    if (index === -1) throw new Error('Không tìm thấy lệnh sản xuất cần xoá.');
    db.productionOrders.splice(index, 1);
    await this.save();
  }

  async addMaterialIssue(issue: Omit<MaterialIssue, 'id' | 'issuedAt'>) {
    const db = this.ensureLoaded();
    const newIssue: MaterialIssue = {
      ...issue,
      id: `iss-${Date.now()}`,
      issuedAt: new Date().toISOString()
    };
    db.materialIssues.unshift(newIssue);

    // Dynamic standard BOM link: update actual consumption count in BOMItem matching this materialName
    const order = db.productionOrders.find(o => o.id === issue.orderId);
    if (order) {
      const bomLine = order.bom.find(b => b.materialName === issue.materialName);
      if (bomLine) {
        bomLine.actualQtyUsed = Number((bomLine.actualQtyUsed + issue.issuedQty).toFixed(2));
      } else {
        // If material isn't originally in BOM, add it as a new line
        order.bom.push({
          id: `bom-${Date.now()}`,
          materialName: issue.materialName,
          unit: issue.unit,
          plannedQty: 0,
          actualQtyUsed: issue.issuedQty
        });
      }
      order.updatedAt = new Date().toISOString();
    }

    await this.save();
    return { issue: newIssue, order };
  }

  async reportDefect(report: Omit<DefectReport, 'id' | 'reportedAt' | 'resolved'>) {
    const db = this.ensureLoaded();
    const newReport: DefectReport = {
      ...report,
      id: `def-${Date.now()}`,
      reportedAt: new Date().toISOString(),
      resolved: false
    };
    db.defectReports.unshift(newReport);

    // Automatically trigger quality AndonAlarm warning if more than 5 defects are logged contextually
    if (newReport.quantity >= 5) {
      const wc = db.workCenters.find(w => w.code === report.workCenterCode);
      await this.triggerAndonAlarm({
         orderId: report.orderId,
         orderNumber: report.orderNumber,
         workCenterCode: report.workCenterCode,
         workCenterName: wc?.name || 'Tổ sản xuất',
         alarmType: 'QUALITY',
         severity: 'WARNING',
         message: `Cảnh báo lỗi: Tổ ghi nhận ${newReport.quantity} sản phẩm bị loại do lỗi "${newReport.defectType}"`
      });
    }

    await this.save();
    return newReport;
  }

  async resolveDefect(reportId: string, notes?: string) {
    const db = this.ensureLoaded();
    const def = db.defectReports.find(d => d.id === reportId);
    if (!def) throw new Error('Không tìm thấy sự cố lỗi cần xác nhận xử lý.');
    def.resolved = true;
    if (notes) def.notes = notes;
    await this.save();
    return def;
  }

  async triggerAndonAlarm(alarm: Omit<AndonAlarm, 'id' | 'status' | 'triggeredAt'>) {
    const db = this.ensureLoaded();
    
    // Check if there is already an active alarm of this type for this workCenter
    const activeAlarm = db.andonAlarms.find(a => a.workCenterCode === alarm.workCenterCode && a.status === 'ACTIVE');
    if (activeAlarm) {
      return activeAlarm;
    }

    const newAlarm: AndonAlarm = {
      ...alarm,
      id: `alarm-${Date.now()}`,
      status: 'ACTIVE',
      triggeredAt: new Date().toISOString()
    };
    db.andonAlarms.unshift(newAlarm);

    // Update WorkCenter status to DOWN if severity is CRITICAL or quality machine error
    const wc = db.workCenters.find(w => w.code === alarm.workCenterCode);
    if (wc) {
      wc.status = 'DOWN';
    }

    await this.save();
    return newAlarm;
  }

  async resolveAndonAlarm(alarmId: string) {
    const db = this.ensureLoaded();
    const alarm = db.andonAlarms.find(a => a.id === alarmId);
    if (!alarm) throw new Error('Không tìm thấy cảnh báo Andon tương ứng.');
    alarm.status = 'RESOLVED';
    alarm.resolvedAt = new Date().toISOString();

    // Update WorkCenter status back to ACTIVE or IDLE
    const hasMoreActiveAlarms = db.andonAlarms.some(a => a.workCenterCode === alarm.workCenterCode && a.status === 'ACTIVE');
    if (!hasMoreActiveAlarms) {
      const wc = db.workCenters.find(w => w.code === alarm.workCenterCode);
      if (wc) {
        wc.status = 'ACTIVE';
      }
    }

    await this.save();
    return alarm;
  }

  // Operator scans QR and updates workcenter progress: completes specific quantity
  async submitProgress(
    orderId: string, 
    workCenterCode: string, 
    qty: number, 
    operatorName: string,
    materialToIssueName?: string,
    materialToIssueQty?: number,
    materialToIssueUnit?: string
  ) {
    const db = this.ensureLoaded();
    const order = db.productionOrders.find(o => o.id === orderId);
    if (!order) throw new Error('Không tìm thấy lệnh sản xuất.');

    // Find the routing step for this workcenter
    const step = order.routing.find(s => s.workCenterCode === workCenterCode);
    if (!step) throw new Error('Mã tổ sản xuất (Work Center) không hợp lệ trong quy trình này.');

    // Adjust status of order to IN_PROGRESS if released
    if (order.status === 'RELEASED' || order.status === 'DRAFT') {
      order.status = 'IN_PROGRESS';
    }

    // Set operator name
    step.operatorName = operatorName;
    step.updatedAt = new Date().toISOString();
    
    // Add quantity
    const previousCompleted = step.completedQty;
    step.completedQty = Math.min(step.targetQty, step.completedQty + qty);
    
    if (step.completedQty >= step.targetQty) {
      step.status = 'COMPLETED';
    } else {
      step.status = 'IN_PROGRESS';
    }

    // Check if we should log any raw material issue automatically as part of progress submission (manufacturing material tracking)
    if (materialToIssueName && materialToIssueQty && materialToIssueQty > 0) {
      await this.addMaterialIssue({
        orderId,
        orderNumber: order.orderNumber,
        materialName: materialToIssueName,
        issuedQty: materialToIssueQty,
        unit: materialToIssueUnit || 'đơn vị',
        operatorName: operatorName,
        note: `Cấp liệu tự động khi báo cáo sản lượng thêm ${qty} cái`
      });
    }

    // Advanced automated logic: if a routing step is completed, set the next step to IN_PROGRESS automatically
    const sortedSteps = [...order.routing].sort((a, b) => a.stepOrder - b.stepOrder);
    if (step.status === 'COMPLETED') {
      const currentIdx = sortedSteps.findIndex(s => s.workCenterCode === workCenterCode);
      if (currentIdx !== -1 && currentIdx < sortedSteps.length - 1) {
        const nextStep = sortedSteps[currentIdx + 1];
        if (nextStep.status === 'PENDING') {
          const actualNextInOrder = order.routing.find(s => s.workCenterCode === nextStep.workCenterCode);
          if (actualNextInOrder) actualNextInOrder.status = 'IN_PROGRESS';
        }
      }
    }

    // If the final routing step is completed, mark the order as COMPLETED
    const finalStep = sortedSteps[sortedSteps.length - 1];
    if (order.routing.every(s => s.status === 'COMPLETED') || (finalStep.workCenterCode === workCenterCode && step.status === 'COMPLETED')) {
      order.status = 'COMPLETED';
    }

    order.updatedAt = new Date().toISOString();
    
    // Force active workcenters status triggers
    INITIAL_WORK_CENTERS.forEach(wc => {
      const activeForOrder = db.productionOrders.some(o => 
        o.status === 'IN_PROGRESS' && 
        o.routing.some(s => s.workCenterCode === wc.code && s.status === 'IN_PROGRESS')
      );
      const targetWc = db.workCenters.find(w => w.code === wc.code);
      if (targetWc && targetWc.status !== 'DOWN') {
        targetWc.status = activeForOrder ? 'ACTIVE' : 'IDLE';
      }
    });

    await this.save();
    return order;
  }

  // RPA robot logger
  async addRPALog(log: Omit<RPASimulationLog, 'id' | 'timestamp'>) {
    const db = this.ensureLoaded();
    const newLog: RPASimulationLog = {
      ...log,
      id: `rpa-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    db.rpaSimulationLogs.unshift(newLog);
    await this.save();
    return newLog;
  }

  getStats(): DashboardStats {
    const db = this.ensureLoaded();
    const orders = db.productionOrders;
    const activeOrders = orders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'RELEASED').length;
    const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
    
    // Weighted progress across all active and released orders
    let totalStepsWeight = 0;
    let completedStepsWeight = 0;
    
    orders.forEach(o => {
      // Completed order is 100%
      if (o.status === 'COMPLETED') {
        completedStepsWeight += 100;
        totalStepsWeight += 100;
      } else if (o.status === 'IN_PROGRESS' || o.status === 'RELEASED') {
        // Multiplied by percentage complete per steps
        const stepsCount = o.routing.length;
        if (stepsCount > 0) {
          const completedProgress = o.routing.reduce((acc, step) => {
            const stepPercent = step.targetQty > 0 ? (step.completedQty / step.targetQty) : 0;
            return acc + (stepPercent / stepsCount);
          }, 0);
          completedStepsWeight += completedProgress * 100;
          totalStepsWeight += 100;
        }
      }
    });

    const overallProgress = totalStepsWeight > 0 ? Math.round(completedStepsWeight / totalStepsWeight * 100) / 100 * 100 : 0;
    const totalDefects = db.defectReports.reduce((acc, d) => acc + (d.resolved ? 0 : d.quantity), 0);
    const activeAlarmsCount = db.andonAlarms.filter(a => a.status === 'ACTIVE').length;

    return {
      totalOrders: orders.length,
      activeOrders,
      completedOrders,
      overallProgress: Number(overallProgress.toFixed(1)),
      totalDefects,
      activeAlarmsCount
    };
  }
}

export const dbContext = new DBContext();
