# Wanek Furniture - Database Schema Design (MVP)

This document maps out the relational database design for the **Production Order & Progress Tracking System** for Wanek Furniture. The schema is optimized for manufacturing operations (tracking BOM variance, Routing steps, defects, and Andon alarms).

Below is the database structure written in DBML (Database Markup Language) compatible with [dbdiagram.io](https://dbdiagram.io).

## DBML Schema Syntax

```dbml
// Database Schema for Wanek Furniture Production MVP

Table Products {
  id varchar [primary key]
  code varchar [unique, note: 'SKU Code (e.g. SP-SOFA-001)']
  name varchar [note: 'Product Name (e.g., Sofa Da Luxury Grand)']
  sku varchar
  category varchar [note: 'e.g. Sofa, Dining Table, Bed Frame']
}

Table WorkCenters {
  id varchar [primary key]
  code varchar [unique, note: 'WC Code (e.g. WC001-CUT)']
  name varchar [note: 'Tổ trưởng / Tổ sản xuất']
  operatorName varchar
  status varchar [note: 'IDLE, ACTIVE, DOWN']
}

Table ProductionOrders {
  id varchar [primary key]
  orderNumber varchar [unique, note: 'LSX code (e.g. LSX-2026-0001)']
  productCode varchar [ref: > Products.code]
  productName varchar
  qtyOrdered int
  status varchar [note: 'DRAFT, RELEASED, IN_PROGRESS, COMPLETED, PAUSED']
  plannedStartDate datetime
  plannedEndDate datetime
  createdAt datetime
  updatedAt datetime
}

Table ProductionRoutingSteps {
  id varchar [primary key]
  orderId varchar [ref: > ProductionOrders.id]
  workCenterCode varchar [ref: > WorkCenters.code]
  stepName varchar [note: 'e.g., Tổ Cắt Gỗ, Tổ Lắp Ráp']
  stepOrder int [note: '1, 2, 3, etc. to map routing flow']
  status varchar [note: 'PENDING, IN_PROGRESS, COMPLETED']
  completedQty int
  targetQty int
  operatorName varchar
  updatedAt datetime
}

Table BOM {
  id varchar [primary key]
  orderId varchar [ref: > ProductionOrders.id]
  materialName varchar [note: 'e.g. Gỗ thông xẻ thanh (m3)']
  unit varchar
  plannedQty float [note: 'Standard BOM quantity for the entire order']
  actualQtyUsed float [note: 'Cumulative actual raw material issued']
}

Table MaterialIssues {
  id varchar [primary key]
  orderId varchar [ref: > ProductionOrders.id]
  orderNumber varchar
  materialName varchar
  issuedQty float
  unit varchar
  issuedAt datetime
  operatorName varchar
  note text
}

Table DefectReports {
  id varchar [primary key]
  orderId varchar [ref: > ProductionOrders.id]
  orderNumber varchar
  workCenterCode varchar [ref: > WorkCenters.code]
  defectType varchar [note: 'Split Wood, Bubble Coating, Wrong Thread']
  quantity int
  reportedBy varchar
  reportedAt datetime
  resolved boolean [default: false]
  notes text
}

Table AndonAlarms {
  id varchar [primary key]
  orderId varchar [ref: > ProductionOrders.id]
  orderNumber varchar
  workCenterCode varchar [ref: > WorkCenters.code]
  workCenterName varchar
  alarmType varchar [note: 'MATERIAL, QUALITY, MACHINE, SAFETY']
  severity varchar [note: 'WARNING, CRITICAL']
  message text
  status varchar [note: 'ACTIVE, RESOLVED']
  triggeredAt datetime
  resolvedAt datetime
}
```

## Relationships Map

1. `Products (1) ─── <(N) ProductionOrders` (One Product can have multiple Production Orders).
2. `ProductionOrders (1) ─── <(N) ProductionRoutingSteps` (One Production Order goes through multiple work center steps in sequential `stepOrder`).
3. `ProductionOrders (1) ─── <(N) BOM` (One Production Order has multiple Bill of Materials lines for raw materials tracking).
4. `ProductionOrders (1) ─── <(N) MaterialIssues` (A station can pull raw materials, logging a file / issue record, updating `BOM.actualQtyUsed` for BOM variance calculating).
5. `ProductionOrders (1) ─── <(N) DefectReports` (Defects are tagged directly to orders and workcenters for reporting throughput and error rates).
6. `ProductionOrders (1) ─── <(N) AndonAlarms` (An Andon alarm is triggered by a workcenter on an active production order, flagged immediately to managers).
7. `WorkCenters (1) ─── <(N) ProductionRoutingSteps` (A WorkCenter processes routing steps across various orders).

This normalized, structured schema represents a professional, real-world layout for an Enterprise Resource Planning (ERP) or Manufacturing Execution System (MES) core!
