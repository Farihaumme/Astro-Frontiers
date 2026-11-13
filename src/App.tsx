import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';

import { BaselineSetup } from './components/baseline/BaselineSetup';
import { Login } from './components/login/Login';
import { supabase } from './services/supabase';

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

// NEW: Aither AI page
import { AIAssistantView } from './components/ai/AIAssistantView';

import type {
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
} from './data/mockData';

import { probeBackendHealth, getBackendUrl } from './services/ijvApi';


// Build the visible astronaut profile from the authenticated user.
function profileForUser(user: Session['user'] | null): AstronautProfile {
  const metadata = user?.user_metadata ?? {};

  const displayName =
    (typeof metadata.username === 'string' && metadata.username.trim()) ||
    (typeof metadata.full_name === 'string' && metadata.full_name.trim()) ||
    (typeof metadata.name === 'string' && metadata.name.trim()) ||
    user?.email?.split('@')[0] ||
    'Astronaut';

  return {
    ...ASTRONAUT_ALEX_RIVERA,
    name: displayName,
  };
}


export default function App() {

  // ==============================
  // AUTHENTICATION STATE
  // ==============================

  const [session, setSession] = useState<Session | null>(null);

  const [baselineLoading, setBaselineLoading] = useState(true);
  const [hasBaseline, setHasBaseline] = useState<boolean | null>(null);

  const [baselineCheckError, setBaselineCheckError] = useState('');

  const [needsCardiovascularBaseline, setNeedsCardiovascularBaseline] =
    useState(false);

  const [needsCognitiveBaseline, setNeedsCognitiveBaseline] =
    useState(false);


  // ==============================
  // DASHBOARD STATE
  // ==============================

  const [activeTab, setActiveTab] =
    useState<NavigationTab>('overview');

  const [astronaut, setAstronaut] =
    useState<AstronautProfile>(ASTRONAUT_ALEX_RIVERA);

  const [notifications, setNotifications] =
    useState<NotificationItem[]>(NOTIFICATIONS);

  const [findings, setFindings] =
    useState<RecentFinding[]>(RECENT_FINDINGS);


  // ==============================
  // NEW: AI ASSISTANT NAVIGATION
  // ==============================

  const [showAIAssistant, setShowAIAssistant] = useState(false);


  // ==============================
  // SYSTEM STATUS
  // ==============================

  const [systemStatus, setSystemStatus] =
    useState<SystemStatusData>({
      ecgAnalysisStatus: 'Simulated',
      ijvModelStatus: 'Checking',
      fastapiConnected: false,
      databaseStatus: 'Local Session',
      apiServicesStatus: 'Running',
      lastAnalysisTimestamp: 'Apr 28, 2025 14:32 UTC',
      backendUrl: getBackendUrl(),
    });

  const [isCheckingHealth, setIsCheckingHealth] =
    useState<boolean>(false);


  // ==============================
  // CHECK USER BASELINES
  // ==============================

  const checkBaseline = async () => {
    setBaselineLoading(true);
    setBaselineCheckError('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setHasBaseline(null);
        setNeedsCardiovascularBaseline(false);
        setNeedsCognitiveBaseline(false);
        return;
      }

      setAstronaut(profileForUser(user));

      const [cardiovascularResult, cognitiveResult] =
        await Promise.all([

          supabase
            .from('astronaut_baselines')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_current', true)
            .maybeSingle(),

          supabase
            .from('cognitive_baselines')
            .select('id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1),

        ]);

      if (cardiovascularResult.error) {
        throw cardiovascularResult.error;
      }

      if (cognitiveResult.error) {
        throw cognitiveResult.error;
      }

      const missingCardiovascular =
        !cardiovascularResult.data;

      const missingCognitive =
        !cognitiveResult.data?.length;

      setNeedsCardiovascularBaseline(missingCardiovascular);
      setNeedsCognitiveBaseline(missingCognitive);

      setHasBaseline(
        !missingCardiovascular && !missingCognitive
      );

    } catch (error) {

      console.error('Baseline check failed:', error);

      setBaselineCheckError(
        error instanceof Error
          ? error.message
          : 'Unable to check your saved baselines.'
      );

      setHasBaseline(null);

    } finally {
      setBaselineLoading(false);
    }
  };


  // ==============================
  // RESTORE LOGIN SESSION
  // ==============================

  useEffect(() => {

    let mounted = true;

    const initializeAuth = async () => {

      const { data, error } =
        await supabase.auth.getSession();

      if (error) {
        console.error('Session error:', error);
      }

      if (!mounted) return;

      setSession(data.session);

      if (data.session) {

        setAstronaut(profileForUser(data.session.user));

        await checkBaseline();

      } else {

        setAstronaut(ASTRONAUT_ALEX_RIVERA);

        setHasBaseline(null);

        setNeedsCardiovascularBaseline(false);
        setNeedsCognitiveBaseline(false);

        setBaselineLoading(false);
      }
    };

    void initializeAuth();


    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {

        setSession(newSession);

        if (newSession) {

          setAstronaut(profileForUser(newSession.user));

          setBaselineLoading(true);

          setTimeout(() => {
            if (mounted) {
              void checkBaseline();
            }
          }, 0);

        } else {

          setAstronaut(ASTRONAUT_ALEX_RIVERA);

          setHasBaseline(null);

          setNeedsCardiovascularBaseline(false);
          setNeedsCognitiveBaseline(false);

          setBaselineLoading(false);

          setBaselineCheckError('');

          setShowAIAssistant(false);
        }
      }
    );


    return () => {
      mounted = false;
      subscription.unsubscribe();
    };

  }, []);


  // ==============================
  // CHECK BACKEND HEALTH
  // ==============================

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
    void checkHealth();
  }, []);


  // ==============================
  // NOTIFICATIONS
  // ==============================

  const handleDismissNotification = (id: string) => {

    setNotifications((prev) =>
      prev.filter(
        (notification) => notification.id !== id
      )
    );

  };


  // ==============================
  // SAVE ANALYSIS HISTORY
  // ==============================

  const handleAddHistoryItem = async (
    item: AnalysisHistoryItem
  ) => {

    try {

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error(
          'Please sign in before saving an analysis.'
        );
      }

      const thumbnailUrl =
        typeof item.thumbnailUrl === 'string' &&
        /^https?:\/\//i.test(item.thumbnailUrl)
          ? item.thumbnailUrl
          : null;


      const { error: insertError } = await supabase
        .from('analysis_history')
        .insert({

          user_id: user.id,

          scan_type: item.scanType,
          source: item.source,

          astronaut_name: astronaut.name,

          primary_metric: item.primaryMetric,
          notes: item.notes,
          status: item.status,

          thumbnail_url: thumbnailUrl,

          metadata: {
            originalId: item.id,
            scanType: item.scanType,
            source: item.source,
            primaryMetric: item.primaryMetric,
            notes: item.notes,
            status: item.status,
            timestamp: item.timestamp,
          },

        });

      if (insertError) throw insertError;


      setFindings((prev) => [

        {
          id: `find-${Date.now()}`,

          dateTime: new Date().toLocaleTimeString(
            'en-US',
            {
              hour: '2-digit',
              minute: '2-digit',
            }
          ),

          type: 'Ultrasound',

          finding: item.primaryMetric,

          status: item.status as
            'Normal' | 'Watch' | 'Review',
        },

        ...prev,

      ]);

    } catch (error) {

      console.error(
        'Could not save analysis history:',
        error
      );

      window.alert(
        error instanceof Error
          ? error.message
          : 'Could not save this analysis to history.'
      );

    }
  };


  // ==============================
  // LOGIN CHECK
  // ==============================

  if (!session) {
    return <Login onAuthenticated={() => {}} />;
  }


  // ==============================
  // BASELINE ERROR
  // ==============================

  if (baselineCheckError) {

    return (

      <div className="min-h-screen bg-[#050914] flex flex-col items-center justify-center gap-4 p-6 text-center">

        <p className="max-w-xl text-sm text-rose-300">
          We could not check your personal health profile:
          {' '}{baselineCheckError}
        </p>

        <p className="max-w-xl text-xs text-slate-400">
          Confirm that the cognitive baseline tables and
          access policies have been created in Supabase,
          then try again.
        </p>

        <button
          type="button"
          onClick={() => void checkBaseline()}
          className="rounded-lg bg-cyan-500 px-5 py-2.5 font-semibold text-[#04101d] hover:bg-cyan-400"
        >
          Retry
        </button>

      </div>

    );
  }


  // ==============================
  // BASELINE LOADING
  // ==============================

  if (baselineLoading || hasBaseline === null) {

    return (

      <div className="min-h-screen bg-[#050914] flex items-center justify-center text-cyan-300">

        Checking your personal health profile...

      </div>

    );
  }


  // ==============================
  // BASELINE SETUP
  // ==============================

  if (!hasBaseline) {

    return (

      <BaselineSetup

        needsCardiovascular={needsCardiovascularBaseline}

        needsCognitive={needsCognitiveBaseline}

        onComplete={() => {

          setHasBaseline(true);

          setNeedsCardiovascularBaseline(false);
          setNeedsCognitiveBaseline(false);

        }}

      />

    );
  }


  // ==============================
  // MAIN APPLICATION
  // ==============================

  return (

    <div className="min-h-screen bg-[#050914] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">

      {/* NAVBAR */}

      <Navbar

        astronaut={astronaut}

        systemStatus={systemStatus}

        notifications={notifications}

        onNotificationDismiss={handleDismissNotification}

        onNavigateToSettings={() => {
          setShowAIAssistant(false);
          setActiveTab('settings');
        }}

        onNavigateToDashboard={() => {
          setShowAIAssistant(false);
          setActiveTab('overview');
        }}

      />


      <div className="flex-1 flex overflow-hidden">

        {/* SIDEBAR */}

        <Sidebar

          activeTab={activeTab}

          onSelectTab={(tab) => {

            setShowAIAssistant(false);

            setActiveTab(tab);

          }}

        />


        {/* MAIN CONTENT */}

        <main className="flex-1 overflow-y-auto bg-[#070c1d] relative">


          {/* ==================================
              AI ASSISTANT PAGE
          ================================== */}

          {showAIAssistant ? (

            <AIAssistantView

              onBack={() => {
                setShowAIAssistant(false);
              }}

            />

          ) : (

            <>


              {/* DASHBOARD */}

              {(activeTab === 'overview' ||
                activeTab === 'dashboard') && (

                <DashboardView

                  astronaut={astronaut}

                  systemStatus={systemStatus}

                  notifications={notifications}

                  findings={findings}

                  onNavigate={(tab) =>
                    setActiveTab(tab)
                  }

                  onRefreshHealth={checkHealth}

                  isCheckingHealth={isCheckingHealth}

                  // NEW: Opens Aither AI page
                  onOpenAIAssistant={() =>
                    setShowAIAssistant(true)
                  }

                />

              )}


              {/* IJV ANALYSIS */}

              {activeTab === 'ijv' && (

                <IJVAnalysisView

                  systemStatus={systemStatus}

                  onAddHistoryItem={handleAddHistoryItem}

                  onNavigateToSettings={() =>
                    setActiveTab('settings')
                  }

                  onNavigateToReports={() =>
                    setActiveTab('reports')
                  }

                />

              )}


              {/* HEALTH TRENDS */}

              {activeTab === 'trends' && (

                <HealthTrendsView
                  astronaut={astronaut}
                />

              )}


              {/* CARDIOVASCULAR */}

              {activeTab === 'cardiovascular' && (

                <CardiovascularView
                  astronaut={astronaut}
                />

              )}


              {/* COGNITIVE */}

              {activeTab === 'cognitive' && (

                <CognitiveView
                  astronaut={astronaut}
                />

              )}


              {/* HEALTH GUIDANCE */}

              {(activeTab === 'guidance' ||
                activeTab === 'profile') && (

                <HealthGuidanceView

                  astronaut={astronaut}

                  onNavigate={(tab) =>
                    setActiveTab(tab)
                  }

                />

              )}


              {/* HEALTH REPORTS */}

              {activeTab === 'reports' && (

                <HealthReportsView

                  astronaut={astronaut}

                  findings={findings}

                  systemStatus={systemStatus}

                />

              )}


              {/* ANALYSIS HISTORY */}

              {activeTab === 'history' && (

                <AnalysisHistoryView

                  onNavigate={(tab) =>
                    setActiveTab(tab)
                  }

                />

              )}


              {/* SETTINGS */}

              {activeTab === 'settings' && (

                <SettingsView

                  systemStatus={systemStatus}

                  onUpdateSystemStatus={(newStatus) =>
                    setSystemStatus(newStatus)
                  }

                />

              )}


            </>

          )}

        </main>

      </div>


      {/* FOOTER */}

      <Footer />

    </div>

  );

}