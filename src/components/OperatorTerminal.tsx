import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  Zap, 
  Boxes, 
  HelpCircle, 
  ClipboardCheck,
  Activity
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ProductionOrder, WorkCenter } from '../types';

interface OperatorTerminalProps {
  orders: ProductionOrder[];
  workCenters: WorkCenter[];
  onSubmitProgress: (payload: any) => Promise<void>;
  onReportDefect: (payload: any) => Promise<void>;
  onTriggerAndon: (payload: any) => Promise<void>;
}

export const OperatorTerminal: React.FC<OperatorTerminalProps> = ({
  orders,
  workCenters,
  onSubmitProgress,
  onReportDefect,
  onTriggerAndon
}) => {
  const [selectedWC, setSelectedWC] = useState('WC003-ASM');
  const [scanResult, setScanResult] = useState('');
  const [scannedOrder, setScannedOrder] = useState<ProductionOrder | null>(null);
  
  // Submit quantity progress
  const [submitQty, setSubmitQty] = useState(1);
  const [operatorName, setOperatorName] = useState('');
  
  // Dynamic material auto-issue link with progress report
  const [issueMaterialLabel, setIssueMaterialLabel] = useState('');
  const [issueQty, setIssueQty] = useState(0);

  // Defect logging form
  const [defectType, setDefectType] = useState('Gỗ nứt mắt xéo');
  const [defectQty, setDefectQty] = useState(0);
  const [defectNotes, setDefectNotes] = useState('');

  // Local helper state for camera init
  const [cameraActive, setCameraActive] = useState(false);
  const [isSuccessfullySubmitted, setIsSuccessfullySubmitted] = useState(false);

  // Auto load active workcenter operations
  const activeWCOrders = orders.filter(o => 
    (o.status === 'RELEASED' || o.status === 'IN_PROGRESS') &&
    o.routing.some(s => s.workCenterCode === selectedWC && s.status !== 'COMPLETED')
  );

  // Parse QR content string format: {orderId}__{workCenterCode}__{orderedQty}
  const parseQRContent = (text: string) => {
    setScanResult(text);
    const parts = text.split('__');
    if (parts.length >= 2) {
      const orderId = parts[0];
      const wcCode = parts[1];
      
      const match = orders.find(o => o.id === orderId);
      if (match) {
        setScannedOrder(match);
        setSelectedWC(wcCode);
        // Default standard values
        const step = match.routing.find(s => s.workCenterCode === wcCode);
        if (step) {
          // prefill material labels if matches
          if (match.bom.length > 0) {
            setIssueMaterialLabel(match.bom[0].materialName);
          }
        }
      }
    }
  };

  // Real Camera scan activator inside browser iframe
  useEffect(() => {
    let qrcodeScanner: Html5QrcodeScanner | null = null;
    
    if (cameraActive) {
      // Start camera rendering inside node element
      qrcodeScanner = new Html5QrcodeScanner(
        "web-reader-element", 
        { fps: 10, qrbox: { width: 200, height: 200 } },
        false
      );
      
      qrcodeScanner.render(
        (decodedText) => {
          parseQRContent(decodedText);
          setCameraActive(false);
          if (qrcodeScanner) qrcodeScanner.clear();
        },
        (error) => {
          // standard low relevance camera noise logs
        }
      );
    }

    return () => {
      // clean logic
      if (qrcodeScanner) {
        qrcodeScanner.clear().catch(err => console.warn("Scanner shutdown noise", err));
      }
    };
  }, [cameraActive]);

  // Recruiter convenient click simulator (mimics physical scanning)
  const handleVirtualScan = (order: ProductionOrder, workCenterCode: string) => {
    const qrContent = `${order.id}__${workCenterCode}__${order.qtyOrdered}`;
    parseQRContent(qrContent);
  };

  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedOrder || !operatorName) return;

    try {
      await onSubmitProgress({
        orderId: scannedOrder.id,
        workCenterCode: selectedWC,
        qty: Number(submitQty),
        operatorName,
        materialToIssueName: issueMaterialLabel || undefined,
        materialToIssueQty: issueQty > 0 ? Number(issueQty) : undefined,
        materialToIssueUnit: scannedOrder.bom.find(b => b.materialName === issueMaterialLabel)?.unit
      });

      setIsSuccessfullySubmitted(true);
      setTimeout(() => setIsSuccessfullySubmitted(false), 3000);
      
      // Auto-refresh order data state in panel
      const reFetchOrder = orders.find(o => o.id === scannedOrder.id);
      if (reFetchOrder) setScannedOrder(reFetchOrder);
      setSubmitQty(1);
      setIssueQty(0);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDefectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedOrder || defectQty <= 0) return;

    try {
      await onReportDefect({
        orderId: scannedOrder.id,
        orderNumber: scannedOrder.orderNumber,
        workCenterCode: selectedWC,
        defectType,
        quantity: Number(defectQty),
        reportedBy: operatorName || 'Tổ trưởng máy',
        notes: defectNotes
      });

      setDefectQty(0);
      setDefectNotes('');
      alert('Đã ghi nhận báo cáo khuyết tật chất lượng lên bảng KCS!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAndonTrigger = async (type: 'MATERIAL' | 'QUALITY' | 'MACHINE' | 'SAFETY') => {
    if (!scannedOrder) return;
    const wc = workCenters.find(w => w.code === selectedWC);
    
    try {
      await onTriggerAndon({
        orderId: scannedOrder.id,
        orderNumber: scannedOrder.orderNumber,
        workCenterCode: selectedWC,
        workCenterName: wc?.name || 'Tổ sản xuất',
        alarmType: type,
        severity: 'CRITICAL',
        message: `Yêu cầu can thiệp khẩn cấp sự cố ${type} phát sinh tại bệ máy ${wc?.name}. Dừng quy trình sản xuất của lệnh ${scannedOrder.orderNumber}!`
      });
      alert('ĐÃ KÍCH HOẠT CÒI BÁO ĐỘNG ANDON ĐẾN TRUNG TÂM CO-ORDINATOR!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      
      {/* COLUMN 1: Scan Station Simulator */}
      <div className="space-y-4">
        
        {/* Workstation selector list */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-2 font-sans">
            TỔ KHỞI CHẠY ĐỒNG BỘ HIỆN TẠI
          </label>
          <select
            value={selectedWC}
            onChange={(e) => {
              setSelectedWC(e.target.value);
              setScannedOrder(null);
              setScanResult('');
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-slate-800"
          >
            {workCenters.map((wc) => (
              <option key={wc.id} value={wc.code}>
                {wc.code} - {wc.name}
              </option>
            ))}
          </select>
        </div>

        {/* QR Core Scanning Portal */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <QrCode className="h-5 w-5 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Trạm quét laser</h3>
          </div>

          <p className="text-xs text-slate-500 font-sans leading-relaxed">
            Mở Camera quét tem mác gỗ thực tế hoặc click nhanh thẻ thông tin dưới đây để mô phỏng dán sấy:
          </p>

          {/* Quick Mock Scanner Laser Selector */}
          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
            {activeWCOrders.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">Không tìm thấy lệnh sẳn có chờ quét tại ổ {selectedWC}</p>
            ) : (
              activeWCOrders.map((order) => (
                <div 
                  key={order.id}
                  onClick={() => handleVirtualScan(order, selectedWC)}
                  className="bg-slate-50 border border-slate-250 hover:bg-slate-100/80 rounded-xl p-2.5 cursor-pointer text-xs transition-all flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{order.productName}</p>
                  </div>
                  <div className="bg-slate-900 text-amber-500 text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                    <Zap className="h-3 w-3 fill-amber-500" />
                    <span>BẮN LASER</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Camera activator toggle */}
          <button
            onClick={() => setCameraActive(!cameraActive)}
            className="w-full flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-850 py-2 rounded-lg text-xs font-bold uppercase transition-all shadow-sm cursor-pointer"
          >
            <Camera className="h-4 w-4 shrink-0" />
            <span>{cameraActive ? 'Dừng Camera quét' : 'Khởi động QR CAM'}</span>
          </button>

          {/* Render container element */}
          {cameraActive && (
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
              <div id="web-reader-element" className="w-full text-xs text-slate-400" />
            </div>
          )}

          {scanResult && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 font-mono text-[10px] text-emerald-400 leading-tight">
              <span className="text-slate-500 uppercase block mb-1">Decoded QR String:</span>
              <span className="break-all">{scanResult}</span>
            </div>
          )}
        </div>
      </div>

      {/* COLUMN 2: Station reports console forms */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
        
        {!scannedOrder ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 font-sans text-center">
            <ClipboardCheck className="h-12 w-12 text-slate-350 mb-3" />
            <p className="text-sm font-semibold text-slate-700">Chưa bắt được tín hiệu phôi quét</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Sử dụng bảng <strong>"Trạm quét laser"</strong> bên trái để quét phôi mộc tự động trước khi ghi nhận sản lượng hoàn thành!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header reporting form */}
            <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row justify-between gap-3 text-slate-850">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-tight bg-slate-900 text-amber-500 px-2 py-0.5 rounded uppercase">
                  ĐANG PHÒNG VẬN HÀNH: {selectedWC}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1 select-all">
                  {scannedOrder.orderNumber} - {scannedOrder.productName}
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Bộ phận sản xuất: {workCenters.find(w => w.code === selectedWC)?.name}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-slate-400 block font-sans">Chi tiết chỉ tiêu:</span>
                <span className="text-sm font-extrabold font-mono text-slate-900">
                  {scannedOrder.routing.find(s => s.workCenterCode === selectedWC)?.completedQty || 0} / {scannedOrder.qtyOrdered} cái
                </span>
              </div>
            </div>

            {/* Form list: progress reports, defects reports and alarm triggers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Box A: Submit completed pieces */}
              <form onSubmit={handleProgressSubmit} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <Activity className="h-4 w-4 text-slate-700" />
                  <span>Nộp sản lượng chế tác</span>
                </h4>

                <div>
                  <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Họ tên sếp máy / Tổ trưởng</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Hoàng Văn Đức"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Số cái làm bù hôm nay</label>
                    <input
                      type="number"
                      min="1"
                      value={submitQty}
                      onChange={(e) => setSubmitQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Tự động xuất keo/gỗ</label>
                    <select
                      value={issueMaterialLabel}
                      onChange={(e) => setIssueMaterialLabel(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    >
                      <option value="">-- Không xuất mộc --</option>
                      {scannedOrder.bom.map(b => (
                        <option key={b.id} value={b.materialName}>{b.materialName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {issueMaterialLabel && (
                  <div className="animate-fade-in block">
                    <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">
                      Lượng xuất bù thực tế ({scannedOrder.bom.find(b => b.materialName === issueMaterialLabel)?.unit || 'đơn vị'})
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={issueQty}
                      onChange={(e) => setIssueQty(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-slate-800"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-850 text-white py-2 rounded-lg text-xs font-bold uppercase transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Ký nộp báo cáo sản lượng</span>
                </button>

                {isSuccessfullySubmitted && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] p-2 rounded-lg text-center font-sans tracking-wide">
                    🎉 Đã truyền tải dữ liệu thành công qua WebSocket! KPI Dashboard đã nạp.
                  </div>
                )}
              </form>

              {/* Box B: Log Quality defect or Alarm trigger */}
              <div className="space-y-4">
                
                {/* Defect Log Form */}
                <form onSubmit={handleDefectSubmit} className="space-y-4 bg-rose-50/40 p-4 rounded-xl border border-rose-200/60 text-slate-850">
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-tight flex items-center gap-1.5 border-b border-rose-200/60 pb-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>Khai báo khuyết tật (KCS)</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Mác khuyết tật lỗi</label>
                      <select
                        value={defectType}
                        onChange={(e) => setDefectType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                      >
                        <option value="Sứt vỡ mắt gỗ xéo phôi">Mắt gỗ sâu sần</option>
                        <option value="Rán rách vải nỉ lót">Nhông nỉ bong bọc</option>
                        <option value="Bọt bọt vón sơn gai PU">Loang ố sơn PU</option>
                        <option value="Lệch góc kẽ mộng mộc">Ráp lệch mộng ốc</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Số phôi lỗi hại</label>
                      <input
                        type="number"
                        min="1"
                        value={defectQty}
                        onChange={(e) => setDefectQty(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Mô tả sự cố kỹ thuật</label>
                    <input
                      type="text"
                      placeholder="Mô tả ngắn gọn hỏng hóc..."
                      value={defectNotes}
                      onChange={(e) => setDefectNotes(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={defectQty <= 0}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white py-1.5 rounded-lg text-xs font-bold uppercase transition-all shadow cursor-pointer disabled:opacity-50"
                  >
                    Báo lỗi phôi KCS
                  </button>
                </form>

                {/* Switch Emergency Andon handle leverage */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white">
                  <h4 className="text-[11px] font-bold text-amber-500 uppercase flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5" />
                    <span>CẦN PHẦN CẤP KHẨN CẤP?</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Nếu xảy ra sự cố nát gãy máy tiện CNC hay thiếu gỗ đợt nặng, xoay còi kéo Andon ngay để báo động:
                  </p>
                  <div className="flex gap-2.5 mt-3">
                    <button
                      onClick={() => handleAndonTrigger('MATERIAL')}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10.5px] font-extrabold px-3 py-1.5 rounded uppercase flex-1 cursor-pointer transition-all"
                    >
                      HẾT GỖ THÔ
                    </button>
                    <button
                      onClick={() => handleAndonTrigger('MACHINE')}
                      className="bg-red-600 hover:bg-red-500 text-white text-[10.5px] font-extrabold px-3 py-1.5 rounded uppercase flex-1 cursor-pointer transition-all"
                      title="Sự cố hỏng hóc hệ tiện"
                    >
                      HỎNG CNC / MÁY
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
