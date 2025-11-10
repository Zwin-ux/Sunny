/**
 * Teacher Dashboard Page
 * 
 * Enhanced dashboard for teachers/parents with agentic learning capabilities.
 * Provides analytics, content review, and agent configuration.
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Settings, FileCheck, Users, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  AgentAnalyticsDashboard,
  AgentContentReview,
  AgentConfigurationPanel,
  GeneratedContentItem,
  AgentConfiguration,
} from '@/components/teacher';

type TabType = 'analytics' | 'content' | 'configuration' | 'students';

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [selectedStudent, setSelectedStudent] = useState('student-1');

  // Mock data - in production, this would come from API
  const students = [
    { id: 'student-1', name: 'Alex Johnson' },
    { id: 'student-2', name: 'Emma Davis' },
    { id: 'student-3', name: 'Michael Chen' },
  ];

  const mockContentItems: GeneratedContentItem[] = [
    {
      id: 'content-1',
      type: 'lesson',
      title: 'Introduction to Fractions',
      description: 'A comprehensive lesson on understanding fractions with visual aids',
      content: 'Lesson content here...',
      generatedBy: 'Content Generation Agent',
      generatedAt: new Date(),
      status: 'pending',
      studentId: 'student-1',
      metadata: {
        difficulty: 'medium',
        topic: 'Mathematics',
        learningObjectives: [
          'Understand what fractions represent',
          'Identify numerator and denominator',
          'Compare simple fractions',
        ],
      },
    },
    {
      id: 'content-2',
      type: 'quiz',
      title: 'Fraction Practice Quiz',
      description: 'Interactive quiz to test fraction understanding',
      content: { questions: [] },
      generatedBy: 'Content Generation Agent',
      generatedAt: new Date(),
      status: 'approved',
      studentId: 'student-1',
      metadata: {
        difficulty: 'easy',
        topic: 'Mathematics',
      },
    },
  ];

  const defaultConfig: AgentConfiguration = {
    assessmentFrequency: 'medium',
    knowledgeGapThreshold: 0.3,
    masteryThreshold: 0.8,
    contentDifficulty: 'adaptive',
    defaultDifficulty: 'medium',
    contentVariety: 'high',
    learningPathStyle: 'adaptive',
    prerequisiteEnforcement: 'flexible',
    interventionThreshold: 0.4,
    frustrationDetection: true,
    encouragementFrequency: 'medium',
    communicationStyle: 'friendly',
    explanationDepth: 'moderate',
    enableRealTimeAdaptation: true,
    enablePredictiveAnalytics: true,
    parentalNotifications: true,
  };

  const [agentConfig, setAgentConfig] = useState<AgentConfiguration>(defaultConfig);

  const handleContentApprove = (id: string, feedback?: string) => {
    console.log('Approved content:', id, feedback);
    // In production, this would call an API
  };

  const handleContentReject = (id: string, reason: string) => {
    console.log('Rejected content:', id, reason);
    // In production, this would call an API
  };

  const handleContentRevision = (id: string, notes: string) => {
    console.log('Requested revision:', id, notes);
    // In production, this would call an API
  };

  const handleConfigSave = (config: AgentConfiguration) => {
    setAgentConfig(config);
    console.log('Saved configuration:', config);
    // In production, this would call an API
  };

  const handleConfigReset = () => {
    setAgentConfig(defaultConfig);
    console.log('Reset configuration to defaults');
  };

  const tabs = [
    { id: 'analytics' as TabType, label: 'Analytics', icon: Brain },
    { id: 'content' as TabType, label: 'Content Review', icon: FileCheck },
    { id: 'configuration' as TabType, label: 'Configuration', icon: Settings },
    { id: 'students' as TabType, label: 'Students', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b-2 border-black px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              size="sm"
              className="border-2 border-black"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Teacher Dashboard</h1>
              <p className="text-sm text-gray-600">AI-Powered Learning Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-green-100 px-3 py-1 rounded-full border-2 border-green-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-green-700">Agents Active</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Student Selector */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Select Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="px-4 py-2 border-2 border-black rounded-lg font-bold bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold border-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'analytics' && (
            <AgentAnalyticsDashboard
              studentId={selectedStudent}
              studentName={students.find(s => s.id === selectedStudent)?.name}
            />
          )}

          {activeTab === 'content' && (
            <AgentContentReview
              contentItems={mockContentItems}
              onApprove={handleContentApprove}
              onReject={handleContentReject}
              onRequestRevision={handleContentRevision}
            />
          )}

          {activeTab === 'configuration' && (
            <AgentConfigurationPanel
              currentConfig={agentConfig}
              onSave={handleConfigSave}
              onReset={handleConfigReset}
            />
          )}

          {activeTab === 'students' && (
            <div className="bg-white rounded-2xl border-2 border-black shadow-lg p-8">
              <h3 className="text-2xl font-black text-gray-900 mb-4">Student Management</h3>
              <div className="space-y-4">
                {students.map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-300 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-black text-lg border-2 border-black">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600">Active learner</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedStudent(student.id);
                        setActiveTab('analytics');
                      }}
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600 text-white border-2 border-black font-bold"
                    >
                      View Analytics
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
