/**
 * AgentConfigurationPanel Component
 * 
 * Teacher interface for configuring AI agent behavior and preferences.
 * Allows customization of teaching strategies, difficulty levels, and intervention thresholds.
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Brain,
  Target,
  Zap,
  AlertCircle,
  Save,
  RotateCcw,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AgentConfiguration {
  // Assessment Agent Settings
  assessmentFrequency: 'low' | 'medium' | 'high';
  knowledgeGapThreshold: number; // 0-1
  masteryThreshold: number; // 0-1
  
  // Content Generation Settings
  contentDifficulty: 'adaptive' | 'fixed';
  defaultDifficulty: 'easy' | 'medium' | 'hard';
  contentVariety: 'low' | 'medium' | 'high';
  
  // Path Planning Settings
  learningPathStyle: 'linear' | 'adaptive' | 'exploratory';
  prerequisiteEnforcement: 'strict' | 'flexible' | 'none';
  
  // Intervention Settings
  interventionThreshold: number; // 0-1
  frustrationDetection: boolean;
  encouragementFrequency: 'low' | 'medium' | 'high';
  
  // Communication Settings
  communicationStyle: 'formal' | 'friendly' | 'playful';
  explanationDepth: 'brief' | 'moderate' | 'detailed';
  
  // General Settings
  enableRealTimeAdaptation: boolean;
  enablePredictiveAnalytics: boolean;
  parentalNotifications: boolean;
}

interface AgentConfigurationPanelProps {
  currentConfig: AgentConfiguration;
  onSave: (config: AgentConfiguration) => void;
  onReset: () => void;
  className?: string;
}

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

export function AgentConfigurationPanel({
  currentConfig,
  onSave,
  onReset,
  className = '',
}: AgentConfigurationPanelProps) {
  const [config, setConfig] = useState<AgentConfiguration>(currentConfig);
  const [hasChanges, setHasChanges] = useState(false);

  const updateConfig = <K extends keyof AgentConfiguration>(
    key: K,
    value: AgentConfiguration[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(config);
    setHasChanges(false);
  };

  const handleReset = () => {
    setConfig(defaultConfig);
    onReset();
    setHasChanges(false);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl border-2 border-black shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black mb-2">Agent Configuration</h2>
            <p className="text-purple-100">Customize AI agent behavior and teaching strategies</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border-2 border-white/30">
            <Settings className="w-12 h-12" />
          </div>
        </div>
      </div>

      {/* Save/Reset Actions */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 rounded-xl border-2 border-yellow-300 p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="font-bold text-yellow-900">You have unsaved changes</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="border-2 border-black font-bold"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              className="bg-green-500 hover:bg-green-600 text-white border-2 border-black font-bold"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </motion.div>
      )}

      {/* Assessment Agent Settings */}
      <ConfigSection
        icon={<Brain className="w-6 h-6" />}
        title="Assessment Agent"
        description="Configure how the AI assesses student understanding"
        color="blue"
      >
        <SelectField
          label="Assessment Frequency"
          value={config.assessmentFrequency}
          onChange={(value) => updateConfig('assessmentFrequency', value as any)}
          options={[
            { value: 'low', label: 'Low - Minimal assessments' },
            { value: 'medium', label: 'Medium - Balanced approach' },
            { value: 'high', label: 'High - Frequent checks' },
          ]}
        />
        
        <SliderField
          label="Knowledge Gap Threshold"
          value={config.knowledgeGapThreshold}
          onChange={(value) => updateConfig('knowledgeGapThreshold', value)}
          min={0}
          max={1}
          step={0.1}
          description="How sensitive to detect knowledge gaps (lower = more sensitive)"
        />
        
        <SliderField
          label="Mastery Threshold"
          value={config.masteryThreshold}
          onChange={(value) => updateConfig('masteryThreshold', value)}
          min={0}
          max={1}
          step={0.1}
          description="Required performance level to consider a concept mastered"
        />
      </ConfigSection>

      {/* Content Generation Settings */}
      <ConfigSection
        icon={<Target className="w-6 h-6" />}
        title="Content Generation"
        description="Control how AI creates learning materials"
        color="green"
      >
        <SelectField
          label="Difficulty Adaptation"
          value={config.contentDifficulty}
          onChange={(value) => updateConfig('contentDifficulty', value as any)}
          options={[
            { value: 'adaptive', label: 'Adaptive - Adjusts to student' },
            { value: 'fixed', label: 'Fixed - Uses default difficulty' },
          ]}
        />
        
        <SelectField
          label="Default Difficulty"
          value={config.defaultDifficulty}
          onChange={(value) => updateConfig('defaultDifficulty', value as any)}
          options={[
            { value: 'easy', label: 'Easy' },
            { value: 'medium', label: 'Medium' },
            { value: 'hard', label: 'Hard' },
          ]}
          disabled={config.contentDifficulty === 'adaptive'}
        />
        
        <SelectField
          label="Content Variety"
          value={config.contentVariety}
          onChange={(value) => updateConfig('contentVariety', value as any)}
          options={[
            { value: 'low', label: 'Low - Focused practice' },
            { value: 'medium', label: 'Medium - Balanced mix' },
            { value: 'high', label: 'High - Diverse activities' },
          ]}
        />
      </ConfigSection>

      {/* Intervention Settings */}
      <ConfigSection
        icon={<Zap className="w-6 h-6" />}
        title="Intervention Agent"
        description="Set when and how AI provides support"
        color="orange"
      >
        <SliderField
          label="Intervention Threshold"
          value={config.interventionThreshold}
          onChange={(value) => updateConfig('interventionThreshold', value)}
          min={0}
          max={1}
          step={0.1}
          description="How quickly to intervene when student struggles (lower = faster)"
        />
        
        <ToggleField
          label="Frustration Detection"
          value={config.frustrationDetection}
          onChange={(value) => updateConfig('frustrationDetection', value)}
          description="Automatically detect and respond to student frustration"
        />
        
        <SelectField
          label="Encouragement Frequency"
          value={config.encouragementFrequency}
          onChange={(value) => updateConfig('encouragementFrequency', value as any)}
          options={[
            { value: 'low', label: 'Low - Minimal encouragement' },
            { value: 'medium', label: 'Medium - Balanced support' },
            { value: 'high', label: 'High - Frequent motivation' },
          ]}
        />
      </ConfigSection>

      {/* Communication Settings */}
      <ConfigSection
        icon={<Settings className="w-6 h-6" />}
        title="Communication Style"
        description="Customize how AI communicates with students"
        color="purple"
      >
        <SelectField
          label="Communication Style"
          value={config.communicationStyle}
          onChange={(value) => updateConfig('communicationStyle', value as any)}
          options={[
            { value: 'formal', label: 'Formal - Professional tone' },
            { value: 'friendly', label: 'Friendly - Warm and approachable' },
            { value: 'playful', label: 'Playful - Fun and energetic' },
          ]}
        />
        
        <SelectField
          label="Explanation Depth"
          value={config.explanationDepth}
          onChange={(value) => updateConfig('explanationDepth', value as any)}
          options={[
            { value: 'brief', label: 'Brief - Concise explanations' },
            { value: 'moderate', label: 'Moderate - Balanced detail' },
            { value: 'detailed', label: 'Detailed - Comprehensive explanations' },
          ]}
        />
      </ConfigSection>

      {/* Advanced Settings */}
      <ConfigSection
        icon={<Settings className="w-6 h-6" />}
        title="Advanced Settings"
        description="Additional configuration options"
        color="gray"
      >
        <ToggleField
          label="Real-Time Adaptation"
          value={config.enableRealTimeAdaptation}
          onChange={(value) => updateConfig('enableRealTimeAdaptation', value)}
          description="Allow agents to adapt teaching strategies in real-time"
        />
        
        <ToggleField
          label="Predictive Analytics"
          value={config.enablePredictiveAnalytics}
          onChange={(value) => updateConfig('enablePredictiveAnalytics', value)}
          description="Use ML models to predict learning outcomes and optimize paths"
        />
        
        <ToggleField
          label="Parental Notifications"
          value={config.parentalNotifications}
          onChange={(value) => updateConfig('parentalNotifications', value)}
          description="Send notifications about student progress and milestones"
        />
      </ConfigSection>
    </div>
  );
}

// Helper Components

interface ConfigSectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'gray';
  children: React.ReactNode;
}

function ConfigSection({ icon, title, description, color, children }: ConfigSectionProps) {
  const colorSchemes = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-black shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`${colorSchemes[color]} p-3 rounded-xl border-2 border-black`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

function SelectField({ label, value, onChange, options, disabled }: SelectFieldProps) {
  return (
    <div>
      <label className="block font-bold text-gray-900 mb-2 text-sm">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  description?: string;
}

function SliderField({ label, value, onChange, min, max, step, description }: SliderFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="font-bold text-gray-900 text-sm">{label}</label>
        <span className="text-sm font-bold text-blue-600">{value.toFixed(1)}</span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      {description && (
        <p className="text-xs text-gray-600 mt-1 flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{description}</span>
        </p>
      )}
    </div>
  );
}

interface ToggleFieldProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
}

function ToggleField({ label, value, onChange, description }: ToggleFieldProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <label className="font-bold text-gray-900 text-sm block mb-1">{label}</label>
        {description && (
          <p className="text-xs text-gray-600">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
