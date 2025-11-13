/**
 * LearningProgressVisualization Component
 * 
 * Real-time visualization of student learning progress powered by the agentic system.
 * Displays knowledge map, mastery levels, and learning velocity.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Target, Zap, BookOpen, Award, Sparkles } from 'lucide-react';
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

  const {
    knowledgeMap,
    currentObjectives,
    learningPath,
    engagementMetrics,
    personalizedPlan,
    momentumScore,
    profileSummary,
  } = learningState;

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
  const momentum = momentumScore ?? 0.6;
  const energyLevel = personalizedPlan?.energyLevel ?? 'calm';
  const energyColorMap: Record<string, string> = {
    calm: 'from-sky-50 to-sky-100 border-sky-200 text-sky-700',
    energized: 'from-rose-50 to-orange-100 border-rose-300 text-rose-700',
    playful: 'from-green-50 to-lime-100 border-green-200 text-green-700',
  };

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

        <div
          className={`bg-gradient-to-br ${energyColorMap[energyLevel] || 'from-blue-50 to-blue-100 border-blue-200 text-blue-700'} rounded-xl border-2 p-4`}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs font-bold text-gray-700">Momentum Pulse</span>
          </div>
          <p className="text-2xl font-black">
            {Math.round(momentum * 100)}%
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {energyLevel === 'energized'
              ? 'Riding a hot streak—let’s launch the next quest!'
              : energyLevel === 'playful'
              ? 'We’re remixing the vibe to keep things fun and fresh.'
              : 'Smooth and steady progress—perfect for deep focus.'}
          </p>
        </div>
      </div>

      {/* Personalized Plan */}
      {personalizedPlan && (
        <div className="mb-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200 p-5">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h4 className="text-sm font-black text-purple-800">Agentic Lesson Engine</h4>
                <span className="text-[10px] uppercase font-bold text-purple-500 bg-purple-100 rounded-full px-2 py-0.5">
                  evolving live
                </span>
              </div>
              <p className="text-lg font-bold text-purple-900">{personalizedPlan.narrativeHook}</p>
              <p className="text-sm text-purple-700">
                Focus Quest: <span className="font-semibold">{personalizedPlan.focusArea}</span>
              </p>
              <p className="text-sm text-gray-700">{personalizedPlan.drivingQuestion}</p>
              {personalizedPlan.lessonIdea && (
                <div className="text-xs text-gray-600 space-y-1 bg-white/70 border border-purple-100 rounded-lg p-3">
                  <p className="font-semibold text-purple-700 uppercase tracking-wide">Lesson Idea Blueprint</p>
                  <p>
                    <span className="font-semibold text-purple-800">Spark:</span>{' '}
                    {personalizedPlan.lessonIdea.refinedTheme}
                  </p>
                  <p>
                    <span className="font-semibold text-purple-800">Power Skill:</span>{' '}
                    {personalizedPlan.lessonIdea.powerSkill}
                  </p>
                  <p>
                    <span className="font-semibold text-purple-800">Outcome:</span>{' '}
                    {personalizedPlan.lessonIdea.desiredOutcome}
                  </p>
                </div>
              )}
            </div>

            <div className="md:w-56 bg-white rounded-xl border border-purple-200 p-4 space-y-2 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">Why this adapts to you</p>
              <ul className="text-xs text-gray-700 space-y-1">
                {personalizedPlan.adaptationHighlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-purple-500">•</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs font-semibold text-purple-600">{personalizedPlan.celebrationMessage}</p>
            </div>
          </div>

          {personalizedPlan.progressionStages?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Progression Arc</p>
              <div className="flex flex-col md:flex-row gap-3">
                {personalizedPlan.progressionStages.map(stage => (
                  <div
                    key={stage.id}
                    className="flex-1 bg-white rounded-xl border border-purple-200 p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-purple-900">{stage.name}</p>
                      <span className="text-[10px] font-semibold text-purple-600 bg-purple-100 rounded-full px-2 py-0.5">
                        {stage.modality}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{stage.mission}</p>
                    <p className="text-[11px] text-gray-500 mt-2">
                      Success: {stage.successCriteria}
                    </p>
                    <p className="text-[10px] text-purple-500 mt-1">
                      Upgrade Signal: {stage.upgradeSignal}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Next experiences</p>
            <div className="flex flex-col md:flex-row gap-3">
              {personalizedPlan.recommendedActivities.map(activity => (
                <div
                  key={activity.id}
                  className="flex-1 bg-white rounded-xl border border-purple-200 p-3 shadow-sm"
                >
                  <p className="text-sm font-black text-gray-900 mb-1">{activity.title}</p>
                  <p className="text-xs text-gray-600 mb-2">{activity.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-purple-600 font-semibold">
                    <span className="bg-purple-100 rounded-full px-2 py-0.5">{activity.type}</span>
                    <span className="bg-purple-100 rounded-full px-2 py-0.5">{activity.pacing}</span>
                    {activity.stageName && (
                      <span className="bg-purple-100 rounded-full px-2 py-0.5">{activity.stageName}</span>
                    )}
                    <span className="bg-purple-100 rounded-full px-2 py-0.5">
                      {Math.round(activity.confidence * 100)}% match
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2">{activity.personalizationReason}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {personalizedPlan.reflectionPrompt && (
              <div className="bg-white rounded-xl border border-purple-200 p-3 shadow-sm">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Reflection Prompt</p>
                <p className="text-sm text-gray-700">{personalizedPlan.reflectionPrompt}</p>
              </div>
            )}
            {personalizedPlan.coCreationOpportunities?.length > 0 && (
              <div className="bg-white rounded-xl border border-purple-200 p-3 shadow-sm">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Co-Create with Sunny</p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  {personalizedPlan.coCreationOpportunities.map((idea, index) => (
                    <li key={index}>{idea}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Identity Snapshot */}
      {profileSummary && (
        <div className="mt-6 bg-white border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-bold text-gray-800">{profileSummary.identityStatement}</p>
              <div className="flex flex-wrap gap-2 text-[11px] text-blue-700">
                {profileSummary.coreStrengths.map((strength, index) => (
                  <span key={index} className="bg-blue-100 px-2 py-0.5 rounded-full font-semibold">
                    {strength}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-gray-500">
                Momentum style: <span className="font-semibold text-blue-600">{profileSummary.preferredPacing}</span> · Collaboration vibe:{' '}
                <span className="font-semibold text-blue-600">{profileSummary.collaborationStyle}</span>
              </p>
            </div>
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
