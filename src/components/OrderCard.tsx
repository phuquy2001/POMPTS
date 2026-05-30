import React, { useState } from 'react';
import { 
  Boxes, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Percent, 
  QrCode, 
  User, 
  AlertTriangle, 
  CornerDownRight, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Trash2,
  ListFilter
} from 'lucide-react';
import { ProductionOrder, OrderStatus, BOMItem } from '../types';

interface OrderCardProps {
  orders: ProductionOrder[];
  onUpdateStatus: (id: string, status: OrderStatus) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
  onIssueMaterial: (issueData: any) => Promise<void>;
}

export const OrderCard: React.FC<OrderCardProps> = ({ 
  orders, 
  onUpdateStatus, 
  onDeleteOrder,
  onIssueMaterial 
}) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [activeTabMap, setActiveTabMap] = useState<Record<string, 'routing' | 'bom'>>({});
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Issue manual material state
  const [issueMaterialName, setIssueMaterialName] = useState('');
  const [issueQty, setIssueQty] = useState(0);
  const [issueUnit, setIssueUnit] = useState('m3');
  const [issueNote, setIssueNote] = useState('');
  const [issueOperator, setIssueOperator] = useState('');
  const [isIssuingMap, setIsIssuingMap] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
    if (!activeTabMap[id]) {
      setActiveTabMap(prev => ({ ...prev, [id]: 'routing' }));
    }
  };

  const setCardTab = (orderId: string, tab: 'routing' | 'bom') => {
    setActiveTabMap(prev => ({ ...prev, [orderId]: tab }));
  };

  const handleIssueSubmit = async (e: React.FormEvent, order: ProductionOrder) => {
    e.preventDefault();
    if (!issueMaterialName || issueQty <= 0 || !issueOperator) return;

    try {
      await onIssueMaterial({
        orderId: order.id,
        orderNumber: order.orderNumber,
        materialName: issueMaterialName,
        issuedQty: Number(issueQty),
        unit: issueUnit,
        operatorName: issueOperator,
        note: issueNote || 'Cấp phát thủ công tại rạp máy'
      });
      // Clear
      setIssueMaterialName('');
      setIssueQty(0);
      setIssueNote('');
      setIsIssuingMap(prev => ({ ...prev, [order.id]: false }));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'ALL') return true;
    return o.status === filterStatus;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* Filtering row */}
      <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <ListFilter className="h-4 w-4" />
          <span>LỌC THEO TRẠNG THÁI KHỞI CHẠY LỆNH:</span>
        </div>
        <div className="flex flex-wrap gap-1.5 self-stretch sm:self-auto">
          {['ALL', 'RELEASED', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === st 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'Tất cả lệnh' : st === 'RELEASED' ? 'RELEASED (Đã ký)' : st === 'IN_PROGRESS' ? 'IN_PROGRESS (Chạy)' : 'COMPLETED (Ok)'}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 font-sans shadow-sm">
          <Boxes className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">Chưa ghi nhận lệnh sản xuất nào có trạng thái này.</p>
          <p className="text-xs text-slate-400 mt-1">Vui lòng khởi tạo lệnh thủ công hoặc chạy rô bốt RPA ở tab kế tiếp!</p>
        </div>
      ) : (
        filteredOrders.map((order) => {
          const isExpanded = expandedOrderId === order.id;
          const activeTab = activeTabMap[order.id] || 'routing';
          
          // Calculate direct completion percent of order
          const totalTargetQty = order.routing.reduce((acc, step) => acc + step.targetQty, 0);
          const totalCompletedQty = order.routing.reduce((acc, step) => acc + step.completedQty, 0);
          const progressPercent = totalTargetQty > 0 ? Math.round((totalCompletedQty / totalTargetQty) * 100) : 0;

          return (
            <div 
              key={order.id}
              className={`bg-white border select-all transition-all rounded-2xl shadow-sm overflow-hidden ${
                isExpanded ? 'ring-2 ring-slate-900/10 border-slate-300' : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Order Header / Summary card */}
              <div 
                onClick={() => toggleExpand(order.id)}
                className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold tracking-tight text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                      {order.orderNumber}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      order.status === 'RELEASED' 
                        ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                        : order.status === 'IN_PROGRESS' 
                        ? 'bg-amber-50 text-amber-600 border border-amber-200/60 animate-normal'
                        : order.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-slate-50 text-slate-500 border border-slate-200'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 truncate leading-snug">
                    {order.productName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-sans mt-1">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Boxes className="h-3.5 w-3.5 text-slate-400" />
                      Mục tiêu: Đặt {order.qtyOrdered} Cái
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Quy trình: {new Date(order.plannedStartDate).toLocaleDateString('vi-VN')} &rarr; {new Date(order.plannedEndDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* Progress bar and toggle indicators */}
                <div className="flex items-center gap-6 self-stretch md:self-auto shrink-0 justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                  <div className="text-right space-y-1">
                    <div className="flex items-center justify-between md:justify-end gap-1.5">
                      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Tiến độ gia công:</span>
                      <span className="text-sm font-bold font-mono text-slate-900">{progressPercent}%</span>
                    </div>
                    {/* Linear bar */}
                    <div className="w-32 bg-slate-150 h-2 rounded-full overflow-hidden hidden sm:block border border-slate-100">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          order.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-slate-900'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status !== 'COMPLETED' && (
                      <select 
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                        value={order.status}
                        className="bg-slate-50 border border-slate-200 text-[10px] font-bold uppercase rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900/10 cursor-pointer"
                      >
                        <option value="RELEASED">RELEASED</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="PAUSED">PAUSED</option>
                      </select>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Bạn có chắc chắn muốn huỷ lệnh sản xuất ' + order.orderNumber + '?')) {
                          onDeleteOrder(order.id);
                        }
                      }}
                      className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                      title="Huỷ lệnh"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="bg-slate-50 p-1.5 rounded-full border border-slate-200 text-slate-600">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Expanded Details Section */}
              {isExpanded && (
                <div className="border-t border-slate-150 bg-slate-50/40 p-5 space-y-5">
                  {/* Internal tabs select */}
                  <div className="flex border-b border-slate-200 gap-1.5">
                    <button
                      onClick={() => setCardTab(order.id, 'routing')}
                      className={`px-4 py-2 text-xs font-bold tracking-wide uppercase cursor-pointer border-b-2 transition-all ${
                        activeTab === 'routing'
                          ? 'border-slate-900 text-slate-900 font-semibold'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Lộ trình qua các tổ ({order.routing.length} bước)
                    </button>
                    <button
                      onClick={() => setCardTab(order.id, 'bom')}
                      className={`px-4 py-2 text-xs font-bold tracking-wide uppercase cursor-pointer border-b-2 transition-all ${
                        activeTab === 'bom'
                          ? 'border-slate-900 text-slate-900 font-semibold'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Bảng hao hụt nguyên vật liệu (BOM Variance)
                    </button>
                  </div>

                  {/* TAB 1: ROUTING TRACKING */}
                  {activeTab === 'routing' && (
                    <div className="space-y-4">
                      {/* Interactive visual line flow */}
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 pt-2">
                        {order.routing.map((step, index) => {
                          const isDone = step.status === 'COMPLETED';
                          const isCurrent = step.status === 'IN_PROGRESS';
                          const pct = step.targetQty > 0 ? Math.round((step.completedQty / step.targetQty) * 100) : 0;

                          // Format the step code QR code data string
                          const qrCodeContent = `${order.id}__${step.workCenterCode}__${order.qtyOrdered}`;
                          const qrLink = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeContent)}`;

                          return (
                            <div 
                              key={step.workCenterCode}
                              className={`relative border rounded-xl p-3.5 shadow-sm text-xs flex flex-col justify-between transition-all select-all ${
                                isDone 
                                  ? 'bg-emerald-50/50 border-emerald-300 text-emerald-950' 
                                  : isCurrent 
                                  ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-300/40' 
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-bold text-[9px] uppercase text-slate-400">
                                    Thứ tự {step.stepOrder} • {step.workCenterCode}
                                  </span>
                                  {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                                  {isCurrent && <Clock className="h-3.5 w-3.5 text-amber-500 animate-spin" />}
                                </div>
                                <h4 className="font-bold text-[11px] leading-tight text-slate-800 shrink-0">
                                  {step.stepName}
                                </h4>
                                
                                {/* Production count feedback */}
                                <div className="flex items-baseline justify-between mt-2">
                                  <span className="text-slate-500 text-[10px]">Đã chuyển:</span>
                                  <span className="font-mono font-bold text-slate-900 text-xs">
                                    {step.completedQty} / {step.targetQty} cái
                                  </span>
                                </div>

                                {/* Step inner progress line */}
                                <div className="w-full bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                                  <div 
                                    className={`h-full ${isDone ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>

                              {/* Action block showing Assigned Operator or dynamic QR portal */}
                              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[10.5px]">
                                {step.operatorName ? (
                                  <div className="flex items-center gap-1 text-slate-500 truncate" title={step.operatorName}>
                                    <User className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{step.operatorName}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">Chờ nhận tổ</span>
                                )}
                                
                                {/* Popable Mini QR Code Launcher */}
                                <div className="group relative shrink-0 cursor-pointer">
                                  <QrCode className="h-4 w-4 text-slate-400 group-hover:text-slate-900 transition-all" />
                                  
                                  {/* Floating visual QR overlay on hover */}
                                  <div className="hidden group-hover:flex absolute right-1 bottom-6 bg-white border border-slate-200 rounded-xl p-3 shadow-xl z-20 flex-col items-center gap-1.5 text-center w-28 select-none">
                                    <img 
                                      src={qrLink} 
                                      alt="QR Code Code" 
                                      className="w-20 h-20 bg-slate-50 shrink-0 border border-slate-150 rounded"
                                      referrerPolicy="no-referrer"
                                    />
                                    <span className="text-[8px] font-mono leading-tight tracking-wider text-slate-500 break-all uppercase">
                                      QUÉT TỔ {step.workCenterCode}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Responsive sequence connector line */}
                              {index < order.routing.length - 1 && (
                                <>
                                  {/* Desktop horizontal connector */}
                                  <div className="hidden md:flex absolute top-1/2 -right-4 w-4 h-0.5 items-center -translate-y-1/2 z-10">
                                    <div className={`h-full w-full transition-all ${
                                      isDone ? 'bg-emerald-500' : isCurrent ? 'bg-amber-500 animate-pulse' : 'bg-slate-200'
                                    }`} />
                                    <div className={`absolute right-0 -mr-[3px] w-0 h-0 border-y-[4px] border-y-transparent border-l-[5px] transition-all ${
                                      isDone ? 'border-l-emerald-500' : isCurrent ? 'border-l-amber-500' : 'border-l-slate-200'
                                    }`} />
                                  </div>

                                  {/* Mobile vertical connector */}
                                  <div className="md:hidden absolute -bottom-4 left-1/2 h-4 w-0.5 flex flex-col items-center -translate-x-1/2 z-10">
                                    <div className={`w-full h-full transition-all ${
                                      isDone ? 'bg-emerald-500' : isCurrent ? 'bg-amber-500 animate-pulse' : 'bg-slate-200'
                                    }`} />
                                    <div className={`absolute bottom-0 -mb-[3px] w-0 h-0 border-x-[4px] border-x-transparent border-t-[5px] transition-all ${
                                      isDone ? 'border-t-emerald-500' : isCurrent ? 'border-t-amber-500' : 'border-t-slate-200'
                                    }`} />
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200/60 p-2.5 rounded-lg flex items-center gap-1.5">
                        <QrCode className="h-4 w-4 shrink-0 text-slate-600" />
                        <span>💡 <strong>QUY TRÌNH QUÉT THỜI GIAN THỰC (MES):</strong> Di con chuột qua biểu tượng QR tại mỗi Tổ máy ở trên để lấy mã Code quy trình. Dùng trạm Operator ở tab thứ 4 quét mã này để nộp sản lượng tự động theo thời gian thực!</span>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: BOM VARIANCE ANALYSIS */}
                  {activeTab === 'bom' && (
                    <div className="space-y-4">
                      
                      {/* Material issue trigger expand button toggles */}
                      <div className="flex justify-between items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <Boxes className="h-4 w-4 text-slate-500" />
                          <span>THEO DÕI NGUYÊN KHÍ TIÊU HAO ĐỊNH MỨC</span>
                        </div>
                        <button
                          onClick={() => setIsIssuingMap(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold uppercase px-3.5 py-1.5 rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4 shrink-0" />
                          <span>Xuất vật tư bù hao (Logs)</span>
                        </button>
                      </div>

                      {/* Manual Issue form dropdown overlay */}
                      {isIssuingMap[order.id] && (
                        <form 
                          onSubmit={(e) => handleIssueSubmit(e, order)}
                          className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs animate-scale-in"
                        >
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Tên nguyên liệu hao phí</label>
                            <select
                              value={issueMaterialName}
                              onChange={(e) => {
                                setIssueMaterialName(e.target.value);
                                // Set unit automatically
                                const match = order.bom.find(b => b.materialName === e.target.value);
                                if (match) setIssueUnit(match.unit);
                              }}
                              required
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                            >
                              <option value="">-- Chọn nguyên liệu --</option>
                              {order.bom.map(b => (
                                <option key={b.id} value={b.materialName}>{b.materialName}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Số lượng cấp phát ({issueUnit})</label>
                            <input
                              type="number"
                              step="any"
                              value={issueQty}
                              onChange={(e) => setIssueQty(Math.max(0, parseFloat(e.target.value) || 0))}
                              required
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Ghi chú hoặc bù hao</label>
                            <input
                              type="text"
                              value={issueNote}
                              placeholder="Ví dụ: bù mép gỗ xéo / thay vít gãy.."
                              onChange={(e) => setIssueNote(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                            />
                          </div>

                          <div className="flex flex-col justify-end">
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Tổ viên hoặc sếp xuất kho</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={issueOperator}
                                required
                                placeholder="Tên cán bộ"
                                onChange={(e) => setIssueOperator(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                              />
                              <button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg font-bold uppercase shrink-0 cursor-pointer flex items-center justify-center"
                              >
                                Thêm
                              </button>
                            </div>
                          </div>
                        </form>
                      )}

                      {/* Relational BOM variance table list */}
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-900 text-white font-semibold font-sans text-[10.5px] uppercase tracking-wide">
                              <th className="p-3">Nguyên Vật Tư</th>
                              <th className="p-3">Đơn Vị</th>
                              <th className="p-3 text-right">Định Mức Chuẩn</th>
                              <th className="p-3 text-right">Thực Tế Cấp Phát</th>
                              <th className="p-3 text-right">Chênh Lệch (Variance)</th>
                              <th className="p-3 text-center">Trạng Thái Thất Thoát</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-sans">
                            {order.bom.map((bomLine) => {
                              const variance = Number((bomLine.actualQtyUsed - bomLine.plannedQty).toFixed(2));
                              const variancePercent = bomLine.plannedQty > 0 ? (variance / bomLine.plannedQty) * 100 : 0;
                              
                              let statusText = 'SAFE (Tối ưu)';
                              let statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                              
                              if (variance > 0) {
                                if (variancePercent > 5) {
                                  statusText = `THẤT THOÁT NẶNG (+${Number(variancePercent.toFixed(1))}%)`;
                                  statusClass = 'bg-rose-50 text-rose-600 border-rose-200/80 animate-normal';
                                } else {
                                  statusText = `HAOHỤT NHẸ (+${Number(variancePercent.toFixed(1))}%)`;
                                  statusClass = 'bg-amber-50 text-amber-700 border-amber-200';
                                }
                              } else if (variance < 0) {
                                statusText = `TIẾT KIỆM (${Number(variancePercent.toFixed(1))}%)`;
                                statusClass = 'bg-blue-50 text-blue-600 border-blue-250';
                              }

                              return (
                                <tr key={bomLine.id} className="hover:bg-slate-50/50 transition-all font-sans">
                                  <td className="p-3 font-semibold text-slate-800">{bomLine.materialName}</td>
                                  <td className="p-3 text-slate-500 font-mono font-medium">{bomLine.unit}</td>
                                  <td className="p-3 text-right font-mono font-bold text-slate-600">{bomLine.plannedQty}</td>
                                  <td className="p-3 text-right font-mono font-bold text-slate-900">{bomLine.actualQtyUsed}</td>
                                  <td className={`p-3 text-right font-mono font-bold ${variance > 0 ? 'text-rose-600' : variance < 0 ? 'text-blue-600' : 'text-slate-500'}`}>
                                    {variance > 0 ? `+${variance}` : variance}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${statusClass}`}>
                                      {statusText}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          );
        })
      )}

    </div>
  );
};
