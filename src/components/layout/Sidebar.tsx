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

import type { LucideIcon } from 'lucide-react';
import type { NavigationTab } from '../../types';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Health Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'trends',
      label: 'Health Trends',
      icon: Activity,
    },
    {
      id: 'ijv',
      label: 'IJV Ultrasound Analysis',
      icon: ScanLine,
    },
    {
      id: 'cardiovascular',
      label: 'Cardiovascular Health',
      icon: Heart,
    },
    {
      id: 'cognitive',
      label: 'Cognitive Health',
      icon: Brain,
    },
    {
      id: 'guidance',
      label: 'Health Guidance',
      icon: Compass,
    },
    {
      id: 'reports',
      label: 'Health Reports',
      icon: FileText,
    },
    {
      id: 'history',
      label: 'Analysis History',
      icon: History,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-[#080e22] border-r border-[#152347] flex flex-col shrink-0 h-[calc(100vh-4rem)] sticky top-16">

      {/* Navigation Links */}
      <div className="px-3.5 pt-2 pb-3 space-y-1.5 overflow-y-auto">

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-[#14234e] text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950'
                  : 'text-slate-300 hover:text-white hover:bg-[#0f1b3b]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-cyan-400'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                <span className="truncate">
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}

      </div>

    </aside>
  );
};