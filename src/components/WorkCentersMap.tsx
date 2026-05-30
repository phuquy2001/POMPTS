import React from 'react';
import { ShieldCheck, Siren, User, Cog, HelpCircle } from 'lucide-react';
import { WorkCenter, AndonAlarm } from '../types';

interface WorkCentersMapProps {
  workCenters: WorkCenter[];
  activeAlarms: AndonAlarm[];
}

export const WorkCentersMap: React.FC<WorkCentersMapProps> = ({ workCenters, activeAlarms }) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
      
      {/* Map Header */}
      <div className="flex items-center justify-between border-b border-slate-105 pb-3">
        <div className="flex items-center gap-2">
          <Cog className="h-5 w-5 text-slate-700 animate-spin" style={{ animationDuration: '6s' }} />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Sơ đồ dây chuyền mộc (SCADA)</h3>
        </div>
        <div className="flex items-center gap-x-3 text-[10px] font-bold font-mono">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" /> RUNNING</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-400 inline-block" /> STANDBY</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500 animate-ping inline-block" /> ANDON DOWN</span>
        </div>
      </div>

      <p className="text-xs text-slate-500 font-sans leading-relaxed">
        Bản đồ trực quan hóa trạng thái thời gian thực của các tổ máy thuộc phân xưởng Wanek Binh Duong:
      </p>

      {/* Grid Floor SCADA */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {workCenters.map((wc) => {
          const matchingAlarms = activeAlarms.filter(a => a.workCenterCode === wc.code && a.status === 'ACTIVE');
          const isDown = wc.status === 'DOWN' || matchingAlarms.length > 0;
          const isActive = wc.status === 'ACTIVE' && !isDown;
          const isIdle = !isActive && !isDown;

          let blockBg = 'bg-white border-slate-200/85';
          let statusLabel = 'STANDBY';
          let borderSignal = 'border-slate-200';
          let lightColor = 'bg-slate-400';

          if (isDown) {
            blockBg = 'bg-red-50/50 border-red-300 animate-normal';
            borderColor: 'border-red-300';
            statusLabel = 'STOPPED (ANDON ALARM)';
            lightColor = 'bg-red-500 animate-ping';
          } else if (isActive) {
            blockBg = 'bg-emerald-50/20 border-emerald-300';
            statusLabel = 'ACTIVE - RUNNING';
            lightColor = 'bg-emerald-500 animate-pulse';
          }

          return (
            <div 
              key={wc.id}
              className={`border rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-sm transition-all select-all ${blockBg}`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  {/* Station Code badge */}
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-150">
                    {wc.code}
                  </span>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${lightColor}`} />
                    <span className="text-[10px] font-bold font-mono text-slate-700 uppercase">
                      {statusLabel}
                    </span>
                  </div>
                </div>

                {/* Station Title */}
                <h4 className="font-bold text-xs text-slate-900 leading-tight">
                  {wc.name}
                </h4>

                {/* Operator info */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-sans pt-1">
                  <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Tổ trưởng: <strong className="text-slate-700">{wc.operatorName}</strong></span>
                </div>
              </div>

              {/* Conditionally show warning message if Andon is DOWN */}
              {isDown ? (
                <div className="bg-red-100 border border-red-200 rounded-lg p-2 mt-4 text-[10.5px] text-red-800 flex items-start gap-1 font-sans animate-bounce">
                  <Siren className="h-4 w-4 text-red-600 shrink-0 mt-0.5 animate-pulse" />
                  <div className="truncate flex-1">
                    <strong>Sự cố:</strong> {matchingAlarms[0]?.message || 'Yêu cầu gọi hỗ trợ kỹ thuật gấp!'}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-4 text-[10.5px] text-slate-400 font-mono italic">
                  <span>Tiêu hao vật tư: OK</span>
                  <span>An toàn: 100%</span>
                </div>
              )}

              {/* Decorative side rotating cog gears for ACTIVE stations */}
              {isActive && (
                <div className="absolute -right-3 -bottom-3 opacity-5 pointer-events-none text-slate-900">
                  <Cog className="h-16 w-16 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
