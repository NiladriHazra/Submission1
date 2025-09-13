'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { AlertTriangle, Users, TrendingUp, Shield, Bell, Search, Filter, Video } from 'lucide-react';
import Link from 'next/link';
import { Student, Alert, RiskPrediction } from '../../lib/types';
import { storage } from '../../lib/storage';
import { 
  generateSampleStudents, 
  generateAttendanceRecords, 
  generateGradeRecords, 
  generateBehaviorRecords, 
  generateAlerts,
  generateRiskPredictions,
  generateModelMetadata
} from '../../lib/data/sampleData';

const COLORS = {
  Low: '#10B981',
  Medium: '#F59E0B', 
  High: '#EF4444'
};

export default function Dashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [predictions, setPredictions] = useState<RiskPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      let existingStudents = await storage.getStudents();
      
      if (existingStudents.length === 0) {
        // Generate sample data if none exists
        const sampleStudents = generateSampleStudents(200);
        const attendanceRecords = generateAttendanceRecords(sampleStudents);
        const gradeRecords = generateGradeRecords(sampleStudents);
        const behaviorRecords = generateBehaviorRecords(sampleStudents);
        const sampleAlerts = generateAlerts(sampleStudents);
        const samplePredictions = generateRiskPredictions(sampleStudents);
        const modelMetadata = generateModelMetadata();

        // Save all data
        for (const student of sampleStudents) {
          await storage.saveStudent(student);
        }
        for (const record of attendanceRecords) {
          await storage.saveAttendanceRecord(record);
        }
        for (const record of gradeRecords) {
          await storage.saveGradeRecord(record);
        }
        for (const record of behaviorRecords) {
          await storage.saveBehaviorRecord(record);
        }
        for (const alert of sampleAlerts) {
          await storage.saveAlert(alert);
        }
        for (const prediction of samplePredictions) {
          await storage.saveRiskPrediction(prediction);
        }
        await storage.saveModelMetadata(modelMetadata);

        existingStudents = sampleStudents;
      }

      const existingAlerts = await storage.getAlerts();
      const existingPredictions = await storage.getRiskPredictions();

      setStudents(existingStudents);
      setAlerts(existingAlerts);
      setPredictions(existingPredictions);
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRisk === 'All' || student.riskLevel === filterRisk;
    return matchesSearch && matchesFilter;
  });

  const riskDistribution = [
    { name: 'Low Risk', value: students.filter(s => s.riskLevel === 'Low').length, color: COLORS.Low },
    { name: 'Medium Risk', value: students.filter(s => s.riskLevel === 'Medium').length, color: COLORS.Medium },
    { name: 'High Risk', value: students.filter(s => s.riskLevel === 'High').length, color: COLORS.High },
  ];

  const gradeDistribution = students.reduce((acc, student) => {
    const grade = student.grade;
    const existing = acc.find(item => item.grade === grade);
    if (existing) {
      existing.Low += student.riskLevel === 'Low' ? 1 : 0;
      existing.Medium += student.riskLevel === 'Medium' ? 1 : 0;
      existing.High += student.riskLevel === 'High' ? 1 : 0;
    } else {
      acc.push({
        grade,
        Low: student.riskLevel === 'Low' ? 1 : 0,
        Medium: student.riskLevel === 'Medium' ? 1 : 0,
        High: student.riskLevel === 'High' ? 1 : 0,
      });
    }
    return acc;
  }, [] as Array<{ grade: string; Low: number; Medium: number; High: number; }>);

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);

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
          <div className="text-white text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black font-mono">
      <div>
        {/* Navigation */}
        <nav className="flex items-center justify-between p-6 lg:px-8 border-b border-gray-800">
          <Link href="/" className="flex items-center">
            <Shield className="h-8 w-8 text-blue-400 mr-3" />
            <span className="text-xl font-bold text-white">Student Risk Monitor</span>
          </Link>
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-blue-400 font-medium text-sm uppercase tracking-wider">
              Dashboard
            </Link>
            <Link href="/students" className="text-gray-400 hover:text-blue-400 transition-colors text-sm uppercase tracking-wider">
              Students
            </Link>
            <Link href="/alerts" className="text-gray-400 hover:text-blue-400 transition-colors text-sm uppercase tracking-wider relative">
              Alerts
              {unacknowledgedAlerts.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unacknowledgedAlerts.length}
                </span>
              )}
            </Link>
            <Link href="/ai-tutor" className="text-gray-400 hover:text-blue-400 transition-colors text-sm uppercase tracking-wider flex items-center gap-2">
              <Video className="w-4 h-4" />
              AI Tutor
            </Link>
            <Link href="/settings" className="text-gray-400 hover:text-blue-400 transition-colors text-sm uppercase tracking-wider">
              Settings
            </Link>
          </div>
        </nav>

        {/* Dashboard Content */}
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Risk Monitoring Dashboard</h1>
            <p className="text-gray-400">Monitor student risk levels and track intervention outcomes</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Students</p>
                  <p className="text-2xl font-bold text-white">{students.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">High Risk</p>
                  <p className="text-2xl font-bold text-white">{students.filter(s => s.riskLevel === 'High').length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-yellow-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Medium Risk</p>
                  <p className="text-2xl font-bold text-white">{students.filter(s => s.riskLevel === 'Medium').length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-6">
              <div className="flex items-center">
                <Bell className="h-8 w-8 text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Alerts</p>
                  <p className="text-2xl font-bold text-white">{unacknowledgedAlerts.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Risk Distribution Pie Chart */}
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Risk Level Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Grade Level Risk Distribution */}
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Risk by Grade Level</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="grade" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="Low" stackId="a" fill={COLORS.Low} />
                  <Bar dataKey="Medium" stackId="a" fill={COLORS.Medium} />
                  <Bar dataKey="High" stackId="a" fill={COLORS.High} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Student List with Search and Filter */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 sm:mb-0">Student Overview</h3>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    value={filterRisk}
                    onChange={(e) => setFilterRisk(e.target.value as 'All' | 'Low' | 'Medium' | 'High')}
                    className="pl-10 pr-8 py-2 bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="All">All Risk Levels</option>
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      GPA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredStudents.slice(0, 10).map((student) => (
                    <tr key={student.id} className="hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">{student.name}</div>
                          <div className="text-sm text-gray-400">{student.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {student.grade}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                          student.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {student.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {student.currentGPA.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {student.attendanceRate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/students/${student.id}`}
                          className="text-orange-500 hover:text-orange-400"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredStudents.length > 10 && (
              <div className="mt-4 text-center">
                <Link
                  href="/students"
                  className="text-orange-500 hover:text-orange-400 font-medium"
                >
                  View All Students ({filteredStudents.length})
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
