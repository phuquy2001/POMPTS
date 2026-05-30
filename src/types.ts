export interface Product {
  id: string;
  code: string;
  name: string;
  sku: string;
  category: string;
}

export interface WorkCenter {
  id: string;
  code: string;
  name: string;
  status: 'IDLE' | 'ACTIVE' | 'DOWN';
  operatorName: string;
  currentOrderId?: string;
}

export interface BOMItem {
  id: string;
  materialName: string;
  unit: string;
  plannedQty: number; // Qty needed for the entire order
  actualQtyUsed: number; // Consumed qty
}

export interface RoutingStep {
  workCenterCode: string;
  stepName: string;
  stepOrder: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  completedQty: number;
  targetQty: number;
  operatorName?: string;
  updatedAt?: string;
}

export type OrderStatus = 'DRAFT' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  productCode: string;
  productName: string;
  qtyOrdered: number;
  status: OrderStatus;
  plannedStartDate: string;
  plannedEndDate: string;
  routing: RoutingStep[];
  bom: BOMItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DefectReport {
  id: string;
  orderId: string;
  orderNumber: string;
  workCenterCode: string;
  defectType: string;
  quantity: number;
  reportedBy: string;
  reportedAt: string;
  resolved: boolean;
  notes?: string;
}

export type AlarmType = 'MATERIAL' | 'QUALITY' | 'MACHINE' | 'SAFETY';
export type AlarmSeverity = 'WARNING' | 'CRITICAL';

export interface AndonAlarm {
  id: string;
  orderId: string;
  orderNumber: string;
  workCenterCode: string;
  workCenterName: string;
  alarmType: AlarmType;
  severity: AlarmSeverity;
  message: string;
  status: 'ACTIVE' | 'RESOLVED';
  triggeredAt: string;
  resolvedAt?: string;
}

export interface MaterialIssue {
  id: string;
  orderId: string;
  orderNumber: string;
  materialName: string;
  issuedQty: number;
  unit: string;
  issuedAt: string;
  operatorName: string;
  note?: string;
}

export interface RPASimulationLog {
  id: string;
  timestamp: string;
  fileName: string;
  ordersCreated: number;
  logMessage: string;
  status: 'SUCCESS' | 'FAILED';
}

export interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  overallProgress: number; // Percentage
  totalDefects: number;
  activeAlarmsCount: number;
}
