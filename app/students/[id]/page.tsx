'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  Shield, 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  GraduationCap, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  BookOpen,
  Users
} from 'lucide-react';
import { Student, AttendanceRecord, GradeRecord, BehaviorRecord, RiskPrediction } from '../../../lib/types';
import { storage } from '../../../lib/storage';
import { format, parseISO, subDays } from 'date-fns';

export default function StudentProfile() {
  const params = useParams();
  const studentId = params.id as string;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [behavior, setBehavior] = useState<BehaviorRecord[]>([]);
  const [prediction, setPrediction] = useState<RiskPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      loadStudentData();
    }
  }, [studentId]);

  const loadStudentData = async () => {
    try {
      const [studentData, attendanceData, gradesData, behaviorData, predictions] = await Promise.all([
        storage.getStudent(studentId),
        storage.getAttendanceRecords(studentId),
        storage.getGradeRecords(studentId),
        storage.getBehaviorRecords(studentId),
        storage.getRiskPredictions()
      ]);

      setStudent(studentData);
      setAttendance(attendanceData);
      setGrades(gradesData);
      setBehavior(behaviorData);
      setPrediction(predictions.find(p => p.studentId === studentId) || null);
    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
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
          <div className="text-white text-lg">Loading student profile...</div>
        </div>
      </div>
    );
  }

  if (!student) {
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
            <h1 className="text-2xl font-bold text-white mb-4">Student Not Found</h1>
            <Link href="/students" className="text-orange-500 hover:text-orange-400">
              Return to Students
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Prepare attendance chart data
  const attendanceChartData = attendance
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30)
    .map(record => ({
      date: format(parseISO(record.date), 'MM/dd'),
      present: record.status === 'Present' ? 1 : 0,
      absent: record.status === 'Absent' ? 1 : 0,
      late: record.status === 'Late' ? 1 : 0,
    }));

  // Prepare grades chart data
  const gradesChartData = grades
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10)
    .map(grade => ({
      assignment: `${grade.subject.substring(0, 3)} ${grade.assignment}`,
      percentage: (grade.score / grade.maxScore) * 100,
      date: grade.date,
    }));

  // Calculate recent performance metrics
  const recentAttendance = attendance.filter(record => {
    const recordDate = new Date(record.date);
    const thirtyDaysAgo = subDays(new Date(), 30);
    return recordDate >= thirtyDaysAgo;
  });

  const recentAttendanceRate = recentAttendance.length > 0 
    ? (recentAttendance.filter(r => r.status === 'Present' || r.status === 'Late').length / recentAttendance.length) * 100
    : 0;

  const recentGrades = grades.filter(grade => {
    const gradeDate = new Date(grade.date);
    const thirtyDaysAgo = subDays(new Date(), 30);
    return gradeDate >= thirtyDaysAgo;
  });

  const recentGPA = recentGrades.length > 0
    ? recentGrades.reduce((sum, grade) => sum + (grade.score / grade.maxScore) * 4, 0) / recentGrades.length
    : 0;

  const recentBehavior = behavior.filter(record => {
    const recordDate = new Date(record.date);
    const thirtyDaysAgo = subDays(new Date(), 30);
    return recordDate >= thirtyDaysAgo;
  });

  const behaviorSummary = {
    positive: recentBehavior.filter(b => b.type === 'Positive').length,
    negative: recentBehavior.filter(b => b.type === 'Negative').length,
    neutral: recentBehavior.filter(b => b.type === 'Neutral').length,
  };

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
            <Link href="/settings" className="text-gray-300 hover:text-white transition-colors">
              Settings
            </Link>
          </div>
        </nav>

        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Link
              href="/students"
              className="flex items-center text-gray-400 hover:text-white transition-colors mr-6"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Students
            </Link>
          </div>

          {/* Student Info Header */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl rounded-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center mb-4 lg:mb-0">
                <div className="bg-gray-800 rounded-full p-4 mr-6">
                  <User className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{student.name}</h1>
                  <div className="flex items-center space-x-4 mt-2 text-gray-400">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {student.email}
                    </div>
                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 mr-1" />
                      {student.grade}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Enrolled {format(parseISO(student.enrollmentDate), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className={`inline-flex px-4 py-2 text-lg font-semibold rounded-full ${
                  student.riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                  student.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {student.riskLevel} Risk
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl rounded-lg p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Risk Score</p>
                  <p className="text-2xl font-bold text-white">{(student.riskScore * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl rounded-lg p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Current GPA</p>
                  <p className="text-2xl font-bold text-white">{student.currentGPA.toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl rounded-lg p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Attendance Rate</p>
                  <p className="text-2xl font-bold text-white">{student.attendanceRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl rounded-lg p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Behavior Score</p>
                  <p className="text-2xl font-bold text-white">{student.behaviorScore.toFixed(1)}/5</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Attendance Trend */}
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Attendance Trend (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '6px'
                    }}
                  />
                  <Line type="monotone" dataKey="present" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Grades */}
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Grade Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gradesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="assignment" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="percentage" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Factors & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Risk Factors */}
            {prediction && (
              <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Risk Factors Analysis</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400">Confidence Score:</span>
                    <span className="text-white font-medium">{(prediction.confidence * 100).toFixed(0)}%</span>
                  </div>
                  
                  {prediction.factors.map((factor, index) => (
                    <div key={index} className="border-b border-gray-700 pb-3 last:border-b-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">{factor.feature}</span>
                        <span className={`text-sm font-medium ${
                          factor.impact > 0 ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {factor.impact > 0 ? '+' : ''}{(factor.impact * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{factor.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Behavior */}
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Behavior (Last 30 Days)</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{behaviorSummary.positive}</div>
                  <div className="text-sm text-gray-400">Positive</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-400">{behaviorSummary.neutral}</div>
                  <div className="text-sm text-gray-400">Neutral</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{behaviorSummary.negative}</div>
                  <div className="text-sm text-gray-400">Negative</div>
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentBehavior.slice(0, 5).map((record) => (
                  <div key={record.id} className="border-l-4 border-gray-600 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white text-sm">{record.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(parseISO(record.date), 'MMM dd, yyyy')} • {record.reportedBy}
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.type === 'Positive' ? 'bg-green-100 text-green-800' :
                        record.type === 'Negative' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {record.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
