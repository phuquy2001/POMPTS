import React from 'react';
import { Layers, Activity, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { AndonAlarm } from '../types';

interface HeaderProps {
  wsConnected: boolean;
  activeAlarms: AndonAlarm[];
  onTabChange: (tab: string) => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ wsConnected, activeAlarms, onTabChange, activeTab }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      {/* Dynamic Alarm Flasher Alert Link */}
      {activeAlarms.length > 0 && (
        <div className="bg-amber-500 text-slate-950 font-medium px-4 py-1.5 text-xs text-center flex items-center justify-center gap-2 animate-pulse">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            HỆ THỐNG GHI NHẬN <strong>{activeAlarms.length} CẢNH BÁO ANDON ĐANG HOẠT ĐỘNG</strong> cần giải quyết ngay lập tức tại dây chuyền mộc!
          </span>
          <button 
            onClick={() => onTabChange('andon')}
            className="underline hover:text-white transition-all ml-2 font-bold cursor-pointer"
          >
            Đến bảng Andon &rarr;
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo and Brand Title */}
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-slate-950 p-2 rounded-lg font-bold shadow-lg flex items-center justify-center">
            <Layers className="h-6 w-6" id="logo-icon" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-bold tracking-tight text-white">WANEK FURNITURE</h1>
              <span className="text-[10px] font-mono tracking-wider bg-slate-800 text-amber-500 border border-slate-700 px-1.5 py-0.5 rounded uppercase">
                MES/ERP
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Hệ thống Quản lý Lệnh Sản xuất & Theo dõi Tiến độ Thời gian thực
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
          {[
            { id: 'dashboard', label: 'Dashboard Live', icon: Activity },
            { id: 'orders', label: 'Quản Lý Lệnh', icon: Layers },
            { id: 'terminal', label: 'Trạm Vận Hành (QR)', icon: Layers },
            { id: 'andon', label: 'Bảng Andon Alarms', icon: AlertTriangle },
            { id: 'rpa', label: 'RPA Robot (Excel)', icon: Activity },
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <IconComponent className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Live connectivity state */}
        <div className="flex items-center gap-3 shrink-0">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono font-medium leading-none ${
            wsConnected 
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60' 
              : 'bg-rose-950/40 text-rose-400 border-rose-800/60 animate-pulse'
          }`}>
            {wsConnected ? (
              <>
                <Wifi className="h-3 w-3 animate-pulse text-emerald-400" />
                <span>LIVE SYNC</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                <span>OFFLINE RECONNECTING</span>
              </>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-mono hidden xl:inline">
            Tổ máy: Wanek_Q2_BinhDuong
          </span>
        </div>
      </div>
    </header>
  );
};
