/**
 * Types for Aither Kairos — Astronaut Health Monitoring System
 * NASA Space Apps Challenge 2026
 */

export type NavigationTab = 
  | 'overview'
  | 'trends'
  | 'ijv'
  | 'guidance'
  | 'reports'
  | 'history'
  | 'settings'
  // Legacy aliases for backward compatibility
  | 'dashboard'
  | 'profile'
  | 'cardiovascular'
  | 'cognitive';


export interface AstronautProfile {
  id: string;
  name: string;
  role: string;
  mission: string;
  missionPhase: string;
  daysInMission: number;
  totalMissionDays: number;
  status: 'Active' | 'Rest' | 'EVA' | 'Medical Review';
  photoUrl: string;
  age: number;
  bloodType: string;
  heightCm: number;
  weightKg: number;
  restingHeartRateBaseline: number;
  bloodPressureBaseline: string;
  ijvCrossSectionBaselineMm2: number;
  sansRiskTier: 'Low' | 'Moderate' | 'High';
}

export interface SystemStatusData {
  ecgAnalysisStatus: 'Simulated' | 'Ready' | 'Offline';
  ijvModelStatus: 'Model Loaded' | 'Backend Offline' | 'Weights Missing' | 'Checking';
  fastapiConnected: boolean;
  databaseStatus: 'Local Session' | 'Connected' | 'Error';
  apiServicesStatus: 'Running' | 'Degraded' | 'Offline';
  lastAnalysisTimestamp: string;
  backendUrl: string;
  modelVersion?: string;
  device?: string;
}

export interface IJVAnalysisResult {
  id: string;
  timestamp: string;
  astronautId: string;
  imageName: string;
  imageDimensions: { width: number; height: number };
  detectionStatus: 'detected' | 'not_detected' | 'borderline';
  areaPixels: number;
  areaMm2: number; // based on calibration (e.g. 0.088 mm/pixel)
  perimeterPixels: number;
  circularity: number; // 4 * pi * area / perimeter^2
  confidence: number | null; // null if model doesn't output calibrated confidence
  inferenceTimeMs: number;
  modelVersion: string;
  source: 'fastapi_keras' | 'segthy_benchmark' | 'simulated_record';
  maskDataUrl?: string; // base64 or overlay coordinates
  contourPoints?: Array<[number, number]>;
  findings: string[];
  limitations: string[];
  abnormalityClassification: {
    status: 'unavailable';
    message: string;
    details: string;
  };
}

export interface AnalysisHistoryItem {
  id: string;
  timestamp: string;
  astronautName: string;
  scanType: 'IJV Ultrasound' | 'ECG Rhythm' | 'Cognitive Battery';
  thumbnailUrl: string;
  status: 'Normal' | 'Watch' | 'Review' | 'Pending';
  primaryMetric: string;
  source: 'fastapi_keras' | 'segthy_benchmark' | 'simulated_record';
  notes: string;
}

export interface TelemetryPoint {
  date: string;
  heartRate: number;
  restingHeartRate: number;
  hrv: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  timestamp: string;
  message: string;
  type: 'warning' | 'info' | 'alert';
  read: boolean;
}

export interface RecentFinding {
  id: string;
  dateTime: string;
  type: 'ECG' | 'Ultrasound' | 'Vitals' | 'Cognitive';
  finding: string;
  status: 'Normal' | 'Watch' | 'Review';
}
