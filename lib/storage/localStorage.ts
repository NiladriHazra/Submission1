import { 
  StorageInterface, 
  Student, 
  AttendanceRecord, 
  GradeRecord, 
  BehaviorRecord, 
  Alert, 
  RiskPrediction, 
  ModelMetadata, 
  AppSettings 
} from '../types';

const STORAGE_KEYS = {
  STUDENTS: 'srm_students',
  ATTENDANCE: 'srm_attendance',
  GRADES: 'srm_grades',
  BEHAVIOR: 'srm_behavior',
  ALERTS: 'srm_alerts',
  PREDICTIONS: 'srm_predictions',
  MODEL_METADATA: 'srm_model_metadata',
  SETTINGS: 'srm_settings',
} as const;

export class LocalStorageService implements StorageInterface {
  private async getFromStorage<T>(key: string, defaultValue: T): Promise<T> {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage key ${key}:`, error);
      return defaultValue;
    }
  }

  private async saveToStorage<T>(key: string, data: T): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to localStorage key ${key}:`, error);
      throw new Error(`Failed to save data to localStorage: ${error}`);
    }
  }

  // Students
  async getStudents(): Promise<Student[]> {
    return this.getFromStorage(STORAGE_KEYS.STUDENTS, []);
  }

  async getStudent(id: string): Promise<Student | null> {
    const students = await this.getStudents();
    return students.find(student => student.id === id) || null;
  }

  async saveStudent(student: Student): Promise<void> {
    const students = await this.getStudents();
    const existingIndex = students.findIndex(s => s.id === student.id);
    
    if (existingIndex >= 0) {
      students[existingIndex] = student;
    } else {
      students.push(student);
    }
    
    await this.saveToStorage(STORAGE_KEYS.STUDENTS, students);
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<void> {
    const students = await this.getStudents();
    const studentIndex = students.findIndex(s => s.id === id);
    
    if (studentIndex >= 0) {
      students[studentIndex] = { ...students[studentIndex], ...updates, lastUpdated: new Date().toISOString() };
      await this.saveToStorage(STORAGE_KEYS.STUDENTS, students);
    }
  }

  async deleteStudent(id: string): Promise<void> {
    const students = await this.getStudents();
    const filteredStudents = students.filter(s => s.id !== id);
    await this.saveToStorage(STORAGE_KEYS.STUDENTS, filteredStudents);
  }

  // Attendance
  async getAttendanceRecords(studentId?: string): Promise<AttendanceRecord[]> {
    const records = await this.getFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    return studentId ? records.filter(r => r.studentId === studentId) : records;
  }

  async saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
    const records = await this.getAttendanceRecords();
    const existingIndex = records.findIndex(r => r.id === record.id);
    
    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }
    
    await this.saveToStorage(STORAGE_KEYS.ATTENDANCE, records);
  }

  // Grades
  async getGradeRecords(studentId?: string): Promise<GradeRecord[]> {
    const records = await this.getFromStorage<GradeRecord[]>(STORAGE_KEYS.GRADES, []);
    return studentId ? records.filter(r => r.studentId === studentId) : records;
  }

  async saveGradeRecord(record: GradeRecord): Promise<void> {
    const records = await this.getGradeRecords();
    const existingIndex = records.findIndex(r => r.id === record.id);
    
    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }
    
    await this.saveToStorage(STORAGE_KEYS.GRADES, records);
  }

  // Behavior
  async getBehaviorRecords(studentId?: string): Promise<BehaviorRecord[]> {
    const records = await this.getFromStorage<BehaviorRecord[]>(STORAGE_KEYS.BEHAVIOR, []);
    return studentId ? records.filter(r => r.studentId === studentId) : records;
  }

  async saveBehaviorRecord(record: BehaviorRecord): Promise<void> {
    const records = await this.getBehaviorRecords();
    const existingIndex = records.findIndex(r => r.id === record.id);
    
    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }
    
    await this.saveToStorage(STORAGE_KEYS.BEHAVIOR, records);
  }

  // Alerts
  async getAlerts(): Promise<Alert[]> {
    return this.getFromStorage(STORAGE_KEYS.ALERTS, []);
  }

  async saveAlert(alert: Alert): Promise<void> {
    const alerts = await this.getAlerts();
    const existingIndex = alerts.findIndex(a => a.id === alert.id);
    
    if (existingIndex >= 0) {
      alerts[existingIndex] = alert;
    } else {
      alerts.push(alert);
    }
    
    await this.saveToStorage(STORAGE_KEYS.ALERTS, alerts);
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<void> {
    const alerts = await this.getAlerts();
    const alertIndex = alerts.findIndex(a => a.id === id);
    
    if (alertIndex >= 0) {
      alerts[alertIndex] = { ...alerts[alertIndex], ...updates };
      await this.saveToStorage(STORAGE_KEYS.ALERTS, alerts);
    }
  }

  // Predictions
  async getRiskPredictions(): Promise<RiskPrediction[]> {
    return this.getFromStorage(STORAGE_KEYS.PREDICTIONS, []);
  }

  async saveRiskPrediction(prediction: RiskPrediction): Promise<void> {
    const predictions = await this.getRiskPredictions();
    const existingIndex = predictions.findIndex(p => p.studentId === prediction.studentId);
    
    if (existingIndex >= 0) {
      predictions[existingIndex] = prediction;
    } else {
      predictions.push(prediction);
    }
    
    await this.saveToStorage(STORAGE_KEYS.PREDICTIONS, predictions);
  }

  // Model & Settings
  async getModelMetadata(): Promise<ModelMetadata | null> {
    return this.getFromStorage<ModelMetadata | null>(STORAGE_KEYS.MODEL_METADATA, null);
  }

  async saveModelMetadata(metadata: ModelMetadata): Promise<void> {
    await this.saveToStorage(STORAGE_KEYS.MODEL_METADATA, metadata);
  }

  async getSettings(): Promise<AppSettings> {
    const defaultSettings: AppSettings = {
      riskThresholds: {
        low: 0.3,
        medium: 0.6,
        high: 0.8,
      },
      alertSettings: {
        enableBrowserNotifications: true,
        enableEmailAlerts: false,
        enableSMSAlerts: false,
        autoAcknowledgeAfterHours: 24,
      },
      modelSettings: {
        autoRetrainThreshold: 50,
        currentModelVersion: '1.0.0',
      },
    };
    
    return this.getFromStorage(STORAGE_KEYS.SETTINGS, defaultSettings);
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  }
}
