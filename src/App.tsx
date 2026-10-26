import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { DashboardView } from './components/dashboard/DashboardView';
import { IJVAnalysisView } from './components/ijv/IJVAnalysisView';
import { HealthTrendsView } from './components/trends/HealthTrendsView';
import { CardiovascularView } from './components/cardiovascular/CardiovascularView';
import { CognitiveView } from './components/cognitive/CognitiveView';
import { HealthGuidanceView } from './components/guidance/HealthGuidanceView';
import { HealthReportsView } from './components/reports/HealthReportsView';
import { AnalysisHistoryView } from './components/history/AnalysisHistoryView';
import { SettingsView } from './components/settings/SettingsView';

import {
  NavigationTab,
  AstronautProfile,
  SystemStatusData,
  NotificationItem,
  RecentFinding,
  AnalysisHistoryItem,
} from './types';
import {
  ASTRONAUT_ALEX_RIVERA,
  NOTIFICATIONS,
  RECENT_FINDINGS,
  INITIAL_ANALYSIS_HISTORY,
} from './data/mockData';
import { probeBackendHealth, getBackendUrl } from './services/ijvApi';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [astronaut, setAstronaut] = useState<AstronautProfile>(ASTRONAUT_ALEX_RIVERA);
  const [notifications, setNotifications] = useState<NotificationItem[]>(NOTIFICATIONS);
  const [findings, setFindings] = useState<RecentFinding[]>(RECENT_FINDINGS);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>(INITIAL_ANALYSIS_HISTORY);

  const [systemStatus, setSystemStatus] = useState<SystemStatusData>({
    ecgAnalysisStatus: 'Simulated',
    ijvModelStatus: 'Checking',
    fastapiConnected: false,
    databaseStatus: 'Local Session',
    apiServicesStatus: 'Running',
    lastAnalysisTimestamp: 'Apr 28, 2025 14:32 UTC',
    backendUrl: getBackendUrl(),
  });
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);

  // Probe backend on mount
  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const status = await probeBackendHealth();
      setSystemStatus(status);
    } catch {
      setSystemStatus((prev) => ({
        ...prev,
        fastapiConnected: false,
        ijvModelStatus: 'Backend Offline',
      }));
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleAddHistoryItem = (item: AnalysisHistoryItem) => {
    setHistory((prev) => [item, ...prev]);
    // Also add to findings table
    setFindings((prev) => [
      {
        id: `find-${Date.now()}`,
        dateTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        type: 'Ultrasound',
        finding: item.primaryMetric,
        status: item.status as 'Normal' | 'Watch' | 'Review',
      },
      ...prev,
    ]);
  };

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <Navbar
        systemStatus={systemStatus}
        notifications={notifications}
        onNotificationDismiss={handleDismissNotification}
        onNavigateToSettings={() => setActiveTab('settings')}
        onNavigateToDashboard={() => setActiveTab('overview')}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#070c1d] relative">
          {(activeTab === 'overview' || activeTab === 'dashboard') && (
            <DashboardView
              astronaut={astronaut}
              systemStatus={systemStatus}
              notifications={notifications}
              findings={findings}
              onNavigate={(tab) => setActiveTab(tab)}
              onRefreshHealth={checkHealth}
              isCheckingHealth={isCheckingHealth}
            />
          )}

          {activeTab === 'ijv' && (
            <IJVAnalysisView
              systemStatus={systemStatus}
              onAddHistoryItem={handleAddHistoryItem}
              onNavigateToSettings={() => setActiveTab('settings')}
              onNavigateToReports={() => setActiveTab('reports')}
            />
          )}

          {activeTab === 'trends' && (
            <HealthTrendsView astronaut={astronaut} />
          )}

          {activeTab === 'cardiovascular' && (
            <CardiovascularView astronaut={astronaut} />
          )}

          {activeTab === 'cognitive' && (
            <CognitiveView astronaut={astronaut} />
          )}

          {(activeTab === 'guidance' || activeTab === 'profile') && (
            <HealthGuidanceView
              astronaut={astronaut}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'reports' && (
            <HealthReportsView
              astronaut={astronaut}
              findings={findings}
              systemStatus={systemStatus}
            />
          )}

          {activeTab === 'history' && (
            <AnalysisHistoryView
              history={history}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              systemStatus={systemStatus}
              onUpdateSystemStatus={(newStatus) => setSystemStatus(newStatus)}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
