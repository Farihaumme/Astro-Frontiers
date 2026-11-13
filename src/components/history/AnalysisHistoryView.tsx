import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  History,
  ScanLine,
  Activity,
  Brain,
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  FileSearch,
  ArrowRight,
} from 'lucide-react';
import { NavigationTab } from '../../types';
import { supabase } from '../../services/supabase';

interface AnalysisHistoryViewProps {
  onNavigate: (tab: NavigationTab) => void;
}

type HistoryRow = {
  id: string;
  scan_type: string;
  source: string;
  astronaut_name: string | null;
  primary_metric: string;
  notes: string | null;
  status: string | null;
  thumbnail_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const sourceLabel = (source: string) => {
  switch (source) {
    case 'fastapi_keras': return 'Keras Backend';
    case 'segthy_benchmark': return 'SegThy Benchmark';
    case 'ecg_fm': return 'ECG-FM';
    case 'manual_entry': return 'Manual Record';
    case 'simulated_record': return 'Simulated Demo';
    default: return source.replaceAll('_', ' ');
  }
};

const sourceClass = (source: string) => {
  switch (source) {
    case 'fastapi_keras':
    case 'ecg_fm':
      return 'bg-emerald-950 text-emerald-300 border-emerald-800';
    case 'segthy_benchmark':
      return 'bg-cyan-950 text-cyan-300 border-cyan-800';
    case 'manual_entry':
      return 'bg-violet-950 text-violet-300 border-violet-800';
    default:
      return 'bg-slate-900 text-slate-400 border-slate-700';
  }
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Time unavailable'
    : date.toLocaleString([], {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
};

export const AnalysisHistoryView: React.FC<AnalysisHistoryViewProps> = ({ onNavigate }) => {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Please sign in to view analysis history.');

      const { data, error: queryError } = await supabase
        .from('analysis_history')
        .select('id, scan_type, source, astronaut_name, primary_metric, notes, status, thumbnail_url, metadata, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (queryError) throw queryError;
      setHistory((data ?? []) as HistoryRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load analysis history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const filteredHistory = useMemo(() => history.filter((item) => {
    if (filterType !== 'all' && item.scan_type !== filterType) return false;
    if (filterSource !== 'all' && item.source !== filterSource) return false;
    return true;
  }), [history, filterType, filterSource]);

  const scanTypes = useMemo(
    () => Array.from(new Set(history.map(item => item.scan_type))).sort(),
    [history]
  );
  const sources = useMemo(
    () => Array.from(new Set(history.map(item => item.source))).sort(),
    [history]
  );

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(filteredHistory, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `aither_kairos_analysis_history_${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const renderIcon = (scanType: string) => {
    if (scanType.toLowerCase().includes('ijv') || scanType.toLowerCase().includes('ultrasound')) {
      return <ScanLine className="h-5 w-5 text-cyan-400" />;
    }
    if (scanType.toLowerCase().includes('ecg') || scanType.toLowerCase().includes('cardio')) {
      return <Activity className="h-5 w-5 text-rose-400" />;
    }
    if (scanType.toLowerCase().includes('cognitive')) {
      return <Brain className="h-5 w-5 text-indigo-400" />;
    }
    return <FileSearch className="h-5 w-5 text-slate-400" />;
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 border-b border-[#152347] pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
            <History className="h-5 w-5 text-cyan-400" />
            <span>Analysis History</span>
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Saved analyses retrieved from your authenticated account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void loadHistory()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-[#26375f] bg-[#101b3b] px-3.5 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            disabled={filteredHistory.length === 0}
            className="flex items-center gap-2 rounded-lg border border-cyan-700/50 bg-[#14234e] px-3.5 py-2 text-xs font-medium text-cyan-300 transition hover:bg-[#1b2f69] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => onNavigate('ijv')}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:from-cyan-500 hover:to-blue-500"
          >
            <ScanLine className="h-4 w-4" />
            New Scan
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#17254d] bg-[#0b1329] p-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-slate-300">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            Scan type
            <select
              value={filterType}
              onChange={event => setFilterType(event.target.value)}
              className="rounded border border-[#1a2b5b] bg-[#101b3b] px-2.5 py-1.5 font-mono text-slate-200 outline-none focus:border-cyan-500"
            >
              <option value="all">All types</option>
              {scanTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>

          <label className="flex items-center gap-2 text-slate-300">
            Inference source
            <select
              value={filterSource}
              onChange={event => setFilterSource(event.target.value)}
              className="rounded border border-[#1a2b5b] bg-[#101b3b] px-2.5 py-1.5 font-mono text-slate-200 outline-none focus:border-cyan-500"
            >
              <option value="all">All sources</option>
              {sources.map(source => <option key={source} value={source}>{sourceLabel(source)}</option>)}
            </select>
          </label>
        </div>

        <span className="font-mono text-[11px] text-slate-400">
          Showing {filteredHistory.length} of {history.length} saved records
        </span>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-800/70 bg-rose-950/30 p-3 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-[#17254d] bg-[#0b1329] py-16 text-center text-sm text-cyan-300">
          Loading saved analysis records...
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#26375f] bg-[#0b1329]/70 px-6 py-16 text-center">
          <History className="mx-auto h-8 w-8 text-slate-500" />
          <h3 className="mt-3 text-sm font-semibold text-white">No saved analyses found</h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
            Completed analyses will appear here after the app saves their results to your account. Existing demo records are not included.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredHistory.map(item => (
            <article
              key={item.id}
              className="flex gap-4 rounded-xl border border-[#17254d] bg-[#0b1329] p-4 shadow-sm transition-colors hover:border-cyan-600/40"
            >
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#1a2c5b] bg-[#050b19]">
                {item.thumbnail_url ? (
                  <img src={item.thumbnail_url} alt={`${item.scan_type} preview`} className="h-full w-full object-cover" />
                ) : renderIcon(item.scan_type)}
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {renderIcon(item.scan_type)}
                      <h3 className="truncate text-xs font-bold text-white">{item.scan_type}</h3>
                    </div>
                    <span className={`rounded border px-2 py-0.5 text-[9px] font-mono ${sourceClass(item.source)}`}>
                      {sourceLabel(item.source)}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400">
                    <span>{formatDate(item.created_at)}</span>
                    {item.astronaut_name && <><span>·</span><span>{item.astronaut_name}</span></>}
                  </div>

                  <p className="mt-2 break-words font-mono text-xs font-semibold text-cyan-300">
                    {item.primary_metric}
                  </p>
                  {item.notes && <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-300">{item.notes}</p>}
                  {item.status && <p className="mt-1 text-[10px] text-slate-500">Review status: {item.status}</p>}
                </div>

                {item.scan_type.toLowerCase().includes('ijv') && (
                  <div className="border-t border-[#16234b] pt-2">
                    <button
                      type="button"
                      onClick={() => onNavigate('ijv')}
                      className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                    >
                      Inspect IJV module <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
