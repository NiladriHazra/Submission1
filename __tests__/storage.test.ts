/**
 * Storage layer tests - simplified version
 */

import { LocalStorageService } from '../lib/storage/localStorage';
import { Student } from '../lib/types';

// Mock localStorage for Node.js environment
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem(key: string) { return this.store[key] || null; },
  setItem(key: string, value: string) { this.store[key] = value; },
  removeItem(key: string) { delete this.store[key]; },
  clear() { this.store = {}; }
};

Object.defineProperty(global, 'localStorage', { value: mockLocalStorage });

// Simple test function
export const testStorage = async () => {
  console.log('Testing LocalStorageService...');
  
  const storage = new LocalStorageService();
  
  const testStudent: Student = {
    id: 'test-1',
    name: 'Test Student',
    email: 'test@example.com',
    grade: '10th',
    enrollmentDate: '2024-01-01',
    attendanceRate: 95,
    currentGPA: 3.8,
    behaviorScore: 4.5,
    riskLevel: 'Low',
    riskScore: 0.2,
    lastUpdated: new Date().toISOString()
  };
  
  try {
    // Test save and retrieve
    await storage.saveStudent(testStudent);
    const retrieved = await storage.getStudent('test-1');
    
    if (retrieved && retrieved.name === 'Test Student') {
      console.log('✓ Storage test passed');
      return true;
    } else {
      console.log('✗ Storage test failed');
      return false;
    }
  } catch (error) {
    console.error('Storage test error:', error);
    return false;
  }
};

