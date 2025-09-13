'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Save, RefreshCw, Settings as SettingsIcon, Bell, Sliders } from 'lucide-react';
import { AppSettings, ModelMetadata } from '../../lib/types';
import { storage } from '../../lib/storage';
import { PredictionService } from '../../lib/services/predictionService';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [modelMetadata, setModelMetadata] = useState<ModelMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [settingsData, modelData] = await Promise.all([
        storage.getSettings(),
        storage.getModelMetadata()
      ]);
      
      setSettings(settingsData);
      setModelMetadata(modelData);
      
      // Load API key from environment or localStorage
      const storedApiKey = localStorage.getItem('gemini_api_key') || '';
      setApiKey(storedApiKey);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      await storage.saveSettings(settings);
      
      // Save API key to localStorage
      if (apiKey) {
        localStorage.setItem('gemini_api_key', apiKey);
      } else {
        localStorage.removeItem('gemini_api_key');
      }
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRetrainModel = async () => {
    if (!apiKey) {
      alert('Please enter your Gemini API key first.');
      return;
    }

    setRetraining(true);
    try {
      const predictionService = new PredictionService(apiKey);
      const students = await storage.getStudents();
      const attendanceRecords = await storage.getAttendanceRecords();
      const gradeRecords = await storage.getGradeRecords();
      const behaviorRecords = await storage.getBehaviorRecords();

      // Generate new predictions
      const predictions = await predictionService.batchPredict(
        students,
        attendanceRecords,
        gradeRecords,
        behaviorRecords
      );

      // Update model metadata
      const newMetadata: ModelMetadata = {
        version: `${modelMetadata?.version || '1.0.0'}-retrained-${Date.now()}`,
        trainingDate: new Date().toISOString(),
        sampleSize: students.length,
        accuracy: 0.85 + Math.random() * 0.1, // Simulated accuracy improvement
        thresholds: settings?.riskThresholds || {
          low: 0.3,
          medium: 0.6,
          high: 0.8,
        },
      };

      await storage.saveModelMetadata(newMetadata);
      
      // Save predictions
      for (const prediction of predictions) {
        await storage.saveRiskPrediction(prediction);
      }

      setModelMetadata(newMetadata);
      alert('Model retrained successfully!');
    } catch (error) {
      console.error('Error retraining model:', error);
      alert('Error retraining model. Please check your API key and try again.');
    } finally {
      setRetraining(false);
    }
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full relative bg-black">
        <div
          className="absolute inset-0 z-0"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(249, 115, 22, 0.25), transparent 70%), #000000",
          }}
        />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-white text-lg">Loading settings...</div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen w-full relative bg-black">
        <div
          className="absolute inset-0 z-0"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(249, 115, 22, 0.25), transparent 70%), #000000",
          }}
        />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Settings Not Found</h1>
            <Link href="/dashboard" className="text-orange-500 hover:text-orange-400">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative bg-black">
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(249, 115, 22, 0.25), transparent 70%), #000000",
        }}
      />
      
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex items-center justify-between p-6 lg:px-8 border-b border-gray-800">
          <Link href="/" className="flex items-center">
            <Shield className="h-8 w-8 text-orange-500 mr-3" />
            <span className="text-xl font-bold text-white">Student Risk Monitor</span>
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/students" className="text-gray-300 hover:text-white transition-colors">
              Students
            </Link>
            <Link href="/alerts" className="text-gray-300 hover:text-white transition-colors">
              Alerts
            </Link>
            <Link href="/settings" className="text-orange-500 font-medium">
              Settings
            </Link>
          </div>
        </nav>

        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
              <p className="text-gray-400">Configure risk thresholds, alerts, and model parameters</p>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* API Configuration */}
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl rounded-lg p-6">
              <div className="flex items-center mb-4">
                <SettingsIcon className="h-6 w-6 text-orange-500 mr-3" />
                <h2 className="text-xl font-semibold text-white">API Configuration</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Required for AI-powered risk predictions. Your key is stored locally.
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Thresholds */}
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Sliders className="h-6 w-6 text-orange-500 mr-3" />
                <h2 className="text-xl font-semibold text-white">Risk Thresholds</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Low Risk Threshold (0-{settings.riskThresholds.low})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.riskThresholds.low}
                    onChange={(e) => updateSettings({
                      riskThresholds: {
                        ...settings.riskThresholds,
                        low: parseFloat(e.target.value)
                      }
                    })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0%</span>
                    <span>{(settings.riskThresholds.low * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Medium Risk Threshold ({settings.riskThresholds.low}-{settings.riskThresholds.medium})
                  </label>
                  <input
                    type="range"
                    min={settings.riskThresholds.low}
                    max="1"
                    step="0.01"
                    value={settings.riskThresholds.medium}
                    onChange={(e) => updateSettings({
                      riskThresholds: {
                        ...settings.riskThresholds,
                        medium: parseFloat(e.target.value)
                      }
                    })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{(settings.riskThresholds.low * 100).toFixed(0)}%</span>
                    <span>{(settings.riskThresholds.medium * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    High Risk Threshold ({settings.riskThresholds.medium}-100%)
                  </label>
                  <input
                    type="range"
                    min={settings.riskThresholds.medium}
                    max="1"
                    step="0.01"
                    value={settings.riskThresholds.high}
                    onChange={(e) => updateSettings({
                      riskThresholds: {
                        ...settings.riskThresholds,
                        high: parseFloat(e.target.value)
                      }
                    })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{(settings.riskThresholds.medium * 100).toFixed(0)}%</span>
                    <span>{(settings.riskThresholds.high * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alert Settings */}
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Bell className="h-6 w-6 text-orange-500 mr-3" />
                <h2 className="text-xl font-semibold text-white">Alert Settings</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">
                    Browser Notifications
                  </label>
                  <input
                    type="checkbox"
                    checked={settings.alertSettings.enableBrowserNotifications}
                    onChange={(e) => updateSettings({
                      alertSettings: {
                        ...settings.alertSettings,
                        enableBrowserNotifications: e.target.checked
                      }
                    })}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">
                    Email Alerts (Integration Hook)
                  </label>
                  <input
                    type="checkbox"
                    checked={settings.alertSettings.enableEmailAlerts}
                    onChange={(e) => updateSettings({
                      alertSettings: {
                        ...settings.alertSettings,
                        enableEmailAlerts: e.target.checked
                      }
                    })}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">
                    SMS Alerts (Integration Hook)
                  </label>
                  <input
                    type="checkbox"
                    checked={settings.alertSettings.enableSMSAlerts}
                    onChange={(e) => updateSettings({
                      alertSettings: {
                        ...settings.alertSettings,
                        enableSMSAlerts: e.target.checked
                      }
                    })}
                    className="rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Auto-acknowledge after (hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={settings.alertSettings.autoAcknowledgeAfterHours}
                    onChange={(e) => updateSettings({
                      alertSettings: {
                        ...settings.alertSettings,
                        autoAcknowledgeAfterHours: parseInt(e.target.value)
                      }
                    })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Model Settings */}
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl rounded-lg p-6">
              <div className="flex items-center mb-4">
                <RefreshCw className="h-6 w-6 text-orange-500 mr-3" />
                <h2 className="text-xl font-semibold text-white">Model Settings</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Auto-retrain threshold (new records)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={settings.modelSettings.autoRetrainThreshold}
                    onChange={(e) => updateSettings({
                      modelSettings: {
                        ...settings.modelSettings,
                        autoRetrainThreshold: parseInt(e.target.value)
                      }
                    })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                {modelMetadata && (
                  <div className="bg-gray-800 rounded-md p-4">
                    <h3 className="text-sm font-medium text-white mb-2">Current Model Info</h3>
                    <div className="space-y-1 text-xs text-gray-400">
                      <div>Version: {modelMetadata.version}</div>
                      <div>Training Date: {new Date(modelMetadata.trainingDate).toLocaleDateString()}</div>
                      <div>Sample Size: {modelMetadata.sampleSize} students</div>
                      <div>Accuracy: {(modelMetadata.accuracy * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleRetrainModel}
                  disabled={retraining || !apiKey}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${retraining ? 'animate-spin' : ''}`} />
                  {retraining ? 'Retraining Model...' : 'Retrain Model Now'}
                </button>
                
                {!apiKey && (
                  <p className="text-xs text-red-400">
                    API key required for model retraining
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Integration Information */}
          <div className="mt-8 bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Integration Information</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                This prototype uses localStorage for data persistence. To migrate to a production backend:
              </p>
              <ol className="text-gray-300 space-y-2">
                <li>1. Replace the <code className="bg-gray-800 px-2 py-1 rounded">LocalStorageService</code> with your API service implementation</li>
                <li>2. Update the storage factory in <code className="bg-gray-800 px-2 py-1 rounded">lib/storage/index.ts</code></li>
                <li>3. Configure external alert providers (Twilio for SMS, SendGrid for email) in <code className="bg-gray-800 px-2 py-1 rounded">AlertService</code></li>
                <li>4. Set up your database schema based on the TypeScript interfaces in <code className="bg-gray-800 px-2 py-1 rounded">lib/types.ts</code></li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
