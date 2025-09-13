'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, Users, TrendingUp, Shield, Video } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-black font-mono">
      {/* Content */}
      <div>
        {/* Navigation */}
        <nav className="flex items-center justify-between p-6 lg:px-8 border-b border-gray-800">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-400 mr-3" />
            <span className="text-xl font-bold text-white">Student Risk Monitor</span>
          </div>
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-gray-400 hover:text-blue-400 transition-colors text-sm uppercase tracking-wider">
              Dashboard
            </Link>
            <Link href="/students" className="text-gray-400 hover:text-blue-400 transition-colors text-sm uppercase tracking-wider">
              Students
            </Link>
            <Link href="/alerts" className="text-gray-400 hover:text-blue-400 transition-colors text-sm uppercase tracking-wider">
              Alerts
            </Link>
            <Link href="/ai-tutor" className="text-gray-400 hover:text-blue-400 transition-colors text-sm uppercase tracking-wider flex items-center gap-2">
              <Video className="w-4 h-4" />
              AI Tutor
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold text-white sm:text-6xl mb-8">
              Student Risk Monitor
            </h1>
            <p className="text-lg text-gray-400 max-w-3xl mb-12 leading-relaxed">
              Monitor and analyze student performance with <span className="text-blue-400 font-semibold">AI-powered risk assessment</span> — 
              attendance tracking, grade analysis, behavioral indicators, and more — side-by-side in one place. 
              Built for educators, administrators, and teams who want faster, clearer insights.
            </p>
            
            <div className="mb-16">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">
                Built by Education Technology Team
              </h3>
              <p className="text-gray-400 mb-8">
                Hi, we're building Student Risk Monitor to make multi-factor student analysis simple and fast. 
                Follow along on our progress, and feel free to reach out.
              </p>
              
              <div className="flex space-x-4">
                <div className="bg-gray-900 border border-gray-700 rounded px-4 py-2 text-gray-400 text-sm">
                  Dashboard
                </div>
                <div className="bg-gray-900 border border-gray-700 rounded px-4 py-2 text-gray-400 text-sm">
                  Analytics
                </div>
                <div className="bg-gray-900 border border-gray-700 rounded px-4 py-2 text-gray-400 text-sm">
                  Alerts
                </div>
              </div>
            </div>

            <div className="mb-16">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">
                What makes Student Risk Monitor different
              </h3>
              <div className="space-y-4 text-gray-400">
                <div className="flex items-start">
                  <span className="text-blue-400 mr-3">→</span>
                  <span>Compare risk factors from multiple data sources in a single view</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-400 mr-3">→</span>
                  <span>Organize by student profiles; keep context flowing</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-400 mr-3">→</span>
                  <span>Works with attendance systems, grade books, and more providers</span>
                </div>
              </div>
            </div>

            <div className="mb-16">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">
                FAQ
              </h3>
              
              <div className="space-y-8">
                <div>
                  <h4 className="text-white font-semibold mb-2">What is Student Risk Monitor?</h4>
                  <p className="text-gray-400">
                    Student Risk Monitor is an AI-powered platform that lets you analyze student performance from <span className="text-blue-400 font-semibold">200+ data points</span> in one interface.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-white font-semibold mb-2">Is Student Risk Monitor free?</h4>
                  <p className="text-gray-400">
                    There's a free experience with sample data. You can connect your own data sources for full analysis and control.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-white font-semibold mb-2">Which data sources are supported?</h4>
                  <p className="text-gray-400">
                    Attendance systems, grade books, behavioral tracking, parent communications, and many more via integrations and native providers.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Link
                href="/dashboard"
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 text-sm font-semibold transition-colors border border-blue-600"
              >
                View Dashboard
              </Link>
              <Link
                href="/ai-tutor"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                Try AI Tutor
              </Link>
              <Link
                href="/students"
                className="border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 px-6 py-3 text-sm font-semibold transition-colors"
              >
                Browse Students →
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-800 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="h-6 w-6 text-blue-400 mr-2" />
                <span className="text-sm text-gray-500">Student Risk Monitor</span>
              </div>
              <p className="text-sm text-gray-500">
                Powered by AI for better educational outcomes
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
