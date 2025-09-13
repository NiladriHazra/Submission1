export interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
  enrollmentDate: string;
  attendanceRate: number;
  currentGPA: number;
  behaviorScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  riskScore: number;
  lastUpdated: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  notes?: string;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  subject: string;
  assignment: string;
  score: number;
  maxScore: number;
  date: string;
  category: 'Homework' | 'Quiz' | 'Test' | 'Project' | 'Participation';
}

export interface BehaviorRecord {
  id: string;
  studentId: string;
  date: string;
  type: 'Positive' | 'Negative' | 'Neutral';
  description: string;
  severity: 1 | 2 | 3 | 4 | 5;
  reportedBy: string;
}

export interface Alert {
  id: string;
  studentId: string;
  type: 'Risk Level Change' | 'Attendance Warning' | 'Grade Drop' | 'Behavior Incident' | 'Manual';
  message: string;
  severity: 'Low' | 'Medium' | 'High';
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface RiskPrediction {
  studentId: string;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  confidence: number;
  factors: {
    feature: string;
    impact: number;
    description: string;
  }[];
  modelVersion: string;
  predictedAt: string;
}

export interface ModelMetadata {
  version: string;
  trainingDate: string;
  sampleSize: number;
  accuracy: number;
  thresholds: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface AppSettings {
  riskThresholds: {
    low: number;
    medium: number;
    high: number;
  };
  alertSettings: {
    enableBrowserNotifications: boolean;
    enableEmailAlerts: boolean;
    enableSMSAlerts: boolean;
    autoAcknowledgeAfterHours: number;
  };
  modelSettings: {
    autoRetrainThreshold: number;
    currentModelVersion: string;
  };
}

export interface StorageInterface {
  // Students
  getStudents(): Promise<Student[]>;
  getStudent(id: string): Promise<Student | null>;
  saveStudent(student: Student): Promise<void>;
  updateStudent(id: string, updates: Partial<Student>): Promise<void>;
  deleteStudent(id: string): Promise<void>;

  // Attendance
  getAttendanceRecords(studentId?: string): Promise<AttendanceRecord[]>;
  saveAttendanceRecord(record: AttendanceRecord): Promise<void>;

  // Grades
  getGradeRecords(studentId?: string): Promise<GradeRecord[]>;
  saveGradeRecord(record: GradeRecord): Promise<void>;

  // Behavior
  getBehaviorRecords(studentId?: string): Promise<BehaviorRecord[]>;
  saveBehaviorRecord(record: BehaviorRecord): Promise<void>;

  // Alerts
  getAlerts(): Promise<Alert[]>;
  saveAlert(alert: Alert): Promise<void>;
  updateAlert(id: string, updates: Partial<Alert>): Promise<void>;

  // Predictions
  getRiskPredictions(): Promise<RiskPrediction[]>;
  saveRiskPrediction(prediction: RiskPrediction): Promise<void>;

  // Model & Settings
  getModelMetadata(): Promise<ModelMetadata | null>;
  saveModelMetadata(metadata: ModelMetadata): Promise<void>;
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;
}
