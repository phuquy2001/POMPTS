import { useState, useEffect } from 'react';
import { dbContext } from './server/db';
import { 
  ProductionOrder, 
  WorkCenter, 
  AndonAlarm, 
  RPASimulationLog, 
  DashboardStats, 
  Product,
  OrderStatus 
} from './types';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { WorkCentersMap } from './components/WorkCentersMap';
import { OrderCard } from './components/OrderCard';
import { OperatorTerminal } from './components/OperatorTerminal';
import { AndonConsole } from './components/AndonConsole';
import { RPABot } from './components/RPABot';
import { NewOrderModal } from './components/NewOrderModal';
import { Plus, HelpCircle, Activity, Play, Calendar, AlertOctagon } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [wsConnected, setWsConnected] = useState(false);

  // Core system databases loaded into state
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [alarms, setAlarms] = useState<AndonAlarm[]>([]);
  const [rpaLogs, setRpaLogs] = useState<RPASimulationLog[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    overallProgress: 0,
    totalDefects: 0,
    activeAlarmsCount: 0
  });

  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  // Fetch all states from the server
  const fetchGlobalData = async () => {
    try {
      const [pRes, oRes, wcRes, aRes, rRes, sRes] = await Promise.all([
        fetch('/api/products').then(r => r.json()),
        fetch('/api/orders').then(r => r.json()),
        fetch('/api/workcenters').then(r => r.json()),
        fetch('/api/andon').then(r => r.json()),
        fetch('/api/rpa/logs').then(r => r.json()),
        fetch('/api/stats').then(r => r.json())
      ]);

      setProducts(pRes);
      setOrders(oRes);
      setWorkCenters(wcRes);
      setAlarms(aRes);
      setRpaLogs(rRes);
      setStats(sRes);
    } catch (err) {
      console.error('Error load manufacturing data', err);
    }
  };

  // Setup actual WebSocket live synchronizers
  useEffect(() => {
    fetchGlobalData();

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      console.log(`[WS] Connecting to ${wsUrl}...`);
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('[WS] Connected to central real-time broadcaster portal.');
        setWsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[WS Broadcast received]', message);

          // Whenever any event is published, force re-trigger simple API sync to pull DB updates
          fetchGlobalData();
        } catch (err) {
          console.warn('[WS Message Parse Fail]', err);
        }
      };

      socket.onclose = () => {
        console.warn('[WS] Connection split. Retrying in 4 seconds...');
        setWsConnected(false);
        reconnectTimeout = setTimeout(connectWebSocket, 4000);
      };

      socket.onerror = (err) => {
        console.error('[WS Error]', err);
        if (socket) socket.close();
      };
    };

    connectWebSocket();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Post wrappers matching backend architecture
  const handleCreateOrder = async (orderData: any) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Cannot draft order');
    }
  };

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    await fetch(`/api/orders/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  };

  const handleSubmitProgress = async (payload: any) => {
    const res = await fetch('/api/progress/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Không thể ghi nhận sản lượng');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    await fetch(`/api/orders/${id}`, { method: 'DELETE' });
  };

  const handleIssueMaterial = async (issueData: any) => {
    await fetch('/api/materials/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issueData)
    });
  };

  const handleReportDefect = async (defectData: any) => {
    await fetch('/api/defects/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defectData)
    });
  };

  const handleTriggerAndon = async (andonData: any) => {
    await fetch('/api/andon/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(andonData)
    });
  };

  const handleResolveAndon = async (alarmId: string) => {
    await fetch(`/api/andon/${alarmId}/resolve`, { method: 'POST' });
  };

  const handleTriggerRPASimulation = async (fileName: string, count: number) => {
    const res = await fetch('/api/rpa/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, targetOrdersCount: count })
    });
    return res.json();
  };

  const activeAlarms = alarms.filter(a => a.status === 'ACTIVE');

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-850 flex flex-col font-sans select-none antialiased">
      <Header 
        wsConnected={wsConnected} 
        activeAlarms={activeAlarms} 
        onTabChange={setActiveTab} 
        activeTab={activeTab} 
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* TAB 1: CENTRAL LIVE DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in block">
            {/* Row 1: KPI Cards */}
            <KpiCards stats={stats} />

            {/* Row 2: Live SCADA Floor view */}
            <WorkCentersMap workCenters={workCenters} activeAlarms={activeAlarms} />

            {/* Row 3: Live routing checklist of IN_PROGRESS or RELEASED orders */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-slate-700" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Quy trình sản xuất đang hoạt động</h3>
                </div>
                <button
                  onClick={() => setIsNewOrderModalOpen(true)}
                  className="bg-slate-900 border hover:bg-slate-800 text-white text-xs font-bold uppercase rounded-xl px-4 py-2 flex items-center gap-1.5 transition-all shadow cursor-pointer shadow-slate-900/10"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span>TẠO LỆNH GỖ MỚI</span>
                </button>
              </div>

              <div className="space-y-4 pt-1">
                {orders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'RELEASED').length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-sans text-xs">
                    🍻 Bình yên quá! Phân xưởng Wanek đang rảnh rỗi hoặc chưa có lệnh mới.
                    <button 
                      onClick={() => setIsNewOrderModalOpen(true)}
                      className="text-amber-600 font-bold ml-1 hover:underline block mx-auto mt-2 cursor-pointer text-xs"
                    >
                      Bấm vào đây để tạo một Lệnh sản xuất mới &rarr;
                    </button>
                  </div>
                ) : (
                  <OrderCard 
                    orders={orders} 
                    onUpdateStatus={handleUpdateStatus} 
                    onDeleteOrder={handleDeleteOrder} 
                    onIssueMaterial={handleIssueMaterial} 
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTION ORDERS LIST SCREEN */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in block">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 uppercase">Danh sách lệnh sản xuất & nguyên liệu mộc</h2>
                <p className="text-xs text-slate-500 font-sans mt-0.5">Khởi tạo, tháo gỡ mã hoặc quản lý chi tiêu định ngạch vật lý</p>
              </div>
              <button
                onClick={() => setIsNewOrderModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase rounded-xl px-4 py-2.5 flex items-center gap-1.5 transition-all shadow cursor-pointer shadow-slate-900/10"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span>Ký phê duyệt Lệnh sản xuất</span>
              </button>
            </div>

            <OrderCard 
              orders={orders} 
              onUpdateStatus={handleUpdateStatus} 
              onDeleteOrder={handleDeleteOrder} 
              onIssueMaterial={handleIssueMaterial} 
            />
          </div>
        )}

        {/* TAB 3: OPERATOR WORKCENTRE TERMINAL */}
        {activeTab === 'terminal' && (
          <div className="space-y-5 animate-fade-in block">
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase">Trạm Báo Cáo Tiến Độ Vận Hành Của Tổ Viên</h2>
              <p className="text-xs text-slate-500 font-sans mt-0.5">Quét bệ phôi mộc bọc mác gỗ để nộp sản phẩm hoàn thiện, tống khói lỗi khuyết sần hoặc kích hoạt Andon</p>
            </div>

            <OperatorTerminal 
              orders={orders}
              workCenters={workCenters}
              onSubmitProgress={handleSubmitProgress} // We use the dynamic submit progress express route
              onReportDefect={handleReportDefect}
              onTriggerAndon={handleTriggerAndon}
            />
          </div>
        )}

        {/* TAB 4: ANDON EMERGENCY SYSTEM PANEL */}
        {activeTab === 'andon' && (
          <div className="space-y-5 animate-fade-in block">
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase">Cổng Sự Cố Andon Alarm Toàn Cầu</h2>
              <p className="text-xs text-slate-500 font-sans mt-0.5">Xử lý ngay các trường hợp dỏ lò máy tiện CNC, kịch thiết gỗ mộc hoặc sự cố cháy nổ dán mép sườn</p>
            </div>

            <AndonConsole 
              alarms={alarms}
              workCenters={workCenters}
              onTriggerAlarm={handleTriggerAndon}
              onResolveAlarm={handleResolveAndon}
            />
          </div>
        )}

        {/* TAB 5: RPA BOT DECK CONTROLLER */}
        {activeTab === 'rpa' && (
          <div className="space-y-5 animate-fade-in block">
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase font-sans">UiPath RPA File Import Robot Deck</h2>
              <p className="text-xs text-slate-500 font-sans mt-0.5">Mô phỏng robot đọc dũ liệu kế hoạch Excel tuần tự từ file SAP mộc, chuyển tiếp thành Lệnh chế tác MES chuẩn</p>
            </div>

            <RPABot 
              logs={rpaLogs} 
              onTriggerSimulate={handleTriggerRPASimulation} 
            />
          </div>
        )}

      </main>

      {/* Floating footer watermark */}
      <footer className="border-t border-slate-200 mt-12 bg-white py-4 text-center text-[10.5px] font-mono text-slate-400">
        <div>WANEK FURNITURE MES/ERP REALTIME DASHBOARD SYSTEM • 2026 CO. LTD</div>
        <div className="mt-1 text-slate-350 select-none">Designed in display Swiss Sans Typography with reactive WebSockets</div>
      </footer>

      {/* New Order form overlay */}
      <NewOrderModal 
        isOpen={isNewOrderModalOpen} 
        onClose={() => setIsNewOrderModalOpen(false)} 
        products={products}
        onCreateOrder={handleCreateOrder}
      />
    </div>
  );
}
