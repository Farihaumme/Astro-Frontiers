/**
 * Mock data for Aither Kairos — Astronaut Health Monitoring System
 * All medical and mission values are simulated demonstration data for Artemis III.
 */

import {
  AstronautProfile,
  NotificationItem,
  RecentFinding,
  TelemetryPoint,
  AnalysisHistoryItem,
} from '../types';

export const ASTRONAUT_ALEX_RIVERA: AstronautProfile = {
  id: 'AST-0427',
  name: 'Alex Rivera',
  role: 'Flight Engineer / Mission Specialist',
  mission: 'Artemis III',
  missionPhase: 'Transit to Moon',
  daysInMission: 12,
  totalMissionDays: 210,
  status: 'Active',
  photoUrl: '/src/assets/images/astronaut_alex_rivera_1792998620282.jpg',
  age: 38,
  bloodType: 'O+',
  heightCm: 181,
  weightKg: 78.4,
  restingHeartRateBaseline: 58,
  bloodPressureBaseline: '116/74 mmHg',
  ijvCrossSectionBaselineMm2: 151.2, // 1G supine baseline
  sansRiskTier: 'Low',
};

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'ECG Signal Quality',
    timestamp: 'Apr 28, 2025 · 13:42',
    message: 'Slight noise detected in lead II. Analysis may be less accurate.',
    type: 'warning',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Baseline Update',
    timestamp: 'Apr 27, 2025 · 09:15',
    message: 'New baseline measurements available for review following Flight Day 10 recalibration.',
    type: 'info',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'SANS Protocol Scheduled',
    timestamp: 'Apr 26, 2025 · 08:00',
    message: 'Weekly optical coherence tomography and IJV ultrasound scanning window opens tomorrow.',
    type: 'info',
    read: true,
  },
];

export const RECENT_FINDINGS: RecentFinding[] = [
  {
    id: 'find-1',
    dateTime: 'Apr 28, 2025 13:42',
    type: 'ECG',
    finding: 'No significant arrhythmia',
    status: 'Normal',
  },
  {
    id: 'find-2',
    dateTime: 'Apr 28, 2025 11:17',
    type: 'Ultrasound',
    finding: 'No evidence of thrombosis (model output)',
    status: 'Normal',
  },
  {
    id: 'find-3',
    dateTime: 'Apr 27, 2025 09:15',
    type: 'ECG',
    finding: 'Minor variation (baseline)',
    status: 'Watch',
  },
  {
    id: 'find-4',
    dateTime: 'Apr 26, 2025 14:03',
    type: 'Vitals',
    finding: 'HR slightly elevated (82 bpm)',
    status: 'Review',
  },
];

export const VITALS_1W_DATA: TelemetryPoint[] = [
  { date: 'Apr 22', heartRate: 74, restingHeartRate: 57, hrv: 44 },
  { date: 'Apr 23', heartRate: 78, restingHeartRate: 58, hrv: 43 },
  { date: 'Apr 24', heartRate: 72, restingHeartRate: 59, hrv: 41 },
  { date: 'Apr 25', heartRate: 75, restingHeartRate: 58, hrv: 42 },
  { date: 'Apr 26', heartRate: 82, restingHeartRate: 60, hrv: 39 },
  { date: 'Apr 27', heartRate: 71, restingHeartRate: 58, hrv: 43 },
  { date: 'Apr 28', heartRate: 72, restingHeartRate: 58, hrv: 42 },
];

export const INITIAL_ANALYSIS_HISTORY: AnalysisHistoryItem[] = [
  {
    id: 'hist-1',
    timestamp: 'Apr 28, 2025 · 11:17',
    astronautName: 'Alex Rivera (AST-0427)',
    scanType: 'IJV Ultrasound',
    thumbnailUrl: '/src/assets/images/ijv_ultrasound_scan_1_1792998621432.jpg',
    status: 'Normal',
    primaryMetric: 'CSA: 190.8 mm² (+26% vs 1G)',
    source: 'segthy_benchmark',
    notes: 'SegThy benchmark analysis. Patent internal jugular vein lumen without occlusion. Microgravity fluid shift expansion observed.',
  },
  {
    id: 'hist-2',
    timestamp: 'Apr 28, 2025 · 13:42',
    astronautName: 'Alex Rivera (AST-0427)',
    scanType: 'ECG Rhythm',
    thumbnailUrl: '/src/assets/images/astronaut_alex_rivera_1792998620282.jpg',
    status: 'Normal',
    primaryMetric: 'HR: 72 bpm | QTc: 418 ms',
    source: 'simulated_record',
    notes: 'Simulated demonstration record. Lead II normal sinus rhythm with nominal repolarization intervals.',
  },
  {
    id: 'hist-3',
    timestamp: 'Apr 27, 2025 · 16:30',
    astronautName: 'Alex Rivera (AST-0427)',
    scanType: 'Cognitive Battery',
    thumbnailUrl: '/src/assets/images/space_earth_orbit_1792998619605.jpg',
    status: 'Normal',
    primaryMetric: 'PVT Mean RT: 214 ms',
    source: 'simulated_record',
    notes: 'Simulated demonstration record. Psychomotor vigilance task showed zero attention lapses.',
  },
  {
    id: 'hist-4',
    timestamp: 'Apr 25, 2025 · 10:05',
    astronautName: 'Alex Rivera (AST-0427)',
    scanType: 'IJV Ultrasound',
    thumbnailUrl: '/src/assets/images/ijv_ultrasound_scan_2_1792998620454.jpg',
    status: 'Normal',
    primaryMetric: 'CSA: 184.2 mm²',
    source: 'segthy_benchmark',
    notes: 'Pre-EVA protocol ultrasound scan. Stable venous outflow through right jugular trunk.',
  },
];
