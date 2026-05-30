import React, { useState, useEffect, useRef } from 'react';
import { Play, FileSpreadsheet, Command, CheckCircle2, AlertTriangle, Cpu, Terminal, Loader2 } from 'lucide-react';
import { RPASimulationLog } from '../types';

interface RPABotProps {
  logs: RPASimulationLog[];
  onTriggerSimulate: (fileName: string, targetCount: number) => Promise<any>;
}

export const RPABot: React.FC<RPABotProps> = ({ logs, onTriggerSimulate }) => {
  const [selectedFile, setSelectedFile] = useState('Wanek_Plan_Weekly_Q2_Week21.xlsx');
  const [targetCount, setTargetCount] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<string[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const virtualFiles = [
    { name: 'Wanek_Plan_Weekly_Q2_Week21.xlsx', size: '24 KB', date: 'Bổ sung hôm nay, 08:30 AM', rows: 2 },
    { name: 'KeHoachSuaChuaGheSofa_X2B.xlsx', size: '18 KB', date: 'Tạo bởi Kế hoạch, Hôm qua', rows: 1 },
    { name: 'BOM_Furniture_DinhMuc_Wanek.xlsx', size: '150 KB', date: 'Chỉ đọc, Tuần trước', rows: 3 }
  ];

  // Auto-scroll robotic console log to bottom
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [steps]);

  const runVritualRPA = async () => {
    setIsRunning(true);
    setCurrentStep(1);
    setSteps([
      '🚀 Kiếm tạo và cấu hình tiến trình RPA UiPath Robot Studio...',
      '🤖 Robot đã đăng nhập thành công vào Hệ thống ERP SAP của Wanek Furniture.',
      `📂 Đang tải tệp Excel kế hoạch sản xuất: "C:/SAP_Downloads/${selectedFile}"...`
    ]);

    // Delay step-by-step console logs to simulate a real robot crawling
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    await delay(1200);
    setCurrentStep(2);
    setSteps(prev => [
      ...prev,
      '⚙️ Đang thực hiện xử lý tệp tin Excel vật lý...',
      `⚡ Ghi nhận ${targetCount} dòng dữ liệu Lệnh Sản xuất cần bóc tách.`,
      `🧩 Đọc cấu hình SKU vật tư. Khớp dữ liệu chuẩn mã hóa Gỗ mộc & Da bọc đệm...`
    ]);

    await delay(1200);
    setCurrentStep(3);
    setSteps(prev => [
      ...prev,
      '🧪 Đang thiết lập công thức tính toán và ánh xạ Bill of Materials (BOM) tự động...',
      '📈 Đã truy xuất thành công hệ thống định mức mác gỗ xẻ sấy, ốc vít thép và lượng sơn phủ bóng gỗ tiêu dùng định mức bổ sung.'
    ]);

    await delay(1200);
    setCurrentStep(4);
    setSteps(prev => [
      ...prev,
      '📡 Đang thiết lập kênh đóng gói API gửi đến Cổng Kết Nối MES của xưởng gỗ...',
      `🌐 GỬI HTTP REQUEST POST /api/orders & /api/materials/issue (Bố trí cấp phôi ban đầu)...`
    ]);

    try {
      // Trigger actual server API call that actually updates the SQL database
      const result = await onTriggerSimulate(selectedFile, targetCount);
      
      await delay(800);
      setCurrentStep(5);
      setSteps(prev => [
        ...prev,
        `✅ API Gateway Phản hồi thành công: Created 201.`,
        `📂 Danh sách Lệnh sản xuất Wanek khởi tạo thành công:`,
        ...result.orders.map((o: any) => `    -> ${o.orderNumber} - ${o.productName} (Số lượng: ${o.qtyOrdered} cái, Tổ ráp: WC003-ASM)`),
        `🎉 RPA UiPath Robot kết thúc thành công với mã trả về 0x000 (SUCCESS).`
      ]);
    } catch (err: any) {
      setSteps(prev => [
        ...prev,
        `❌ LỖI KẾT NỐI API: ${err.message}`,
        `⚠️ Robot tự động đóng tiến trình do phát sinh cảnh báo kỹ thuật.`
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      
      {/* File browser select card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600 shrink-0" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Kế hoạch Excel từ SAP</h3>
          </div>
          
          <p className="text-xs text-slate-500 font-sans leading-relaxed mb-4">
            Chọn tệp tin Excel kế hoạch hàng tuần tải về từ SAP của Wanek Furniture để cung cấp đầu vào cho rô bốt đọc tự động:
          </p>

          <div className="space-y-3">
            {virtualFiles.map((file) => {
              const isSelected = selectedFile === file.name;
              return (
                <div 
                  key={file.name} 
                  onClick={() => !isRunning && setSelectedFile(file.name)}
                  className={`border rounded-xl p-3 cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-medium' 
                      : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  } ${isRunning ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono truncate">{file.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{file.size}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[9px] text-slate-500">
                    <span>{file.date}</span>
                    <span className="font-bold text-slate-700">Gồm {file.rows} lệnh sản xuất</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-sans">
                Số lượng lệnh nhập hàng tối đa
              </label>
              <input
                type="number"
                min="1"
                max="3"
                value={targetCount}
                onChange={(e) => setTargetCount(Math.max(1, Math.min(3, parseInt(e.target.value) || 1)))}
                disabled={isRunning}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        <button
          onClick={runVritualRPA}
          disabled={isRunning}
          className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>ROBOT ĐANG XỬ LÝ...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-white" />
              <span>CHẠY WORKFLOW ROBOT (UIPATH)</span>
            </>
          )}
        </button>
      </div>

      {/* Robot visual console logs */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl lg:col-span-2 flex flex-col justify-between text-white md:min-h-[400px]">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className={`h-5 w-5 ${isRunning ? 'text-emerald-500 animate-spin' : 'text-slate-500'}`} />
            <span className="text-xs font-bold font-mono tracking-wider uppercase text-emerald-400">
              CONSOLE UIPATH EXECUTION LOGS
            </span>
          </div>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
        </div>

        {/* Dynamic step visualization indicator */}
        <div className="grid grid-cols-5 gap-1.5 my-3">
          {[
            { label: 'Cấu hình', num: 1 },
            { label: 'Đọc Excel', num: 2 },
            { label: 'Tính BOM', num: 3 },
            { label: 'Cổng API', num: 4 },
            { label: 'Hoàn tất', num: 5 }
          ].map((s) => {
            const isDone = currentStep > s.num;
            const isCurr = currentStep === s.num;
            return (
              <div key={s.num} className="text-center">
                <div className={`h-1 rounded transition-all duration-300 ${
                  isDone 
                    ? 'bg-emerald-500' 
                    : isCurr 
                    ? 'bg-amber-500 animate-pulse' 
                    : 'bg-slate-800'
                }`} />
                <span className={`text-[8.5px] font-mono block mt-1 ${
                  isDone ? 'text-emerald-400' : isCurr ? 'text-amber-500' : 'text-slate-600'
                }`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Infinite terminal logger window */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-xl font-mono text-[11px] space-y-2 leading-relaxed text-slate-300 border border-slate-900 box-border max-h-[220px]">
          {steps.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 font-sans gap-2 py-10 text-center">
              <Terminal className="h-8 w-8 text-slate-800" />
              <span>Chưa bắt đầu quy trình tự động hoá RPA.</span>
              <span className="text-[10px]">Chọn một file Excel kế hoạch và click nút khởi chạy rô bốt ở bên trái</span>
            </div>
          ) : (
            <>
              {steps.map((step, idx) => (
                <div key={idx} className="transition-all duration-300">
                  <span className="text-slate-600 select-none mr-2">[{idx + 1}]</span>
                  <span className="whitespace-pre-line leading-relaxed">{step}</span>
                </div>
              ))}
              <div ref={consoleEndRef} />
            </>
          )}
        </div>

        {/* Historic logs audit trail */}
        <div className="mt-5 border-t border-slate-900 pt-3">
          <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase block mb-2">
            Nhật ký lưu trữ hệ thống ({logs.length} bản ghi)
          </span>
          <div className="space-y-1.5 max-h-[85px] overflow-y-auto text-[10px] font-mono text-slate-400 pr-1">
            {logs.map((log) => (
              <div key={log.id} className="bg-slate-900/50 p-1.5 rounded border border-slate-900 flex items-start justify-between gap-3">
                <div className="truncate flex-1">
                  <span className="text-slate-500 mr-1.5">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className="text-emerald-400 mr-1 font-bold">{log.fileName}</span>
                  <span>- {log.logMessage}</span>
                </div>
                <span className={`px-1 rounded text-[8px] font-bold uppercase tracking-wider shrink-0 mt-0.5 ${
                  log.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-red-950 text-red-400 border border-red-900'
                }`}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
