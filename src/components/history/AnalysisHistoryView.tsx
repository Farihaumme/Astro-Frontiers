import React, { useState } from 'react';
import {
  History,
  ScanLine,
  Activity,
  Brain,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { AnalysisHistoryItem, NavigationTab } from '../../types';

interface AnalysisHistoryViewProps {
  history: AnalysisHistoryItem[];
  onNavigate: (tab: NavigationTab) => void;
}

export const AnalysisHistoryView: React.FC<AnalysisHistoryViewProps> = ({
  history,
  onNavigate,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');

  const filteredHistory = history.filter((item) => {
    if (filterType !== 'all' && item.scanType !== filterType) return false;
    if (filterSource !== 'all' && item.source !== filterSource) return false;
    return true;
  });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aither_kairos_session_analyses_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#152347]">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <span>Analysis Session History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log of completed IJV ultrasound segmentations and telemetry records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 rounded-lg bg-[#14234e] hover:bg-[#1b2f69] text-cyan-300 border border-cyan-700/50 text-xs font-medium transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Session JSON</span>
          </button>
          <button
            onClick={() => onNavigate('ijv')}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <ScanLine className="w-4 h-4" />
            <span>New Scan</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg bg-[#0b1329] border border-[#17254d] text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300 font-medium">Scan Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#101b3b] border border-[#1a2b5b] rounded px-2.5 py-1 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Types</option>
              <option value="IJV Ultrasound">IJV Ultrasound</option>
              <option value="ECG Rhythm">ECG Rhythm</option>
              <option value="Cognitive Battery">Cognitive Battery</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-medium">Inference Source:</span>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="bg-[#101b3b] border border-[#1a2b5b] rounded px-2.5 py-1 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Sources</option>
              <option value="fastapi_keras">Real Keras Model</option>
              <option value="segthy_benchmark">SegThy Benchmark</option>
              <option value="simulated_record">Simulated Demo Record</option>
            </select>
          </div>
        </div>

        <span className="text-[11px] font-mono text-slate-400">
          Showing {filteredHistory.length} of {history.length} records
        </span>
      </div>

      {/* Analysis Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredHistory.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-[#0b1329] border border-[#17254d] hover:border-cyan-600/40 transition-colors flex gap-4 shadow-sm"
          >
            {/* Thumbnail Preview */}
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-black border border-[#1a2c5b] shrink-0">
              <img
                src={item.thumbnailUrl}
                alt={item.scanType}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.scanType === 'IJV Ultrasound' ? (
                      <ScanLine className="w-4 h-4 text-cyan-400" />
                    ) : item.scanType === 'ECG Rhythm' ? (
                      <Activity className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Brain className="w-4 h-4 text-indigo-400" />
                    )}
                    <h3 className="text-xs font-bold text-white truncate">{item.scanType}</h3>
                  </div>

                  {/* Clear Source Badge */}
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                      item.source === 'fastapi_keras'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : item.source === 'segthy_benchmark'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    {item.source === 'fastapi_keras'
                      ? 'Keras Backend'
                      : item.source === 'segthy_benchmark'
                      ? 'SegThy Benchmark'
                      : 'Simulated Demo'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-1">
                  <span>{item.timestamp}</span>
                  <span>·</span>
                  <span>{item.astronautName}</span>
                </div>

                <p className="text-xs font-semibold text-cyan-300 mt-1.5 font-mono">
                  {item.primaryMetric}
                </p>

                <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                  {item.notes}
                </p>
              </div>

              {item.scanType === 'IJV Ultrasound' && (
                <div className="mt-2 pt-2 border-t border-[#16234b]">
                  <button
                    onClick={() => onNavigate('ijv')}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>Inspect Segmentation Overlay</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
