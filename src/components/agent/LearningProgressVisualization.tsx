/**
 * LearningProgressVisualization Component
 * 
 * Real-time visualization of student learning progress powered by the agentic system.
 * Displays knowledge map, mastery levels, and learning velocity.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Target, Zap, BookOpen, Award } from 'lucide-react';
import { LearningState } from '@/lib/agents/types';

interface LearningProgressVisualizationProps {
  learningState: LearningState | null;
  compact?: boolean;
  className?: string;
}

export function LearningProgressVisualization({
  learningState,
  compact = false,
  className = '',
}: LearningProgressVisualizationProps) {
  if (!learningState) {
    return (
      <div className={`bg-white rounded-xl border-2 border-gray-200 p-4 ${className}`}>
        <p className="text-gray-500 text-sm text-center">
          Start learning to see your progress! 🚀
        </p>
      </div>
    );
  }

  const { knowledgeMap, currentObjectives, learningPath, engagementMetrics } = learningState;

  // Calculate overall progress
  const conceptsArray = knowledgeMap?.concepts ? Object.values(knowledgeMap.concepts) : [];
  const totalConcepts = conceptsArray.length;
  const masteredConcepts = Array.from(knowledgeMap?.masteryLevels?.values() || []).filter(
    level => level.level === 'mastered' || level.level === 'proficient'
  ).length;
  const progressPercentage = totalConcepts > 0 ? (masteredConcepts / totalConcepts) * 100 : 0;

  // Get current learning velocity and engagement
  const velocity = 1.0; // Placeholder - would be calculated from engagement history
  const engagement = engagementMetrics?.currentLevel || 0.5;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 p-3 ${className}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs font-semibold text-gray-700">Learning Progress</p>
              <p className="text-lg font-black text-blue-600">{Math.round(progressPercentage)}%</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-bold text-gray-700">
              {velocity.toFixed(1)}x speed
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-green-600" />
            <span className="text-sm font-bold text-gray-700">
              {currentObjectives?.length || 0} goals
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 ${className}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-3 rounded-xl border-2 border-black">
          <Brain className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900">Your Learning Journey</h3>
          <p className="text-sm text-gray-600">Powered by AI agents 🤖</p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-gray-700">Overall Mastery</span>
          <span className="text-sm font-black text-blue-600">
            {masteredConcepts} / {totalConcepts} concepts
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 border-2 border-black overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          />
        </div>
      </div>

      {/* Learning Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-300 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            <span className="text-xs font-bold text-gray-700">Learning Speed</span>
          </div>
          <p className="text-2xl font-black text-yellow-600">{velocity.toFixed(1)}x</p>
          <p className="text-xs text-gray-600 mt-1">
            {velocity > 1.5 ? 'Blazing fast! 🔥' : velocity > 1.0 ? 'Great pace! ⚡' : 'Steady progress 🌱'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border-2 border-green-300 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-xs font-bold text-gray-700">Engagement</span>
          </div>
          <p className="text-2xl font-black text-green-600">{Math.round(engagement * 100)}%</p>
          <p className="text-xs text-gray-600 mt-1">
            {engagement > 0.8 ? 'Super focused! 🎯' : engagement > 0.5 ? 'Good energy! 💪' : 'Keep going! 🌟'}
          </p>
        </div>
      </div>

      {/* Current Objectives */}
      {currentObjectives && currentObjectives.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-purple-600" />
            <h4 className="text-sm font-black text-gray-900">Current Goals</h4>
          </div>
          <div className="space-y-2">
            {currentObjectives.slice(0, 3).map((objective, index) => (
              <motion.div
                key={objective.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 bg-purple-50 rounded-lg border border-purple-200 p-3"
              >
                <div className="bg-purple-200 rounded-full w-6 h-6 flex items-center justify-center border border-purple-400">
                  <span className="text-xs font-bold text-purple-700">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{objective.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-purple-200 rounded-full h-1.5">
                      <div
                        className="bg-purple-600 h-full rounded-full"
                        style={{ width: `${objective.progress * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-purple-600">
                      {Math.round(objective.progress * 100)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Path Preview */}
      {learningPath && learningPath.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h4 className="text-sm font-black text-gray-900">Next Steps</h4>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {learningPath.slice(0, 5).map((node, index) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`flex-shrink-0 px-3 py-2 rounded-lg border-2 text-xs font-bold ${
                  node.completed
                    ? 'bg-green-100 border-green-400 text-green-700'
                    : node.startedAt
                    ? 'bg-blue-100 border-blue-400 text-blue-700'
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
              >
                {node.completed && '✓ '}
                {node.type}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Knowledge Gaps (if any) */}
      {knowledgeMap?.knowledgeGaps && knowledgeMap.knowledgeGaps.length > 0 && (
        <div className="mt-6 bg-orange-50 rounded-xl border-2 border-orange-300 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-orange-600" />
            <h4 className="text-sm font-black text-gray-900">Areas to Strengthen</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {knowledgeMap.knowledgeGaps.slice(0, 3).map((gap, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-xs font-bold border border-orange-400"
              >
                {gap.concept}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
