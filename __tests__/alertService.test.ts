/**
 * AlertService tests - simplified version
 */

import { AlertService } from '../lib/services/alertService';
import { Student, Alert } from '../lib/types';

// Simple test function for AlertService
export const testAlertService = async () => {
  console.log('Testing AlertService...');
  
  const alertService = new AlertService();
  
  const testAlert = {
    studentId: 'test-student-1',
    type: 'Risk Level Change' as const,
    message: 'Test alert message',
    severity: 'High' as const,
    acknowledged: false,
  };
  
  try {
    // Test alert creation
    const createdAlert = await alertService.createAlert(testAlert);
    
    if (createdAlert && createdAlert.id && createdAlert.timestamp) {
      console.log('✓ AlertService test passed');
      return true;
    } else {
      console.log('✗ AlertService test failed');
      return false;
    }
  } catch (error) {
    console.error('AlertService test error:', error);
    return false;
  }
};

