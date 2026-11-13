import React, { useState } from 'react';
import { Bell, AlertTriangle, Info, X } from 'lucide-react';
import type {
  AstronautProfile,
  NotificationItem,
  SystemStatusData,
} from '../../types';

interface NavbarProps {
  astronaut: AstronautProfile;
  systemStatus: SystemStatusData;
  notifications: NotificationItem[];
  onNotificationDismiss: (id: string) => void;
  onNavigateToSettings: () => void;
  onNavigateToDashboard: () => void;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'A';

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const Navbar: React.FC<NavbarProps> = ({
  astronaut,
  systemStatus,
  notifications,
  onNotificationDismiss,
  onNavigateToSettings,
  onNavigateToDashboard,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayName = astronaut.name?.trim() || 'Astronaut';
  const initials = getInitials(displayName);

  return (
    <header className="h-16 border-b border-[#152347] bg-[#070d1f] px-6 flex items-center justify-between shrink-0 z-30 sticky top-0">

      {/* Brand Zone */}
      <div
        onClick={onNavigateToDashboard}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-500 flex items-center justify-center p-0.5 shadow-md shadow-cyan-900/20 group-hover:scale-105 transition-transform">
          <div className="w-full h-full rounded-full bg-[#070d1f] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-cyan-400 stroke-current fill-none stroke-[1.75]">
              <circle cx="12" cy="12" r="8" />
              <path d="M4 14.5c4-1 12-1 16 0" />
              <path d="M8 12c1.5-3 6.5-3 8 0" strokeDasharray="1 1" />
            </svg>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
              Aither Kairos
            </h1>
           {/* <span className="text-[10px] font-mono tracking-widest uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 px-1.5 py-0.5 rounded">
              NASA 2026
            </span>*/}
          </div>

          <p className="text-[11px] text-slate-400 tracking-wide">
            Astronaut Health Monitoring System
          </p>
        </div>
      </div>

      {/* Backend Health */}
      <div className="hidden lg:flex items-center gap-6">
       
        <button
          onClick={onNavigateToSettings}
          title="Configure Python/FastAPI model server"
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono transition-colors border ${
            systemStatus.fastapiConnected
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/30'
              : 'bg-amber-950/30 border-amber-800/40 text-amber-300 hover:bg-amber-900/30'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${
            systemStatus.fastapiConnected ? 'bg-emerald-400' : 'bg-amber-400'
          }`} />

          <span>
            FastAPI Engine: {systemStatus.fastapiConnected ? 'Connected' : 'Offline (Benchmark Active)'}
          </span>
        </button>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-4 relative">

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View mission alerts and schedule"
            className="w-9 h-9 rounded-lg bg-[#0e1938] hover:bg-[#14234e] text-slate-300 hover:text-white border border-[#1b2b5a] flex items-center justify-center transition-colors relative"
          >
            <Bell className="w-4 h-4" />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-[#0c1633] border border-[#1d2d5a] rounded-xl shadow-2xl p-4 z-50">

              <div className="flex items-center justify-between pb-3 border-b border-[#18264d] mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">
                    Mission Health Alerts & Schedule
                  </span>

                  <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/50 px-1.5 py-0.5 rounded-full">
                    {notifications.length}
                  </span>
                </div>

                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {notifications.map((item) => (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
  {notifications.length === 0 ? (
    <div className="py-8 text-center">
      <Bell className="w-7 h-7 text-slate-500 mx-auto mb-2" />
      <p className="text-sm text-slate-300">No mission alerts</p>
      <p className="text-xs text-slate-500 mt-1">
        You're all caught up!
      </p>
    </div>
  ) : (
    notifications.map((item) => (
      <div
        key={item.id}
        className={`p-3 rounded-lg border transition-colors ${
          item.read
            ? 'bg-[#0d1935] border-[#1e2f5f] opacity-70'
            : 'bg-[#111e42] border-cyan-800/50'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {item.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            )}

            <span className="text-xs font-semibold text-slate-200">
              {item.title}
            </span>

            {!item.read && (
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
            )}
          </div>

          <button
            onClick={() => onNotificationDismiss(item.id)}
            title="Dismiss notification"
            className="text-slate-500 hover:text-rose-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 mt-2 pl-6">
          {item.message}
        </p>

        <p className="text-[10px] font-mono text-slate-500 mt-2 pl-6">
          {item.timestamp}
        </p>
      </div>
    ))
  )}
</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Logged-in User Identity */}
        <div className="flex items-center gap-3 pl-2 border-l border-[#152347]">

          <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-400/40 flex items-center justify-center text-cyan-300 text-xs font-bold font-mono">
            {initials}
          </div>

          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-white leading-tight">
                {displayName}
              </p>

              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-1 rounded border border-cyan-800">
                AST-0427
              </span>
            </div>

            
          </div>
        </div>
      </div>
    </header>
  );
};