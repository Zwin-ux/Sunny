'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Brain,
  Settings,
  Download,
  Bell,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressCharts } from '@/components/insights/ProgressCharts';
import { LearningPatterns } from '@/components/insights/LearningPatterns';

type TabType = 'overview' | 'patterns' | 'settings';

interface Student {
  id: string;
  name: string;
  grade: number;
  avatar: string;
}

export default function ParentDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedStudent, setSelectedStudent] = useState<Student>({
    id: '1',
    name: 'Emma',
    grade: 3,
    avatar: '👧',
  });

  // Mock data - TODO: Get from API
  const students: Student[] = [
    { id: '1', name: 'Emma', grade: 3, avatar: '👧' },
    { id: '2', name: 'Lucas', grade: 5, avatar: '👦' },
  ];

  const tabs = [
    { id: 'overview' as TabType, label: 'Progress Overview', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'patterns' as TabType, label: 'Learning Patterns', icon: <Brain className="w-5 h-5" /> },
    { id: 'settings' as TabType, label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b-2 border-black px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-black text-gray-900">Parent Dashboard</h1>
                <p className="text-sm text-gray-600">Monitor your child's learning journey</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="border-2 border-black">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm" className="border-2 border-black">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Student Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Student
          </label>
          <div className="relative inline-block">
            <select
              value={selectedStudent.id}
              onChange={(e) => {
                const student = students.find((s) => s.id === e.target.value);
                if (student) setSelectedStudent(student);
              }}
              className="appearance-none bg-white border-2 border-black rounded-xl px-6 py-3 pr-12 font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.avatar} {student.name} (Grade {student.grade})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" />
          </div>
        </motion.div>

        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="flex items-start gap-4">
            <div className="text-5xl">{selectedStudent.avatar}</div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">
                {selectedStudent.name}'s Learning Journey
              </h2>
              <p className="text-gray-700">
                Track progress, discover learning patterns, and get personalized insights from
                Sunny AI. Last updated: Today at 3:45 PM
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex gap-2 bg-white rounded-xl p-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]'
                    : 'bg-transparent text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && <ProgressCharts studentName={selectedStudent.name} />}
          {activeTab === 'patterns' && <LearningPatterns studentName={selectedStudent.name} />}
          {activeTab === 'settings' && <SettingsPanel student={selectedStudent} />}
        </motion.div>
      </main>
    </div>
  );
}

function SettingsPanel({ student }: { student: Student }) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
      >
        <h3 className="text-2xl font-black text-gray-900 mb-6">Learning Preferences</h3>

        <div className="space-y-6">
          {/* Daily Goal */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Daily Learning Goal
            </label>
            <select className="w-full md:w-64 border-2 border-black rounded-lg px-4 py-2 font-semibold">
              <option>15 minutes</option>
              <option>30 minutes</option>
              <option>45 minutes</option>
              <option>60 minutes</option>
            </select>
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Challenge Level
            </label>
            <select className="w-full md:w-64 border-2 border-black rounded-lg px-4 py-2 font-semibold">
              <option>Adaptive (Recommended)</option>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>

          {/* Focus Areas */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Focus Areas
            </label>
            <div className="flex flex-wrap gap-2">
              {['Math', 'Reading', 'Science', 'Writing', 'Logic'].map((subject) => (
                <button
                  key={subject}
                  className="px-4 py-2 bg-purple-100 border-2 border-black rounded-lg font-semibold hover:bg-purple-200 transition-colors"
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Notifications
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-5 h-5" defaultChecked />
                <span className="text-sm text-gray-700">Weekly progress reports</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-5 h-5" defaultChecked />
                <span className="text-sm text-gray-700">Achievement milestones</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-5 h-5" />
                <span className="text-sm text-gray-700">Daily activity summary</span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button className="bg-black text-white hover:bg-gray-800 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              Save Preferences
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
      >
        <h3 className="text-2xl font-black text-gray-900 mb-6">Account Information</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-600">Student Name</p>
            <p className="text-lg font-bold text-gray-900">{student.name}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Grade Level</p>
            <p className="text-lg font-bold text-gray-900">Grade {student.grade}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Account Type</p>
            <p className="text-lg font-bold text-gray-900">Premium</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Member Since</p>
            <p className="text-lg font-bold text-gray-900">October 2025</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
