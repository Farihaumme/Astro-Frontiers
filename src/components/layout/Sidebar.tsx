import React from 'react';
import {
  LayoutDashboard,
  ScanLine,
  Activity,
  Heart,
  Brain,
  Compass,
  FileText,
  History,
  Settings,
} from 'lucide-react';
import { NavigationTab } from '../../types';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const navItems = [
    {
      id: 'overview' as NavigationTab,
      label: 'Health Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'trends' as NavigationTab,
      label: 'Health Trends',
      icon: Activity,
      badge: 'Telemetry',
    },
    {
      id: 'ijv' as NavigationTab,
      label: 'IJV Ultrasound Analysis',
      icon: ScanLine,
      isPrimary: true,
      badge: 'Active AI',
    },
    {
      id: 'cardiovascular' as NavigationTab,
      label: 'Cardiovascular Health',
      icon: Heart,
      badge: 'Demonstration',
    },
    {
      id: 'cognitive' as NavigationTab,
      label: 'Cognitive Health',
      icon: Brain,
      badge: 'Demonstration',
    },
    {
      id: 'guidance' as NavigationTab,
      label: 'Health Guidance',
      icon: Compass,
      badge: 'Protocol',
    },
    {
      id: 'reports' as NavigationTab,
      label: 'Health Reports',
      icon: FileText,
      badge: 'Ground Team',
    },
    {
      id: 'history' as NavigationTab,
      label: 'Analysis History',
      icon: History,
    },
    {
      id: 'settings' as NavigationTab,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-[#080e22] border-r border-[#152347] flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16">
      {/* Navigation Links */}
      <div className="p-3.5 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-mono tracking-wider text-slate-400 uppercase">
          Mission Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-[#14234e] text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950'
                  : 'text-slate-300 hover:text-white hover:bg-[#0f1b3b]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.isPrimary ? (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {item.badge}
                </span>
              ) : item.badge ? (
                <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer Tagline */}
      <div className="p-4 border-t border-[#152347] bg-[#070b1a]">
        <div className="p-3 rounded-lg bg-[#0c1633] border border-[#172752]">
          <p className="text-xs font-medium text-slate-200 leading-snug">
            Better data.
          </p>
          <p className="text-xs font-semibold text-cyan-400 leading-snug">
            Safer missions.
          </p>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">
            Artemis III Medical Console
          </p>
        </div>
      </div>
    </aside>
  );
};
