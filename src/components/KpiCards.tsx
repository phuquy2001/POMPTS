import React from 'react';
import { Layers, CheckCircle2, TrendingUp, AlertOctagon, Sparkles, AlertTriangle } from 'lucide-react';
import { DashboardStats } from '../types';

interface KpiCardsProps {
  stats: DashboardStats;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      {/* KPI Card 1: Total Orders */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 font-sans tracking-wide uppercase">TẤT CẢ LỆNH (BOM)</span>
          <div className="bg-slate-100 text-slate-700 p-1.5 rounded-lg">
            <Layers className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold font-mono text-slate-900">{stats.totalOrders}</span>
          <span className="text-[10px] text-slate-400 block mt-1 font-sans">Lệnh trong hệ thống</span>
        </div>
      </div>

      {/* KPI Card 2: Active Orders */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:layer lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 font-sans tracking-wide uppercase">ĐANG SẢN XUẤT</span>
          <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold font-mono text-blue-600">{stats.activeOrders}</span>
          <span className="text-[10px] text-slate-400 block mt-1 font-sans">Đang chạy ở các tổ máy</span>
        </div>
      </div>

      {/* KPI Card 3: Completed Orders */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:layer lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 font-sans tracking-wide uppercase">ĐÃ ĐÓNG GÓI</span>
          <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold font-mono text-emerald-600">{stats.completedOrders}</span>
          <span className="text-[10px] text-slate-400 block mt-1 font-sans">Hoàn thiện kỹ thuật kcs</span>
        </div>
      </div>

      {/* KPI Card 4: Overall Completion Progress */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:layer lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 font-sans tracking-wide uppercase">TIẾN ĐỘ CHUNG</span>
          <div className="bg-amber-50 text-amber-600 p-1.5 rounded-lg">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-amber-600">{stats.overallProgress}%</span>
          </div>
          {/* Progress bar container */}
          <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full transition-all duration-500" 
              style={{ width: `${stats.overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* KPI Card 5: Defect Rates */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:layer lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 font-sans tracking-wide uppercase">SẢN PHẨM LỖI (KCS)</span>
          <div className="bg-rose-50 text-rose-600 p-1.5 rounded-lg">
            <AlertOctagon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold font-mono text-rose-600">{stats.totalDefects}</span>
          <span className="text-[10px] text-slate-400 block mt-1 font-sans">Khuyết tật mộc chờ xử lý</span>
        </div>
      </div>

      {/* KPI Card 6: Active Andon Alerts */}
      <div className={`${
        stats.activeAlarmsCount > 0 
          ? 'bg-red-50 border-red-200 animate-pulse text-red-950' 
          : 'bg-white border-slate-100'
      } border rounded-xl p-4 shadow-sm flex flex-col justify-between hover:layer lg:col-span-1`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 font-sans tracking-wide uppercase">ALARM ANDON</span>
          <div className={`p-1.5 rounded-lg ${
            stats.activeAlarmsCount > 0 ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className={`text-2xl font-bold font-mono ${
            stats.activeAlarmsCount > 0 ? 'text-red-600' : 'text-slate-900'
          }`}>{stats.activeAlarmsCount}</span>
          <span className="text-[10px] text-slate-400 block mt-1 font-sans">
            {stats.activeAlarmsCount > 0 ? 'Yêu cầu hỗ trợ khẩn cấp!' : 'An toàn dây chuyền'}
          </span>
        </div>
      </div>
    </div>
  );
};
