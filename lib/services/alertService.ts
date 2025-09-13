import { Alert, Student, RiskPrediction } from '../types';
import { storage } from '../storage';

export class AlertService {
  async createAlert(alert: Omit<Alert, 'id' | 'timestamp'>): Promise<Alert> {
    const newAlert: Alert = {
      ...alert,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    await storage.saveAlert(newAlert);
    
    // Trigger browser notification if enabled
    await this.triggerBrowserNotification(newAlert);
    
    // Log alert to console for prototype
    console.log('Alert Created:', newAlert);
    
    return newAlert;
  }

  async createRiskLevelChangeAlert(student: Student, oldLevel: string, newLevel: string): Promise<Alert> {
    const severity = newLevel === 'High' ? 'High' : newLevel === 'Medium' ? 'Medium' : 'Low';
    
    return this.createAlert({
      studentId: student.id,
      type: 'Risk Level Change',
      message: `${student.name}'s risk level changed from ${oldLevel} to ${newLevel}`,
      severity,
      acknowledged: false,
    });
  }

  async createAttendanceAlert(student: Student): Promise<Alert> {
    return this.createAlert({
      studentId: student.id,
      type: 'Attendance Warning',
      message: `${student.name}'s attendance rate has dropped to ${student.attendanceRate}%`,
      severity: student.attendanceRate < 70 ? 'High' : 'Medium',
      acknowledged: false,
    });
  }

  async createGradeAlert(student: Student): Promise<Alert> {
    return this.createAlert({
      studentId: student.id,
      type: 'Grade Drop',
      message: `${student.name}'s GPA has dropped to ${student.currentGPA}`,
      severity: student.currentGPA < 2.0 ? 'High' : 'Medium',
      acknowledged: false,
    });
  }

  async createBehaviorAlert(student: Student, incident: string): Promise<Alert> {
    return this.createAlert({
      studentId: student.id,
      type: 'Behavior Incident',
      message: `${student.name}: ${incident}`,
      severity: 'Medium',
      acknowledged: false,
    });
  }

  async createManualAlert(studentId: string, message: string, severity: 'Low' | 'Medium' | 'High'): Promise<Alert> {
    return this.createAlert({
      studentId,
      type: 'Manual',
      message,
      severity,
      acknowledged: false,
    });
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    await storage.updateAlert(alertId, {
      acknowledged: true,
      acknowledgedBy,
      acknowledgedAt: new Date().toISOString(),
    });
  }

  async getUnacknowledgedAlerts(): Promise<Alert[]> {
    const allAlerts = await storage.getAlerts();
    return allAlerts.filter(alert => !alert.acknowledged);
  }

  async getAlertsForStudent(studentId: string): Promise<Alert[]> {
    const allAlerts = await storage.getAlerts();
    return allAlerts.filter(alert => alert.studentId === studentId);
  }

  async processRiskPredictions(predictions: RiskPrediction[]): Promise<void> {
    const students = await storage.getStudents();
    const existingPredictions = await storage.getRiskPredictions();
    
    for (const prediction of predictions) {
      const student = students.find(s => s.id === prediction.studentId);
      if (!student) continue;

      const existingPrediction = existingPredictions.find(p => p.studentId === prediction.studentId);
      
      // Check for risk level changes
      if (existingPrediction && existingPrediction.riskLevel !== prediction.riskLevel) {
        await this.createRiskLevelChangeAlert(student, existingPrediction.riskLevel, prediction.riskLevel);
      }
      
      // Create alerts for new high-risk students
      if (prediction.riskLevel === 'High' && (!existingPrediction || existingPrediction.riskLevel !== 'High')) {
        await this.createAlert({
          studentId: student.id,
          type: 'Risk Level Change',
          message: `${student.name} has been classified as High Risk. Immediate intervention recommended.`,
          severity: 'High',
          acknowledged: false,
        });
      }
      
      // Save the new prediction
      await storage.saveRiskPrediction(prediction);
    }
  }

  private async triggerBrowserNotification(alert: Alert): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const settings = await storage.getSettings();
      if (!settings.alertSettings.enableBrowserNotifications) return;
      
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(`Student Risk Alert - ${alert.severity}`, {
            body: alert.message,
            icon: '/favicon.ico',
          });
        } else if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            new Notification(`Student Risk Alert - ${alert.severity}`, {
              body: alert.message,
              icon: '/favicon.ico',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error triggering browser notification:', error);
    }
  }

  // Integration hooks for external services (Twilio, SendGrid, etc.)
  async sendSMSAlert(alert: Alert, phoneNumber: string): Promise<void> {
    // Placeholder for SMS integration
    console.log('SMS Alert (Integration Hook):', {
      to: phoneNumber,
      message: alert.message,
      severity: alert.severity,
    });
    
    // In production, this would integrate with Twilio:
    // const client = twilio(accountSid, authToken);
    // await client.messages.create({
    //   body: alert.message,
    //   from: '+1234567890',
    //   to: phoneNumber
    // });
  }

  async sendEmailAlert(alert: Alert, email: string): Promise<void> {
    // Placeholder for email integration
    console.log('Email Alert (Integration Hook):', {
      to: email,
      subject: `Student Risk Alert - ${alert.severity}`,
      message: alert.message,
    });
    
    // In production, this would integrate with SendGrid:
    // const msg = {
    //   to: email,
    //   from: 'alerts@school.edu',
    //   subject: `Student Risk Alert - ${alert.severity}`,
    //   text: alert.message,
    // };
    // await sgMail.send(msg);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
