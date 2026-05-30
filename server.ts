import express from 'express';
import path from 'path';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { dbContext } from './src/server/db';
import { createServer as createViteServer } from 'vite';

// Express and HTTP Server Initialization
const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// WebSocket Server Integration
const wss = new WebSocketServer({ noServer: true });
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WS] Client connected. Total clients: ${clients.size}`);
  
  // Send immediate initial handshake
  ws.send(JSON.stringify({ type: 'HANDSHAKE', message: 'Kết nối thời gian thực thành công!' }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected. Total clients: ${clients.size}`);
  });
});

// Broadcast changes to all connected client browsers
function broadcast(type: string, payload: any) {
  const message = JSON.stringify({ type, payload });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Upgrade HTTP to WS smoothly
server.on('upgrade', (request, socket, head) => {
  if (request.url === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 1. Products
app.get('/api/products', (req, res) => {
  res.json(dbContext.getProducts());
});

// 2. Workcenters
app.get('/api/workcenters', (req, res) => {
  res.json(dbContext.getWorkCenters());
});

// 3. Stats KPIs
app.get('/api/stats', (req, res) => {
  res.json(dbContext.getStats());
});

// 4. Production Orders CRM
app.get('/api/orders', (req, res) => {
  res.json(dbContext.getOrders());
});

app.post('/api/orders', async (req, res) => {
  try {
    const { orderNumber, productCode, productName, qtyOrdered, status, plannedStartDate, plannedEndDate } = req.body;
    
    if (!orderNumber || !productCode || !qtyOrdered) {
      return res.status(400).json({ error: 'Mã lệnh, mã sản phẩm và số lượng đặt hàng là bắt buộc.' });
    }

    const newOrder = await dbContext.createOrder({
      orderNumber,
      productCode,
      productName: productName || 'Sản phẩm mộc sấy',
      qtyOrdered: Number(qtyOrdered),
      status: status || 'RELEASED',
      plannedStartDate: plannedStartDate || new Date().toISOString().split('T')[0],
      plannedEndDate: plannedEndDate || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    broadcast('ORDER_CREATED', newOrder);
    broadcast('STATS_UPDATED', dbContext.getStats());
    res.status(201).json(newOrder);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await dbContext.updateOrderStatus(req.params.id, status);
    
    broadcast('ORDER_UPDATED', order);
    broadcast('STATS_UPDATED', dbContext.getStats());
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    await dbContext.deleteOrder(req.params.id);
    broadcast('ORDER_DELETED', req.params.id);
    broadcast('STATS_UPDATED', dbContext.getStats());
    res.json({ success: true, message: 'Đã xoá lệnh sản xuất thành công.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Operator scans and submits progress
app.post('/api/progress/submit', async (req, res) => {
  try {
    const { 
      orderId, 
      workCenterCode, 
      qty, 
      operatorName, 
      materialToIssueName, 
      materialToIssueQty, 
      materialToIssueUnit 
    } = req.body;

    if (!orderId || !workCenterCode || !qty || !operatorName) {
      return res.status(400).json({ error: 'Thiếu thông tin báo cáo: Lệnh, Tổ trưởng, số lượng.' });
    }

    const updatedOrder = await dbContext.submitProgress(
      orderId,
      workCenterCode,
      Number(qty),
      operatorName,
      materialToIssueName,
      materialToIssueQty ? Number(materialToIssueQty) : undefined,
      materialToIssueUnit
    );

    // Broadcast update immediately to trigger real-time progress on dashboards
    broadcast('ORDER_UPDATED', updatedOrder);
    broadcast('STATS_UPDATED', dbContext.getStats());
    broadcast('WORKCENTERS_UPDATED', dbContext.getWorkCenters());
    broadcast('MATERIAL_ISSUED', { orderId, list: dbContext.getMaterialIssues() });

    res.json(updatedOrder);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Manual materials issue and BOM variance
app.get('/api/materials', (req, res) => {
  res.json(dbContext.getMaterialIssues());
});

app.post('/api/materials/issue', async (req, res) => {
  try {
    const { orderId, orderNumber, materialName, issuedQty, unit, operatorName, note } = req.body;
    if (!orderId || !materialName || !issuedQty) {
      return res.status(400).json({ error: 'Thiếu thông tin cấp phát vật liệu.' });
    }

    const result = await dbContext.addMaterialIssue({
      orderId,
      orderNumber,
      materialName,
      issuedQty: Number(issuedQty),
      unit: unit || 'Cái',
      operatorName,
      note
    });

    broadcast('ORDER_UPDATED', result.order);
    broadcast('MATERIAL_ISSUED', dbContext.getMaterialIssues());
    broadcast('STATS_UPDATED', dbContext.getStats());

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Quality & defect Reports
app.get('/api/defects', (req, res) => {
  res.json(dbContext.getDefects());
});

app.post('/api/defects/report', async (req, res) => {
  try {
    const { orderId, orderNumber, workCenterCode, defectType, quantity, reportedBy, notes } = req.body;
    if (!orderId || !workCenterCode || !defectType || !quantity) {
      return res.status(400).json({ error: 'Đầu vào báo cáo khuyết tật không đầy đủ.' });
    }

    const report = await dbContext.reportDefect({
      orderId,
      orderNumber,
      workCenterCode,
      defectType,
      quantity: Number(quantity),
      reportedBy,
      notes
    });

    broadcast('DEFECT_REPORTED', report);
    broadcast('STATS_UPDATED', dbContext.getStats());
    broadcast('WORKCENTERS_UPDATED', dbContext.getWorkCenters());
    broadcast('ANDON_ALARM_TRIGGERED', dbContext.getAlarms()); // defect could trigger alarms

    res.status(201).json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/defects/:id/resolve', async (req, res) => {
  try {
    const { notes } = req.body;
    const report = await dbContext.resolveDefect(req.params.id, notes);
    
    broadcast('DEFECT_RESOLVED', report);
    broadcast('STATS_UPDATED', dbContext.getStats());
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Andon Alarms
app.get('/api/andon', (req, res) => {
  res.json(dbContext.getAlarms());
});

app.post('/api/andon/trigger', async (req, res) => {
  try {
    const { orderId, orderNumber, workCenterCode, workCenterName, alarmType, severity, message } = req.body;
    if (!workCenterCode || !alarmType || !severity) {
      return res.status(400).json({ error: 'Thiếu thông số kích hoạt Andon.' });
    }

    const newAlarm = await dbContext.triggerAndonAlarm({
      orderId: orderId || 'unlinked',
      orderNumber: orderNumber || 'Không liên kết',
      workCenterCode,
      workCenterName: workCenterName || 'Tổ sản xuất',
      alarmType,
      severity,
      message: message || 'Yêu cầu hỗ trợ khẩn cấp tại tổ máy!'
    });

    broadcast('ANDON_ALARM_TRIGGERED', newAlarm);
    broadcast('WORKCENTERS_UPDATED', dbContext.getWorkCenters());
    broadcast('STATS_UPDATED', dbContext.getStats());

    res.status(201).json(newAlarm);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/andon/:id/resolve', async (req, res) => {
  try {
    const alarm = await dbContext.resolveAndonAlarm(req.params.id);
    
    broadcast('ANDON_ALARM_RESOLVED', alarm);
    broadcast('WORKCENTERS_UPDATED', dbContext.getWorkCenters());
    broadcast('STATS_UPDATED', dbContext.getStats());

    res.json(alarm);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. RPA Simulation Logger and executor
app.get('/api/rpa/logs', (req, res) => {
  res.json(dbContext.getRPALogs());
});

app.post('/api/rpa/simulate', async (req, res) => {
  try {
    const { fileName, targetOrdersCount } = req.body;
    const file = fileName || 'Wanek_RPA_Plan_Weekly.xlsx';
    const count = targetOrdersCount ? Number(targetOrdersCount) : 2;

    // Log start step
    await dbContext.addRPALog({
      fileName: file,
      ordersCreated: 0,
      logMessage: `[UiPath RPA] Đang quét hệ thống SAP để tìm tệp cấu hình ${file}...`,
      status: 'SUCCESS' // processing
    });

    // We simulate creating requested production orders automatically in sequence
    const rpaProducts = [
      { code: 'SP-SOFA-LUX', name: 'Sofa Góc Luxury Da Bò sành điệu (WS-01)', qty: 60 },
      { code: 'SP-TABLE-OAK', name: 'Bàn Ăn Gỗ Sồi Chun Wanek (WT-02)', qty: 35 },
      { code: 'SP-BED-PINE', name: 'Giường Ngủ Gỗ Thông Hàn Quốc (WB-04)', qty: 80 }
    ];

    const createdOrders: any[] = [];
    for (let i = 0; i < Math.min(count, rpaProducts.length); i++) {
      const p = rpaProducts[i];
      const sequentialOrderNumber = `LSX-RPA-${2026}-${Math.floor(Math.random() * 9000 + 1000)}`;
      
      const newOrder = await dbContext.createOrder({
        orderNumber: sequentialOrderNumber,
        productCode: p.code,
        productName: p.name,
        qtyOrdered: p.qty,
        status: 'RELEASED',
        plannedStartDate: new Date().toISOString().split('T')[0],
        plannedEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      createdOrders.push(newOrder);

      // Log material issue standard
      await dbContext.addMaterialIssue({
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        materialName: newOrder.bom[0].materialName,
        issuedQty: Number((newOrder.bom[0].plannedQty * 0.5).toFixed(2)), // Issue first batch raw wood
        unit: newOrder.bom[0].unit,
        operatorName: 'RPA-Robot-System',
        note: '[RPA Auto Issue] Cấp phôi tự động từ hệ thống quản lý kho ERP'
      });
    }

    const logMsg = `RPA Robot hoàn thành việc xử lý tệp ${file}. Đã đối soát tham số định mức BOM, tự động hóa rẽ nhánh quy trình kỹ thuật và khởi tạo ${createdOrders.length} Lệnh sản xuất: ${createdOrders.map(o => o.orderNumber).join(', ')}`;
    const finalLog = await dbContext.addRPALog({
      fileName: file,
      ordersCreated: createdOrders.length,
      logMessage: logMsg,
      status: 'SUCCESS'
    });

    broadcast('RPA_INTEGRATED', finalLog);
    createdOrders.forEach(o => broadcast('ORDER_CREATED', o));
    broadcast('MATERIAL_ISSUED', dbContext.getMaterialIssues());
    broadcast('STATS_UPDATED', dbContext.getStats());

    res.status(201).json({ success: true, log: finalLog, orders: createdOrders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// Initialization of DB and starting HTTP servers
async function startServer() {
  await dbContext.init();
  
  // Dev & Production asset setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    // Vite middleware serves frontend index.html assets
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Wanek Furniture MES Engine] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[WS Engine] WebSocket portal connected on /ws`);
  });
}

startServer();
