'use client';

import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Award, Target, Brain } from 'lucide-react';

interface ProgressData {
  date: string;
  math: number;
  reading: number;
  science: number;
  overall: number;
}

interface SkillData {
  skill: string;
  mastery: number;
  fullMark: 100;
}

interface ActivityData {
  day: string;
  missions: number;
  timeSpent: number;
}

interface ProgressChartsProps {
  studentName?: string;
}

export function ProgressCharts({ studentName = 'Your Child' }: ProgressChartsProps) {
  // Mock data - TODO: Replace with real data from API
  const progressData: ProgressData[] = [
    { date: 'Mon', math: 65, reading: 70, science: 60, overall: 65 },
    { date: 'Tue', math: 68, reading: 72, science: 63, overall: 68 },
    { date: 'Wed', math: 72, reading: 75, science: 68, overall: 72 },
    { date: 'Thu', math: 75, reading: 78, science: 72, overall: 75 },
    { date: 'Fri', math: 78, reading: 80, science: 75, overall: 78 },
    { date: 'Sat', math: 82, reading: 83, science: 78, overall: 81 },
    { date: 'Sun', math: 85, reading: 85, science: 82, overall: 84 },
  ];

  const skillData: SkillData[] = [
    { skill: 'Addition', mastery: 85, fullMark: 100 },
    { skill: 'Subtraction', mastery: 78, fullMark: 100 },
    { skill: 'Multiplication', mastery: 72, fullMark: 100 },
    { skill: 'Division', mastery: 65, fullMark: 100 },
    { skill: 'Fractions', mastery: 58, fullMark: 100 },
    { skill: 'Word Problems', mastery: 70, fullMark: 100 },
  ];

  const activityData: ActivityData[] = [
    { day: 'Mon', missions: 3, timeSpent: 25 },
    { day: 'Tue', missions: 4, timeSpent: 32 },
    { day: 'Wed', missions: 2, timeSpent: 18 },
    { day: 'Thu', missions: 5, timeSpent: 38 },
    { day: 'Fri', missions: 3, timeSpent: 28 },
    { day: 'Sat', missions: 6, timeSpent: 45 },
    { day: 'Sun', missions: 4, timeSpent: 35 },
  ];

  const stats = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      label: 'Overall Progress',
      value: '+16%',
      subtext: 'This week',
      color: 'from-green-100 to-teal-100',
      textColor: 'text-green-600',
    },
    {
      icon: <Award className="w-6 h-6" />,
      label: 'Current Streak',
      value: '7 days',
      subtext: 'Keep it up!',
      color: 'from-orange-100 to-red-100',
      textColor: 'text-orange-600',
    },
    {
      icon: <Target className="w-6 h-6" />,
      label: 'Missions Completed',
      value: '27',
      subtext: 'This week',
      color: 'from-blue-100 to-purple-100',
      textColor: 'text-blue-600',
    },
    {
      icon: <Brain className="w-6 h-6" />,
      label: 'Avg. Accuracy',
      value: '84%',
      subtext: 'Across all subjects',
      color: 'from-purple-100 to-pink-100',
      textColor: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={stat.textColor}>{stat.icon}</div>
            </div>
            <p className="text-sm font-semibold text-gray-700">{stat.label}</p>
            <p className={`text-4xl font-black ${stat.textColor} mt-1`}>{stat.value}</p>
            <p className="text-xs text-gray-600 mt-1">{stat.subtext}</p>
          </motion.div>
        ))}
      </div>

      {/* Progress Over Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
      >
        <h3 className="text-2xl font-black text-gray-900 mb-4">Progress Over Time</h3>
        <p className="text-sm text-gray-600 mb-6">
          {studentName}'s mastery levels across subjects this week
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '2px solid #000',
                borderRadius: '8px',
                boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="math"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Math"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="reading"
              stroke="#10b981"
              strokeWidth={3}
              name="Reading"
              dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="science"
              stroke="#8b5cf6"
              strokeWidth={3}
              name="Science"
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Skill Mastery Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        >
          <h3 className="text-2xl font-black text-gray-900 mb-4">Math Skills Breakdown</h3>
          <p className="text-sm text-gray-600 mb-6">Current mastery levels by topic</p>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={skillData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="skill" stroke="#6b7280" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
              <Radar
                name="Mastery"
                dataKey="mastery"
                stroke="#f59e0b"
                fill="#fbbf24"
                fillOpacity={0.6}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '2px solid #000',
                  borderRadius: '8px',
                  boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        >
          <h3 className="text-2xl font-black text-gray-900 mb-4">Weekly Activity</h3>
          <p className="text-sm text-gray-600 mb-6">Missions completed and time spent</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '2px solid #000',
                  borderRadius: '8px',
                  boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                }}
              />
              <Legend />
              <Bar dataKey="missions" fill="#3b82f6" name="Missions" radius={[8, 8, 0, 0]} />
              <Bar dataKey="timeSpent" fill="#10b981" name="Time (min)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Insights Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="flex items-start gap-4">
          <div className="text-4xl">📊</div>
          <div>
            <h4 className="text-xl font-black text-gray-900 mb-2">Key Insights</h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>
                  <strong>Strong progress in Reading:</strong> Up 15 points this week!
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">→</span>
                <span>
                  <strong>Math is improving steadily:</strong> Consistent daily practice showing
                  results
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">!</span>
                <span>
                  <strong>Focus area - Fractions:</strong> Consider extra practice with visual
                  tools
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 font-bold">★</span>
                <span>
                  <strong>Best learning time:</strong> Saturday mornings (45 min avg session)
                </span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
