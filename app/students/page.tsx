'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Shield, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { Student } from '../../lib/types';
import { storage } from '../../lib/storage';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
  const [filterGrade, setFilterGrade] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'riskScore' | 'gpa' | 'attendance'>('riskScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const studentsData = await storage.getStudents();
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedStudents = students
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRiskFilter = filterRisk === 'All' || student.riskLevel === filterRisk;
      const matchesGradeFilter = filterGrade === 'All' || student.grade === filterGrade;
      return matchesSearch && matchesRiskFilter && matchesGradeFilter;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'riskScore':
          aValue = a.riskScore;
          bValue = b.riskScore;
          break;
        case 'gpa':
          aValue = a.currentGPA;
          bValue = b.currentGPA;
          break;
        case 'attendance':
          aValue = a.attendanceRate;
          bValue = b.attendanceRate;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const grades = [...new Set(students.map(s => s.grade))].sort();

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
          <div className="text-white text-lg">Loading students...</div>
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
            <Link href="/dashboard" className="text-gray-400 hover:text-blue-400 transition-colors text-sm uppercase tracking-wider">
              Dashboard
            </Link>
            <Link href="/students" className="text-blue-400 font-medium text-sm uppercase tracking-wider">
              Students
            </Link>
            <Link href="/alerts" className="text-gray-400 hover:text-blue-400 transition-colors text-sm uppercase tracking-wider">
              Alerts
            </Link>
            <Link href="/settings" className="text-gray-400 hover:text-blue-400 transition-colors text-sm uppercase tracking-wider">
              Settings
            </Link>
          </div>
        </nav>

        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Student Directory</h1>
            <p className="text-gray-400">Comprehensive view of all students and their risk profiles</p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Students</p>
                  <p className="text-2xl font-bold text-white">{students.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Low Risk</p>
                  <p className="text-2xl font-bold text-white">{students.filter(s => s.riskLevel === 'Low').length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Medium Risk</p>
                  <p className="text-2xl font-bold text-white">{students.filter(s => s.riskLevel === 'Medium').length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">High Risk</p>
                  <p className="text-2xl font-bold text-white">{students.filter(s => s.riskLevel === 'High').length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value as 'All' | 'Low' | 'Medium' | 'High')}
                className="px-4 py-2 bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Risk Levels</option>
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
              </select>

              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Grades</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as 'name' | 'riskScore' | 'gpa' | 'attendance');
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="pl-10 pr-8 py-2 bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="riskScore-desc">Risk Score (High to Low)</option>
                <option value="riskScore-asc">Risk Score (Low to High)</option>
                <option value="name-asc">Name (A to Z)</option>
                <option value="name-desc">Name (Z to A)</option>
                <option value="gpa-desc">GPA (High to Low)</option>
                <option value="gpa-asc">GPA (Low to High)</option>
                <option value="attendance-desc">Attendance (High to Low)</option>
                <option value="attendance-asc">Attendance (Low to High)</option>
              </select>
            </div>
            
            <div className="mt-4 text-sm text-gray-400">
              Showing {filteredAndSortedStudents.length} of {students.length} students
            </div>
          </div>

          {/* Student Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedStudents.map((student) => (
              <Link
                key={student.id}
                href={`/students/${student.id}`}
                className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-6 hover:border-blue-400 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white truncate">{student.name}</h3>
                    <p className="text-sm text-gray-400">{student.grade}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    student.riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                    student.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {student.riskLevel}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Risk Score:</span>
                    <span className="text-white font-medium">{(student.riskScore * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">GPA:</span>
                    <span className="text-white font-medium">{student.currentGPA.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Attendance:</span>
                    <span className="text-white font-medium">{student.attendanceRate.toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-400 truncate">{student.email}</p>
                </div>
              </Link>
            ))}
          </div>

          {filteredAndSortedStudents.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-300">No students found</h3>
              <p className="mt-1 text-sm text-gray-400">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
