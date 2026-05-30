import React, { useState } from 'react';
import { AlertOctagon, HelpCircle, CheckCircle2, Siren, Zap, RefreshCw } from 'lucide-react';
import { AndonAlarm, WorkCenter } from '../types';

interface AndonConsoleProps {
  alarms: AndonAlarm[];
  workCenters: WorkCenter[];
  onTriggerAlarm: (alarmData: any) => Promise<void>;
  onResolveAlarm: (alarmId: string) => Promise<void>;
}

export const AndonConsole: React.FC<AndonConsoleProps> = ({ 
  alarms, 
  workCenters, 
  onTriggerAlarm, 
  onResolveAlarm 
}) => {
  const [selectedWC, setSelectedWC] = useState('');
  const [alarmType, setAlarmType] = useState<'MATERIAL' | 'QUALITY' | 'MACHINE' | 'SAFETY'>('MATERIAL');
  const [severity, setSeverity] = useState<'WARNING' | 'CRITICAL'>('WARNING');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeAlarms = alarms.filter(a => a.status === 'ACTIVE');
  const resolvedAlarms = alarms.filter(a => a.status === 'RESOLVED');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWC) return;
    
    setIsSubmitting(true);
    const wc = workCenters.find(w => w.code === selectedWC);
    try {
      await onTriggerAlarm({
        workCenterCode: selectedWC,
        workCenterName: wc?.name || 'Tổ sản xuất',
        alarmType,
        severity,
        message: message || `Báo động sự cố ${alarmType} phát sinh tại ${wc?.name}. Đề nghị hỗ trợ kỹ thuật!`
      });
      // Clear message
      setMessage('');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      
      {/* Column 1: Andon Controller Trigger Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-red-500/20 text-red-400 p-2 rounded-lg">
              <Siren className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-100">Còi Andon Cảnh Báo</h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">Bấm chuông ảo kích hoạt sự cố khẩn cấp Tổ máy</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="block text-xs font-medium text-slate-300 font-sans mb-1.5 uppercase tracking-wider">
                Chọn Tổ Phát Sinh Sự Cố
              </label>
              <select
                value={selectedWC}
                onChange={(e) => setSelectedWC(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500"
              >
                <option value="">-- Chọn tổ trưởng tổ máy --</option>
                {workCenters.map(wc => (
                  <option key={wc.id} value={wc.code}>
                    {wc.name} ({wc.status === 'DOWN' ? 'ĐANG DỪNG MÁY' : 'ĐANG CHẠY'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 font-sans mb-1.5 uppercase tracking-wider">
                  Loại Sự Cố
                </label>
                <select
                  value={alarmType}
                  onChange={(e) => setAlarmType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500"
                >
                  <option value="MATERIAL">Thiếu gỗ / Liệu</option>
                  <option value="QUALITY">Lỗi Chất lượng QA</option>
                  <option value="MACHINE">Kỹ thuật hỏng máy</option>
                  <option value="SAFETY">An toàn lao động</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 font-sans mb-1.5 uppercase tracking-wider">
                  Mức Độ
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500"
                >
                  <option value="WARNING">Cảnh báo - WARNING</option>
                  <option value="CRITICAL">Dừng máy - CRITICAL !</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 font-sans mb-1.5 uppercase tracking-wider">
                Mô tả chi tiết yêu cầu hỗ trợ
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ví dụ: Lỗi máy CNC xẻ xéo phôi liên tục / Hết mút bọc bọt nệm vải thô nỉ xanh..."
                rows={3}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500 placeholder:text-slate-600"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedWC}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase cursor-pointer transition-all ${
                severity === 'CRITICAL'
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Siren className="h-4 w-4 shrink-0 animate-bounce" />
              <span>KÍCH HOẠT HỆ THỐNG ANDON</span>
            </button>
          </form>
        </div>

        <div className="mt-8 border-t border-slate-800/80 pt-4 bg-slate-950/40 p-3 rounded-lg text-[11px] font-mono leading-relaxed text-slate-400">
          <div className="text-amber-500 font-bold mb-1">💡 GIẢI THÍCH SỰ CỐ & QUY TRÌNH:</div>
          Khi nhấn Andon, hệ thống sẽ đổi trạng thái Tổ sản xuất thành <span className="text-red-500">DOWN</span> (Màu đỏ dường máy). Còi báo động kỹ thuật sẽ nhấp nháy đỏ trên toàn bộ hệ thống Live Dashboard của tổ trưởng và Giám đốc điều hành.
        </div>
      </div>

      {/* Column 2: Active Alarms Terminal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl lg:col-span-2 flex flex-col">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-red-500" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-100">
              Cảnh báo đang hoạt động ({activeAlarms.length})
            </h3>
          </div>
          <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded font-bold font-mono">
            BẢNG ĐIỀU KHIỂN SỰ CỐ REAL-TIME
          </span>
        </div>

        {activeAlarms.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 font-sans text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
            <p className="text-xs font-semibold text-slate-300">Tuyệt vời! Dây chuyền Wanek đang chạy trơn tru</p>
            <p className="text-[11px] text-slate-500 mt-1">Không ghi nhận sự cố hay gián đoạn vật liệu hay hỏng máy móc.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[350px] overflow-y-auto flex-1 pr-1">
            {activeAlarms.map((alarm) => (
              <div 
                key={alarm.id} 
                className={`border rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all animate-pulse ${
                  alarm.severity === 'CRITICAL'
                    ? 'bg-red-950/20 border-red-800/80 shadow-inner'
                    : 'bg-amber-950/20 border-amber-800/80'
                }`}
              >
                <div className="space-y-1.5 flex-1 select-all">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      alarm.severity === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-500 text-slate-950'
                    }`}>
                      {alarm.severity} - {alarm.alarmType}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">
                      {alarm.workCenterName} ({alarm.workCenterCode})
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {alarm.message}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                    <span>Lệnh liên đới: <span className="text-slate-300 font-bold">{alarm.orderNumber}</span></span>
                    <span>•</span>
                    <span>Phát sinh: {new Date(alarm.triggeredAt).toLocaleTimeString('vi-VN')}</span>
                  </div>
                </div>

                <button
                  onClick={() => onResolveAlarm(alarm.id)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1 shrink-0 self-stretch md:self-auto justify-center"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>XÓA SỰ CỐ / CHẠY LẠI</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Alarm History Grid */}
        <div className="mt-6 border-t border-slate-800 pt-4 flex-1 flex flex-col">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <RefreshCw className="h-3 w-3" />
            <span>Lịch sử sự cố đã xử lý ({resolvedAlarms.length})</span>
          </h4>
          {resolvedAlarms.length === 0 ? (
            <p className="text-[11px] text-slate-600 font-sans mt-1">Chưa ghi nhận ca sự cố nào trong ngày hôm nay.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[150px] overflow-y-auto pr-1">
              {resolvedAlarms.map((alarm) => (
                <div key={alarm.id} className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2.5 flex items-center justify-between text-xs text-slate-400">
                  <div className="truncate flex-1 pr-2">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-emerald-400 font-bold uppercase">RESOLVED</span>
                      <span className="text-slate-500 font-mono font-bold shrink-0">{alarm.workCenterCode}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 truncate select-all">{alarm.message}</p>
                  </div>
                  <span className="text-[9px] font-mono text-slate-600 shrink-0 select-none">
                    Giải quyết: {alarm.resolvedAt ? new Date(alarm.resolvedAt).toLocaleTimeString('vi-VN') : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
