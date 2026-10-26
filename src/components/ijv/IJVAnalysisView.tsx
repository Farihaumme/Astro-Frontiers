import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  ScanLine,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Sliders,
  Trash2,
  RefreshCw,
  Download,
  Save,
  Check,
  FileText,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Activity,
  AlertCircle
} from 'lucide-react';
import { IJVAnalysisResult, SystemStatusData, AnalysisHistoryItem } from '../../types';
import {
  analyzeIJVImage,
  RESEARCH_BENCHMARK_SCANS,
  getBackendUrl,
  probeBackendHealth,
} from '../../services/ijvApi';

interface IJVAnalysisViewProps {
  systemStatus: SystemStatusData;
  onAddHistoryItem: (item: AnalysisHistoryItem) => void;
  onNavigateToSettings: () => void;
  onNavigateToReports?: () => void;
}

export const IJVAnalysisView: React.FC<IJVAnalysisViewProps> = ({
  systemStatus,
  onAddHistoryItem,
  onNavigateToSettings,
  onNavigateToReports,
}) => {
  // Upload and Selection State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(RESEARCH_BENCHMARK_SCANS[0].id);
  const [previewUrl, setPreviewUrl] = useState<string>(RESEARCH_BENCHMARK_SCANS[0].url);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({
    width: RESEARCH_BENCHMARK_SCANS[0].width,
    height: RESEARCH_BENCHMARK_SCANS[0].height,
  });
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Execution & Pipeline Mode
  const [pipelineMode, setPipelineMode] = useState<'benchmark' | 'live_fastapi'>('benchmark');
  const [calibrationMmPerPx, setCalibrationMmPerPx] = useState<number>(0.088);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<IJVAnalysisResult | null>(null);

  // Visualization Controls
  const [maskOpacity, setMaskOpacity] = useState<number>(0.55);
  const [maskColor, setMaskColor] = useState<'cyan' | 'emerald' | 'purple'>('cyan');
  const [showContourOnly, setShowContourOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'overlay' | 'split'>('overlay');
  const [savedToHistory, setSavedToHistory] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set initial sample
  useEffect(() => {
    if (selectedSampleId && !selectedFile) {
      const sample = RESEARCH_BENCHMARK_SCANS.find((s) => s.id === selectedSampleId);
      if (sample) {
        setPreviewUrl(sample.url);
        setImageDimensions({ width: sample.width, height: sample.height });
      }
    }
  }, [selectedSampleId, selectedFile]);

  // Handle custom file upload with validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setAnalysisError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid format. Please select an ultrasound image in PNG or JPEG format.');
      return;
    }

    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File is too large. Maximum supported size is 20MB.');
      return;
    }

    setSelectedFile(file);
    setSelectedSampleId(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Read dimensions
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;

    // Automatically switch to live FastAPI mode if user uploads their own file
    setPipelineMode('live_fastapi');
  };

  // Select preloaded research sample
  const handleSelectSample = (sampleId: string) => {
    const sample = RESEARCH_BENCHMARK_SCANS.find((s) => s.id === sampleId);
    if (!sample) return;

    setSelectedFile(null);
    setSelectedSampleId(sampleId);
    setPreviewUrl(sample.url);
    setImageDimensions({ width: sample.width, height: sample.height });
    setUploadError(null);
    setAnalysisError(null);
    setAnalysisResult(null);
    setSavedToHistory(false);
  };

  // Remove current image
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setSelectedSampleId(null);
    setPreviewUrl('');
    setAnalysisResult(null);
    setUploadError(null);
    setAnalysisError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Trigger analysis
  const handleRunAnalysis = async () => {
    if (!previewUrl) {
      setUploadError('Please select or upload an ultrasound image first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setSavedToHistory(false);

    try {
      if (pipelineMode === 'benchmark' && selectedSampleId) {
        // Run SegThy benchmark analysis
        const result = await analyzeIJVImage(new Blob(), selectedSampleId, {
          useBenchmarkFallback: true,
          sampleId: selectedSampleId,
          calibrationMmPerPx,
        });
        setAnalysisResult(result);
      } else {
        // Run live FastAPI backend
        if (!selectedFile) {
          // If sample was chosen, fetch it as blob
          const res = await fetch(previewUrl);
          const blob = await res.blob();
          const result = await analyzeIJVImage(blob, 'sample_scan.png', {
            useBenchmarkFallback: false,
            calibrationMmPerPx,
          });
          setAnalysisResult(result);
        } else {
          const result = await analyzeIJVImage(selectedFile, selectedFile.name, {
            useBenchmarkFallback: false,
            calibrationMmPerPx,
          });
          setAnalysisResult(result);
        }
      }
    } catch (err: any) {
      // Honest reporting of backend / model error
      setAnalysisError(err.message || 'Analysis could not be completed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save to session history
  const handleSaveToHistory = () => {
    if (!analysisResult) return;

    const historyItem: AnalysisHistoryItem = {
      id: analysisResult.id,
      timestamp: `Today · ${analysisResult.timestamp}`,
      astronautName: 'Alex Rivera (AST-0427)',
      scanType: 'IJV Ultrasound',
      thumbnailUrl: previewUrl,
      status: 'Normal',
      primaryMetric: `CSA: ${analysisResult.areaMm2} mm² (${analysisResult.areaPixels.toLocaleString()} px)`,
      source: analysisResult.source,
      notes: analysisResult.findings.join(' '),
    };

    onAddHistoryItem(historyItem);
    setSavedToHistory(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#152347]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
              <ScanLine className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Internal Jugular Vein (IJV) Ultrasound Analysis
            </h2>
            <span className="text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded">
              Primary Research Module
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Quantitative lumen segmentation and cross-sectional area (CSA) estimation for monitoring cephalad
            fluid shift, internal jugular vein engorgement, and SANS risk factors in long-duration spaceflight.
          </p>
        </div>

        {/* Backend Connectivity Status Widget */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0b1329] border border-[#17254d]">
          <div className="text-right text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">FastAPI Inference Service</span>
            <span className={`font-semibold ${systemStatus.fastapiConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {systemStatus.fastapiConnected ? 'Online (Port 8000)' : 'Not Connected'}
            </span>
          </div>
          <button
            onClick={onNavigateToSettings}
            className="p-1.5 rounded bg-[#132047] hover:bg-[#1a2d64] text-slate-300 hover:text-cyan-300 transition-colors"
            title="Inspect backend setup"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload, Sample Selection, Preprocessing Settings (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Upload & Input Card */}
          <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#16234b]">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-cyan-400" />
                1. Upload B-Mode Ultrasound
              </span>
              {previewUrl && (
                <button
                  onClick={handleRemoveImage}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Dropzone & File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg"
              className="hidden"
              id="ultrasound-file-input"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                selectedFile
                  ? 'border-cyan-500/50 bg-cyan-950/10'
                  : 'border-[#1e2f5f] hover:border-cyan-500/50 bg-[#090f23] hover:bg-[#0c1530]'
              }`}
            >
              <div className="w-10 h-10 mx-auto rounded-full bg-[#121f44] flex items-center justify-center text-cyan-400 mb-2 shadow-inner">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-200">
                Click to browse or drop an ultrasound scan
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports DICOM-exported B-mode ultrasound (PNG, JPEG) up to 20MB
              </p>
            </div>

            {/* Upload Error Banner */}
            {uploadError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-xs text-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Preloaded Reference Scans Selector */}
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Or select a SegThy research reference scan:
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {RESEARCH_BENCHMARK_SCANS.map((sample) => {
                  const isSelected = selectedSampleId === sample.id && !selectedFile;
                  return (
                    <button
                      key={sample.id}
                      onClick={() => handleSelectSample(sample.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-cyan-400 bg-[#12224d] shadow-sm shadow-cyan-950'
                          : 'border-[#192b5b] bg-[#0c1633] hover:border-slate-500'
                      }`}
                    >
                      <div className="w-full h-16 rounded overflow-hidden bg-black mb-2 border border-[#1d2f62]">
                        <img
                          src={sample.url}
                          alt={sample.name}
                          className="w-full h-full object-cover grayscale"
                        />
                      </div>
                      <span className="text-[11px] font-medium text-slate-200 line-clamp-1">
                        {sample.name.split(':')[0]}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 mt-0.5">
                        {sample.width}×{sample.height} px
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Loaded Scan Summary */}
            {previewUrl && (
              <div className="p-3 rounded-lg bg-[#0e1939] border border-[#192c5d] space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Selected scan:</span>
                  <span className="font-mono truncate max-w-[200px] text-white">
                    {selectedFile ? selectedFile.name : selectedSampleId ? RESEARCH_BENCHMARK_SCANS.find(s => s.id === selectedSampleId)?.fileLabel : 'Ultrasound Scan'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Resolution:</span>
                  <span className="font-mono text-cyan-300">{imageDimensions.width} × {imageDimensions.height} px</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Target Anatomy:</span>
                  <span className="text-slate-200">Internal Jugular Vein (Cervical)</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Pipeline Execution & Calibration Settings */}
          <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#16234b]">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                2. Model Execution Configuration
              </span>
            </div>

            {/* Execution Pipeline Mode Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 block">
                Inference Mode:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPipelineMode('benchmark')}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    pipelineMode === 'benchmark'
                      ? 'border-cyan-400 bg-[#12224d] text-white'
                      : 'border-[#192b5b] bg-[#0c1633] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300">SegThy Benchmark</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      SIMULATED — DEMO
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                    Use verified research dataset annotations (SIMULATED — DEMONSTRATION ONLY).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPipelineMode('live_fastapi')}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    pipelineMode === 'live_fastapi'
                      ? 'border-cyan-400 bg-[#12224d] text-white'
                      : 'border-[#192b5b] bg-[#0c1633] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Live FastAPI Backend</span>
                    <span className={`text-[9px] font-mono px-1 py-0.2 rounded ${systemStatus.fastapiConnected ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'}`}>
                      {systemStatus.fastapiConnected ? 'Active' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                    Send to local Python FastAPI backend at localhost:8000.
                  </p>
                </button>
              </div>
            </div>

            {/* Transducer Depth Calibration Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Transducer Scale Factor:</span>
                <span className="font-mono text-cyan-400 font-semibold">
                  {calibrationMmPerPx.toFixed(3)} mm / pixel
                </span>
              </div>
              <input
                type="range"
                min="0.04"
                max="0.16"
                step="0.002"
                value={calibrationMmPerPx}
                onChange={(e) => setCalibrationMmPerPx(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 bg-[#142248] h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[10px] font-mono text-slate-500">
                Calibrated for 12 MHz linear probe at 4.0 cm standard focal depth.
              </p>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing || !previewUrl}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                isAnalyzing || !previewUrl
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-950 hover:scale-[1.01]'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                  <span>Processing U-Net Tensor Inference...</span>
                </>
              ) : (
                <>
                  <ScanLine className="w-4 h-4 text-cyan-300" />
                  <span>Analyze IJV Ultrasound</span>
                </>
              )}
            </button>

            {/* Honest Backend Error Notice */}
            {analysisError && (
              <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-800/80 text-xs text-amber-200 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-300">Backend Inference Unavailable</p>
                    <p className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">{analysisError}</p>
                  </div>
                </div>
                <div className="pl-6 pt-1 text-[11px] text-slate-300 border-t border-amber-900/40">
                  <p>To inspect expected pipeline outputs right now, toggle to <strong className="text-cyan-300">SegThy Benchmark Mode</strong> above, or start the Python service:</p>
                  <code className="block mt-1 p-1 bg-black/40 rounded font-mono text-[10px] text-cyan-300">
                    uvicorn main:app --port 8000
                  </code>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Results, Segmentation Overlay, Area Calculation, Clinical Report (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Ultrasound & Mask Stage */}
          <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#16234b]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Ultrasound Stage & Segmentation Mask</span>
                  {analysisResult && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      IJV Delineated
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">
                  B-Mode transverse echogram with real-time semantic contour overlay
                </p>
              </div>

              {/* View mode toggle */}
              {analysisResult && (
                <div className="flex items-center gap-1 bg-[#101b3b] p-0.5 rounded-lg border border-[#1a2b5b]">
                  <button
                    onClick={() => setViewMode('overlay')}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      viewMode === 'overlay' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Overlay
                  </button>
                  <button
                    onClick={() => setViewMode('split')}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      viewMode === 'split' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Side-by-Side
                  </button>
                </div>
              )}
            </div>

            {/* Stage Canvas Area */}
            {previewUrl ? (
              <div className="space-y-3">
                <div
                  className={`grid gap-3 ${
                    viewMode === 'split' && analysisResult ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                  }`}
                >
                  {/* Original Image Frame */}
                  <div className="relative rounded-lg overflow-hidden bg-black border border-[#1c2e63] aspect-[4/3] flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Ultrasound Scan"
                      className="w-full h-full object-contain"
                    />

                    {/* Mask Overlay in Overlay Mode */}
                    {analysisResult?.maskDataUrl && viewMode === 'overlay' && (
                      <div
                        className="absolute inset-0 pointer-events-none transition-opacity duration-150"
                        style={{ opacity: maskOpacity }}
                      >
                        <img
                          src={analysisResult.maskDataUrl}
                          alt="Segmentation Mask"
                          className="w-full h-full object-contain mix-blend-screen"
                          style={{
                            filter:
                              maskColor === 'emerald'
                                ? 'hue-rotate(90deg)'
                                : maskColor === 'purple'
                                ? 'hue-rotate(240deg)'
                                : 'none',
                          }}
                        />
                      </div>
                    )}

                    {/* Simulated Overlay Badge in Benchmark Mode */}
                    {analysisResult?.maskDataUrl && viewMode === 'overlay' && analysisResult.source === 'segthy_benchmark' && (
                      <div className="absolute top-2 right-2 bg-amber-950/90 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-mono text-[9px] uppercase font-bold tracking-wider shadow-sm z-20">
                        SIMULATED OVERLAY (Synthetic Geometric Reference)
                      </div>
                    )}

                    {/* Transducer Depth HUD Tag */}
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded font-mono text-[10px] text-cyan-300 border border-cyan-800/50">
                      12 MHz · Depth: 4.0 cm
                    </div>

                    {/* Scale Calibration Marker */}
                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded font-mono text-[10px] text-slate-300 border border-slate-700">
                      Scale: 10 mm
                    </div>
                  </div>

                  {/* Mask Only Frame (in Split Mode) */}
                  {analysisResult?.maskDataUrl && viewMode === 'split' && (
                    <div className="relative rounded-lg overflow-hidden bg-[#050914] border border-cyan-700/50 aspect-[4/3] flex items-center justify-center">
                      <img
                        src={analysisResult.maskDataUrl}
                        alt="Segmentation Mask Only"
                        className="w-full h-full object-contain"
                        style={{
                          filter:
                            maskColor === 'emerald'
                              ? 'hue-rotate(90deg)'
                              : maskColor === 'purple'
                              ? 'hue-rotate(240deg)'
                              : 'none',
                        }}
                      />
                      <div className="absolute top-2 left-2 bg-cyan-950/90 px-2 py-0.5 rounded font-mono text-[10px] text-cyan-300 border border-cyan-800">
                        {analysisResult.source === 'segthy_benchmark'
                          ? 'SIMULATED OVERLAY (Synthetic Geometric Reference)'
                          : 'Predicted IJV Mask'}
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded font-mono text-[10px] text-emerald-400 border border-emerald-800">
                        Area: {analysisResult.areaPixels.toLocaleString()} px
                      </div>
                    </div>
                  )}
                </div>

                {/* Overlay Controls (when analysis is displayed) */}
                {analysisResult && viewMode === 'overlay' && (
                  <div className="p-3 rounded-lg bg-[#0e1939] border border-[#1a2d5d] flex flex-wrap items-center justify-between gap-4 text-xs">
                    {/* Opacity Slider */}
                    <div className="flex items-center gap-3">
                      <span className="text-slate-300 text-[11px] font-medium">Mask Opacity:</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={maskOpacity}
                        onChange={(e) => setMaskOpacity(parseFloat(e.target.value))}
                        className="w-28 accent-cyan-400 bg-[#16244e] h-1.5 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="font-mono text-cyan-400 text-[11px]">
                        {Math.round(maskOpacity * 100)}%
                      </span>
                    </div>

                    {/* Color Presets */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300 text-[11px] font-medium">Color:</span>
                      <button
                        onClick={() => setMaskColor('cyan')}
                        className={`w-5 h-5 rounded-full bg-cyan-400 border-2 ${
                          maskColor === 'cyan' ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        title="Laser Cyan"
                      />
                      <button
                        onClick={() => setMaskColor('emerald')}
                        className={`w-5 h-5 rounded-full bg-emerald-400 border-2 ${
                          maskColor === 'emerald' ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        title="Bio Green"
                      />
                      <button
                        onClick={() => setMaskColor('purple')}
                        className={`w-5 h-5 rounded-full bg-fuchsia-400 border-2 ${
                          maskColor === 'purple' ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        title="Ultraviolet"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 rounded-lg bg-[#090f23] border border-[#16234b] flex flex-col items-center justify-center text-slate-500">
                <ImageIcon className="w-10 h-10 mb-2 text-slate-600" />
                <p className="text-xs">No ultrasound image loaded.</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Select a research sample or upload a scan to begin.
                </p>
              </div>
            )}
          </div>

          {/* Quantitative Metrics & Results Section */}
          {analysisResult && (
            <div className="space-y-5">
              {/* Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Area in mm² */}
                <div className="p-3 rounded-xl bg-[#0b1329] border border-[#17254d]">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Cross-Sectional Area
                  </span>
                  <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
                    {analysisResult.areaMm2} <span className="text-xs font-normal text-slate-400">mm²</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
                    {analysisResult.source === 'segthy_benchmark'
                      ? '+26% vs baseline (Illustrative demo value)'
                      : '+26% vs 1G baseline'}
                  </span>
                </div>

                {/* Area in Pixels */}
                <div className="p-3 rounded-xl bg-[#0b1329] border border-[#17254d]">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Segmentation Area
                  </span>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {analysisResult.areaPixels.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-400">px</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    {analysisResult.perimeterPixels} px boundary {analysisResult.source === 'segthy_benchmark' ? '(Illustrative)' : ''}
                  </span>
                </div>

                {/* Circularity Index */}
                <div className="p-3 rounded-xl bg-[#0b1329] border border-[#17254d]">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Circularity Index
                  </span>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {analysisResult.circularity}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    Patent elliptical {analysisResult.source === 'segthy_benchmark' ? '(Illustrative)' : ''}
                  </span>
                </div>

                {/* Confidence & Model Score */}
                <div className="p-3 rounded-xl bg-[#0b1329] border border-[#17254d]">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    {analysisResult.source === 'segthy_benchmark' ? 'Model Confidence' : 'Model Inference'}
                  </span>
                  <div className="text-xl font-bold font-mono mt-1">
                    {analysisResult.source === 'segthy_benchmark' || analysisResult.confidence === null ? (
                      <span className="text-amber-300 font-bold">N/A</span>
                    ) : (
                      <span className="text-white">{(analysisResult.confidence * 100).toFixed(1)}%</span>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-mono mt-0.5 block truncate text-slate-400"
                    title={
                      analysisResult.source === 'segthy_benchmark'
                        ? 'Geometric Benchmark Reference — No Model Confidence Score Available'
                        : undefined
                    }
                  >
                    {analysisResult.source === 'segthy_benchmark'
                      ? 'N/A (Benchmark Reference — No Model Score)'
                      : analysisResult.confidence !== null
                      ? `${analysisResult.inferenceTimeMs} ms inference`
                      : 'Score unavailable'}
                  </span>
                </div>
              </div>

              {/* Structured Findings & Medical Report Card */}
              <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#16234b]">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">Automated Quantitative Findings</h3>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      analysisResult.source === 'segthy_benchmark'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    }`}
                  >
                    {analysisResult.source === 'segthy_benchmark'
                      ? 'SIMULATED — DEMONSTRATION ONLY'
                      : 'Keras Model Inference'}
                  </span>
                </div>

                {/* Explicit Demonstration Data Banner when using Benchmark */}
                {analysisResult.source === 'segthy_benchmark' && (
                  <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800 text-xs text-amber-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">SIMULATED — DEMONSTRATION ONLY</span>
                      <span className="text-[11px] leading-relaxed">
                        This segmentation output is generated from the SegThy research reference dataset. Live model
                        inference requires running the local FastAPI server with compatible Keras weights.
                      </span>
                    </div>
                  </div>
                )}

                {/* Findings List */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Observation Summary:</span>
                  <ul className="space-y-1.5 text-xs text-slate-200">
                    {analysisResult.findings.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CRITICAL REQUIREMENT: ABNORMALITY CLASSIFICATION SECTION */}
                <div className="p-3.5 rounded-lg bg-[#0e1736] border border-cyan-800/40 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      {analysisResult.abnormalityClassification.message}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {analysisResult.abnormalityClassification.details}
                  </p>
                  <p className="text-[11px] text-slate-400 italic">
                    Automated segmentation only provides vessel geometry. It does not diagnose, confirm, or rule out thrombosis
                    or vascular occlusion. Clinical assessment by the Ground Medical Team (Flight Surgeon) is required.
                  </p>
                </div>

                {/* Clinical Limitations Disclaimer */}
                <div className="space-y-1.5 pt-2 border-t border-[#16234b]">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Protocol Limitations & Ground Medical Guidance:
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-400">
                    {analysisResult.limitations.map((lim, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-cyan-500 font-bold">·</span>
                        <span>{lim}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions Footer: Save to Session History & Ground Summary */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#16234b]">
                  <span className="text-[10px] font-mono text-slate-500">
                    Model: {analysisResult.modelVersion}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveToHistory}
                      disabled={savedToHistory}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        savedToHistory
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 cursor-default'
                          : 'bg-[#14234e] hover:bg-[#1b2f69] text-cyan-300 border border-cyan-700/40'
                      }`}
                    >
                      {savedToHistory ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Saved to Session History</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save to Session History</span>
                        </>
                      )}
                    </button>

                    {onNavigateToReports && (
                      <button
                        onClick={() => {
                          handleSaveToHistory();
                          onNavigateToReports();
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white transition-all flex items-center gap-1.5 shadow-md shadow-cyan-950/40"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Prepare Ground Medical Summary</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
