import React, { useState } from 'react';
import {
  Settings,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Terminal,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { SystemStatusData } from '../../types';
import { getBackendUrl, setBackendUrl, probeBackendHealth } from '../../services/ijvApi';

interface SettingsViewProps {
  systemStatus: SystemStatusData;
  onUpdateSystemStatus: (newStatus: SystemStatusData) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  systemStatus,
  onUpdateSystemStatus,
}) => {
  const [urlInput, setUrlInput] = useState<string>(getBackendUrl());
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestMessage(null);
    setTestSuccess(null);

    setBackendUrl(urlInput);
    const status = await probeBackendHealth(urlInput);
    onUpdateSystemStatus(status);

    setIsTesting(false);
    if (status.fastapiConnected) {
      setTestSuccess(true);
      setTestMessage(`Successfully connected to FastAPI backend (${status.device || 'CPU'}). Model: ${status.ijvModelStatus}.`);
    } else {
      setTestSuccess(false);
      setTestMessage(`Could not reach ${urlInput}. Ensure the Python FastAPI server is running with 'uvicorn main:app --port 8000'.`);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-[#152347]">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <span>System & Model Configuration</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          FastAPI inference backend endpoint, ultrasound probe calibrations, and diagnostics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Backend Connection Config */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#16234b]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>FastAPI Inference Service</span>
            </h3>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                systemStatus.fastapiConnected
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border-amber-800'
              }`}
            >
              {systemStatus.fastapiConnected ? 'Connected' : 'Offline'}
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 block">
              Backend Service URL:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 bg-[#101b3b] border border-[#1a2c5b] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Test Probe</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Default local address is <code className="text-cyan-300">http://localhost:8000</code>.
            </p>
          </div>

          {testMessage && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                testSuccess
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                  : 'bg-amber-950/40 border-amber-800 text-amber-200'
              }`}
            >
              {testSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{testMessage}</div>
            </div>
          )}
        </div>

        {/* Card 2: Model Architecture & SegThy Notice */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#16234b]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Model Architecture Specifications</span>
            </h3>
            <span className="text-[10px] font-mono text-cyan-400">Keras 3 / TensorFlow</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#142144]">
              <span className="text-slate-400">Network:</span>
              <span className="font-mono text-white">U-Net (ResNet34 Backbone)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#142144]">
              <span className="text-slate-400">Input Tensor:</span>
              <span className="font-mono text-cyan-300">256 × 256 × 1 (Grayscale)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#142144]">
              <span className="text-slate-400">Output Tensor:</span>
              <span className="font-mono text-cyan-300">256 × 256 × 1 (Binary Sigmoid)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#142144]">
              <span className="text-slate-400">Reference Dataset:</span>
              <span className="text-slate-200">SegThy (Cervical / Thyroid Vascular Cohort)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Abnormality Classifier:</span>
              <span className="text-amber-300 font-mono font-medium">Not Connected (Ground-Truth Pending)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Backend Setup Code Box */}
      <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#16234b]">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">How to Run the Python FastAPI Backend</h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The complete Python and Keras inference code has been generated in the <code className="text-cyan-300">/backend</code> folder.
          To launch it on your local machine:
        </p>

        <div className="bg-black/60 p-3.5 rounded-lg border border-[#16254c] font-mono text-xs text-cyan-300 space-y-1">
          <p className="text-slate-500"># 1. Navigate to backend and create virtualenv</p>
          <p className="text-slate-200">cd backend</p>
          <p className="text-slate-200">python3 -m venv venv &amp;&amp; source venv/bin/activate</p>
          <p className="text-slate-500 mt-2"># 2. Install requirements (FastAPI, TensorFlow/Keras)</p>
          <p className="text-slate-200">pip install -r requirements.txt</p>
          <p className="text-slate-500 mt-2"># 3. Start server with live reload</p>
          <p className="text-slate-200">uvicorn main:app --host 0.0.0.0 --port 8000 --reload</p>
        </div>
      </div>
    </div>
  );
};
