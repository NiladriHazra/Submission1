'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Bell, CheckCircle, AlertTriangle, Clock, User, Search, Filter, X, Plus } from 'lucide-react';
import { Alert, Student } from '../../lib/types';
import { storage } from '../../lib/storage';
import { AlertService } from '../../lib/services/alertService';
import { format, parseISO } from 'date-fns';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Acknowledged' | 'Unacknowledged'>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlert, setNewAlert] = useState({
    studentId: '',
    message: '',
    severity: 'Medium' as 'Low' | 'Medium' | 'High'
  });

  const alertService = new AlertService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [alertsData, studentsData] = await Promise.all([
        storage.getAlerts(),
        storage.getStudents()
      ]);
      
      // Sort alerts by timestamp (newest first)
      const sortedAlerts = alertsData.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setAlerts(sortedAlerts);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await alertService.acknowledgeAlert(alertId, 'System User');
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleCreateManualAlert = async () => {
    if (newAlert.studentId && newAlert.message) {
      try {
        await alertService.createManualAlert(newAlert.studentId, newAlert.message, newAlert.severity);
        await loadData(); // Refresh data
        setShowCreateModal(false);
        setNewAlert({ studentId: '', message: '', severity: 'Medium' });
      } catch (error) {
        console.error('Error creating manual alert:', error);
      }
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setNewAlert({ studentId: '', message: '', severity: 'Medium' });
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown Student';
  };

  const filteredAlerts = alerts.filter(alert => {
    const studentName = getStudentName(alert.studentId);
    const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'All' || alert.severity === filterSeverity;
    const matchesStatus = filterStatus === 'All' || 
                         (filterStatus === 'Acknowledged' && alert.acknowledged) ||
                         (filterStatus === 'Unacknowledged' && !alert.acknowledged);
    const matchesType = filterType === 'All' || alert.type === filterType;
    
    return matchesSearch && matchesSeverity && matchesStatus && matchesType;
  });

  const alertTypes = [...new Set(alerts.map(a => a.type))];
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

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
          <div className="text-white text-lg">Loading alerts...</div>
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
            <Link href="/alerts" className="text-orange-500 font-medium relative">
              Alerts
              {unacknowledgedCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unacknowledgedCount}
                </span>
              )}
            </Link>
            <Link href="/settings" className="text-gray-300 hover:text-white transition-colors">
              Settings
            </Link>
          </div>
        </nav>

        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Alert Management</h1>
              <p className="text-gray-400">Monitor and manage student risk alerts</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Alert
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl rounded-lg p-6">
              <div className="flex items-center">
                <Bell className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Alerts</p>
                  <p className="text-2xl font-bold text-white">{alerts.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl rounded-lg p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Unacknowledged</p>
                  <p className="text-2xl font-bold text-white">{unacknowledgedCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl rounded-lg p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">H</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">High Severity</p>
                  <p className="text-2xl font-bold text-white">{alerts.filter(a => a.severity === 'High').length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl rounded-lg p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Acknowledged</p>
                  <p className="text-2xl font-bold text-white">{alerts.filter(a => a.acknowledged).length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as 'All' | 'Low' | 'Medium' | 'High')}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="All">All Severities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'All' | 'Acknowledged' | 'Unacknowledged')}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="All">All Statuses</option>
                <option value="Unacknowledged">Unacknowledged</option>
                <option value="Acknowledged">Acknowledged</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="All">All Types</option>
                {alertTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="mt-4 text-sm text-gray-400">
              Showing {filteredAlerts.length} of {alerts.length} alerts
            </div>
          </div>

          {/* Alerts List */}
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-black/20 backdrop-blur-md border rounded-lg shadow-xl p-6 ${
                  alert.acknowledged ? 'border-white/10' : 
                  alert.severity === 'High' ? 'border-red-500/50' :
                  alert.severity === 'Medium' ? 'border-yellow-500/50' :
                  'border-blue-500/50'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        alert.severity === 'High' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-sm text-gray-400">{alert.type}</span>
                      {alert.acknowledged && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    
                    <h3 className="text-lg font-medium text-white mb-2">{alert.message}</h3>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {getStudentName(alert.studentId)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {format(parseISO(alert.timestamp), 'MMM dd, yyyy HH:mm')}
                      </div>
                      {alert.acknowledged && alert.acknowledgedBy && (
                        <div>
                          Acknowledged by {alert.acknowledgedBy}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 lg:mt-0 lg:ml-6 flex space-x-3">
                    <Link
                      href={`/students/${alert.studentId}`}
                      className="text-orange-500 hover:text-orange-400 font-medium"
                    >
                      View Student
                    </Link>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAlerts.length === 0 && (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-300">No alerts found</h3>
              <p className="mt-1 text-sm text-gray-400">
                {alerts.length === 0 
                  ? "No alerts have been generated yet."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </div>
          )}
        </div>

        {/* Create Alert Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Create New Alert</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Student
                  </label>
                  <select
                    value={newAlert.studentId}
                    onChange={(e) => setNewAlert({ ...newAlert, studentId: e.target.value })}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-gray-900 [&>option]:text-white [&>option]:py-2"
                  >
                    <option value="" className="bg-gray-900 text-gray-400">Select a student...</option>
                    {students.map((student: Student) => (
                      <option key={student.id} value={student.id} className="bg-gray-900 text-white hover:bg-gray-800">{student.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Severity
                  </label>
                  <select
                    value={newAlert.severity}
                    onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value as 'Low' | 'Medium' | 'High' })}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-gray-900 [&>option]:text-white [&>option]:py-2"
                  >
                    <option value="Low" className="bg-gray-900 text-white hover:bg-gray-800">Low</option>
                    <option value="Medium" className="bg-gray-900 text-white hover:bg-gray-800">Medium</option>
                    <option value="High" className="bg-gray-900 text-white hover:bg-gray-800">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    value={newAlert.message}
                    onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                    placeholder="Enter alert message..."
                    rows={3}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 p-6 border-t border-white/10">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateManualAlert}
                  disabled={!newAlert.studentId || !newAlert.message}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded-md font-medium transition-colors"
                >
                  Create Alert
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
